'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import styles from './Auth.module.scss';
import { OTPInput } from './OTPInput';

export default function Auth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<
    'magic-link' | 'otp' | 'password' | 'reset-password'
  >('password');
  const [resetEmailSent, setResetEmailSent] = useState(false);
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

  const signInWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('Error sending OTP:', error);
      setOtpError(error.message);
    } else {
      setOtpSent(true);
      setOtpError('');
    }
  };

  const verifyOtp = async (token: string) => {
    setVerifyingOtp(true);
    setOtpError('');

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      setOtpError(error.message);
      setVerifyingOtp(false);
    } else {
      // Success - user will be redirected by auth state change
      setVerifyingOtp(false);
    }
  };

  const resendOtp = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setOtpError(error.message);
    } else {
      setOtpError('');
    }
  };

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setPasswordError('');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in with password:', error);
      setPasswordError(error.message);
    }
  };

  const sendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setPasswordError('');
    const supabase = createClient();
    const redirectOrigin =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectOrigin}/auth/confirm?next=/account/update-password`,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      setPasswordError(error.message);
    } else {
      setResetEmailSent(true);
      setPasswordError('');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setMagicLinkSent(false);
    setOtpSent(false);
    setOtpError('');
    setPasswordError('');
    setResetEmailSent(false);
    setAuthMethod('password');
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
        <h1>DYKSTRA|HAMEL</h1>
        <div className={styles.buttonWrapper}>
          <button onClick={signInWithGoogle} className="button primaryButton">
            Sign in with Google
          </button>
          <button onClick={signInWithFacebook} className="button primaryButton">
            Sign in with Facebook
          </button>
        </div>

        <div className={styles.magicLinkFormWrapper}>
          <h2 className={styles.magicLinkHeading}>Or sign in with email:</h2>

          {/* Auth method toggle */}
          <div className={styles.authMethodToggle}>
            <button
              type="button"
              className={
                authMethod === 'password'
                  ? styles.activeToggle
                  : styles.inactiveToggle
              }
              onClick={() => setAuthMethod('password')}
            >
              Password
            </button>
            {/* <button
              type="button"
              className={
                authMethod === 'magic-link'
                  ? styles.activeToggle
                  : styles.inactiveToggle
              }
              onClick={() => setAuthMethod('magic-link')}
            >
              Magic Link
            </button> */}
            <button
              type="button"
              className={
                authMethod === 'otp'
                  ? styles.activeToggle
                  : styles.inactiveToggle
              }
              onClick={() => setAuthMethod('otp')}
            >
              OTP Code/Magic Link
            </button>
          </div>

          {/* Password Flow */}
          {authMethod === 'password' && (
            <form
              onSubmit={signInWithPassword}
              className={styles.emailPasswordForm}
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {passwordError && (
                <div className={styles.errorMessage}>{passwordError}</div>
              )}
              <button type="submit" className={styles.authFormButton}>
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('reset-password')}
                className={styles.forgotPasswordLink}
              >
                Forgot your password?
              </button>
            </form>
          )}

          {/* Magic Link Flow */}
          {authMethod === 'magic-link' && (
            <>
              {magicLinkSent ? (
                <div className={styles.successMessage}>
                  Magic link sent! Check your email.
                  <div className={styles.otpActions}>
                    <button
                      type="button"
                      onClick={resetForm}
                      className={styles.backButton}
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>
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
                    required
                  />
                  <button type="submit" className={styles.authFormButton}>
                    Send Magic Link
                  </button>
                </form>
              )}
            </>
          )}

          {/* OTP Flow */}
          {authMethod === 'otp' && (
            <>
              {!otpSent ? (
                <form onSubmit={signInWithOtp} className={styles.magicLinkForm}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className={styles.authFormButton}>
                    Send Code/Link
                  </button>
                </form>
              ) : (
                <div className={styles.otpVerificationContainer}>
                  <p>
                    Enter the 6-digit code sent to {email}, or click the login
                    link included in the email.
                  </p>

                  <OTPInput
                    length={6}
                    onComplete={verifyOtp}
                    loading={verifyingOtp}
                  />

                  {otpError && (
                    <div className={styles.errorMessage}>{otpError}</div>
                  )}

                  <div className={styles.otpActions}>
                    <button
                      type="button"
                      onClick={resendOtp}
                      className={styles.resendButton}
                      disabled={verifyingOtp}
                    >
                      Resend Code
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className={styles.backButton}
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Password Reset Flow */}
          {authMethod === 'reset-password' && (
            <>
              {!resetEmailSent ? (
                <form
                  onSubmit={sendPasswordReset}
                  className={styles.resetPasswordForm}
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  {passwordError && (
                    <div className={styles.errorMessage}>{passwordError}</div>
                  )}
                  <button type="submit" className={styles.authFormButton}>
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.backButton}
                  >
                    ← Back to login
                  </button>
                </form>
              ) : (
                <div className={styles.successMessage}>
                  Password reset link sent! Check your email.
                  <div className={styles.otpActions}>
                    <button
                      type="button"
                      onClick={resetForm}
                      className={styles.backButton}
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>
              )}
            </>
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
