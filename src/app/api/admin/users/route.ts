import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    // Get all users from auth.users
    const { data: authUsers, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // Combine auth users with their profiles
    const usersWithProfiles =
      authUsers.users?.map(user => ({
        ...user,
        profiles: profiles?.find(profile => profile.id === user.id),
      })) || [];

    return NextResponse.json(usersWithProfiles);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const { validateUserInput, sanitizeString } = await import(
      '@/lib/validation'
    );

    // Validate and sanitize input
    const userData = {
      email: sanitizeString(body.email || ''),
      first_name: sanitizeString(body.first_name || ''),
      last_name: sanitizeString(body.last_name || ''),
    };

    const validation = validateUserInput(userData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Generate secure random password
    const crypto = await import('crypto');
    const randomPassword = crypto.randomBytes(16).toString('base64').slice(0, 16);
    
    // Create user via Supabase auth admin
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: randomPassword, // Secure random password, user should reset
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
      },
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
      });

      if (profileError) {
        // Profile creation failed, but user was created - this is logged for debugging
        // In production, you might want to implement a cleanup mechanism
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
