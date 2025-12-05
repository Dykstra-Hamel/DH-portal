'use client';

/**
 * Redemption Modal Component
 *
 * Modal workflow for campaign redemption:
 * 1. Schedule Step - Select preferred date/time
 * 2. Signature Step - Accept terms and sign
 * 3. Thank You Step - Confirmation
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { getClientDeviceData } from '@/lib/device-utils';
import styles from './RedemptionModal.module.scss';
import ScheduleStep from './steps/ScheduleStep';
import SignatureStep from './steps/SignatureStep';
import ThankYouStep from './steps/ThankYouStep';

interface RedemptionModalProps {
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
  branding: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    phoneNumber: string | null;
    email: string | null;
    companyName: string;
  };
  termsContent: string | null;
  selectedAddonIds: string[];
  onClose: () => void;
}

type Step = 'schedule' | 'signature' | 'thankyou';

export default function RedemptionModal({
  campaign,
  customer,
  company,
  branding,
  termsContent,
  selectedAddonIds,
  onClose,
}: RedemptionModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('schedule');
  const [scheduleData, setScheduleData] = useState<{
    date: string;
    time: string;
  }>({ date: '', time: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScheduleSubmit = (data: { date: string; time: string }) => {
    setScheduleData(data);
    setCurrentStep('signature');
  };

  const handleSignatureSubmit = async (signatureData: {
    signature: string;
    termsAccepted: boolean;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const clientDeviceData = getClientDeviceData();

      const response = await fetch(`/api/campaigns/${campaign.campaign_id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          signature_data: signatureData.signature,
          terms_accepted: signatureData.termsAccepted,
          requested_date: scheduleData.date,
          requested_time: scheduleData.time,
          client_device_data: clientDeviceData,
          selected_addon_ids: selectedAddonIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to redeem campaign');
      }

      setCurrentStep('thankyou');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSchedule = () => {
    setCurrentStep('schedule');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget && currentStep !== 'thankyou') {
      onClose();
    }
  };

  // Don't render on server
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        className={styles.modal}
        style={{
          '--brand-primary': branding.primaryColor,
          '--brand-secondary': branding.secondaryColor,
        } as React.CSSProperties}
      >
        {/* Close button (hidden on thank you step) */}
        {currentStep !== 'thankyou' && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        )}

        {/* Step content */}
        {currentStep === 'schedule' && (
          <ScheduleStep
            customer={customer}
            onSubmit={handleScheduleSubmit}
          />
        )}

        {currentStep === 'signature' && (
          <SignatureStep
            customer={customer}
            termsContent={termsContent}
            onSubmit={handleSignatureSubmit}
            onBack={handleBackToSchedule}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}

        {currentStep === 'thankyou' && (
          <ThankYouStep
            customer={customer}
            campaign={campaign}
            company={company}
            branding={branding}
            scheduleData={scheduleData}
            onClose={onClose}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
