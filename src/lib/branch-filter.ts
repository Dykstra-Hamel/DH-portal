import { SupabaseClient } from '@supabase/supabase-js';
import { geocodeCustomerAddress } from '@/lib/geocoding';

/**
 * Normalizes a ZIP to its 5-digit form. Strips whitespace and any +4
 * suffix (so `12345-6789` -> `12345`). Returns null if the result isn't
 * exactly 5 digits — the caller can treat that as "no usable ZIP" and
 * skip lookup.
 */
export function normalizeZip(zip: string | null | undefined): string | null {
  if (!zip) return null;
  const head = zip.trim().split('-')[0]?.trim() ?? '';
  if (!/^\d{5}$/.test(head)) return null;
  return head;
}

/**
 * Returns a PostgREST-compatible `.or()` filter string that restricts a query
 * to the user's assigned branches OR records where branch_id IS NULL.
 * NULL-branch records are visible to branch-restricted users so they can
 * spot and reassign mis-assigned/unassigned records.
 *
 * Returns null if the user is unrestricted (global admin, or no branch assignments),
 * in which case all records are visible regardless of branch.
 * Usage: if (filter) query = query.or(filter);
 */
export async function getUserBranchFilter(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  isGlobalAdmin: boolean
): Promise<string | null> {
  // Global app admins (profiles.role = 'admin') see everything
  if (isGlobalAdmin) return null;

  const { data } = await supabase
    .from('user_branch_assignments')
    .select('branch_id')
    .eq('user_id', userId)
    .eq('company_id', companyId);

  // No assignments = unrestricted (sees all branches)
  if (!data?.length) return null;

  const ids = data.map(r => r.branch_id).join(',');
  return `branch_id.is.null,branch_id.in.(${ids})`;
}

/**
 * Resolves a branch_id from a raw ZIP by checking service_areas.
 *
 * Returns null when the company has no service_areas with a branch_id covering
 * the ZIP, so companies that haven't opted into branches keep getting NULL.
 * Match semantics intentionally mirror the auto_assign_quote_lead trigger:
 * exact ZIP containment via @>, ordered by priority DESC then created_at ASC.
 *
 * Normalizes the ZIP via `normalizeZip` so callers can pass raw values like
 * `12345-6789` and have it match a stored `12345`.
 */
export async function resolveBranchIdByZip(
  supabase: SupabaseClient,
  companyId: string,
  zip: string | null | undefined
): Promise<string | null> {
  const normalized = normalizeZip(zip);
  if (!normalized) return null;

  const { data } = await supabase
    .from('service_areas')
    .select('branch_id, priority, created_at')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .not('branch_id', 'is', null)
    .contains('zip_codes', [normalized])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.branch_id ?? null;
}

/**
 * Resolves the default branch for a logged-in user creating a record manually.
 *
 * 1. First user_branch_assignments row (oldest by created_at) for this user+company.
 * 2. Fall back to the company's primary branch (`branches.is_primary = true`).
 * 3. Otherwise null.
 *
 * Used as the assignee/submitter fallback in /api/tickets and /api/leads POST,
 * and as the default value for branch filter dropdowns on list pages.
 */
export async function resolveDefaultBranchForUser(
  supabase: SupabaseClient,
  userId: string,
  companyId: string
): Promise<string | null> {
  if (!userId || !companyId) return null;

  const { data: uba } = await supabase
    .from('user_branch_assignments')
    .select('branch_id, created_at')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (uba?.branch_id) return uba.branch_id;

  const { data: primary } = await supabase
    .from('branches')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_primary', true)
    .eq('is_active', true)
    .maybeSingle();

  return primary?.id ?? null;
}

/**
 * Cache-aware branch resolution for a service_address.
 *
 * Order:
 *   1. Cache hit on the service_address (branch_resolved_at IS NOT NULL).
 *   2. ZIP fast-path (resolveBranchIdByZip).
 *   3. coords-validate via check_service_area_coverage RPC if lat/lng present.
 *   4. Geocode the address (Google) -> coords -> RPC. Skipped when
 *      options.skipGeocode is true (manual user submissions).
 *
 * Persists the result on the service_address (and lat/lng if geocoded) so
 * the next ticket/lead at the same address short-circuits at step 1.
 * Cache invalidation is handled by /api/service-areas POST/PUT clearing
 * branch_id + branch_resolved_at for all addresses in the company.
 *
 * Returns null when no service area covers the address (the negative is
 * cached too, so out-of-area addresses don't pay Google repeatedly).
 */
