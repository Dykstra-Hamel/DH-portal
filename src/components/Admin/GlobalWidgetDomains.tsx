'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, X, AlertTriangle, CheckCircle, Save, ChevronDown, ChevronRight, Search, Building2, Edit2 } from 'lucide-react';
import styles from './GlobalWidgetDomains.module.scss';

interface WidgetDomain {
  id: string;
  domain: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  companies: {
    id: string;
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

interface GlobalWidgetDomainsProps {
  className?: string;
}

export default function GlobalWidgetDomains({ className }: GlobalWidgetDomainsProps) {
  const [domains, setDomains] = useState<WidgetDomain[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [domainsCollapsed, setDomainsCollapsed] = useState(false);
  const [infoCollapsed, setInfoCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editCompanyId, setEditCompanyId] = useState('');

  // Load current domains and companies
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/widget-domains');
      const data = await response.json();
      
      if (data.success) {
        setDomains(data.domains || []);
        setCompanies(data.companies || []);
        
        // Set default company selection to first company
        if (!selectedCompanyId && data.companies?.length > 0) {
          setSelectedCompanyId(data.companies[0].id);
        }
      } else {
        setError(data.error || 'Failed to load data');
      }
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Add new domain
  const addDomain = async () => {
    const trimmed = newDomain.trim();
    if (!trimmed || !selectedCompanyId) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/widget-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          domain: trimmed,
          company_id: selectedCompanyId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Domain added successfully');
        setNewDomain('');
        setError(null);
        // Reload data to get updated list
        await loadData();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to add domain');
      }
    } catch (error) {
      setError('Failed to add domain');
    } finally {
      setSaving(false);
    }
  };

  // Remove domain
  const removeDomain = async (domainId: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/widget-domains?id=${domainId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Domain removed successfully');
        setError(null);
        // Reload data to get updated list
        await loadData();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to remove domain');
      }
    } catch (error) {
      setError('Failed to remove domain');
    } finally {
      setSaving(false);
    }
  };

  // Start editing domain company assignment
  const startEdit = (domainId: string, currentCompanyId: string) => {
    setEditingDomain(domainId);
    setEditCompanyId(currentCompanyId);
  };

  // Save domain company assignment
  const saveEdit = async () => {
    if (!editingDomain || !editCompanyId) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/widget-domains', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: editingDomain,
          company_id: editCompanyId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Domain updated successfully');
        setError(null);
        setEditingDomain(null);
        setEditCompanyId('');
        // Reload data to get updated list
        await loadData();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update domain');
      }
    } catch (error) {
      setError('Failed to update domain');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingDomain(null);
    setEditCompanyId('');
  };

  // Handle enter key in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDomain();
    }
  };

  // Filter domains based on search query
  const filteredDomains = domains.filter(domain =>
    domain.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    domain.companies.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group domains by company
  const domainsByCompany = filteredDomains.reduce((acc, domain) => {
    const companyName = domain.companies.name;
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(domain);
    return acc;
  }, {} as Record<string, WidgetDomain[]>);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Globe className={styles.icon} />
          <h2>Widget Domains</h2>
        </div>
        <p className={styles.description}>
          Manage domains that can embed widgets, organized by company.
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
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className={styles.companySelect}
            disabled={saving}
          >
            <option value="">Select Company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <button
            onClick={addDomain}
            disabled={!newDomain.trim() || !selectedCompanyId || saving}
            className={styles.addButton}
          >
            <Plus size={16} />
            Add Domain
          </button>
        </div>
        <div className={styles.helpText}>
          Enter full URL and select the company that owns this domain.
        </div>
      </div>

      <div className={styles.domainsList}>
        <div className={styles.listHeader} onClick={() => setDomainsCollapsed(!domainsCollapsed)}>
          <div className={styles.headerLeft}>
            {domainsCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            <h3>Widget Domains ({domains.length})</h3>
          </div>
          <div className={styles.headerRight}>
            {saving && (
              <div className={styles.savingIndicator}>
                <Save size={16} />
                Saving...
              </div>
            )}
          </div>
        </div>

        {!domainsCollapsed && (
          <>
            {domains.length > 0 && (
              <div className={styles.searchSection}>
                <div className={styles.searchInput}>
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search domains or companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className={styles.loading}>Loading domains...</div>
            ) : domains.length === 0 ? (
              <div className={styles.emptyState}>
                <Globe size={24} />
                <h3>No domains configured</h3>
                <p>Add domains above to allow widgets on partner/client websites.</p>
              </div>
            ) : filteredDomains.length === 0 && searchQuery ? (
              <div className={styles.emptyState}>
                <Search size={24} />
                <h3>No domains found</h3>
                <p>No domains match &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className={styles.domains}>
                {Object.entries(domainsByCompany).map(([companyName, companyDomains]) => (
                  <div key={companyName} className={styles.companyGroup}>
                    <div className={styles.companyHeader}>
                      <Building2 size={16} />
                      <h4>{companyName}</h4>
                      <span className={styles.domainCount}>({companyDomains.length})</span>
                    </div>
                    <div className={styles.companyDomains}>
                      {companyDomains.map((domain) => (
                        <div key={domain.id} className={styles.domainItem}>
                          <div className={styles.domainUrl}>
                            <Globe size={14} />
                            {domain.domain}
                            {!domain.is_active && (
                              <span className={styles.inactiveLabel}>Inactive</span>
                            )}
                          </div>
                          <div className={styles.domainActions}>
                            {editingDomain === domain.id ? (
                              <>
                                <select
                                  value={editCompanyId}
                                  onChange={(e) => setEditCompanyId(e.target.value)}
                                  className={styles.editSelect}
                                  disabled={saving}
                                >
                                  {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                      {company.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={saveEdit}
                                  disabled={saving}
                                  className={styles.saveButton}
                                  title="Save changes"
                                >
                                  <CheckCircle size={14} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={saving}
                                  className={styles.cancelButton}
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(domain.id, domain.company_id)}
                                  className={styles.editButton}
                                  disabled={saving}
                                  title="Change company assignment"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => removeDomain(domain.id)}
                                  className={styles.removeButton}
                                  disabled={saving}
                                  title="Remove domain"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.infoSection}>
        <div className={styles.infoHeader} onClick={() => setInfoCollapsed(!infoCollapsed)}>
          {infoCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <h4>How This Works</h4>
        </div>
        
        {!infoCollapsed && (
          <ul>
            <li><strong>Company Association:</strong> Each domain is tied to a specific company</li>
            <li><strong>Widget Resolution:</strong> When a widget loads, the system finds the company based on the domain</li>
            <li><strong>No Duplicates:</strong> Each domain can only belong to one company at a time</li>
            <li><strong>HTTPS Recommended:</strong> Use HTTPS domains for production security</li>
            <li><strong>Immediate Effect:</strong> Changes take effect immediately when saved</li>
            <li><strong>Always Allowed:</strong> Localhost and your main site URL are always permitted</li>
          </ul>
        )}
      </div>
    </div>
  );
}