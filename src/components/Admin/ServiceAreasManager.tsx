'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ServiceAreaMap from '@/components/Widget/ServiceAreaMap';
import { getCompanyCoordinates, createCachedGeocodeResult, isCacheValid } from '@/lib/geocoding';
import { adminAPI } from '@/lib/api-client';
import styles from './ServiceAreasManager.module.scss';

interface ServiceAreasManagerProps {
  companyId: string;
}

interface Company {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  widget_config?: any;
}

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface CompanyUser {
  id: string;
  display_name: string;
  email: string;
}

interface ZipCodeGroup {
  id: string;
  name: string;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  zip_codes: string[];
}

export default function ServiceAreasManager({ companyId }: ServiceAreasManagerProps) {
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [showServiceAreaMap, setShowServiceAreaMap] = useState(true);
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  // Named zip-code service areas. Each entry is one row in service_areas
  // with type='zip_code'. Replaces the legacy single-area "consolidated"
  // approach; each named area can have its own branch.
  const [zipCodeAreas, setZipCodeAreas] = useState<
    Array<{
      id?: string;
      name: string;
      branchId: string | null;
      zipCodes: string[];
    }>
  >([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [areaInputs, setAreaInputs] = useState<Record<string, string>>({});
  const areaCsvInputRef = useRef<HTMLInputElement>(null);
  const [csvTargetAreaIndex, setCsvTargetAreaIndex] = useState<number | null>(
    null
  );
  const [areaCsvSummary, setAreaCsvSummary] = useState<
    Record<number, string>
  >({});
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchAssignments, setBranchAssignments] = useState<Record<string, string>>({});

  // CSV upload state
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvSummary, setCsvSummary] = useState<string | null>(null);

  // Group CSV upload state
  const groupCsvUploadGroupRef = useRef<string | null>(null);
  const groupCsvInputRef = useRef<HTMLInputElement>(null);
  const [groupCsvSummary, setGroupCsvSummary] = useState<Record<string, string>>({});

  // Groups state
  const [groups, setGroups] = useState<ZipCodeGroup[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupUserId, setNewGroupUserId] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupZipInput, setGroupZipInput] = useState<Record<string, string>>({});
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [editingGroupNames, setEditingGroupNames] = useState<Record<string, string>>({});

  // Create stable callback for ServiceAreaMap to prevent infinite loop
  const handleAreasChange = useCallback((areas: any[]) => {
    setServiceAreas(areas);
  }, []);

  // Fetch Google API key on mount
  useEffect(() => {
    const fetchGoogleApiKey = async () => {
      try {
        const response = await fetch('/api/google-places-key');
        if (response.ok) {
          const data = await response.json();
          setGoogleApiKey(data.apiKey || '');
        }
      } catch (error) {
        console.error('Error fetching Google API key:', error);
      }
    };
    fetchGoogleApiKey();
  }, []);

  // Fetch branches for this company
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/branches?companyId=${companyId}`)
      .then(r => r.json())
      .then(d => setBranches((d.branches ?? []).filter((b: Branch) => b.is_active)))
      .catch(() => setBranches([]));
  }, [companyId]);

  // Fetch company users for the group user picker
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/companies/${companyId}/users`)
      .then(r => r.json())
      .then(d => setCompanyUsers(d.users ?? []))
      .catch(() => setCompanyUsers([]));
  }, [companyId]);

  // Load service areas, zip code groups, and geocode company address
  useEffect(() => {
    setInitialCenter(undefined);

    const loadData = async () => {
      if (!companyId) return;

      try {
        setLoading(true);

        const [companies, areasResponse, groupsResponse] = await Promise.all([
          adminAPI.getCompanies(),
          fetch(`/api/service-areas/${companyId}`),
          fetch(`/api/companies/${companyId}/zip-code-groups`),
        ]);

        const company = companies.find((c: Company) => c.id === companyId);

        if (company) {
          const coordinates = await getCompanyCoordinates(company);
          setInitialCenter({ lat: coordinates.lat, lng: coordinates.lng });

          const existingCache = company.widget_config?.geocodedAddress;
          const cachedLower = existingCache?.address?.toLowerCase() ?? '';
          const cacheNeedsUpdate =
            !existingCache ||
            !isCacheValid(existingCache) ||
            (company.city && !cachedLower.includes(company.city.toLowerCase())) ||
            (company.state && !cachedLower.includes(company.state.toLowerCase()));

          if (cacheNeedsUpdate) {
            const cachedResult = createCachedGeocodeResult(coordinates);
            adminAPI.updateCompany(company.id, {
              widget_config: { ...company.widget_config, geocodedAddress: cachedResult },
            }).catch((err: unknown) => {
              console.error('Failed to cache geocoded address:', err);
            });
          }
        }

        if (areasResponse.ok) {
          const data = await areasResponse.json();
          if (data.success) {
            const areas = data.serviceAreas || [];
            const geographic = areas.filter((a: any) => a.type !== 'zip_code');
            const zipCodeAreas = areas.filter((a: any) => a.type === 'zip_code');
            setServiceAreas(geographic);
            const assignments: Record<string, string> = {};
            geographic.forEach((a: any) => {
              if (a.id && a.branchId) assignments[a.id] = a.branchId;
            });
            setBranchAssignments(assignments);
            const allZipCodes = [...new Set<string>(zipCodeAreas.flatMap((a: any) => a.zipCodes || []))];
            setZipCodes(allZipCodes);
            // Hydrate named zip_code areas (each kept separate now). Filter
            // out any "Zip Code Service Area" legacy single-bucket entries
            // by surfacing whatever the server returns; users can rename
            // and split as needed.
            setZipCodeAreas(
              zipCodeAreas.map((a: any) => ({
                id: a.id,
                name: a.name || 'Zip Code Service Area',
                branchId: a.branchId ?? null,
                zipCodes: Array.isArray(a.zipCodes) ? a.zipCodes : [],
              }))
            );
          }
        }

        if (groupsResponse.ok) {
          const data = await groupsResponse.json();
          setGroups(data.groups ?? []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setServiceAreas([]);
        setZipCodes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId]);

  const saveServiceAreas = async (areas: any[]) => {
    try {
      setSaving(true);
      const areasWithBranch = areas.map(a => ({
        ...a,
        branchId: branchAssignments[a.id] ?? a.branchId ?? null,
      }));
      const response = await fetch(`/api/service-areas/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceAreas: areasWithBranch }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServiceAreas(areas);
        } else {
          throw new Error(data.error || 'Failed to save service areas');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving service areas:', error);
      alert('Failed to save service areas. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addZipCode = () => {
    if (serviceAreaInput.trim() && !zipCodes.includes(serviceAreaInput.trim())) {
      const newZipCodes = [...zipCodes, serviceAreaInput.trim()];
      setZipCodes(newZipCodes);
      setServiceAreaInput('');
      saveZipCodes(newZipCodes);
    }
  };

  const removeZipCode = (zipCode: string) => {
    const newZipCodes = zipCodes.filter(z => z !== zipCode);
    setZipCodes(newZipCodes);
    saveZipCodes(newZipCodes);
  };

  const saveZipCodes = async (zipCodeList: string[]) => {
    // Legacy fallback: kept for the unnamed flat-list flow. New callers
    // should use saveZipCodeAreas instead.
    try {
      const geographicAreas = serviceAreas.map(a => ({
        ...a,
        branchId: branchAssignments[a.id] ?? a.branchId ?? null,
      }));

      const uniqueZips = [...new Set(zipCodeList)];
      const zipArea = uniqueZips.length > 0
        ? [{ name: 'Zip Code Service Area', type: 'zip_code', zipCodes: uniqueZips, priority: 0, isActive: true }]
        : [];

      const response = await fetch(`/api/service-areas/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceAreas: [...geographicAreas, ...zipArea] }),
      });
      if (!response.ok) {
        throw new Error('Failed to save zip codes');
      }
    } catch (error) {
      console.error('Error saving zip codes:', error);
      alert('Failed to save zip codes. Please try again.');
    }
  };

  // Edits to named zip_code service areas are buffered locally; nothing
  // hits the server until the user clicks "Save Changes" at the bottom
  // of the section. `dirty` tracks whether there are unsaved local edits.
  const [dirty, setDirty] = useState(false);
  const saveInFlightRef = useRef(false);

  const persistZipCodeAreas = async (
    toSave: Array<{ id?: string; name: string; branchId: string | null; zipCodes: string[] }>
  ): Promise<boolean> => {
    if (saveInFlightRef.current) return false; // guard against double-click
    saveInFlightRef.current = true;
    try {
      setSaving(true);
      const geographicAreas = serviceAreas.map(a => ({
        ...a,
        branchId: branchAssignments[a.id] ?? a.branchId ?? null,
      }));
      const namedZipAreas = toSave
        .filter(a => a.zipCodes.length > 0 || a.name.trim().length > 0)
        .map(a => ({
          id: a.id,
          name: a.name.trim() || 'Zip Code Service Area',
          type: 'zip_code',
          zipCodes: [...new Set(a.zipCodes)],
          priority: 0,
          isActive: true,
          branchId: a.branchId ?? null,
        }));

      const response = await fetch(`/api/service-areas/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceAreas: [...geographicAreas, ...namedZipAreas] }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save zip-code service areas');
      }
      return true;
    } catch (error) {
      console.error('Error saving named zip code areas:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save zip-code service areas. Please try again.'
      );
      return false;
    } finally {
      setSaving(false);
      saveInFlightRef.current = false;
    }
  };

  const handleSaveZipCodeAreas = async () => {
    const ok = await persistZipCodeAreas(zipCodeAreas);
    if (ok) setDirty(false);
  };

  const updateZipCodeArea = (
    index: number,
    patch: Partial<{ name: string; branchId: string | null; zipCodes: string[] }>
  ) => {
    setZipCodeAreas(prev =>
      prev.map((area, i) => (i === index ? { ...area, ...patch } : area))
    );
    setDirty(true);
  };

  const addZipCodeArea = () => {
    const name = newAreaName.trim() || `Service Area ${zipCodeAreas.length + 1}`;
    setZipCodeAreas(prev => [
      ...prev,
      { name, branchId: null, zipCodes: [] as string[] },
    ]);
    setNewAreaName('');
    setDirty(true);
  };

  const removeZipCodeArea = (index: number) => {
    if (
      !confirm(
        `Remove service area "${zipCodeAreas[index]?.name}"? This will release its ZIPs from any branch.`
      )
    ) {
      return;
    }
    setZipCodeAreas(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const addZipToArea = (index: number) => {
    const raw = (areaInputs[String(index)] ?? '').trim();
    if (!raw) return;
    const normalized = raw.split('-')[0]?.trim() ?? '';
    if (!/^\d{5}$/.test(normalized)) {
      alert('Please enter a 5-digit ZIP code');
      return;
    }
    const area = zipCodeAreas[index];
    if (!area || area.zipCodes.includes(normalized)) {
      setAreaInputs(prev => ({ ...prev, [String(index)]: '' }));
      return;
    }
    updateZipCodeArea(index, {
      zipCodes: [...area.zipCodes, normalized],
    });
    setAreaInputs(prev => ({ ...prev, [String(index)]: '' }));
  };

  const removeZipFromArea = (index: number, zip: string) => {
    const area = zipCodeAreas[index];
    if (!area) return;
    updateZipCodeArea(index, {
      zipCodes: area.zipCodes.filter(z => z !== zip),
    });
  };

  const handleAreaCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetIndex = csvTargetAreaIndex;
    setCsvTargetAreaIndex(null);
    if (targetIndex === null) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const area = zipCodeAreas[targetIndex];
    if (!area) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const text = (ev.target?.result as string) ?? '';
      const candidates = text.split(/[\s,;\t]+/);
      const valid: string[] = [];
      for (const raw of candidates) {
        const head = raw.trim().split('-')[0]?.trim() ?? '';
        if (/^\d{5}$/.test(head)) valid.push(head);
      }
      const merged = [...new Set([...area.zipCodes, ...valid])];
      const added = merged.length - area.zipCodes.length;
      updateZipCodeArea(targetIndex, { zipCodes: merged });
      setAreaCsvSummary(prev => ({
        ...prev,
        [targetIndex]: `Added ${added} new ZIP${added === 1 ? '' : 's'} (${valid.length} total in file).`,
      }));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // CSV upload handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Split by commas, newlines, semicolons, tabs — filter to 5-digit numeric strings
      const candidates = text.split(/[\s,;\t]+/);
      const valid5Digit = candidates.filter(v => /^\d{5}$/.test(v.trim())).map(v => v.trim());

      const added: string[] = [];
      const duplicates: string[] = [];

      valid5Digit.forEach(zip => {
        if (zipCodes.includes(zip) || added.includes(zip)) {
          duplicates.push(zip);
        } else {
          added.push(zip);
        }
      });

      if (added.length > 0) {
        const merged = [...zipCodes, ...added];
        setZipCodes(merged);
        saveZipCodes(merged);
      }

      setCsvSummary(
        `Added ${added.length} zip code${added.length !== 1 ? 's' : ''}` +
        (duplicates.length > 0 ? `, ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''} skipped` : '')
      );

      // Reset file input so same file can be re-uploaded if needed
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Group CSV upload handler
  const handleGroupCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const groupId = groupCsvUploadGroupRef.current;
    if (!file || !groupId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const candidates = text.split(/[\s,;\t]+/);
      const valid = candidates.filter(v => /^\d{5}$/.test(v.trim())).map(v => v.trim());

      const currentGroup = groups.find(g => g.id === groupId);
      if (!currentGroup) return;

      const groupAdded: string[] = [];
      const groupDupes: string[] = [];
      valid.forEach(zip => {
        if (currentGroup.zip_codes.includes(zip) || groupAdded.includes(zip)) {
          groupDupes.push(zip);
        } else {
          groupAdded.push(zip);
        }
      });

      if (groupAdded.length > 0) {
        handleUpdateGroup(groupId, { zip_codes: [...currentGroup.zip_codes, ...groupAdded] });
      }

      // Zip Code Groups (user-assignment) are intentionally decoupled
      // from named zip_code service areas (branch-routing). Don't mirror
      // group ZIPs into the flat service_area list — that used to wipe
      // the named areas via a competing PUT.

      setGroupCsvSummary(prev => ({
        ...prev,
        [groupId]: `Added ${groupAdded.length} zip${groupAdded.length !== 1 ? 's' : ''} to group` +
          (groupDupes.length > 0 ? `, ${groupDupes.length} duplicate${groupDupes.length !== 1 ? 's' : ''} skipped` : ''),
      }));

      if (groupCsvInputRef.current) groupCsvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleBranchAssignment = (areaId: string, branchId: string) => {
    setBranchAssignments(prev => ({ ...prev, [areaId]: branchId }));
  };

  const saveBranchAssignments = async () => {
    await saveServiceAreas(serviceAreas);
  };

  // Group CRUD helpers
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/zip-code-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          assigned_user_id: newGroupUserId || null,
          zip_codes: [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(prev => [...prev, {
          id: data.group.id,
          name: data.group.name,
          assigned_user_id: data.group.assigned_user_id,
          assigned_user_name: companyUsers.find(u => u.id === data.group.assigned_user_id)?.display_name ?? null,
          zip_codes: data.group.zip_codes,
        }]);
        setNewGroupName('');
        setNewGroupUserId('');
        setShowCreateGroup(false);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleUpdateGroup = async (groupId: string, patch: Partial<{ name: string; assigned_user_id: string | null; zip_codes: string[] }>) => {
    setSavingGroupId(groupId);
    try {
      const res = await fetch(`/api/companies/${companyId}/zip-code-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(prev => prev.map(g => g.id === groupId ? {
          ...g,
          name: data.group.name,
          assigned_user_id: data.group.assigned_user_id,
          assigned_user_name: companyUsers.find(u => u.id === data.group.assigned_user_id)?.display_name ?? null,
          zip_codes: data.group.zip_codes,
        } : g));
      }
    } catch (error) {
      console.error('Error updating group:', error);
    } finally {
      setSavingGroupId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this zip code group? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/zip-code-groups/${groupId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        if (expandedGroupId === groupId) setExpandedGroupId(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleAddZipToGroup = (group: ZipCodeGroup) => {
    const zip = (groupZipInput[group.id] ?? '').trim();
    if (!zip || group.zip_codes.includes(zip)) return;
    const updated = [...group.zip_codes, zip];
    setGroupZipInput(prev => ({ ...prev, [group.id]: '' }));
    handleUpdateGroup(group.id, { zip_codes: updated });

    // (Decoupled from named zip_code service areas — see comment above
    // about why we no longer mirror group ZIPs into the flat list.)
  };

  const handleRemoveZipFromGroup = (group: ZipCodeGroup, zip: string) => {
    const updated = group.zip_codes.filter(z => z !== zip);
    handleUpdateGroup(group.id, { zip_codes: updated });
  };

  const handleGroupNameBlur = (group: ZipCodeGroup) => {
    const name = editingGroupNames[group.id];
    if (name !== undefined && name.trim() && name.trim() !== group.name) {
      handleUpdateGroup(group.id, { name: name.trim() });
    }
    setEditingGroupNames(prev => {
      const next = { ...prev };
      delete next[group.id];
      return next;
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading service areas...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Service Areas</h2>
          <p>Define where you provide service using geographic areas or zip codes.</p>
        </div>
      </div>

      <div className={styles.serviceAreaTabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${showServiceAreaMap ? styles.active : ''}`}
          onClick={() => setShowServiceAreaMap(true)}
        >
          Geographic Areas
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${!showServiceAreaMap ? styles.active : ''}`}
          onClick={() => setShowServiceAreaMap(false)}
        >
          Zip Codes
        </button>
      </div>

      {!showServiceAreaMap ? (
        <div className={styles.zipCodeSection}>
          {/* Hidden CSV file inputs (group csv stays for the groups section
              below; area csv targets a specific named area via state). */}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.txt"
            className={styles.hiddenFileInput}
            onChange={handleCsvUpload}
          />
          <input
            ref={groupCsvInputRef}
            type="file"
            accept=".csv,.txt"
            className={styles.hiddenFileInput}
            onChange={handleGroupCsvUpload}
          />
          <input
            ref={areaCsvInputRef}
            type="file"
            accept=".csv,.txt"
            className={styles.hiddenFileInput}
            onChange={handleAreaCsvUpload}
          />

          {/* New named-area creator */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 16,
              padding: 12,
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          >
            <input
              type="text"
              value={newAreaName}
              onChange={e => setNewAreaName(e.target.value)}
              placeholder="New service area name (e.g., 'North Zone')"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
              onKeyDown={e => e.key === 'Enter' && addZipCodeArea()}
            />
            <button
              type="button"
              onClick={addZipCodeArea}
              style={{
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 500,
                color: 'white',
                background: '#3b82f6',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              + Add Service Area
            </button>
          </div>

          {/* Named ZIP-list service areas (each = one row in service_areas
              with type='zip_code'). Each has its own branch and ZIPs. */}
          {zipCodeAreas.length === 0 ? (
            <p className={styles.emptyState}>
              No zip-code service areas configured. Create one above to assign
              ZIPs to a branch.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {zipCodeAreas.map((area, idx) => (
                <div
                  key={area.id ?? `new-${idx}`}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 16,
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      marginBottom: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      type="text"
                      value={area.name}
                      onChange={e =>
                        updateZipCodeArea(idx, { name: e.target.value })
                      }
                      style={{
                        flex: 1,
                        minWidth: 180,
                        padding: '6px 10px',
                        fontSize: 14,
                        fontWeight: 500,
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />
                    {branches.length > 0 && (
                      <select
                        value={area.branchId ?? ''}
                        onChange={e =>
                          updateZipCodeArea(idx, {
                            branchId: e.target.value || null,
                          })
                        }
                        style={{
                          fontSize: 13,
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          background: '#fff',
                        }}
                      >
                        <option value="">— No branch —</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => removeZipCodeArea(idx)}
                      style={{
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#b91c1c',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="text"
                      value={areaInputs[String(idx)] ?? ''}
                      onChange={e =>
                        setAreaInputs(prev => ({
                          ...prev,
                          [String(idx)]: e.target.value,
                        }))
                      }
                      placeholder="Add a ZIP (e.g., 12345)"
                      onKeyDown={e => e.key === 'Enter' && addZipToArea(idx)}
                      style={{
                        padding: '6px 10px',
                        fontSize: 13,
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addZipToArea(idx)}
                      style={{
                        padding: '6px 10px',
                        fontSize: 13,
                        background: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Add ZIP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAreaCsvSummary(prev => {
                          const next = { ...prev };
                          delete next[idx];
                          return next;
                        });
                        setCsvTargetAreaIndex(idx);
                        areaCsvInputRef.current?.click();
                      }}
                      style={{
                        padding: '6px 10px',
                        fontSize: 13,
                        background: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Upload CSV
                    </button>
                  </div>

                  {areaCsvSummary[idx] && (
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
                      {areaCsvSummary[idx]}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {area.zipCodes.length === 0 ? (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        No ZIPs yet.
                      </span>
                    ) : (
                      area.zipCodes.map(zip => (
                        <span
                          key={zip}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            padding: '3px 8px',
                            background: '#eff6ff',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                            borderRadius: 999,
                          }}
                        >
                          {zip}
                          <button
                            type="button"
                            onClick={() => removeZipFromArea(idx, zip)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#1e40af',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: 14,
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save bar — only renders when there are unsaved local edits */}
          {(dirty || saving) && (
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                marginTop: 16,
                padding: '12px 16px',
                background: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                zIndex: 5,
              }}
            >
              <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                {dirty
                  ? 'You have unsaved changes to your zip-code service areas.'
                  : 'Saving…'}
              </span>
              <button
                type="button"
                onClick={handleSaveZipCodeAreas}
                disabled={!dirty || saving}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'white',
                  background: dirty && !saving ? '#3b82f6' : '#9ca3af',
                  border: 'none',
                  borderRadius: 6,
                  cursor: dirty && !saving ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Zip Code Groups section */}
          <div className={styles.groupsSection}>
            <div className={styles.groupsSectionHeader}>
              <div>
                <h3 className={styles.groupsSectionTitle}>Zip Code Groups</h3>
                <p className={styles.groupsSectionSubtitle}>
                  Organize zip codes into named groups with an assigned team member.
                </p>
              </div>
              <button
                type="button"
                className={styles.createGroupButton}
                onClick={() => setShowCreateGroup(v => !v)}
              >
                {showCreateGroup ? 'Cancel' : 'Create Group'}
              </button>
            </div>

            {showCreateGroup && (
              <div className={styles.createGroupForm}>
                <input
                  type="text"
                  placeholder="Group name (e.g., North Route)"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                  className={styles.groupNameInput}
                />
                <select
                  value={newGroupUserId}
                  onChange={e => setNewGroupUserId(e.target.value)}
                  className={styles.groupUserSelect}
                >
                  <option value="">No assigned user</option>
                  {companyUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.email ? `${u.display_name} — ${u.email}` : u.display_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.saveGroupButton}
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !newGroupName.trim()}
                >
                  {creatingGroup ? 'Creating...' : 'Create'}
                </button>
              </div>
            )}

            {groups.length === 0 && !showCreateGroup && (
              <p className={styles.emptyState}>
                No groups yet. Create a group to organize zip codes by route or team member.
              </p>
            )}

            <div className={styles.groupList}>
              {groups.map(group => (
                <div key={group.id} className={styles.groupCard}>
                  <div
                    className={styles.groupHeader}
                    onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                  >
                    <div className={styles.groupHeaderLeft}>
                      <span className={styles.groupExpandIcon}>
                        {expandedGroupId === group.id ? '▾' : '▸'}
                      </span>
                      <input
                        type="text"
                        className={styles.groupNameEditInput}
                        value={editingGroupNames[group.id] !== undefined ? editingGroupNames[group.id] : group.name}
                        onChange={e => setEditingGroupNames(prev => ({ ...prev, [group.id]: e.target.value }))}
                        onBlur={() => handleGroupNameBlur(group)}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      />
                      <span className={styles.groupZipCount}>{group.zip_codes.length} zip{group.zip_codes.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.groupHeaderRight} onClick={e => e.stopPropagation()}>
                      <select
                        value={group.assigned_user_id ?? ''}
                        onChange={e => handleUpdateGroup(group.id, { assigned_user_id: e.target.value || null })}
                        className={styles.groupUserSelect}
                        disabled={savingGroupId === group.id}
                      >
                        <option value="">No assigned user</option>
                        {companyUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.email ? `${u.display_name} — ${u.email}` : u.display_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.deleteGroupButton}
                        onClick={() => handleDeleteGroup(group.id)}
                        title="Delete group"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {expandedGroupId === group.id && (
                    <div className={styles.groupBody}>
                      <div className={styles.groupZipInputRow}>
                        <input
                          type="text"
                          placeholder="Add zip code"
                          value={groupZipInput[group.id] ?? ''}
                          onChange={e => setGroupZipInput(prev => ({ ...prev, [group.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddZipToGroup(group)}
                          className={styles.groupZipEntryInput}
                        />
                        <button
                          type="button"
                          className={styles.addGroupZipButton}
                          onClick={() => handleAddZipToGroup(group)}
                          disabled={savingGroupId === group.id}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className={styles.uploadCsvButton}
                          onClick={() => {
                            setGroupCsvSummary(prev => ({ ...prev, [group.id]: '' }));
                            groupCsvUploadGroupRef.current = group.id;
                            groupCsvInputRef.current?.click();
                          }}
                        >
                          Upload CSV
                        </button>
                      </div>
                      {groupCsvSummary[group.id] && (
                        <p className={styles.csvSummary}>{groupCsvSummary[group.id]}</p>
                      )}
                      <div className={styles.groupZipList}>
                        {group.zip_codes.map(zip => (
                          <span key={zip} className={styles.serviceArea}>
                            {zip}
                            <button
                              type="button"
                              onClick={() => handleRemoveZipFromGroup(group, zip)}
                              disabled={savingGroupId === group.id}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {group.zip_codes.length === 0 && (
                          <p className={styles.groupEmptyZips}>No zip codes in this group yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.geographicSection}>
          {googleApiKey ? (
            <ServiceAreaMap
              companyId={companyId}
              existingAreas={serviceAreas}
              onAreasChange={handleAreasChange}
              onSave={saveServiceAreas}
              googleMapsApiKey={googleApiKey}
              defaultCenter={initialCenter}
            />
          ) : (
            <div className={styles.missingApiKey}>
              <p>Google Maps API key is required for geographic service areas.</p>
              <p>Please add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your environment variables.</p>
            </div>
          )}

          {serviceAreas.length > 0 && branches.length > 0 && (
            <div className={styles.branchAssignmentPanel}>
              <h3 className={styles.branchAssignmentTitle}>Branch Assignment</h3>
              <p className={styles.branchAssignmentSubtitle}>
                Assign a branch to each service area. Save changes after updating.
              </p>
              <div className={styles.branchAssignmentList}>
                {serviceAreas.map(area => (
                  <div key={area.id || area.name} className={styles.branchAssignmentRow}>
                    <span className={styles.areaName}>{area.name}</span>
                    <select
                      className={styles.branchSelect}
                      value={branchAssignments[area.id] ?? ''}
                      onChange={e => handleBranchAssignment(area.id, e.target.value)}
                      disabled={saving}
                    >
                      <option value="">No branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button
                className={styles.saveBranchButton}
                onClick={saveBranchAssignments}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Branch Assignments'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
