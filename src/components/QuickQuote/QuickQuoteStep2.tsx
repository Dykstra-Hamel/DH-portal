'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import styles from './QuickQuoteStep2.module.scss';

interface PestOption {
  name: string;
  slug: string;
  custom_label: string | null;
}

interface CustomerResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
}

interface PestSummary {
  pest_slug: string;
  pest_name: string;
  description: string;
  observation_count: number;
}

interface QuickQuoteStep2Props {
  companyId: string;
  salesScript: string;
  selectedPest: PestOption;
  existingCustomer: CustomerResult | null;
  isNewCustomer: boolean;
  customerForm: CustomerFormData;
  onExistingCustomerSelect: (customer: CustomerResult) => void;
  onClearCustomer: () => void;
  onFormChange: (form: CustomerFormData) => void;
  onContinue: () => void;
}

export default function QuickQuoteStep2({
  companyId,
  salesScript,
  selectedPest,
  existingCustomer,
  isNewCustomer,
  customerForm,
  onExistingCustomerSelect,
  onClearCustomer,
  onFormChange,
  onContinue,
}: QuickQuoteStep2Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pestSummary, setPestSummary] = useState<PestSummary | null>(null);
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [validationError, setValidationError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch pest summary
  useEffect(() => {
    if (!companyId || !selectedPest?.slug) return;

    const fetchSummary = async () => {
      try {
        const response = await fetch(
          `/api/companies/${companyId}/pest-summary?pestSlug=${selectedPest.slug}`
        );
        if (!response.ok) return;
        const data = await response.json();
        setPestSummary(data.data);
      } catch {
        // Non-critical, fail silently
      }
    };

    fetchSummary();
  }, [companyId, selectedPest?.slug]);

  // Customer search with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (value.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/customers/search?q=${encodeURIComponent(value)}&companyId=${companyId}`
          );
          if (!response.ok) return;
          const data = await response.json();
          setSearchResults(data.customers || []);
          setShowResults(true);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [companyId]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectResult = (customer: CustomerResult) => {
    onExistingCustomerSelect(customer);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleContinue = () => {
    setValidationError('');

    if (existingCustomer) {
      onContinue();
      return;
    }

    // Validate new customer form
    if (!customerForm.firstName.trim()) {
      setValidationError('First name is required.');
      return;
    }
    if (!customerForm.lastName.trim()) {
      setValidationError('Last name is required.');
      return;
    }
    if (!customerForm.phone.trim()) {
      setValidationError('Phone number is required.');
      return;
    }
    if (!customerForm.email.trim()) {
      setValidationError('Email is required.');
      return;
    }

    onContinue();
  };

  const updateForm = (field: keyof CustomerFormData, value: string) => {
    onFormChange({ ...customerForm, [field]: value });
  };

  const pestLabel = selectedPest.custom_label || selectedPest.name;

  return (
    <div className={styles.step}>
      {salesScript && (
        <div className={styles.scriptBanner}>
          <span className={styles.scriptBannerLabel}>Sales Script</span>
          <span className={styles.scriptBannerText}>{salesScript}</span>
        </div>
      )}

      <div className={styles.columns}>
        {/* Left: Customer */}
        <div className={styles.leftColumn}>
          {/* Pest badge */}
          <div className={styles.pestBadge}>
            {pestLabel} Inquiry
          </div>

          {/* Mode switcher */}
          {!existingCustomer && (
            <div className={styles.modeSwitcher}>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'search' ? styles.active : ''}`}
                onClick={() => setMode('search')}
              >
                Search Existing Customer
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'new' ? styles.active : ''}`}
                onClick={() => setMode('new')}
              >
                New Customer
              </button>
            </div>
          )}

          {/* Selected existing customer */}
          {existingCustomer && (
            <div className={styles.selectedCustomer}>
              <div className={styles.selectedCustomerInfo}>
                <span className={styles.selectedCustomerName}>
                  {existingCustomer.first_name} {existingCustomer.last_name}
                </span>
                <span className={styles.selectedCustomerSub}>
                  {existingCustomer.phone || existingCustomer.email || 'Existing customer'}
                </span>
              </div>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={onClearCustomer}
              >
                Change
              </button>
            </div>
          )}

          {/* Customer search */}
          {!existingCustomer && mode === 'search' && (
            <div className={styles.searchWrapper} ref={searchRef}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by name, phone, or email&hellip;"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
              {(showResults || isSearching) && (
                <div className={styles.searchResults}>
                  {isSearching ? (
                    <div className={styles.searchLoading}>
                      <Loader2 size={14} className={styles.spinner} />
                      Searching&hellip;
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className={styles.searchLoading}>No customers found</div>
                  ) : (
                    searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className={styles.searchResultItem}
                        onClick={() => handleSelectResult(customer)}
                      >
                        <span className={styles.resultName}>
                          {customer.first_name} {customer.last_name}
                        </span>
                        <span className={styles.resultDetails}>
                          {[customer.phone, customer.email, customer.city && `${customer.city}, ${customer.state}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* New customer form */}
          {!existingCustomer && mode === 'new' && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Jane"
                  value={customerForm.firstName}
                  onChange={(e) => updateForm('firstName', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Last Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Smith"
                  value={customerForm.lastName}
                  onChange={(e) => updateForm('lastName', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Phone <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="(555) 555-5555"
                  value={customerForm.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Email <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="jane@example.com"
                  value={customerForm.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Street Address</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="123 Main St"
                  value={customerForm.streetAddress}
                  onChange={(e) => updateForm('streetAddress', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>City</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Springfield"
                  value={customerForm.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>State</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="IL"
                  maxLength={2}
                  value={customerForm.state}
                  onChange={(e) => updateForm('state', e.target.value.toUpperCase())}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Zip Code</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="62701"
                  value={customerForm.zip}
                  onChange={(e) => updateForm('zip', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Pest Pressure Panel */}
        <div className={styles.rightColumn}>
          <p className={styles.pressureTitle}>Area Pest Pressure</p>

          {pestSummary ? (
            <>
              <div className={styles.pressureStat}>
                <span className={styles.pressureCount}>
                  {pestSummary.observation_count}
                </span>
                <span className={styles.pressureLabel}>
                  {pestLabel} reports in your service area
                </span>
              </div>

            </>
          ) : (
            <div className={styles.pressureStat}>
              <span className={styles.pressureLabel}>
                Loading area data&hellip;
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.footerError}>{validationError}</span>
        <button
          type="button"
          className={styles.continueBtn}
          onClick={handleContinue}
        >
          Continue to Plan Selection
        </button>
      </div>
    </div>
  );
}
