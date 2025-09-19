'use client';

import { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './GlobalCompanyDropdown.module.scss';

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill="none"
  >
    <path
      d="M13 6.20032L8 11.2003L3 6.20032"
      stroke="#525252"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function GlobalCompanyDropdown() {
  const {
    selectedCompany,
    availableCompanies,
    isAdmin,
    isLoading,
    setSelectedCompany,
  } = useCompany();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const iconLogo = selectedCompany?.branding?.icon_logo_url;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show dropdown if user has no companies or only one company (and not admin)
  if (isLoading || (!isAdmin && availableCompanies.length <= 1)) {
    return null;
  }

  const handleCompanySelect = (company: typeof selectedCompany) => {
    setSelectedCompany(company);
    setIsOpen(false);
  };

  const displayText = selectedCompany
    ? selectedCompany.name
    : availableCompanies[0]?.name || 'Select Company';

  const maxDisplayLength = 25;
  const truncatedDisplayText =
    displayText.length > maxDisplayLength
      ? `${displayText.substring(0, maxDisplayLength)}...`
      : displayText;

  return (
    <div className={styles.companyDropdown} ref={dropdownRef}>
      <div className={styles.iconLogoWrapper}>
        <img
          src={iconLogo}
          alt={selectedCompany?.name}
          className={styles.iconLogo}
        />
      </div>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        title={displayText}
      >
        <span className={styles.text}>{truncatedDisplayText}</span>
        <div className={`${styles.chevron} ${isOpen ? styles.open : ''}`}>
          <ChevronDownIcon />
        </div>
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {availableCompanies.map(company => (
            <button
              key={company.id}
              className={`${styles.option} ${selectedCompany?.id === company.id ? styles.selected : ''}`}
              onClick={() => handleCompanySelect(company)}
              title={company.name}
            >
              <span>{company.name}</span>
              {selectedCompany?.id === company.id && (
                <div className={styles.checkmark}>✓</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
