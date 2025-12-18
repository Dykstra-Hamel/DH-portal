'use client';

import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { PestSelection } from '@/components/Common/PestSelection/PestSelection';
import { AdditionalPestsSelection } from '@/components/Common/AdditionalPestsSelection/AdditionalPestsSelection';
import { CustomDropdown } from '@/components/Common/CustomDropdown/CustomDropdown';
import EligibleAddOnSelector from '@/components/Quotes/EligibleAddOnSelector/EligibleAddOnSelector';
import { ScrollText } from 'lucide-react';
import { LeadQuoteSectionProps } from '../../types/leadStepTypes';
import styles from './LeadQuoteSection.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

export function LeadQuoteSection({
  lead,
  quote,
  isQuoteUpdating,
  pricingSettings,
  pestOptions,
  allServicePlans,
  serviceSelections,
  selectedPests,
  additionalPests,
  selectedAddOns,
  loadingPlan,
  loadingPestOptions,
  homeSize,
  yardSize,
  selectedHomeSizeOption,
  selectedYardSizeOption,
  homeSizeOptions,
  yardSizeOptions,
  preferredDate,
  preferredTime,
  onPestsChange,
  onHomeSizeChange,
  onYardSizeChange,
  onServiceSelectionChange,
  onAddOnToggle,
  onPreferredDateChange,
  onPreferredTimeChange,
  onEmailQuote,
  onShowToast,
  onRequestUndo,
  broadcastQuoteUpdate,
  setSelectedPests,
  setAdditionalPests,
  setHomeSize,
  setYardSize,
  setSelectedHomeSizeOption,
  setSelectedYardSizeOption,
  setPreferredDate,
  setPreferredTime,
}: LeadQuoteSectionProps) {
  const selectedPlan = serviceSelections[0]?.servicePlan;

  // Handler for updating primary pest
  const updatePrimaryPest = async (pestId: string) => {
    await onPestsChange(pestId, additionalPests);
  };

  // Handler for updating additional pests
  const updateAdditionalPests = async (pestIds: string[]) => {
    await onPestsChange(selectedPests[0] || '', pestIds);
  };

  // Handler for updating requested date
  const updateLeadRequestedDate = async (date: string) => {
    onPreferredDateChange(date);
  };

  // Handler for updating requested time
  const updateLeadRequestedTime = async (time: string) => {
    onPreferredTimeChange(time);
  };

  return (
    <InfoCard
      title="Quote"
      icon={<ScrollText size={20} />}
      isCollapsible={true}
      startExpanded={true}
    >
      <div className={styles.cardContent} style={{ position: 'relative' }}>
        {/* Pest Selection Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Pest Selection</h4>
          {loadingPlan && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingText}>Updating service plan...</div>
            </div>
          )}
          {loadingPestOptions ? (
            <div className={cardStyles.lightText}>Loading pest options...</div>
          ) : (
            <>
              {/* Primary Pest Section */}
              <PestSelection
                selectedPestId={selectedPests[0] || null}
                pestOptions={pestOptions}
                onPestChange={async pestId => {
                  if (pestId) {
                    // Update primary pest
                    setSelectedPests([pestId, ...additionalPests]);
                    await updatePrimaryPest(pestId);
                  } else {
                    // Remove primary pest
                    setSelectedPests(additionalPests);
                    await updatePrimaryPest('');
                  }
                }}
                loading={loadingPlan}
              />

              {/* Additional Pests Section - Only show if primary pest is selected */}
              {selectedPests.length > 0 && selectedPests[0] && (
                <AdditionalPestsSelection
                  selectedPestIds={additionalPests}
                  pestOptions={pestOptions}
                  primaryPestId={selectedPests[0]}
                  onPestsChange={async pestIds => {
                    setAdditionalPests(pestIds);
                    setSelectedPests(
                      [selectedPests[0], ...pestIds].filter(Boolean)
                    );
                    await updateAdditionalPests(pestIds);
                  }}
                  loading={loadingPlan}
                />
              )}
            </>
          )}
        </div>

        {/* Service Selection Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Service Selection</h4>
          {(loadingPlan || isQuoteUpdating) && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingText}>
                {loadingPlan ? 'Loading service plan...' : 'Updating...'}
              </div>
            </div>
          )}
          {loadingPlan && !selectedPlan ? (
            <div className={styles.emptyState}>Loading service plan...</div>
          ) : selectedPests.length === 0 ? (
            <div className={styles.emptyState}>
              Select a pest to view available service plans
            </div>
          ) : !selectedPlan ? (
            <div className={styles.emptyState}>
              No service plans available for selected pest
            </div>
          ) : (
            <>
              {/* Service Selection Form */}
              {/* Row 1: Size of Home, Yard Size (2 columns) */}
              <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel}>Size of Home</label>
                  </div>
                  <CustomDropdown
                    options={homeSizeOptions}
                    value={selectedHomeSizeOption}
                    onChange={onHomeSizeChange}
                    placeholder="Select home size"
                  />
                </div>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel}>Yard Size</label>
                  </div>
                  <CustomDropdown
                    options={yardSizeOptions}
                    value={selectedYardSizeOption}
                    onChange={onYardSizeChange}
                    placeholder="Select yard size"
                  />
                </div>
              </div>

              {/* Add-on Services Selector */}
              <EligibleAddOnSelector
                quote={quote}
                pricingSettings={pricingSettings}
                onToggleAddon={onAddOnToggle}
                selectedAddOns={selectedAddOns}
              />

              {/* Preferred Date and Time Inputs */}
              <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Preferred Date</label>
                  <input
                    type="date"
                    className={styles.selectInput}
                    value={preferredDate}
                    onChange={e => {
                      setPreferredDate(e.target.value);
                      updateLeadRequestedDate(e.target.value);
                    }}
                    placeholder="Enter preferred date"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Preferred Time</label>
                  <CustomDropdown
                    options={[
                      { value: 'morning', label: 'Morning (8AM - 12PM)' },
                      { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
                      { value: 'evening', label: 'Evening (5PM - 8PM)' },
                      { value: 'anytime', label: 'Anytime' },
                    ]}
                    value={preferredTime}
                    onChange={value => {
                      setPreferredTime(value);
                      updateLeadRequestedTime(value);
                    }}
                    placeholder="Enter preferred time"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quote Summary Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Quote Summary</h4>
          <QuoteSummaryCard
            quote={quote}
            lead={lead}
            isUpdating={isQuoteUpdating}
            onEmailQuote={onEmailQuote}
            hideCard={true}
          />
        </div>
      </div>
    </InfoCard>
  );
}
