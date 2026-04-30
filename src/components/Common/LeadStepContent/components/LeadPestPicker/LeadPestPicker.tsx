'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Star, X } from 'lucide-react';
import { Lead } from '@/types/lead';
import { adminAPI } from '@/lib/api-client';
import styles from './LeadPestPicker.module.scss';

export interface PestOption {
  id: string;
  pest_id: string;
  name: string;
  slug: string;
  icon_svg: string | null;
  custom_label: string | null;
}

export interface SelectedPest {
  id: string;
  label: string;
  iconSvg: string | null;
}

interface LeadPestPickerProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSelectionChange: (selected: SelectedPest[], primaryId: string | null) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

function labelFor(option: PestOption): string {
  return option.custom_label?.trim() || option.name;
}

function matchLeadPest(options: PestOption[], value?: string | null): PestOption | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return (
    options.find(
      o =>
        o.name.toLowerCase() === normalized ||
        o.custom_label?.toLowerCase() === normalized ||
        o.slug === value ||
        o.id === value
    ) ?? null
  );
}

export function LeadPestPicker({
  lead,
  isOpen,
  onClose,
  onSelectionChange,
  onShowToast,
}: LeadPestPickerProps) {
  const [options, setOptions] = useState<PestOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [secondaryIds, setSecondaryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const hydratedRef = useRef(false);
  const onSelectionChangeRef = useRef(onSelectionChange);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  });

  // Load company pest options
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!lead.company_id) return;
      setLoading(true);
      try {
        const response = await adminAPI.getPestOptions(lead.company_id);
        if (!cancelled && response.success) {
          setOptions(response.data || []);
        }
      } catch (err) {
        console.error('Error loading pest options:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lead.company_id]);

  // Hydrate selection from lead once options are loaded
  useEffect(() => {
    if (options.length === 0 || hydratedRef.current) return;
    const primary = matchLeadPest(options, lead.pest_type);
    const additional = (lead.additional_pests ?? [])
      .map(v => matchLeadPest(options, v))
      .filter((p): p is PestOption => p != null && (!primary || p.id !== primary.id));

    setPrimaryId(primary?.id ?? null);
    setSecondaryIds(additional.map(p => p.id));
    hydratedRef.current = true;
  }, [options, lead.pest_type, lead.additional_pests]);

  // Emit selection changes upward whenever they change
  const selected: SelectedPest[] = useMemo(() => {
    const ordered: PestOption[] = [];
    if (primaryId) {
      const primary = options.find(o => o.id === primaryId);
      if (primary) ordered.push(primary);
    }
    for (const sid of secondaryIds) {
      const opt = options.find(o => o.id === sid);
      if (opt && opt.id !== primaryId) ordered.push(opt);
    }
    return ordered.map(o => ({ id: o.id, label: labelFor(o), iconSvg: o.icon_svg }));
  }, [options, primaryId, secondaryIds]);

  useEffect(() => {
    onSelectionChangeRef.current(selected, primaryId);
  }, [selected, primaryId]);

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => labelFor(a).localeCompare(labelFor(b))),
    [options]
  );

  const filteredOptions = useMemo(
    () =>
      searchQuery.trim()
        ? sortedOptions.filter(o =>
            labelFor(o).toLowerCase().includes(searchQuery.toLowerCase())
          )
        : sortedOptions,
    [sortedOptions, searchQuery]
  );

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  // Close modal on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Persist changes to the lead (debounced)
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const persist = useCallback(
    (nextPrimaryId: string | null, nextSecondaryIds: string[]) => {
      if (!hydratedRef.current) return;
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = setTimeout(async () => {
        try {
          const primaryOpt = nextPrimaryId
            ? options.find(o => o.id === nextPrimaryId)
            : null;
          const additionalOpts = nextSecondaryIds
            .map(id => options.find(o => o.id === id))
            .filter((o): o is PestOption => o != null);

          await adminAPI.updateLead(lead.id, {
            pest_type: primaryOpt ? labelFor(primaryOpt) : null,
            additional_pests: additionalOpts.map(o => labelFor(o)),
          });
        } catch (err) {
          console.error('Failed to save pest selection', err);
          onShowToast?.('Failed to save pest selection', 'error');
        }
      }, 400);
    },
    [lead.id, options, onShowToast]
  );

  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, []);

  const togglePest = (id: string) => {
    if (id === primaryId) {
      const nextPrimary = secondaryIds[0] ?? null;
      const nextSecondary = secondaryIds.slice(1);
      setPrimaryId(nextPrimary);
      setSecondaryIds(nextSecondary);
      persist(nextPrimary, nextSecondary);
      return;
    }
    if (secondaryIds.includes(id)) {
      const nextSecondary = secondaryIds.filter(s => s !== id);
      setSecondaryIds(nextSecondary);
      persist(primaryId, nextSecondary);
      return;
    }
    if (!primaryId) {
      setPrimaryId(id);
      persist(id, secondaryIds);
    } else {
      const nextSecondary = [...secondaryIds, id];
      setSecondaryIds(nextSecondary);
      persist(primaryId, nextSecondary);
    }
  };

  const promoteToPrimary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === primaryId) return;
    const prevPrimary = primaryId;
    const nextSecondary = [
      ...(prevPrimary ? [prevPrimary] : []),
      ...secondaryIds.filter(s => s !== id),
    ];
    setPrimaryId(id);
    setSecondaryIds(nextSecondary);
    persist(id, nextSecondary);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.heading}>
            <h3 className={styles.title}>Pests the customer has issues with</h3>
            <p className={styles.subtitle}>
              Tap to select. The first selection is the primary pest; star
              others to promote.
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {loading ? (
          <div className={styles.loading}>Loading pests…</div>
        ) : options.length === 0 ? (
          <div className={styles.empty}>
            No pest options configured for this company.
          </div>
        ) : (
          <>
            {options.length > 10 && (
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search pests…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            )}
          <div className={styles.pestRow}>
            {filteredOptions.map(opt => {
              const isPrimary = opt.id === primaryId;
              const isSecondary = secondaryIds.includes(opt.id);
              const isSelected = isPrimary || isSecondary;
              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  className={`${styles.pestBtn} ${
                    isSelected
                      ? styles.pestBtnSelected
                      : styles.pestBtnUnselected
                  }`}
                  onClick={() => togglePest(opt.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePest(opt.id);
                    }
                  }}
                  aria-pressed={isSelected}
                >
                  <div
                    className={`${styles.pestCircle} ${
                      isSelected
                        ? styles.pestCircleSelected
                        : styles.pestCircleUnselected
                    } ${isPrimary ? styles.pestCirclePrimary : ''}`}
                  >
                    {opt.icon_svg ? (
                      <span
                        className={styles.pestIconSvg}
                        dangerouslySetInnerHTML={{ __html: opt.icon_svg }}
                      />
                    ) : (
                      <span className={styles.pestInitial}>
                        {labelFor(opt).charAt(0).toUpperCase()}
                      </span>
                    )}
                    {isSelected && (
                      <span
                        className={`${styles.selectedBadge} ${
                          isPrimary ? styles.selectedBadgePrimary : ''
                        }`}
                        aria-label={isPrimary ? 'Primary' : 'Selected'}
                      >
                        {isPrimary ? (
                          <Star size={12} fill="currentColor" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                          >
                            <path
                              d="M9.75 0C7.82164 0 5.93657 0.571828 4.33319 1.64317C2.72982 2.71451 1.48013 4.23726 0.742179 6.01884C0.00422452 7.80042 -0.188858 9.76082 0.187348 11.6521C0.563554 13.5434 1.49215 15.2807 2.85571 16.6443C4.21928 18.0079 5.95656 18.9365 7.84787 19.3127C9.73919 19.6889 11.6996 19.4958 13.4812 18.7578C15.2627 18.0199 16.7855 16.7702 17.8568 15.1668C18.9282 13.5634 19.5 11.6784 19.5 9.75C19.4973 7.16498 18.4692 4.68661 16.6413 2.85872C14.8134 1.03084 12.335 0.00272983 9.75 0ZM14.0306 8.03063L8.78063 13.2806C8.71097 13.3504 8.62826 13.4057 8.53721 13.4434C8.44616 13.4812 8.34857 13.5006 8.25 13.5006C8.15144 13.5006 8.05385 13.4812 7.9628 13.4434C7.87175 13.4057 7.78903 13.3504 7.71938 13.2806L5.46938 11.0306C5.32865 10.8899 5.24959 10.699 5.24959 10.5C5.24959 10.301 5.32865 10.1101 5.46938 9.96937C5.61011 9.82864 5.80098 9.74958 6 9.74958C6.19903 9.74958 6.3899 9.82864 6.53063 9.96937L8.25 11.6897L12.9694 6.96937C13.0391 6.89969 13.1218 6.84442 13.2128 6.8067C13.3039 6.76899 13.4015 6.74958 13.5 6.74958C13.5986 6.74958 13.6961 6.76899 13.7872 6.8067C13.8782 6.84442 13.9609 6.89969 14.0306 6.96937C14.1003 7.03906 14.1556 7.12178 14.1933 7.21283C14.231 7.30387 14.2504 7.40145 14.2504 7.5C14.2504 7.59855 14.231 7.69613 14.1933 7.78717C14.1556 7.87822 14.1003 7.96094 14.0306 8.03063Z"
                              fill="currentColor"
                            />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                  <span className={styles.pestLabel}>{labelFor(opt)}</span>
                  {isPrimary && (
                    <span className={styles.primaryTag}>Primary</span>
                  )}
                  {isSecondary && (
                    <button
                      type="button"
                      className={styles.promoteBtn}
                      onClick={e => promoteToPrimary(opt.id, e)}
                      title="Set as primary"
                    >
                      <Star size={12} /> Make primary
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
