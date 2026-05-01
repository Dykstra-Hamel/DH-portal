import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import {
  validateUserInput,
  sanitizeString,
  validateUUID,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();

    const VALID_DEPARTMENT_TYPES = ['residential', 'commercial', 'both'] as const;
    type InviteDepartmentType = typeof VALID_DEPARTMENT_TYPES[number];
    const rawDepartmentTypes =
      body.departmentTypes && typeof body.departmentTypes === 'object'
        ? body.departmentTypes
        : {};
    const departmentTypes: Partial<Record<string, InviteDepartmentType>> = {};
    for (const key of ['technician', 'inspector']) {
      const value = rawDepartmentTypes[key];
      if (typeof value === 'string' && (VALID_DEPARTMENT_TYPES as readonly string[]).includes(value)) {
        departmentTypes[key] = value as InviteDepartmentType;
      }
    }

    // Validate and sanitize input
    const userData = {
      email: sanitizeString(body.email || ''),
      first_name: sanitizeString(body.first_name || ''),
      last_name: sanitizeString(body.last_name || ''),
      company_id: sanitizeString(body.company_id || ''),
      role: sanitizeString(body.role || 'member'),
      departments: Array.isArray(body.departments) ? body.departments.map((dept: string) => sanitizeString(dept)).filter(Boolean) : [],
      departmentTypes,
      sendEmail: body.sendEmail !== false, // default true
      password: typeof body.password === 'string' ? body.password.trim() : '',
    };

    // Validate required fields
    const validation = validateUserInput({
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    if (!userData.company_id || !validateUUID(userData.company_id)) {
      return NextResponse.json(
        { error: 'Valid company ID is required' },
        { status: 400 }
      );
    }

    // Departments are optional — assign them if provided, skip silently if not
    const canHaveDepartments = ['member', 'manager'].includes(userData.role);

    // Validate department values
    const validDepartments = ['sales', 'support', 'scheduling', 'technician', 'inspector'];
    const invalidDepartments = userData.departments.filter((dept: string) => !validDepartments.includes(dept));
    if (invalidDepartments.length > 0) {
      return NextResponse.json(
        { error: `Invalid departments: ${invalidDepartments.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', userData.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    // Send invitation or create user directly depending on sendEmail flag
    let inviteData: { user: { id: string; email?: string | null } | null } = { user: null };
    let inviteError: { message: string } | null = null;

    if (userData.sendEmail) {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(userData.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          company_id: userData.company_id,
          company_name: company.name,
          role: userData.role,
        },
      });
      inviteData = data ?? { user: null };
      inviteError = error;
    } else {
      // Create user directly — use provided password or fall back to a random one
      const crypto = await import('crypto');
      const password = userData.password || crypto.randomBytes(24).toString('base64').slice(0, 24);
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
        },
      });
      inviteData = { user: data.user ?? null };
      inviteError = error;
    }

    if (inviteError) {
      console.error('Error creating user:', inviteError);
      return NextResponse.json(
        { error: userData.sendEmail ? 'Failed to send invitation' : 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile and company relationship for the new user
    const newUser = inviteData.user;
    if (newUser) {
      await supabase.from('profiles').insert({
        id: newUser.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
      });

      await supabase.from('user_companies').insert({
        user_id: newUser.id,
        company_id: userData.company_id,
        role: userData.role,
        is_primary: true,
      });

      if (canHaveDepartments && userData.departments.length > 0) {
        // Gate department_type by company settings — server is source of truth
        const { data: propertyTypeRows } = await supabase
          .from('company_settings')
          .select('setting_key, setting_value')
          .eq('company_id', userData.company_id)
          .in('setting_key', [
            'technician_property_type_enabled',
            'inspector_property_type_enabled',
          ]);
        const propertyTypeEnabled = { technician: false, inspector: false };
        for (const row of propertyTypeRows ?? []) {
          const isTrue = row.setting_value === 'true';
          if (row.setting_key === 'technician_property_type_enabled') propertyTypeEnabled.technician = isTrue;
          if (row.setting_key === 'inspector_property_type_enabled') propertyTypeEnabled.inspector = isTrue;
        }

        const departmentInserts = userData.departments.map((department: string) => {
          let department_type: InviteDepartmentType | null = null;
          if (department === 'technician' && propertyTypeEnabled.technician) {
            department_type = userData.departmentTypes.technician ?? null;
          } else if (department === 'inspector' && propertyTypeEnabled.inspector) {
            department_type = userData.departmentTypes.inspector ?? null;
          }
          return {
            user_id: newUser.id,
            company_id: userData.company_id,
            department,
            department_type,
          };
        });
        const { error: departmentError } = await supabase
          .from('user_departments')
          .insert(departmentInserts);
        if (departmentError) {
          console.error('Error assigning departments:', departmentError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: userData.sendEmail
        ? `Invitation sent to ${userData.email}`
        : `User ${userData.email} added successfully`,
      user: newUser
        ? {
            id: newUser.id,
            email: newUser.email,
            company: company.name,
            role: userData.role,
            departments: canHaveDepartments ? userData.departments : [],
          }
        : null,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users/invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
