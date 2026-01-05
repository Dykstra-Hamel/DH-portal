'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export function useAuth() {
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

      // Avatar sync is handled in useUser.ts hook

      // Redirect to tickets/new if user is authenticated
      if (session?.user) {
        router.push('/tickets/new');
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
        redirectTo: `${redirectOrigin}/auth/callback?next=/tickets/new`,
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
        redirectTo: `${redirectOrigin}/auth/callback?next=/tickets/new`,
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
        emailRedirectTo: `${redirectOrigin}/auth/callback?next=/tickets/new`,
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

  return {
    // State
    user,
    loading,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    authMethod,
    setAuthMethod,
    magicLinkSent,
    otpSent,
    verifyingOtp,
    otpError,
    passwordError,
    resetEmailSent,
    
    // Actions
    signInWithGoogle,
    signInWithFacebook,
    signInWithMagicLink,
    signInWithOtp,
    verifyOtp,
    resendOtp,
    signInWithPassword,
    sendPasswordReset,
    resetForm,
    signOut,
  };
}