/**
 * Tabbed FAQ Section Component
 *
 * Displays FAQs with left sidebar tabs for service and add-ons
 * Right content area shows accordion-style FAQ items for selected tab
 */

'use client';

import { useState } from 'react';
import styles from '../CampaignLandingPage.module.scss';
import FAQItem from '../components/FAQItem';

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
}

export default function TabbedFAQSection({ faq }: TabbedFAQSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('service');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Build tabs array combining service + all add-ons
  const tabs = [
    { id: 'service', label: faq.serviceName, faqs: faq.serviceFaqs },
    ...faq.addonFaqs.map(addon => ({
      id: addon.addonId,
      label: addon.addonName,
      faqs: addon.faqs,
    })),
  ];

  // Get FAQs for the active tab
  const activeFaqs = tabs.find(tab => tab.id === activeTab)?.faqs || [];

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Reset expanded index when changing tabs
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setExpandedIndex(null);
  };

  return (
    <section className={styles.faqSection}>
      <div className={styles.faqContainer}>
        <h2 className={styles.faqHeading}>{faq.heading}</h2>

        <div className={styles.faqLayout}>
          {/* Left Sidebar Tabs */}
          <div className={styles.faqTabs}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`${styles.faqTab} ${activeTab === tab.id ? styles.faqTabActive : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

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
