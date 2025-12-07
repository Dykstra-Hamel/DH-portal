import { Dispatch, SetStateAction } from 'react';
import { User } from '@supabase/supabase-js';
import styles from '../Auth.module.scss';
import { PMPCentralHeader } from './PMPCentralHeader';
import { SocialAuthButtons } from './SocialAuthButtons';
import { AuthMethodToggle } from './AuthMethodToggle';
import { PasswordForm } from './PasswordForm';
import { OTPForm } from './OTPForm';
import { ResetPasswordForm } from './ResetPasswordForm';

interface AuthFormContentProps {
  auth: {
    user: User | null;
    loading: boolean;
    email: string;
    setEmail: Dispatch<SetStateAction<string>>;
    password: string;
    setPassword: Dispatch<SetStateAction<string>>;
    showPassword: boolean;
    setShowPassword: Dispatch<SetStateAction<boolean>>;
    authMethod: 'magic-link' | 'otp' | 'password' | 'reset-password';
    setAuthMethod: Dispatch<
      SetStateAction<'magic-link' | 'otp' | 'password' | 'reset-password'>
    >;
    magicLinkSent: boolean;
    otpSent: boolean;
    verifyingOtp: boolean;
    otpError: string;
    passwordError: string;
    resetEmailSent: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithFacebook: () => Promise<void>;
    signInWithMagicLink: (e: React.FormEvent) => Promise<void>;
    signInWithOtp: (e: React.FormEvent) => Promise<void>;
    verifyOtp: (token: string) => Promise<void>;
    resendOtp: () => Promise<void>;
    signInWithPassword: (e: React.FormEvent) => Promise<void>;
    sendPasswordReset: (e: React.FormEvent) => Promise<void>;
    resetForm: () => void;
    signOut: () => Promise<void>;
  };
}

export function AuthFormContent({ auth }: AuthFormContentProps) {
  return (
    <>
      <PMPCentralHeader />
      <div className={styles.loginFormWrapper}>
        <div className={styles.magicLinkFormWrapper}>
          <h2 className={styles.magicLinkHeading}>Login to your account</h2>
          <p className={styles.magicLinkSubheading}>
            Fill out the form below to login
          </p>

          <AuthMethodToggle
            authMethod={auth.authMethod}
            onMethodChange={auth.setAuthMethod}
          />

          {/* Password Flow */}
          {auth.authMethod === 'password' && (
            <PasswordForm
              email={auth.email}
              setEmail={auth.setEmail}
              password={auth.password}
              setPassword={auth.setPassword}
              showPassword={auth.showPassword}
              setShowPassword={auth.setShowPassword}
              passwordError={auth.passwordError}
              onSubmit={auth.signInWithPassword}
              onForgotPassword={() => auth.setAuthMethod('reset-password')}
            />
          )}

          {/* OTP Flow */}
          {auth.authMethod === 'otp' && (
            <OTPForm
              email={auth.email}
              setEmail={auth.setEmail}
              otpSent={auth.otpSent}
              verifyingOtp={auth.verifyingOtp}
              otpError={auth.otpError}
              onSendOtp={auth.signInWithOtp}
              onVerifyOtp={auth.verifyOtp}
              onResendOtp={auth.resendOtp}
              onBack={auth.resetForm}
            />
          )}

          {/* Password Reset Flow */}
          {auth.authMethod === 'reset-password' && (
            <ResetPasswordForm
              email={auth.email}
              setEmail={auth.setEmail}
              resetEmailSent={auth.resetEmailSent}
              passwordError={auth.passwordError}
              onSubmit={auth.sendPasswordReset}
              onBack={auth.resetForm}
            />
          )}
          <div className={styles.socialSubHeaderWrapper}>
            <p className={styles.socialSubHeader}>
              Or login with social accounts
            </p>
          </div>
          <SocialAuthButtons
            onGoogleSignIn={auth.signInWithGoogle}
            onFacebookSignIn={auth.signInWithFacebook}
          />
        </div>
      </div>
      <p className={styles.termsText}>
        By clicking “Login” I accept the PMP Central Terms of Service and
        Privacy Notice
      </p>
    </>
  );
}
