'use client';

import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api-client';
import styles from './CompanyDropdown.module.scss';

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
    <path d="M13 6.20032L8 11.2003L3 6.20032" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Company {
  id: string;
  name: string;
}

interface CompanyDropdownProps {
  selectedCompanyId?: string;
  onCompanyChange: (companyId: string | undefined) => void;
  includeAllOption?: boolean;
  placeholder?: string;
}

const CompanyDropdown: React.FC<CompanyDropdownProps> = ({
  selectedCompanyId,
  onCompanyChange,
  includeAllOption = false,
  placeholder = 'Select a company',
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const companiesData = await adminAPI.getCompanies();
      setCompanies(companiesData || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (companyId: string | undefined) => {
    onCompanyChange(companyId);
    setIsOpen(false);
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const displayText = selectedCompany
    ? selectedCompany.name
    : placeholder;

  if (loading) {
    return (
      <div className={styles.dropdown}>
        <div className={styles.trigger}>
          <span>Loading companies...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dropdown}>
        <div className={styles.trigger}>
          <span className={styles.error}>Error loading companies</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dropdown}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{displayText}</span>
        <div className={`${styles.chevron} ${isOpen ? styles.open : ''}`}>
          <ChevronDownIcon />
        </div>
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {includeAllOption && (
            <button
              className={`${styles.option} ${!selectedCompanyId ? styles.selected : ''}`}
              onClick={() => handleCompanySelect(undefined)}
            >
              All Companies
            </button>
          )}
          {companies.map(company => (
            <button
              key={company.id}
              className={`${styles.option} ${selectedCompanyId === company.id ? styles.selected : ''}`}
              onClick={() => handleCompanySelect(company.id)}
            >
              {company.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyDropdown;
