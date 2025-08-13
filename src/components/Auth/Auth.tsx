'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import styles from './Auth.module.scss';

export default function Auth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Redirect to dashboard if user is authenticated
      if (session?.user) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    const supabase = createClient();
    // Use localhost in development, otherwise use current origin
    const redirectOrigin =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectOrigin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) console.error('Error signing in:', error);
  };

  const signInWithFacebook = async () => {
    const supabase = createClient();
    // Use localhost in development, otherwise use current origin
    const redirectOrigin =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${redirectOrigin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) console.error('Error signing in:', error);
  };

  const signInWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const supabase = createClient();
    // Use localhost in development, otherwise use current origin
    const redirectOrigin =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${redirectOrigin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      console.error('Error sending magic link:', error);
    } else {
      setMagicLinkSent(true);
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className={styles.authWrapper}>
        <div className={styles.buttonWrapper}>
          <button onClick={signInWithGoogle} className="button primaryButton">
            Sign in with Google
          </button>
          <button onClick={signInWithFacebook} className="button primaryButton">
            Sign in with Facebook
          </button>
        </div>

        <div className="">
          <h2 className={styles.magicLinkHeading}>
            Or sign in with magic link:
          </h2>
          {magicLinkSent ? (
            <div className="">Magic link sent! Check your email.</div>
          ) : (
            <form
              onSubmit={signInWithMagicLink}
              className={styles.magicLinkForm}
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className=""
                required
              />
              <button type="submit" className={styles.authFormButton}>
                Send Magic Link
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome, {user.user_metadata?.full_name || user.email}!</p>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
