'use client';

/**
 * Campaign Landing Page (Subdomain-based)
 *
 * Accessible via: company.pmpcentral.io/campaign/{campaignId}/{customerId}
 * Company is extracted from subdomain and validated against campaign/customer data.
 */

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CampaignLandingPage from '@/components/CampaignLanding/CampaignLandingPage/CampaignLandingPage';
import LoadingSpinner from '@/components/CampaignLanding/LoadingSpinner/LoadingSpinner';

interface CampaignData {
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
  } | null;
  landingPage: {
    hero: {
      title: string;
      subtitle: string;
      description: string | null;
      buttonText: string;
      imageUrl: string | null;
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

export default function SubdomainCampaignLandingPage() {
  const params = useParams();
  const { campaignId, customerId } = params;

  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // API automatically determines company from campaign ID
        // No company slug needed in URL - it's looked up from the campaign
        const response = await fetch(
          `/api/campaigns/${campaignId}/landing-page?customerId=${customerId}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to load campaign data');
        }

        setData(result.data);
        // Trigger fade-in animation after a brief delay
        setTimeout(() => setFadeIn(true), 50);
      } catch (err) {
        console.error('Error fetching campaign data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    }

    if (campaignId && customerId) {
      fetchData();
    }
  }, [campaignId, customerId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Campaign Not Found</h2>
        <p>{error}</p>
        <p>This campaign may have expired or the link may be invalid.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>No Data Available</h2>
        <p>Unable to load campaign information.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      <CampaignLandingPage
        campaign={data.campaign}
        customer={data.customer}
        company={data.company}
        redemption={data.redemption || {
          isRedeemed: false,
          redeemedAt: null,
          requestedDate: null,
          requestedTime: null,
        }}
        landingPage={data.landingPage}
      />
    </div>
  );
}
