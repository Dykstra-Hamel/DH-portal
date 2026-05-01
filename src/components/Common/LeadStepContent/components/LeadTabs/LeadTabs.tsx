'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styles from './LeadTabs.module.scss';

export interface LeadTabDef<Id extends string = string> {
  id: Id;
  label: string;
  count?: number;
  isNew?: boolean;
}

interface LeadTabsProps<Id extends string = string> {
  tabs: ReadonlyArray<LeadTabDef<Id>>;
  activeTab: Id;
  onChange: (id: Id) => void;
}

export function LeadTabs<Id extends string = string>({
  tabs,
  activeTab,
  onChange,
}: LeadTabsProps<Id>) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number } | null>(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  useLayoutEffect(() => {
    const index = tabs.findIndex(t => t.id === activeTab);
    const tabEl = tabRefs.current[index];
    if (!tabEl) return;

    const measure = () => {
      if (!tabEl || tabEl.offsetWidth === 0) return;
      setSliderStyle({ left: tabEl.offsetLeft, width: tabEl.offsetWidth });
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(tabEl);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [activeTab, tabs]);

  useEffect(() => {
    if (!mobileDropdownOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [mobileDropdownOpen]);

  const handleTabClick = (id: Id) => {
    onChange(id);
    setMobileDropdownOpen(false);
  };

  const activeTabDef = tabs.find(t => t.id === activeTab);

  return (
    <div className={styles.tabBarWrapper}>
      <div className={styles.tabBar}>
        {sliderStyle && (
          <div
            className={styles.tabSlider}
            style={{ left: sliderStyle.left, width: sliderStyle.width }}
          />
        )}
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => {
              tabRefs.current[index] = el;
            }}
            type="button"
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className={styles.tabLabel}>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`${styles.tabCount} ${tab.isNew ? styles.tabCountNew : ''}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.mobileTabSelect} ref={mobileDropdownRef}>
        <button
          type="button"
          className={styles.mobileTabTrigger}
          onClick={() => setMobileDropdownOpen(prev => !prev)}
          aria-haspopup="listbox"
          aria-expanded={mobileDropdownOpen}
        >
          <span className={styles.tabLabel}>
            {activeTabDef?.label ?? ''}
          </span>
          {typeof activeTabDef?.count === 'number' && (
            <span
              className={`${styles.tabCount} ${activeTabDef.isNew ? styles.tabCountNew : ''}`}
            >
              {activeTabDef.count}
            </span>
          )}
          <span
            className={`${styles.mobileTabChevron} ${mobileDropdownOpen ? styles.mobileTabChevronOpen : ''}`}
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6 7.77734L10 12.2218L14 7.77734"
                stroke="#6A7282"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {mobileDropdownOpen && (
          <div className={styles.mobileTabMenu} role="listbox">
            {tabs
              .filter(t => t.id !== activeTab)
              .map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={styles.mobileTabMenuItem}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <span className={styles.tabLabel}>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span
                      className={`${styles.tabCount} ${tab.isNew ? styles.tabCountNew : ''}`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
