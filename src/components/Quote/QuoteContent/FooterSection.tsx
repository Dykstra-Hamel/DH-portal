/**
 * Footer Section Component
 *
 * Footer with logo, links, and contact info
 */

import Image from 'next/image';
import Link from 'next/link';
import styles from './quotecontent.module.scss';

interface FooterSectionProps {
  links: {
    privacyUrl: string | null;
    termsUrl: string | null;
  };
  branding: {
    logoUrl: string | null;
    companyName: string;
    phoneNumber: string | null;
    email: string | null;
  };
}

export default function FooterSection({ links, branding }: FooterSectionProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Upper row with brand and support */}
        <div className={styles.footerTop}>
          {/* Logo and tagline */}
          <div className={styles.footerBrand}>
            {branding.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt={branding.companyName}
                width={150}
                height={50}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className={styles.footerCompanyName}>
                {branding.companyName}
              </div>
            )}
          </div>

          {/* Support column */}
          <div className={styles.footerSupport}>
            <h4>Support</h4>
            {branding.phoneNumber && <p>{branding.phoneNumber}</p>}
            {branding.email && <p>{branding.email}</p>}
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.footerBottom}>
          <p>
            © {new Date().getFullYear()} {branding.companyName}. All Rights
            Reserved.
          </p>
          <div className={styles.footerLinks}>
            <Link
              href={links.termsUrl || '#'}
              target={links.termsUrl ? '_blank' : undefined}
              rel={links.termsUrl ? 'noopener noreferrer' : undefined}
            >
              Terms & Conditions
            </Link>
            <span>|</span>
            <Link
              href={links.privacyUrl || '#'}
              target={links.privacyUrl ? '_blank' : undefined}
              rel={links.privacyUrl ? 'noopener noreferrer' : undefined}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
