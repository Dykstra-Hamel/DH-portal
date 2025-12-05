/**
 * FAQ Item Component
 *
 * Individual FAQ accordion item
 */

import styles from '../CampaignLandingPage.module.scss';

interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function FAQItem({ question, answer, isExpanded, onToggle }: FAQItemProps) {
  return (
    <div className={`${styles.faqItem} ${isExpanded ? styles.faqItemExpanded : ''}`}>
      <button className={styles.faqQuestion} onClick={onToggle}>
        <span>{question}</span>
        <svg
          className={styles.faqIcon}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className={styles.faqAnswer}>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
