'use client';

import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { CompanyFeature } from '@/types/company';
import styles from './CompanyFeaturesManager.module.scss';

interface CompanyFeaturesManagerProps {
  companyId: string;
}

const AVAILABLE_FEATURES: Record<CompanyFeature, { label: string; description: string }> = {
  project_management: {
    label: 'Project Management',
    description: 'Access to the Tracker app for managing projects, tasks, and workflows',
  },
  // Add more features here as needed
};

export default function CompanyFeaturesManager({ companyId }: CompanyFeaturesManagerProps) {
  const { features, hasFeature, enableFeature, disableFeature, loading } = useCompanyFeatures(companyId);

  const handleToggle = async (feature: CompanyFeature) => {
    const isEnabled = hasFeature(feature);

    if (isEnabled) {
      await disableFeature(feature);
    } else {
      await enableFeature(feature);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading features...</p>
      </div>
    );
  }

  return (
    <div className={styles.featuresManager}>
      <h3>Company Features</h3>
      <p>Enable or disable features for this company</p>

      <div className={styles.featuresList}>
        {Object.entries(AVAILABLE_FEATURES).map(([key, { label, description }]) => {
          const feature = key as CompanyFeature;
          const isEnabled = hasFeature(feature);

          return (
            <div key={feature} className={styles.featureItem}>
              <div className={styles.featureInfo}>
                <h4>{label}</h4>
                <p>{description}</p>
              </div>

              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => handleToggle(feature)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
