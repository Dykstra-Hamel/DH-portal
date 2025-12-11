/**
 * Footer Section Component
 *
 * Footer with logo, links, and contact info
 */

import Image from 'next/image';
import Link from 'next/link';
import styles from '../CampaignLandingPage.module.scss';

interface FooterSectionProps {
  footer: {
    tagline: string;
    links: Array<{ label: string; url: string }>;
  };
  branding: {
    logoUrl: string | null;
    companyName: string;
    phoneNumber: string | null;
    email: string | null;
  };
  serviceName: string;
}

export default function FooterSection({ footer, branding, serviceName }: FooterSectionProps) {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const offset = 70; // Account for fixed header
      const targetY = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
    }
  };

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
              <div className={styles.footerCompanyName}>{branding.companyName}</div>
            )}
            <p className={styles.footerTagline}>{footer.tagline}</p>
          </div>

          {/* Offers column */}
          <div className={styles.footerOffers}>
            <h4>Offers</h4>
            <button
              className={styles.footerLink}
              onClick={() => scrollToSection('hero-section')}
            >
              {serviceName}
            </button>
            <button
              className={styles.footerLink}
              onClick={() => scrollToSection('additional-services-section')}
            >
              Additional Add-On Services
            </button>
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
            © {new Date().getFullYear()} {branding.companyName}. All Rights Reserved.
          </p>
          <div className={styles.footerLinks}>
            <Link href="/terms">Terms & Conditions</Link>
            <span>|</span>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
