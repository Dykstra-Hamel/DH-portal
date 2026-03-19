'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Building2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './MobileCompanySwitcher.module.scss';

export function MobileCompanySwitcher() {
  const { selectedCompany, availableCompanies, isAdmin, isLoading, setSelectedCompany } = useCompany();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCompanies = useMemo(() => {
    const filtered = availableCompanies.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [availableCompanies, searchQuery]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (isLoading || (!isAdmin && availableCompanies.length <= 1)) return null;

  const handleSelect = (company: typeof selectedCompany) => {
    setSelectedCompany(company);
    setIsOpen(false);
    router.push('/tickets/new');
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        aria-label="Switch company"
      >
        <Building2 size={20} />
      </button>

      {isOpen && createPortal(
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h3 className={styles.title}>Switch Company</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.searchWrapper}>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search companies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>

            <div className={styles.list}>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map(company => (
                  <button
                    key={company.id}
                    type="button"
                    className={`${styles.option} ${selectedCompany?.id === company.id ? styles.selected : ''}`}
                    onClick={() => handleSelect(company)}
                  >
                    <span>{company.name}</span>
                    {selectedCompany?.id === company.id && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>
                ))
              ) : (
                <p className={styles.noResults}>No companies found</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
