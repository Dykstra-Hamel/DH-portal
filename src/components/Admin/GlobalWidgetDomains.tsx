'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, X, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import styles from './GlobalWidgetDomains.module.scss';

interface GlobalWidgetDomainsProps {
  className?: string;
}

export default function GlobalWidgetDomains({ className }: GlobalWidgetDomainsProps) {
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load current domains
  const loadDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/widget-domains');
      const data = await response.json();
      
      if (data.success) {
        setDomains(data.domains || []);
        setLastUpdated(data.lastUpdated);
      } else {
        setError(data.error || 'Failed to load domains');
      }
    } catch (error) {
      setError('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  // Domains are now auto-saved on add/remove

  // Add new domain
  const addDomain = async () => {
    const trimmed = newDomain.trim();
    if (!trimmed) return;

    // Basic client-side validation
    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        setError('Domain must start with http:// or https://');
        return;
      }
      
      if (domains.includes(trimmed.toLowerCase())) {
        setError('Domain already exists in the list');
        return;
      }

      const updatedDomains = [...domains, trimmed.toLowerCase()];
      setDomains(updatedDomains);
      setNewDomain('');
      setError(null);

      // Save the changes immediately
      try {
        setSaving(true);
        const response = await fetch('/api/admin/widget-domains', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ domains: updatedDomains }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess('Domain added successfully');
          setLastUpdated(new Date().toISOString());
          // Clear success message after 2 seconds
          setTimeout(() => setSuccess(null), 2000);
        } else {
          setError(data.error || 'Failed to add domain');
          // Revert the change if save failed
          setDomains(domains);
          setNewDomain(trimmed); // Restore input
        }
      } catch (error) {
        setError('Failed to add domain');
        // Revert the change if save failed
        setDomains(domains);
        setNewDomain(trimmed); // Restore input
      } finally {
        setSaving(false);
      }
    } catch (e) {
      setError('Invalid URL format. Please enter a full URL like https://example.com');
    }
  };

  // Remove domain
  const removeDomain = async (index: number) => {
    const updatedDomains = domains.filter((_, i) => i !== index);
    setDomains(updatedDomains);
    setError(null);
    
    // Save the changes immediately
    try {
      setSaving(true);
      const response = await fetch('/api/admin/widget-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains: updatedDomains }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Domain removed successfully');
        setLastUpdated(new Date().toISOString());
        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(data.error || 'Failed to remove domain');
        // Revert the change if save failed
        setDomains(domains);
      }
    } catch (error) {
      setError('Failed to remove domain');
      // Revert the change if save failed
      setDomains(domains);
    } finally {
      setSaving(false);
    }
  };

  // Handle enter key in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDomain();
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Globe className={styles.icon} />
          <h2>Global Widget Domains</h2>
        </div>
        <p className={styles.description}>
          Manage the global whitelist of domains that can embed widgets for any company. 
          This is a security feature that controls which websites can load your widget scripts.
        </p>
      </div>

      {error && (
        <div className={styles.alert} data-type="error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className={styles.alert} data-type="success">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <div className={styles.addSection}>
        <div className={styles.inputRow}>
          <input
            type="url"
            placeholder="https://example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.domainInput}
            disabled={saving}
          />
          <button
            onClick={addDomain}
            disabled={!newDomain.trim() || saving}
            className={styles.addButton}
          >
            <Plus size={16} />
            Add Domain
          </button>
        </div>
        <div className={styles.helpText}>
          Enter the full URL including https://. Subdomains will also be allowed automatically.
        </div>
      </div>

      <div className={styles.domainsList}>
        <div className={styles.listHeader}>
          <h3>Allowed Domains ({domains.length})</h3>
          {saving && (
            <div className={styles.savingIndicator}>
              <Save size={16} />
              Saving...
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Loading domains...</div>
        ) : domains.length === 0 ? (
          <div className={styles.emptyState}>
            <Globe size={48} />
            <h3>No domains configured</h3>
            <p>
              Your widget will only work on localhost and your main site URL.<br />
              Add domains above to allow widgets on partner/client websites.
            </p>
          </div>
        ) : (
          <div className={styles.domains}>
            {domains.map((domain, index) => (
              <div key={index} className={styles.domainItem}>
                <div className={styles.domainUrl}>
                  <Globe size={16} />
                  {domain}
                </div>
                <button
                  onClick={() => removeDomain(index)}
                  className={styles.removeButton}
                  disabled={saving}
                  title="Remove domain"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.infoSection}>
        <h4>Security Notes:</h4>
        <ul>
          <li><strong>Global whitelist:</strong> Any domain listed here can embed widgets for ALL companies</li>
          <li><strong>HTTPS recommended:</strong> Use HTTPS domains for production security</li>
          <li><strong>Subdomain support:</strong> Adding &quot;example.com&quot; automatically allows &quot;www.example.com&quot;</li>
          <li><strong>Immediate effect:</strong> Changes take effect immediately when saved</li>
          <li><strong>Always allowed:</strong> Localhost and your main site URL are always permitted</li>
        </ul>
        {lastUpdated && (
          <div className={styles.lastUpdated}>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}