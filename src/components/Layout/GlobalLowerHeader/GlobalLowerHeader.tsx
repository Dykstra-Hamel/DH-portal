'use client';

import { useState } from 'react';
import { useDateFilter, DateFilterOption } from '@/contexts/DateFilterContext';
import styles from './GlobalLowerHeader.module.scss';

interface GlobalLowerHeaderProps {
  title: string;
  description: string;
  showFilter?: boolean;
  showAddLead?: boolean;
}

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="19"
    viewBox="0 0 18 19"
    fill="none"
  >
    <path
      d="M12 11.2003V12.8503L13.2 13.6003M12 2.20032V5.20032M15.75 6.32532V5.20032C15.75 4.80249 15.592 4.42096 15.3107 4.13966C15.0294 3.85835 14.6478 3.70032 14.25 3.70032H3.75C3.35218 3.70032 2.97064 3.85835 2.68934 4.13966C2.40804 4.42096 2.25 4.80249 2.25 5.20032V15.7003C2.25 16.0981 2.40804 16.4797 2.68934 16.761C2.97064 17.0423 3.35218 17.2003 3.75 17.2003H6.375M2.25 8.20032H6M6 2.20032V5.20032M16.5 12.7003C16.5 15.1856 14.4853 17.2003 12 17.2003C9.51472 17.2003 7.5 15.1856 7.5 12.7003C7.5 10.215 9.51472 8.20032 12 8.20032C14.4853 8.20032 16.5 10.215 16.5 12.7003Z"
      stroke="#525252"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
    <path d="M13 6.20032L8 11.2003L3 6.20032" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
    <path d="M8.14529 3.88458V15.516M13.961 9.70031H2.32956" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function GlobalLowerHeader({
  title,
  description,
  showFilter = false,
  showAddLead = false,
}: GlobalLowerHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { selectedFilter, setSelectedFilter } = useDateFilter();

  const filterOptions: DateFilterOption[] = [
    'Past 7 Days',
    'Past 30 Days',
    'Past 90 Days',
    'All Time',
  ];

  const handleFilterChange = (option: DateFilterOption) => {
    setSelectedFilter(option);
    setIsFilterOpen(false);
  };

  return (
    <div className={styles.globalLowerHeader}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.rightSection}>
          {showFilter && (
            <div className={styles.filterContainer}>
              <button
                className={styles.filterButton}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                type="button"
              >
                <CalendarIcon />
                <span className={styles.filterText}>{selectedFilter}</span>
                <div className={`${styles.chevron} ${isFilterOpen ? styles.open : ''}`}>
                  <ChevronDownIcon />
                </div>
              </button>

              {isFilterOpen && (
                <div className={styles.filterDropdown}>
                  {filterOptions.map(option => (
                    <button
                      key={option}
                      className={`${styles.filterOption} ${selectedFilter === option ? styles.selected : ''}`}
                      onClick={() => handleFilterChange(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
