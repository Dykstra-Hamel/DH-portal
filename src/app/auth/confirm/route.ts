import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';


  const supabase = await createClient();

  // Handle code-based flow (password reset emails)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Code exchange error:', error);
    }
  }

  // Handle token_hash/type flow (OTP and other flows)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('OTP verification error:', error);
    }
  }

  // Return to login with error if token exchange fails
  return NextResponse.redirect(`${origin}/login?error=invalid-token`);
}