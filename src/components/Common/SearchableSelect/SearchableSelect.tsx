'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import styles from './SearchableSelect.module.scss';

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
  subtitle?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  id?: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  noResultsText = 'No results found',
  disabled = false,
  className = '',
  triggerClassName = '',
  ariaLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const searchTarget = `${option.label} ${option.searchText || ''}`.toLowerCase();
      return searchTarget.includes(query);
    });
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    searchInputRef.current?.focus();
  }, [isOpen]);

  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <button
        id={id}
        type="button"
        className={`${styles.trigger} ${triggerClassName}`}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span className={`${styles.triggerText} ${!selectedOption ? styles.placeholder : ''}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className={styles.menu}>
          <div className={styles.searchContainer}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsOpen(false);
                  setSearchQuery('');
                }
              }}
            />
          </div>

          <div className={styles.optionsList} role="listbox">
            {filteredOptions.length === 0 ? (
              <div className={styles.noResults}>{noResultsText}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelectOption(option.value)}
                    disabled={option.disabled}
                  >
                    <div className={styles.optionContent}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.subtitle && (
                        <span className={styles.optionSubtitle}>{option.subtitle}</span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className={styles.checkIcon} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

