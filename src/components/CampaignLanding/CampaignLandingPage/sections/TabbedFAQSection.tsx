/**
 * Tabbed FAQ Section Component
 *
 * Displays FAQs with left sidebar tabs for service and add-ons
 * Right content area shows accordion-style FAQ items for selected tab
 */

'use client';

import { useState, useMemo } from 'react';
import styles from '../CampaignLandingPage.module.scss';
import FAQItem from '../components/FAQItem';
import { processTextWithVariables, type VariableContext } from '@/lib/campaign-text-processing';

interface TabbedFAQSectionProps {
  faq: {
    show: boolean;
    heading: string;
    serviceName: string;
    serviceFaqs: Array<{ question: string; answer: string }>;
    addonFaqs: Array<{
      addonId: string;
      addonName: string;
      faqs: Array<{ question: string; answer: string }>;
    }>;
  };
  customer: VariableContext['customer'];
  pricing: VariableContext['pricing'];
  company: VariableContext['company'];
  branding?: VariableContext['branding'];
  serviceName?: string;
}

export default function TabbedFAQSection({
  faq,
  customer,
  pricing,
  company,
  branding,
  serviceName,
}: TabbedFAQSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Create variable context for text processing
  const variableContext = useMemo(
    () => ({
      customer,
      pricing,
      company,
      branding,
      serviceName,
    }),
    [customer, pricing, company, branding, serviceName]
  );

  // Process heading with variables
  const processedHeading = useMemo(
    () => processTextWithVariables(faq.heading, variableContext),
    [faq.heading, variableContext]
  );

  // Build tabs array combining service + add-ons that have FAQs
  const tabs = [
    ...(faq.serviceFaqs.length > 0
      ? [{ id: 'service', label: faq.serviceName, faqs: faq.serviceFaqs }]
      : []),
    ...faq.addonFaqs
      .filter(addon => addon.faqs && addon.faqs.length > 0)
      .map(addon => ({
        id: addon.addonId,
        label: addon.addonName,
        faqs: addon.faqs,
      })),
  ];

  const showTabs = tabs.length > 1;

  // Get FAQs for the active tab (default to first tab)
  const currentTab = activeTab || tabs[0]?.id || '';
  const activeFaqs = tabs.find(tab => tab.id === currentTab)?.faqs || [];

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Reset expanded index when changing tabs
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setExpandedIndex(null);
  };

  return (
    <section id="faq-section" className={styles.faqSection}>
      <div className={`${styles.faqContainer} ${!showTabs ? styles.faqContainerSingle : ''}`}>
        <h2
          className={styles.faqHeading}
          dangerouslySetInnerHTML={{ __html: processedHeading }}
        />

        {/* Mobile Dropdown (visible on mobile only, hidden when single tab) */}
        {showTabs && (
          <div className={styles.faqDropdownContainer}>
            <label htmlFor="faq-program-select" className={styles.faqDropdownLabel}>
              Choose A Program To View FAQs:
            </label>
            <select
              id="faq-program-select"
              className={styles.faqDropdown}
              value={currentTab}
              onChange={(e) => handleTabChange(e.target.value)}
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.faqLayout}>
          {/* Left Sidebar Tabs (hidden on mobile, hidden when single tab) */}
          {showTabs && (
            <div className={styles.faqTabs}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.faqTab} ${currentTab === tab.id ? styles.faqTabActive : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Right Content Area */}
          <div className={styles.faqContent}>
            <div className={styles.faqList}>
              {activeFaqs.length > 0 ? (
                activeFaqs.map((item, index) => (
                  <FAQItem
                    key={index}
                    question={item.question}
                    answer={item.answer}
                    isExpanded={expandedIndex === index}
                    onToggle={() => toggleItem(index)}
                  />
                ))
              ) : (
                <p className={styles.noFaqs}>No FAQs available for this service.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
