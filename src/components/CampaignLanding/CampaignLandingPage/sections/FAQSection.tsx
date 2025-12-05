/**
 * FAQ Section Component
 *
 * Accordion-style FAQ items
 */

import { useState } from 'react';
import styles from '../CampaignLandingPage.module.scss';
import FAQItem from '../components/FAQItem';

interface FAQSectionProps {
  faq: {
    heading: string;
    items: Array<{ question: string; answer: string }>;
  };
}

export default function FAQSection({ faq }: FAQSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section className={styles.faqSection}>
      <div className={styles.faqContainer}>
        <h2 className={styles.faqHeading}>{faq.heading}</h2>

        <div className={styles.faqList}>
          {faq.items.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isExpanded={expandedIndex === index}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
