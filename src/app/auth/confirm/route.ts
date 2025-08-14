import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  // Debug logging
  console.log('Auth confirm received params:', {
    code: code ? 'present' : 'missing',
    token_hash: token_hash ? 'present' : 'missing',
    type,
    next,
    allParams: Object.fromEntries(searchParams.entries())
  });

  const supabase = await createClient();

  // Handle code-based flow (password reset emails)
  if (code) {
    console.log('Processing code-based auth flow');
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log('Code exchange successful, redirecting to:', next);
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Code exchange error:', error);
    }
  }

  // Handle token_hash/type flow (OTP and other flows)
  if (token_hash && type) {
    console.log('Processing token_hash/type auth flow');
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      console.log('OTP verification successful, redirecting to:', next);
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('OTP verification error:', error);
    }
  }

  // Return to login with error if token exchange fails
  console.log('No valid auth flow found, redirecting to login with error');
  return NextResponse.redirect(`${origin}/login?error=invalid-token`);
}