'use client';

/**
 * Campaign Landing Page (Subdomain-based)
 *
 * Accessible via: company.pmpcentral.io/campaign/{campaignId}/{customerId}
 * Company is extracted from subdomain and validated against campaign/customer data.
 */

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
    website: string[];
  };
  redemption: {
    isRedeemed: boolean;
    redeemedAt: string | null;
    requestedDate: string | null;
    requestedTime: string | null;
  } | null;
  businessHours?: {
    [day: string]: {
      start: string;
      end: string;
      closed: boolean;
    };
  } | null;
  landingPage: {
    hero: {
      title: string;
      subtitle: string;
      description: string | null;
      buttonText: string;
      imageUrl: string | null;
      buttonIconUrl: string | null;
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
      termsUrl: string | null;
      privacyUrl: string | null;
    };
    terms: {
      content: string | null;
    };
    redemptionCard: {
      heading: string | null;
      disclaimer: string | null;
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
    thankYou: {
      greeting: string;
      content: string | null;
      showExpect: boolean;
      expectHeading: string;
      expectColumns: Array<{
        imageUrl: string | null;
        heading: string | null;
        content: string | null;
      }>;
      ctaText: string;
      ctaUrl: string | null;
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
  const viewTrackedRef = useRef(false);

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

  // Track page view (run once per session)
  useEffect(() => {
    async function trackView() {
      if (viewTrackedRef.current || !campaignId || !customerId) {
        return;
      }

      viewTrackedRef.current = true;

      try {
        // Generate session ID for deduplication
        const sessionId = sessionStorage.getItem('campaign_session_id') ||
          `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        sessionStorage.setItem('campaign_session_id', sessionId);

        // Capture client-side device data
        const clientDeviceData = {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
        };

        await fetch(`/api/campaigns/${campaignId}/track-view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            sessionId,
            client_device_data: clientDeviceData,
          }),
        });
      } catch (err) {
        // Silent failure - don't block page if tracking fails
        console.error('Error tracking page view:', err);
      }
    }

    trackView();
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
        businessHours={data.businessHours || null}
        landingPage={data.landingPage}
      />
    </div>
  );
}
