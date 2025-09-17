'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BaseAuth } from './BaseAuth';
import styles from './Auth.module.scss';

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
}

interface CompanyBranding {
  company: Company;
  branding: {
    logo_url: string | null;
    icon_logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    slogans: {
      line1: string;
      line2: string;
      line3: string;
    };
    login_images: string[];
  };
}

interface BrandedAuthProps {
  slug: string;
}

export default function BrandedAuth({ slug }: BrandedAuthProps) {
  const [companyBranding, setCompanyBranding] =
    useState<CompanyBranding | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  // Load company branding data
  useEffect(() => {
    const loadCompanyBranding = async () => {
      try {
        setBrandingLoading(true);

        // Get company data with branding and login settings in single call
        const companyResponse = await fetch(`/api/companies/by-slug/${slug}`);
        if (!companyResponse.ok) {
          if (companyResponse.status === 404) {
            setShouldRedirect(true);
            return;
          }
          throw new Error('Failed to load company data');
        }

        const brandingData = await companyResponse.json();
        setCompanyBranding(brandingData);
      } catch (err) {
        console.error('Error loading company branding:', err);
        setShouldRedirect(true);
      } finally {
        setBrandingLoading(false);
      }
    };

    if (slug) {
      loadCompanyBranding();
    }
  }, [slug]);

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/login');
    }
  }, [shouldRedirect, router]);

  if (brandingLoading) {
    return (
      <div className={styles.authWrapper}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading login page...</p>
        </div>
      </div>
    );
  }

  // Fallback to generic login if no branding data
  if (
    !companyBranding ||
    !companyBranding.company ||
    !companyBranding.branding
  ) {
    if (!shouldRedirect) {
      setShouldRedirect(true);
    }
    return null;
  }

  const { company, branding } = companyBranding;

  // Transform branding data to match BaseAuth interface
  const authBranding = {
    logoUrl: branding.logo_url,
    companyName: company.name,
    primaryColor: branding.primary_color,
    secondaryColor: branding.secondary_color,
    slogans: branding.slogans,
    brandingImages:
      branding.login_images.length > 0 ? branding.login_images : undefined,
  };

  return <BaseAuth branding={authBranding} />;
}
