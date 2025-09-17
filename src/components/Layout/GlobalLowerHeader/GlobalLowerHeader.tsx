'use client';

import styles from './GlobalLowerHeader.module.scss';

interface GlobalLowerHeaderProps {
  title: string;
  description: string;
  showAddLead?: boolean;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
    <path d="M8.14529 3.88458V15.516M13.961 9.70031H2.32956" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function GlobalLowerHeader({
  title,
  description,
  showAddLead = false,
}: GlobalLowerHeaderProps) {
  return (
    <div className={styles.globalLowerHeader}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.rightSection}>
          {showAddLead && (
            <button
              className={styles.addLeadButton}
              disabled={true}
              type="button"
            >
              <PlusIcon />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}