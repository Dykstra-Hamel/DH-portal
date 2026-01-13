/**
 * Quote Page Settings Section
 *
 * Allows configuring quote page settings including terms and conditions
 */

'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import RichTextEditor from '../Common/RichTextEditor/RichTextEditor';
import styles from './CompanyManagement.module.scss';

interface QuotePageSectionProps {
  companyId: string;
  onSave: (data: { quote_terms: string; quote_thanks_content: string }) => void;
  saving: boolean;
}

export default function QuotePageSection({
  companyId,
  onSave,
  saving,
}: QuotePageSectionProps) {
  const [quoteTerms, setQuoteTerms] = useState('');
  const [quoteThanksContent, setQuoteThanksContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}/settings`);
      if (response.ok) {
        const { settings } = await response.json();
        setQuoteTerms(settings.quote_terms?.value || '');
        setQuoteThanksContent(settings.quote_thanks_content?.value || '');
      }
    } catch (error) {
      console.error('Error loading quote page settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave({
      quote_terms: quoteTerms,
      quote_thanks_content: quoteThanksContent,
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading quote page settings...</div>;
  }

  return (
    <div className={styles.section}>
      <h2>Quote Page Settings</h2>

      <div className={styles.formGroup}>
        <label htmlFor="quote-terms">Terms and Conditions</label>
        <RichTextEditor
          value={quoteTerms}
          onChange={setQuoteTerms}
          placeholder="Enter terms and conditions..."
        />
        <p className={styles.fieldDescription}>
          These terms will be displayed on the quote signing page. Customers
          must accept these terms before signing the quote.
        </p>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="quote-thanks">Thank You Page Content</label>
        <RichTextEditor
          value={quoteThanksContent}
          onChange={setQuoteThanksContent}
          placeholder="Enter thank you page content..."
        />
        <p className={styles.fieldDescription}>
          This content will be displayed to customers after they successfully
          sign and submit the quote.
        </p>
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveButton}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
