'use client';

/**
 * Campaign Landing Content Component
 *
 * Displays 4-step campaign redemption modal with signature acceptance.
 */

import CampaignSteps from './CampaignSteps';

interface CampaignLandingContentProps {
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
}

export default function CampaignLandingContent({
  campaign,
  customer,
  company,
  redemption,
}: CampaignLandingContentProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}
    >
      <CampaignSteps
        campaign={campaign}
        customer={customer}
        company={company}
        redemption={redemption}
      />
    </div>
  );
}
