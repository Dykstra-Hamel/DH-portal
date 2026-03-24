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
  onSave: (data: { quote_terms: string; quote_thanks_content: string; wisetack_enabled: boolean; wisetack_url: string; quote_accent_color_preference: string }) => void;
  saving: boolean;
}

export default function QuotePageSection({
  companyId,
  onSave,
  saving,
}: QuotePageSectionProps) {
  const [quoteTerms, setQuoteTerms] = useState('');
  const [quoteThanksContent, setQuoteThanksContent] = useState('');
  const [wisetackEnabled, setWisetackEnabled] = useState(false);
  const [wisetackUrl, setWisetackUrl] = useState('');
  const [quoteAccentColorPreference, setQuoteAccentColorPreference] = useState<'primary' | 'secondary'>('primary');
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
        setWisetackEnabled(settings.wisetack_enabled?.value === 'true');
        setWisetackUrl(settings.wisetack_url?.value || '');
        setQuoteAccentColorPreference((settings.quote_accent_color_preference?.value as 'primary' | 'secondary') || 'primary');
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
      wisetack_enabled: wisetackEnabled,
      wisetack_url: wisetackUrl,
      quote_accent_color_preference: quoteAccentColorPreference,
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

      <div className={styles.formGroup}>
        <label>Wisetack Financing</label>
        <div className={styles.toggleRow}>
          <input
            type="checkbox"
            id="wisetack-enabled"
            checked={wisetackEnabled}
            onChange={e => setWisetackEnabled(e.target.checked)}
          />
          <label htmlFor="wisetack-enabled">Enable Wisetack financing section on quote page</label>
        </div>
        {wisetackEnabled && (
          <div style={{ marginTop: '12px' }}>
            <label htmlFor="wisetack-url">Wisetack URL</label>
            <input
              type="url"
              id="wisetack-url"
              value={wisetackUrl}
              onChange={e => setWisetackUrl(e.target.value)}
              placeholder="https://apply.wisetack.com/..."
              className={styles.textInput}
            />
            <p className={styles.fieldDescription}>
              The pre-qualification link provided by Wisetack. Customers will be sent to this URL when they click &quot;Pre-Qualify By Clicking Here.&quot;
            </p>
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="quote-accent-color">Quote Page Color Preference</label>
        <select
          id="quote-accent-color"
          value={quoteAccentColorPreference}
          onChange={e => setQuoteAccentColorPreference(e.target.value as 'primary' | 'secondary')}
          className={styles.textInput}
        >
          <option value="primary">Primary Color (default)</option>
          <option value="secondary">Secondary Color (reversed)</option>
        </select>
        <p className={styles.fieldDescription}>
          Choose which brand color is used as the primary accent on the public quote page. &quot;Reversed&quot; swaps the primary and secondary brand colors.
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
