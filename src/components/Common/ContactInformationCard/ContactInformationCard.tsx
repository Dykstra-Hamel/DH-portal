import { SquareUserRound } from 'lucide-react';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { getCustomerDisplayName, getPhoneDisplay } from '@/lib/display-utils';
import styles from './ContactInformationCard.module.scss';
import cardStyles from '../InfoCard/InfoCard.module.scss';

interface ContactInformationCardProps {
  customer: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
    customer_status?: string;
    created_at?: string;
  } | null;
  startExpanded?: boolean;
}

export function ContactInformationCard({
  customer,
  startExpanded = false,
}: ContactInformationCardProps) {
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <InfoCard
      title="Contact Information"
      icon={<SquareUserRound size={20} />}
      startExpanded={startExpanded}
    >
      <div className={styles.cardContent}>
        {customer ? (
          <div className={styles.callInsightsGrid}>
            <div className={styles.callDetailItem}>
              <span className={cardStyles.dataLabel}>Name</span>
              <span className={cardStyles.dataText}>
                {getCustomerDisplayName(customer)}
              </span>
            </div>
            <div className={styles.callDetailItem}>
              <span className={cardStyles.dataLabel}>Phone Number</span>
              <span className={cardStyles.dataText}>
                {getPhoneDisplay(customer.phone)}
              </span>
            </div>
            <div className={styles.callDetailItem}>
              <span className={cardStyles.dataLabel}>Email</span>
              <span className={cardStyles.dataText}>
                {customer.email || 'Not provided'}
              </span>
            </div>
            {customer.customer_status && (
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Customer Status</span>
                <span className={cardStyles.dataText}>
                  {capitalizeFirst(customer.customer_status)}
                </span>
              </div>
            )}
            {customer.created_at && (
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Created At</span>
                <span className={cardStyles.dataText}>
                  {new Date(customer.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className={cardStyles.lightText}>
            No customer information available
          </div>
        )}
      </div>
    </InfoCard>
  );
}
