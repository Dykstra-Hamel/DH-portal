/**
 * Additional Services Section Component
 *
 * Additional services list with image and CTA
 */

import styles from '../CampaignLandingPage.module.scss';

interface AdditionalServicesSectionProps {
  additionalServices: {
    heading: string;
    imageUrl: string | null;
  };
  addons: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
  }>;
  onCtaClick: () => void;
}

export default function AdditionalServicesSection({
  additionalServices,
  addons,
  onCtaClick,
}: AdditionalServicesSectionProps) {
  return (
    <section className={styles.additionalServicesSection}>
      <div className={styles.additionalServicesContainer}>
        {/* Left column - Content */}
        <div className={styles.additionalServicesContent}>
          <h2 className={styles.additionalServicesHeading}>
            {additionalServices.heading}
          </h2>

          <ul className={styles.servicesList}>
            {addons.map((addon) => (
              <li key={addon.id} className={styles.serviceItem}>
                <svg
                  className={styles.checkIcon}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <circle cx="10" cy="10" r="10" fill="currentColor" />
                  <path
                    d="M6 10L9 13L14 7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <strong>{addon.name}</strong>
                  {addon.description && <p>{addon.description}</p>}
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.additionalServicesActions}>
            <button className={styles.additionalServicesCta} onClick={onCtaClick}>
              Upgrade Today!
            </button>
            <button className={styles.additionalServicesLink}>
              View Add-On FAQ&apos;s
            </button>
          </div>
        </div>

        {/* Right column - Image */}
        <div className={styles.additionalServicesImage}>
          {additionalServices.imageUrl ? (
            <img src={additionalServices.imageUrl} alt="Additional Services" />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}
        </div>
      </div>
    </section>
  );
}
