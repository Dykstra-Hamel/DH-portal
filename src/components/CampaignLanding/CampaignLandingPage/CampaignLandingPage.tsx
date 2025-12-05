'use client';

/**
 * Campaign Landing Page Component
 *
 * Main landing page with customizable sections based on campaign configuration
 */

import { useState, useEffect } from 'react';
import styles from './CampaignLandingPage.module.scss';
import ThankYouPage from '../ThankYouPage/ThankYouPage';
import RedemptionModal from '../RedemptionModal/RedemptionModal';
import CampaignRedemptionCard from '../CampaignRedemptionCard/CampaignRedemptionCard';
import HeaderSection from './sections/HeaderSection';
import HeroSection from './sections/HeroSection';
import LetterSection from './sections/LetterSection';
import FeaturesSection from './sections/FeaturesSection';
import AdditionalServicesSection from './sections/AdditionalServicesSection';
import TabbedFAQSection from './sections/TabbedFAQSection';
import FooterSection from './sections/FooterSection';

interface CampaignLandingPageProps {
  campaign: {
    id: string;
    campaign_id: string;
    name: string;
    description: string | null;
    discount: {
      id: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
      name: string;
    } | null;
  };
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    service_address: {
      id: string;
      street_address: string;
      city: string;
      state: string;
      zip_code: string;
    } | null;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
  redemption: {
    isRedeemed: boolean;
    redeemedAt: string | null;
    requestedDate: string | null;
    requestedTime: string | null;
  };
  landingPage: {
    hero: {
      title: string;
      subtitle: string;
      description: string | null;
      buttonText: string;
      imageUrl: string | null; // Changed from imageUrls array to single image
    };
    pricing: {
      displayPrice: string;
      originalPrice: string | null;
      savings: string | null;
    };
    letter: {
      show: boolean;
      content: string | null;
      signatureText: string;
      imageUrl: string | null;
    };
    features: {
      heading: string;
      bullets: string[];
      imageUrl: string | null;
    };
    additionalServices: {
      show: boolean;
      heading: string;
      services: Array<{ name: string; description?: string }>;
      imageUrl: string | null;
    };
    addons: Array<{
      id: string;
      name: string;
      description: string | null;
      faqs: Array<{ question: string; answer: string }>;
      price: number;
    }>;
    faq: {
      show: boolean;
      heading: string;
      serviceName: string;
      serviceFaqs: Array<{ question: string; answer: string }>;
      addonFaqs: Array<{
        addonId: string;
        addonName: string;
        faqs: Array<{ question: string; answer: string }>;
      }>;
    };
    header: {
      primaryButtonText: string;
      secondaryButtonText: string;
      showCta: boolean;
    };
    footer: {
      tagline: string;
      links: Array<{ label: string; url: string }>;
    };
    terms: {
      content: string | null;
    };
    branding: {
      logoUrl: string | null;
      primaryColor: string;
      secondaryColor: string;
      phoneNumber: string | null;
      email: string | null;
      companyName: string;
      accentColorPreference: 'primary' | 'secondary';
      fontPrimaryName: string | null;
      fontPrimaryUrl: string | null;
    };
  };
}

export default function CampaignLandingPage({
  campaign,
  customer,
  company,
  redemption,
  landingPage,
}: CampaignLandingPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Load brand primary font dynamically
  useEffect(() => {
    if (landingPage.branding.fontPrimaryUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = landingPage.branding.fontPrimaryUrl;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [landingPage.branding.fontPrimaryUrl]);

  // If already redeemed, show full-page thank you
  if (redemption.isRedeemed) {
    return (
      <ThankYouPage
        campaign={campaign}
        customer={customer}
        company={company}
        redemption={redemption}
        branding={landingPage.branding}
      />
    );
  }

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddonChange = (addonId: string, checked: boolean) => {
    setSelectedAddonIds(prev =>
      checked
        ? [...prev, addonId]  // Add if checked
        : prev.filter(id => id !== addonId)  // Remove if unchecked
    );
  };

  return (
    <div
      className={styles.landingPage}
      style={{
        '--brand-primary': landingPage.branding.primaryColor,
        '--brand-secondary': landingPage.branding.secondaryColor,
        '--accent-color': landingPage.branding.accentColorPreference === 'primary'
          ? landingPage.branding.primaryColor
          : landingPage.branding.secondaryColor,
        '--font-primary': landingPage.branding.fontPrimaryName
          ? `"${landingPage.branding.fontPrimaryName}", sans-serif`
          : '"Inter Tight", sans-serif',
      } as React.CSSProperties}
    >
      {/* Header */}
      {landingPage.header.showCta && (
        <HeaderSection
          logo={landingPage.branding.logoUrl}
          companyName={landingPage.branding.companyName}
          primaryButtonText={landingPage.header.primaryButtonText}
          secondaryButtonText={landingPage.header.secondaryButtonText}
          phoneNumber={landingPage.branding.phoneNumber}
          onPrimaryClick={handleOpenModal}
        />
      )}

      {/* Hero Section */}
      <HeroSection
        hero={landingPage.hero}
        pricing={landingPage.pricing}
        onCtaClick={handleOpenModal}
      />

      {/* Letter Section with Redemption Card (2-column layout) */}
      {landingPage.letter.show && landingPage.letter.content && (
        <section className={styles.letterAndRedemptionSection}>
          <div className={styles.letterAndRedemptionContainer}>
            <div className={styles.letterColumn}>
              <LetterSection
                letter={landingPage.letter}
                pricing={landingPage.pricing}
                customer={customer}
                campaign={campaign}
                branding={landingPage.branding}
                onCtaClick={handleOpenModal}
              />
            </div>
            <div className={styles.redemptionColumn}>
              <CampaignRedemptionCard
                price={landingPage.pricing.displayPrice.split('/')[0] || '$44'}
                frequency={'/' + (landingPage.pricing.displayPrice.split('/')[1] || 'mo')}
                originalPrice={landingPage.pricing.originalPrice || undefined}
                addons={landingPage.addons.map(addon => ({
                  id: addon.id,
                  name: `${addon.name}*`,
                  checked: false,
                }))}
                onRedeemClick={handleOpenModal}
                onAddonChange={handleAddonChange}
              />
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {landingPage.features.bullets.length > 0 && (
        <FeaturesSection features={landingPage.features} onCtaClick={handleOpenModal} />
      )}

      {/* Additional Services Section */}
      {landingPage.additionalServices.show &&
        landingPage.addons.length > 0 && (
          <AdditionalServicesSection
            additionalServices={landingPage.additionalServices}
            addons={landingPage.addons}
            onCtaClick={handleOpenModal}
          />
        )}

      {/* FAQ Section */}
      {landingPage.faq.show && (landingPage.faq.serviceFaqs.length > 0 || landingPage.faq.addonFaqs.length > 0) && (
        <TabbedFAQSection faq={landingPage.faq} />
      )}

      {/* Footer Section */}
      <FooterSection
        footer={landingPage.footer}
        branding={landingPage.branding}
      />

      {/* Redemption Modal */}
      {isModalOpen && (
        <RedemptionModal
          campaign={campaign}
          customer={customer}
          company={company}
          branding={landingPage.branding}
          termsContent={landingPage.terms.content}
          selectedAddonIds={selectedAddonIds}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
