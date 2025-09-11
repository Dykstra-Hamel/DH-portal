'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { Customer } from '@/types/customer';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './SearchBar.module.scss';

interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  company?: {
    id: string;
    name: string;
  };
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Use global company context for filtering
  const { selectedCompany, isAdmin } = useCompany();

  // Clear search results when company changes
  useEffect(() => {
    setResults([]);
    setShowResults(false);
    setQuery('');
  }, [selectedCompany]);

  // Debounce search function
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, selectedCompany]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      
      // Build search URL with company filter
      let searchUrl = `/api/customers/search?q=${encodeURIComponent(searchQuery)}`;
      
      // Add company filter if a specific company is selected
      // For admins: if selectedCompany is null, search all companies
      // For regular users: selectedCompany should always be set
      if (selectedCompany) {
        searchUrl += `&companyId=${selectedCompany.id}`;
      }
      
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.customers || []);
        setShowResults(true);
        setSelectedIndex(-1);
      } else {
        console.error('Search failed:', response.statusText);
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (customer: SearchResult) => {
    // Navigate to customer or related lead/ticket based on what's available
    // For now, navigate to customers page or create one if it doesn't exist
    router.push(`/customers/${customer.id}`);
    setQuery('');
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding results to allow clicks on results
    setTimeout(() => {
      if (!resultsRef.current?.contains(e.relatedTarget as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const formatCustomerName = (customer: SearchResult) => {
    return `${customer.first_name} ${customer.last_name}`.trim();
  };

  const formatCustomerAddress = (customer: SearchResult) => {
    const parts = [customer.address, customer.city, customer.state].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <input
          ref={inputRef}
          type="text"
          id="global-search"
          name="global-search"
          placeholder="Search"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={styles.searchInput}
        />
        <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
          <path d="M17.5 18.2002L13.8833 14.5835" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.16667 16.5335C12.8486 16.5335 15.8333 13.5488 15.8333 9.86686C15.8333 6.18496 12.8486 3.2002 9.16667 3.2002C5.48477 3.2002 2.5 6.18496 2.5 9.86686C2.5 13.5488 5.48477 16.5335 9.16667 16.5335Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {loading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div ref={resultsRef} className={styles.searchResults}>
          {results.map((customer, index) => (
            <div
              key={customer.id}
              className={`${styles.searchResult} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => handleResultClick(customer)}
            >
              <div className={styles.resultHeader}>
                <User className={styles.resultIcon} size={16} />
                <span className={styles.customerName}>
                  {formatCustomerName(customer)}
                </span>
                {customer.company && (
                  <span className={styles.companyName}>
                    @ {customer.company.name}
                  </span>
                )}
              </div>
              
              <div className={styles.resultDetails}>
                {customer.email && (
                  <div className={styles.resultDetail}>
                    <Mail size={12} />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className={styles.resultDetail}>
                    <Phone size={12} />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {(customer.address || customer.city) && (
                  <div className={styles.resultDetail}>
                    <MapPin size={12} />
                    <span>{formatCustomerAddress(customer)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.trim().length >= 2 && !loading && (
        <div ref={resultsRef} className={styles.searchResults}>
          <div className={styles.noResults}>
            No customers found for &quot;{query}&quot;
          </div>
        </div>
      )}
    </div>
  );
}