import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getHomeRoute } from '@/lib/supabase/get-home-route';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? null;

  const supabase = await createClient();

  // Handle OAuth/magic link flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Sync avatar_url from OAuth metadata into profiles (handles users who
      // originally signed up via email and later connected Google)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const avatarUrl =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          user.user_metadata?.profile_image ||
          user.user_metadata?.profile_picture_url ||
          null;
        if (avatarUrl) {
          await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .is('avatar_url', null);
        }
        const destination = next ?? await getHomeRoute(supabase, user.id);
        return NextResponse.redirect(`${origin}${destination}`);
      }
      return NextResponse.redirect(`${origin}/tickets/dashboard`);
    }
  }

  // Handle invite confirmation flow
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const destination = next ?? (user ? await getHomeRoute(supabase, user.id) : '/tickets/dashboard');
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
