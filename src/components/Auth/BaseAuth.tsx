import { useAuth } from '@/hooks/useAuth';
import styles from './Auth.module.scss';
import { BrandingPanel } from './components/BrandingPanel';
import { AuthFormContent } from './components/AuthFormContent';

interface AuthBranding {
  logoUrl?: string | null;
  companyName?: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  slogans?: {
    line1: string;
    line2: string;
    line3: string;
  };
  brandingImages?: string[];
}

interface BaseAuthProps {
  branding?: AuthBranding;
}

export function BaseAuth({ branding }: BaseAuthProps) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className={styles.authWrapper}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.user) {
    return (
      <div>
        <p>Welcome, {auth.user.user_metadata?.full_name || auth.user.email}!</p>
        <button onClick={auth.signOut}>Sign out</button>
      </div>
    );
  }

  // Determine if we should use split-screen layout (branded pages with background image)
  const useSplitScreen = branding?.brandingImages;

  if (useSplitScreen) {
    // Split-screen layout for branded pages
    return (
      <div className={styles.authSplitContainer}>
        {/* Left Panel - Auth Form */}
        <div className={styles.authLeftPanel}>
          <AuthFormContent auth={auth} />
        </div>

        {/* Right Panel - Company Branding */}
        <BrandingPanel
          brandingImages={branding.brandingImages}
          companyLogo={branding.logoUrl}
          companyName={branding.companyName}
          slogans={branding.slogans}
        />
      </div>
    );
  }

  // Single column layout for base auth (no branding)
  return (
    <div className={styles.authWrapper}>
      <AuthFormContent auth={auth} />
    </div>
  );
}
