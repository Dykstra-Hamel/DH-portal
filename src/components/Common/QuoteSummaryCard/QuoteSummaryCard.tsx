import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { Quote } from '@/types/quote';
import styles from './QuoteSummaryCard.module.scss';
import { FileText, Mail, ExternalLink } from 'lucide-react';
import { formatAcresFractional } from '@/lib/pricing-calculations';
import { getFullQuoteUrl } from '@/lib/quote-utils';

interface QuoteSummaryCardProps {
  quote: Quote | null;
  lead?: any; // Lead data for customer/service details
  isUpdating?: boolean;
  onNotInterested?: () => void;
  onEmailQuote?: () => void;
  onReadyToSchedule?: () => void;
  hideCard?: boolean;
}

export function QuoteSummaryCard({
  quote,
  lead,
  isUpdating = false,
  onNotInterested,
  onEmailQuote,
  onReadyToSchedule,
  hideCard = false,
}: QuoteSummaryCardProps) {
  if (!quote) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format yard size range from decimal to fractional display
  const formatYardSizeRange = (range: string): string => {
    // Parse range like "0.26-0.50" or "2.00+"
    if (range.includes('+')) {
      const startValue = parseFloat(range.replace('+', ''));
      return `${formatAcresFractional(startValue)}+ acre`;
    } else if (range.includes('-')) {
      const [start, end] = range.split('-').map(parseFloat);
      const startFormatted = formatAcresFractional(start);
      const endFormatted = formatAcresFractional(end);
      const acreWord = end > 1 ? 'acres' : 'acre';
      return `${startFormatted}-${endFormatted} ${acreWord}`;
    }
    return range;
  };

  // Format pest concerns from quote (single source of truth)
  const pestConcerns = [];
  if (quote.primary_pest) {
    pestConcerns.push(quote.primary_pest);
  }
  if (quote.additional_pests && quote.additional_pests.length > 0) {
    pestConcerns.push(...quote.additional_pests);
  }

  // Get total number of line items
  const totalLineItems = quote.line_items?.length || 0;

  const cardContent = (
    <div
      className={`${styles.quoteContent} ${isUpdating ? styles.updating : ''}`}
    >
      {/* Service Details Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Service Details:</h4>

        {/* Pest Concerns */}
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Pest Concerns</div>
          <div className={styles.fieldValue}>
            {pestConcerns.length > 0
              ? pestConcerns.join(', ')
              : 'Not specified'}
          </div>
        </div>

        {/* Display all line items */}
        {quote.line_items && quote.line_items.length > 0 && (
          <>
            {quote.line_items.map((lineItem, index) => (
              <div key={lineItem.id}>
                {/* Service Selection, Frequency, Initial Price, Recurring Price all on one row */}
                <div className={styles.gridRow}>
                  <div className={styles.gridItem}>
                    <div className={styles.fieldLabel}>
                      Service Selection {index + 1}/{totalLineItems}
                    </div>
                    <div className={styles.fieldValue}>
                      {lineItem.plan_name}
                    </div>
                  </div>
                  <div className={styles.gridItem}>
                    <div className={styles.fieldLabel}>Frequency</div>
                    <div className={styles.fieldValue}>
                      {lineItem.billing_frequency === 'quarterly'
                        ? 'Quarterly'
                        : lineItem.billing_frequency === 'monthly'
                          ? 'Monthly'
                          : lineItem.billing_frequency === 'annual'
                            ? 'Annual'
                            : lineItem.billing_frequency}
                    </div>
                  </div>
                  <div className={styles.gridItem}>
                    <div className={styles.fieldLabel}>Initial Price</div>
                    <div className={styles.fieldValue}>
                      {formatCurrency(
                        lineItem.final_initial_price ||
                          lineItem.initial_price ||
                          0
                      )}
                      {lineItem.discount_percentage || lineItem.discount_amount
                        ? ' (Discounted)'
                        : ''}
                    </div>
                  </div>
                  <div className={styles.gridItem}>
                    <div className={styles.fieldLabel}>Recurring Price</div>
                    <div className={styles.fieldValue}>
                      {formatCurrency(
                        lineItem.final_recurring_price ||
                          lineItem.recurring_price ||
                          0
                      )}
                      /mo
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Customer Details Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Customer Details:</h4>

        {/* Customer Name, Phone, Email in Grid */}
        {lead?.customer && (
          <>
            <div className={styles.gridRow}>
              <div className={styles.gridItem}>
                <div className={styles.fieldLabel}>Customer Name</div>
                <div className={styles.fieldValue}>
                  {lead.customer.first_name} {lead.customer.last_name}
                </div>
              </div>
              <div className={styles.gridItem}>
                <div className={styles.fieldLabel}>Phone</div>
                <div className={styles.fieldValue}>
                  {lead.customer.phone || 'Not provided'}
                </div>
              </div>
              <div className={styles.gridItem}>
                <div className={styles.fieldLabel}>Email</div>
                <div className={styles.fieldValue}>
                  {lead.customer.email || 'Not provided'}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Service Address, City, State, Zip in Grid */}
        {lead?.primary_service_address && (
          <div className={styles.gridRow}>
            <div className={styles.gridItem}>
              <div className={styles.fieldLabel}>Service Address</div>
              <div className={styles.fieldValue}>
                {lead.primary_service_address.street_address}
                {lead.primary_service_address.apartment_unit &&
                  `, ${lead.primary_service_address.apartment_unit}`}
              </div>
            </div>
            <div className={styles.gridItem}>
              <div className={styles.fieldLabel}>City</div>
              <div className={styles.fieldValue}>
                {lead.primary_service_address.city}
              </div>
            </div>
            <div className={styles.gridItem}>
              <div className={styles.fieldLabel}>State</div>
              <div className={styles.fieldValue}>
                {lead.primary_service_address.state}
              </div>
            </div>
            <div className={styles.gridItem}>
              <div className={styles.fieldLabel}>Zip</div>
              <div className={styles.fieldValue}>
                {lead.primary_service_address.zip_code}
              </div>
            </div>
          </div>
        )}

        {/* Home Size, Yard Size, Preferred Date, Preferred Time in Grid */}
        <div className={styles.gridRow}>
          {quote.home_size_range && (
            <div className={styles.gridItem}>
              <div className={styles.fieldLabel}>Home Size</div>
              <div className={styles.fieldValue}>
                {quote.home_size_range} sq ft
              </div>
            </div>
          )}
          {quote.yard_size_range && (
            <div className={styles.gridItem}>
              <div className={styles.fieldLabel}>Yard Size</div>
              <div className={styles.fieldValue}>
                {formatYardSizeRange(quote.yard_size_range)}
              </div>
            </div>
          )}
          {lead?.requested_date && (
            <div className={styles.gridItem}>
              <div className={styles.fieldLabel}>Preferred Date</div>
              <div className={styles.fieldValue}>
                {new Date(lead.requested_date).toLocaleDateString()}
              </div>
            </div>
          )}
          {lead?.requested_time && (
            <div className={styles.gridItem}>
              <div className={styles.fieldLabel}>Preferred Time</div>
              <div className={styles.fieldValue}>
                {lead.requested_time === 'morning'
                  ? 'Morning'
                  : lead.requested_time === 'afternoon'
                    ? 'Afternoon'
                    : lead.requested_time === 'evening'
                      ? 'Evening'
                      : lead.requested_time}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        {onEmailQuote && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onEmailQuote}
            disabled={isUpdating}
          >
            <Mail size={18} />
            Email Quote
          </button>
        )}
        {quote.quote_url && quote.quote_token && (
          <a
            href={`${getFullQuoteUrl(quote.quote_url)}${quote.quote_url.includes('?') ? '&' : '?'}token=${quote.quote_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryButton}
          >
            <ExternalLink size={18} />
            View Public Quote Link
          </a>
        )}
      </div>
    </div>
  );

  return hideCard ? (
    cardContent
  ) : (
    <InfoCard
      title={isUpdating ? 'Quote Summary (Updating...)' : 'Quote Summary'}
      icon={<FileText />}
      isCollapsible={true}
      startExpanded={true}
    >
      {cardContent}
    </InfoCard>
  );
}
