'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { SlidersHorizontal, Check, ChevronDown } from 'lucide-react';
import styles from './FilterPanel.module.scss';

export interface FilterOption {
  value: string | null;
  label: string;
  subtitle?: string;
  avatar?: string | null;
}

export interface FilterConfig {
  key: string;
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  searchable?: boolean;
}

interface FilterPanelProps {
  filters: FilterConfig[];
  onClearAll: () => void;
  className?: string;
}

const DefaultAvatar = ({ name }: { name: string }) => (
  <div className={styles.defaultAvatar}>{name.charAt(0).toUpperCase()}</div>
);

export function FilterPanel({ filters, onClearAll, className }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const activeCount = filters.filter(f => f.value !== null).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getSelectedLabel = (filter: FilterConfig): string | null => {
    if (filter.value === null) return null;
    const match = filter.options.find(o => o.value === filter.value);
    return match?.label ?? null;
  };

  return (
    <div className={`${styles.filterPanel} ${className || ''}`} ref={panelRef}>
      <button
        className={`${styles.filterButton} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Filters${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
        type="button"
      >
        <SlidersHorizontal size={16} className={styles.filterIcon} />
        {activeCount > 0 && (
          <span className={styles.badge}>{activeCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          {filters.map((filter) => {
            const isSectionOpen = openSections.has(filter.key);
            const selectedLabel = getSelectedLabel(filter);
            const searchQuery = searchQueries[filter.key] || '';
            const filteredOptions = filter.searchable
              ? filter.options.filter(opt =>
                  opt.value === null ||
                  opt.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : filter.options;

            return (
              <div key={filter.key} className={styles.filterSection}>
                <button
                  className={`${styles.sectionHeader} ${isSectionOpen ? styles.sectionOpen : ''}`}
                  onClick={() => toggleSection(filter.key)}
                  type="button"
                >
                  <span className={styles.sectionLabel}>{filter.label}</span>
                  {selectedLabel && (
                    <span className={styles.selectedValue}>{selectedLabel}</span>
                  )}
                  <ChevronDown
                    size={14}
                    className={`${styles.sectionChevron} ${isSectionOpen ? styles.chevronOpen : ''}`}
                  />
                </button>

                {isSectionOpen && (
                  <div className={styles.sectionBody}>
                    {filter.searchable && (
                      <div className={styles.searchContainer}>
                        <input
                          type="text"
                          placeholder={`Search ${filter.label.toLowerCase()}...`}
                          className={styles.searchInput}
                          value={searchQuery}
                          onChange={(e) =>
                            setSearchQueries(prev => ({ ...prev, [filter.key]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    <div className={styles.optionsList}>
                      {filteredOptions.map((option) => {
                        const isSelected = filter.value === option.value;
                        return (
                          <button
                            key={option.value ?? '__null__'}
                            className={`${styles.optionRow} ${isSelected ? styles.selected : ''}`}
                            onClick={() => filter.onChange(option.value)}
                            type="button"
                          >
                            <div className={styles.optionLeft}>
                              {option.avatar !== undefined && (
                                <div className={styles.avatarWrapper}>
                                  {option.avatar ? (
                                    <Image
                                      src={option.avatar}
                                      alt={option.label}
                                      width={24}
                                      height={24}
                                      className={styles.avatar}
                                    />
                                  ) : (
                                    <DefaultAvatar name={option.label} />
                                  )}
                                </div>
                              )}
                              <div className={styles.optionInfo}>
                                <span className={styles.optionLabel}>{option.label}</span>
                                {option.subtitle && (
                                  <span className={styles.optionSubtitle}>{option.subtitle}</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check size={14} className={styles.checkIcon} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className={styles.footer}>
            <button
              className={styles.clearButton}
              onClick={() => {
                onClearAll();
                setSearchQueries({});
              }}
              disabled={activeCount === 0}
              type="button"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
