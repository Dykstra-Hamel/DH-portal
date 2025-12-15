'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
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
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const iconLogo = selectedCompany?.branding?.icon_logo_url;

  // Filter and sort companies alphabetically
  const filteredAndSortedCompanies = useMemo(() => {
    const filtered = availableCompanies.filter(company =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [availableCompanies, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery(''); // Clear search when closing
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Don't show dropdown if user has no companies or only one company (and not admin)
  if (isLoading || (!isAdmin && availableCompanies.length <= 1)) {
    return null;
  }

  const handleCompanySelect = (company: typeof selectedCompany) => {
    setSelectedCompany(company);
    setIsOpen(false);
    setSearchQuery(''); // Clear search when selecting
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
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
      {iconLogo && (
        <div className={styles.iconLogoWrapper}>
          <Image
            src={iconLogo}
            alt={selectedCompany?.name || ''}
            width={32}
            height={32}
            className={styles.iconLogo}
            style={{ objectFit: 'contain' }}
          />
        </div>
      )}
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
          <div className={styles.searchContainer}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent dropdown close
            />
            {searchQuery && (
              <button
                className={styles.clearButton}
                onClick={handleClearSearch}
                type="button"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className={styles.optionsList}>
            {filteredAndSortedCompanies.length > 0 ? (
              filteredAndSortedCompanies.map(company => (
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
              ))
            ) : (
              <div className={styles.noResults}>No companies found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
