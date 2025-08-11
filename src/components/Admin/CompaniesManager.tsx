'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api-client';
import styles from './AdminManager.module.scss';

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  industry: string | null;
  size: string | null;
  ga_property_id: string | null;
  callrail_api_token: string | null;
  callrail_account_id: string | null;
  created_at: string;
}

export default function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    industry: '',
    size: '',
    ga_property_id: '',
    callrail_api_token: '',
    callrail_account_id: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesData = await adminAPI.getCompanies();
      
      // Load GA property IDs and CallRail API tokens from company settings for each company
      const companiesWithSettings = await Promise.all(
        companiesData.map(async (company: Company) => {
          try {
            const response = await fetch(`/api/companies/${company.id}/settings`);
            if (response.ok) {
              const { settings } = await response.json();
              return {
                ...company,
                ga_property_id: settings.ga_property_id?.value || null,
                callrail_api_token: settings.callrail_api_token?.value || null,
                callrail_account_id: settings.callrail_account_id?.value || null
              };
            }
          } catch (error) {
            console.error(`Error loading settings for company ${company.id}:`, error);
          }
          return { ...company, ga_property_id: null, callrail_api_token: null, callrail_account_id: null };
        })
      );
      
      setCompanies(companiesWithSettings);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { ga_property_id, callrail_api_token, callrail_account_id, ...companyData } = formData;
      const newCompany = await adminAPI.createCompany(companyData);
      
      // Save settings to company_settings if provided
      const settingsToSave: any = {};
      
      if (ga_property_id && ga_property_id.trim()) {
        settingsToSave.ga_property_id = {
          value: ga_property_id.trim(),
          type: 'string'
        };
      }
      
      if (callrail_api_token && callrail_api_token.trim()) {
        settingsToSave.callrail_api_token = {
          value: callrail_api_token.trim(),
          type: 'string'
        };
      }
      
      if (callrail_account_id && callrail_account_id.trim()) {
        settingsToSave.callrail_account_id = {
          value: callrail_account_id.trim(),
          type: 'string'
        };
      }
      
      if (Object.keys(settingsToSave).length > 0) {
        try {
          await fetch(`/api/companies/${newCompany.id}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: settingsToSave }),
          });
        } catch (error) {
          console.error('Error saving company settings:', error);
        }
      }

      setFormData({
        name: '',
        description: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'United States',
        industry: '',
        size: '',
        ga_property_id: '',
        callrail_api_token: '',
        callrail_account_id: '',
      });
      setShowCreateForm(false);
      loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    try {
      const { ga_property_id, callrail_api_token, callrail_account_id, ...companyData } = editingCompany;
      
      // Update company data (without settings fields)
      await adminAPI.updateCompany(editingCompany.id, {
        name: companyData.name,
        description: companyData.description,
        website: companyData.website,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        zip_code: companyData.zip_code,
        country: companyData.country,
        industry: companyData.industry,
        size: companyData.size,
      });
      
      // Update settings
      try {
        await fetch(`/api/companies/${editingCompany.id}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              ga_property_id: {
                value: ga_property_id?.trim() || '',
                type: 'string'
              },
              callrail_api_token: {
                value: callrail_api_token?.trim() || '',
                type: 'string'
              },
              callrail_account_id: {
                value: callrail_account_id?.trim() || '',
                type: 'string'
              }
            }
          }),
        });
      } catch (error) {
        console.error('Error updating company settings:', error);
      }

      setEditingCompany(null);
      loadCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this company? This will also remove all user associations.'
      )
    )
      return;

    try {
      await adminAPI.deleteCompany(companyId);

      loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  if (loading) {
    return <div>Loading companies...</div>;
  }

  const renderForm = (
    company: Company | null,
    onSubmit: (e: React.FormEvent) => void
  ) => (
    <form onSubmit={onSubmit}>
      <div className={styles.formGroup}>
        <label>Name *:</label>
        <input
          type="text"
          value={company ? company.name : formData.name}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, name: e.target.value });
            } else {
              setFormData({ ...formData, name: e.target.value });
            }
          }}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Description:</label>
        <textarea
          value={company ? company.description || '' : formData.description}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, description: e.target.value });
            } else {
              setFormData({ ...formData, description: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Website:</label>
        <input
          type="url"
          value={company ? company.website || '' : formData.website}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, website: e.target.value });
            } else {
              setFormData({ ...formData, website: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Email:</label>
        <input
          type="email"
          value={company ? company.email || '' : formData.email}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, email: e.target.value });
            } else {
              setFormData({ ...formData, email: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Phone:</label>
        <input
          type="tel"
          value={company ? company.phone || '' : formData.phone}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, phone: e.target.value });
            } else {
              setFormData({ ...formData, phone: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Address:</label>
        <input
          type="text"
          value={company ? company.address || '' : formData.address}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, address: e.target.value });
            } else {
              setFormData({ ...formData, address: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>City:</label>
        <input
          type="text"
          value={company ? company.city || '' : formData.city}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, city: e.target.value });
            } else {
              setFormData({ ...formData, city: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>State:</label>
        <input
          type="text"
          value={company ? company.state || '' : formData.state}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, state: e.target.value });
            } else {
              setFormData({ ...formData, state: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>ZIP Code:</label>
        <input
          type="text"
          value={company ? company.zip_code || '' : formData.zip_code}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, zip_code: e.target.value });
            } else {
              setFormData({ ...formData, zip_code: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Industry:</label>
        <input
          type="text"
          value={company ? company.industry || '' : formData.industry}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, industry: e.target.value });
            } else {
              setFormData({ ...formData, industry: e.target.value });
            }
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Size:</label>
        <select
          value={company ? company.size || '' : formData.size}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, size: e.target.value });
            } else {
              setFormData({ ...formData, size: e.target.value });
            }
          }}
        >
          <option value="">Select size</option>
          <option value="1-10">1-10 employees</option>
          <option value="11-50">11-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201-500">201-500 employees</option>
          <option value="501-1000">501-1000 employees</option>
          <option value="1000+">1000+ employees</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Google Analytics Property ID:</label>
        <input
          type="text"
          placeholder="e.g., 123456789"
          value={company ? company.ga_property_id || '' : formData.ga_property_id}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, ga_property_id: e.target.value });
            } else {
              setFormData({ ...formData, ga_property_id: e.target.value });
            }
          }}
        />
        <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          Enter the GA4 Property ID (numbers only) to enable analytics dashboard for this company
        </small>
      </div>

      <div className={styles.formGroup}>
        <label>CallRail API Token:</label>
        <input
          type="password"
          placeholder="Enter CallRail API token"
          value={company ? company.callrail_api_token || '' : formData.callrail_api_token}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, callrail_api_token: e.target.value });
            } else {
              setFormData({ ...formData, callrail_api_token: e.target.value });
            }
          }}
        />
        <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          Enter your CallRail API token to enable call analytics dashboard for this company
        </small>
      </div>

      <div className={styles.formGroup}>
        <label>CallRail Account ID:</label>
        <input
          type="text"
          placeholder="e.g., ACC28a0b8ba54bf4a1bbc85e8c5bb9aa15d"
          value={company ? company.callrail_account_id || '' : formData.callrail_account_id}
          onChange={e => {
            if (company) {
              setEditingCompany({ ...company, callrail_account_id: e.target.value });
            } else {
              setFormData({ ...formData, callrail_account_id: e.target.value });
            }
          }}
        />
        <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          Enter the specific CallRail Account ID to use for this company (found in CallRail dashboard URL)
        </small>
      </div>


      <div className={styles.formActions}>
        <button type="submit" className={styles.saveButton}>
          {company ? 'Save' : 'Create'}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => {
            if (company) {
              setEditingCompany(null);
            } else {
              setShowCreateForm(false);
            }
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Companies Management</h2>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          Create Company
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create New Company</h3>
            {renderForm(null, handleCreateCompany)}
          </div>
        </div>
      )}

      {editingCompany && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit Company</h3>
            {renderForm(editingCompany, handleUpdateCompany)}
          </div>
        </div>
      )}

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Industry</th>
              <th>Size</th>
              <th>Email</th>
              <th>Analytics</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.industry || '-'}</td>
                <td>{company.size || '-'}</td>
                <td>{company.email || '-'}</td>
                <td>
                  {company.ga_property_id ? (
                    <span style={{ color: '#10b981', fontWeight: '500' }}>
                      ✓ {company.ga_property_id}
                    </span>
                  ) : (
                    <span style={{ color: '#6b7280' }}>Not configured</span>
                  )}
                </td>
                <td>{new Date(company.created_at).toLocaleDateString()}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => setEditingCompany(company)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteCompany(company.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
