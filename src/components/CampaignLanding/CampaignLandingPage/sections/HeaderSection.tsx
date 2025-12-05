/**
 * Header Section Component
 *
 * Top header with logo and CTA buttons
 */

import styles from '../CampaignLandingPage.module.scss';

interface HeaderSectionProps {
  logo: string | null;
  companyName: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  phoneNumber: string | null;
  onPrimaryClick: () => void;
}

export default function HeaderSection({
  logo,
  companyName,
  primaryButtonText,
  secondaryButtonText,
  phoneNumber,
  onPrimaryClick,
}: HeaderSectionProps) {
  const handlePhoneClick = () => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.headerLogo}>
          {logo ? (
            <img src={logo} alt={companyName} />
          ) : (
            <span className={styles.companyName}>{companyName}</span>
          )}
        </div>

        <div className={styles.headerActions}>
          <button className={styles.headerPrimaryButton} onClick={onPrimaryClick}>
            {primaryButtonText}
          </button>
          <button className={styles.headerSecondaryButton} onClick={handlePhoneClick}>
            {secondaryButtonText}
          </button>
        </div>
      </div>
    </header>
  );
}
