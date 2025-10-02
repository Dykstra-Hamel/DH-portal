'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import styles from './SearchableDropdown.module.scss';

export interface SearchableDropdownItem {
  id: string;
  [key: string]: any;
}

export interface SearchableDropdownProps {
  items: SearchableDropdownItem[];
  onSearch: (query: string) => void;
  onSelect: (item: SearchableDropdownItem | null) => void;
  placeholder?: string;
  displayKey: string;
  searchKeys?: string[];
  loading?: boolean;
  disabled?: boolean;
  selectedItem?: SearchableDropdownItem | null;
  className?: string;
  noResultsText?: string;
  minSearchLength?: number;
}

export default function SearchableDropdown({
  items,
  onSearch,
  onSelect,
  placeholder = "Search...",
  displayKey,
  searchKeys = [],
  loading = false,
  disabled = false,
  selectedItem = null,
  className = "",
  noResultsText = "No results found",
  minSearchLength = 2,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastSearchQueryRef = useRef<string>('');

  // Debounced search - only trigger when searchQuery actually changes
  useEffect(() => {
    // Only search if the query has actually changed
    if (lastSearchQueryRef.current === searchQuery) {
      return;
    }

    const timeoutId = setTimeout(() => {
      lastSearchQueryRef.current = searchQuery;
      
      if (searchQuery.length >= minSearchLength) {
        onSearch(searchQuery);
      } else if (searchQuery.length === 0) {
        onSearch('');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, minSearchLength, onSearch]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(-1);
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

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

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!isOpen && query.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= minSearchLength || selectedItem) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < items.length - 1 ? prev + 1 : 0;
          scrollToItem(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : items.length - 1;
          scrollToItem(newIndex);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          handleSelectItem(items[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const scrollToItem = (index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      item.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  };

  const handleSelectItem = (item: SearchableDropdownItem) => {
    onSelect(item);
    setSearchQuery(item[displayKey] || '');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getDisplayValue = () => {
    if (selectedItem) {
      return selectedItem[displayKey] || '';
    }
    return searchQuery;
  };

  const showDropdown = isOpen && (items.length > 0 || loading || (searchQuery.length >= minSearchLength));

  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.input} ${disabled ? styles.disabled : ''}`}
          autoComplete="off"
        />
        
        <div className={styles.inputIcons}>
          {selectedItem && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
              tabIndex={-1}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
          />
        </div>
      </div>

      {showDropdown && (
        <div className={styles.dropdown}>
          {loading && (
            <div className={styles.loadingItem}>
              <div className={styles.spinner}></div>
              Searching...
            </div>
          )}
          
          {!loading && items.length === 0 && searchQuery.length >= minSearchLength && (
            <div className={styles.noResults}>
              {noResultsText}
            </div>
          )}
          
          {!loading && items.map((item, index) => (
            <div
              key={item.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={`${styles.item} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => handleSelectItem(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {item[displayKey]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}