export async function resolveBranchForServiceAddress(
  supabase: SupabaseClient,
  companyId: string,
  serviceAddressId: string | null | undefined,
  options?: { skipGeocode?: boolean }
): Promise<string | null> {
  if (!serviceAddressId || !companyId) return null;

  const { data: addr } = await supabase
    .from('service_addresses')
    .select(
      'id, zip_code, latitude, longitude, branch_id, branch_resolved_at, street_address, city, state'
    )
    .eq('id', serviceAddressId)
    .maybeSingle();

  if (!addr) return null;

  // Step 1: cache hit (positive or negative)
  if (addr.branch_resolved_at) {
    return (addr.branch_id as string | null) ?? null;
  }

  const persist = async (
    branchId: string | null,
    extras?: { latitude?: number; longitude?: number }
  ) => {
    const patch: Record<string, unknown> = {
      branch_id: branchId,
      branch_resolved_at: new Date().toISOString(),
    };
    if (extras?.latitude !== undefined) patch.latitude = extras.latitude;
    if (extras?.longitude !== undefined) patch.longitude = extras.longitude;
    if (extras?.latitude !== undefined && extras?.longitude !== undefined) {
      patch.geocoded_at = new Date().toISOString();
    }
    await supabase.from('service_addresses').update(patch).eq('id', addr.id);
  };

  // Step 2: ZIP fast-path
  const zipBranch = await resolveBranchIdByZip(
    supabase,
    companyId,
    addr.zip_code as string | null
  );
  if (zipBranch) {
    await persist(zipBranch);
    return zipBranch;
  }

  // Step 3: coords-validate via RPC (covers polygon + radius areas)
  const lat = addr.latitude as number | null;
  const lng = addr.longitude as number | null;

  const validateAtCoords = async (
    latitude: number,
    longitude: number
  ): Promise<string | null> => {
    const { data: areas, error } = await supabase.rpc(
      'check_service_area_coverage',
      {
        p_company_id: companyId,
        p_latitude: latitude,
        p_longitude: longitude,
        p_zip_code: addr.zip_code ?? null,
      }
    );
    if (error || !Array.isArray(areas) || areas.length === 0) return null;
    const matchedAreaIds = areas.map((a: any) => a.area_id);
    const { data: areaRows } = await supabase
      .from('service_areas')
      .select('id, branch_id, priority, created_at')
      .in('id', matchedAreaIds)
      .not('branch_id', 'is', null);
    if (!areaRows?.length) return null;
    // Order matches the RPC: priority DESC, created_at ASC.
    const ordered = [...areaRows].sort((a, b) => {
      const pa = (a.priority as number | null) ?? 0;
      const pb = (b.priority as number | null) ?? 0;
      if (pa !== pb) return pb - pa;
      return (a.created_at as string).localeCompare(b.created_at as string);
    });
    return (ordered[0].branch_id as string | null) ?? null;
  };

  if (lat !== null && lng !== null) {
    const coordsBranch = await validateAtCoords(lat, lng);
    if (coordsBranch) {
      await persist(coordsBranch);
      return coordsBranch;
    }
    // Have coords but no match — cache the negative.
    await persist(null);
    return null;
  }

  // Step 4: geocode + retry (unless caller asked to skip)
  if (
    !options?.skipGeocode &&
    addr.city &&
    addr.state
  ) {
    const result = await geocodeCustomerAddress({
      street: addr.street_address as string | null,
      city: addr.city as string | null,
      state: addr.state as string | null,
      zip: addr.zip_code as string | null,
    });
    if (result.success && result.coordinates) {
      const { lat: gLat, lng: gLng } = result.coordinates;
      const geoBranch = await validateAtCoords(gLat, gLng);
      await persist(geoBranch, { latitude: gLat, longitude: gLng });
      return geoBranch;
    }
  }

  // No address data or geocode failed — cache the negative so the next
  // resolution at this address short-circuits.
  await persist(null);
  return null;
}

/**
 * Resolves the branch_id to assign to a new lead/ticket/submission from
 * a known service area. Used by the widget submission flow which already
 * has a serviceAreaId from polygon/radius validation.
 *
 * 1. If a service area ID is provided and it has a branch, use that.
 * 2. Otherwise, fall back to the company's primary branch.
 * 3. If no primary branch exists, returns null (no branch assigned).
 */
export async function resolveDefaultBranchId(
  supabase: SupabaseClient,
  companyId: string,
  serviceAreaId?: string | null
): Promise<string | null> {
  // 1. Try to derive branch from matched service area
  if (serviceAreaId) {
    const { data: sa } = await supabase
      .from('service_areas')
      .select('branch_id')
      .eq('id', serviceAreaId)
      .single();
    if (sa?.branch_id) return sa.branch_id;
  }

  // 2. Fall back to the company's primary branch
  const { data: primary } = await supabase
    .from('branches')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_primary', true)
    .single();

  return primary?.id ?? null;
}
