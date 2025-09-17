'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import styles from './AdminManager.module.scss';

interface GooglePlaceListing {
  id?: string;
  place_id: string;
  place_name?: string;
  is_primary: boolean;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string[] | null; // Now an array of website domains
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
  google_place_id: string | null; // Keep for backward compatibility
  google_places_listings?: GooglePlaceListing[];
  created_at: string;
}

export default function CompaniesManager() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [googlePlacesListings, setGooglePlacesListings] = useState<GooglePlaceListing[]>([]);
  const [websites, setWebsites] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: [] as string[],
    email: '',
    phone: '',
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
                callrail_account_id: settings.callrail_account_id?.value || null,
                google_place_id: settings.google_place_id?.value || null
              };
            }
          } catch (error) {
            console.error(`Error loading settings for company ${company.id}:`, error);
          }
          return { ...company, ga_property_id: null, callrail_api_token: null, callrail_account_id: null, google_place_id: null };
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
    setError(null);

    try {
      // Client-side validation
      if (!formData.name || formData.name.trim().length === 0) {
        setError('Company name is required');
        return;
      }
      
      // Validate websites
      const websiteErrors = validateWebsites();
      if (websiteErrors.length > 0) {
        setError(websiteErrors.join('; '));
        return;
      }
      
      // Use websites from state (for create form)
      const websitesToSubmit = websites
        .filter((url: string) => url && url.trim().length > 0);
      const companyDataWithWebsites = {
        ...formData,
        website: websitesToSubmit,
        // Set default values for required fields
        country: 'United States'
      };
      
      const newCompany = await adminAPI.createCompany(companyDataWithWebsites);

      setFormData({
        name: '',
        description: '',
        website: [],
        email: '',
        phone: '',
      });
      setWebsites([]);
      setShowCreateForm(false);
      setError(null);
      loadCompanies();
    } catch (error: any) {
      console.error('Error creating company:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create company';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    try {
      const { ga_property_id, callrail_api_token, callrail_account_id, google_place_id, ...companyData } = editingCompany;
      
      // Validate websites
      const websiteErrors = validateWebsites();
      if (websiteErrors.length > 0) {
        setError(websiteErrors.join('; '));
        return;
      }
      
      // Update company data (without settings fields)
      const websitesToSubmit = (websites.length > 0 ? websites : (companyData.website || []))
        .filter((url: string) => url && url.trim().length > 0);
      await adminAPI.updateCompany(editingCompany.id, {
        name: companyData.name,
        description: companyData.description,
        website: websitesToSubmit,
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
              },
              google_place_id: {
                value: google_place_id?.trim() || '',
                type: 'string'
              }
            }
          }),
        });
      } catch (error) {
        console.error('Error updating company settings:', error);
      }

      // Save Google Places listings
      try {
        await saveGooglePlacesListings(editingCompany.id);
      } catch (error) {
        console.error('Error saving Google Places listings:', error);
      }

      setEditingCompany(null);
      setGooglePlacesListings([]); // Clear listings
      setWebsites([]); // Clear websites
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

  // Google Places listings management functions
  const addGooglePlaceListing = () => {
    const newListing: GooglePlaceListing = {
      place_id: '',
      place_name: '',
      is_primary: googlePlacesListings.length === 0 // First listing is primary by default
    };
    setGooglePlacesListings([...googlePlacesListings, newListing]);
  };

  const removeGooglePlaceListing = (index: number) => {
    const updatedListings = googlePlacesListings.filter((_, i) => i !== index);
    // If we removed the primary listing, make the first remaining listing primary
    if (googlePlacesListings[index]?.is_primary && updatedListings.length > 0) {
      updatedListings[0].is_primary = true;
    }
    setGooglePlacesListings(updatedListings);
  };

  const updateGooglePlaceListing = (index: number, field: keyof GooglePlaceListing, value: any) => {
    const updatedListings = [...googlePlacesListings];
    
    // If setting is_primary to true, make sure all others are false
    if (field === 'is_primary' && value === true) {
      updatedListings.forEach((listing, i) => {
        if (i !== index) {
          listing.is_primary = false;
        }
      });
    }
    
    (updatedListings[index] as any)[field] = value;
    setGooglePlacesListings(updatedListings);
  };

  // Load Google Places listings when editing a company
  const loadGooglePlacesListings = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/google-places`);
      if (response.ok) {
        const { listings } = await response.json();
        setGooglePlacesListings(listings || []);
      }
    } catch (error) {
      console.error('Error loading Google Places listings:', error);
      setGooglePlacesListings([]);
    }
  };

  // Website management functions
  const addWebsite = () => {
    setWebsites([...websites, '']);
  };

  const removeWebsite = (index: number) => {
    const updatedWebsites = websites.filter((_, i) => i !== index);
    setWebsites(updatedWebsites);
  };

  const updateWebsite = (index: number, value: string) => {
    const updatedWebsites = [...websites];
    updatedWebsites[index] = value;
    setWebsites(updatedWebsites);
  };

  // Validate websites
  const validateWebsites = () => {
    const errors: string[] = [];
    const seenWebsites = new Set();
    
    websites.forEach((website, index) => {
      if (website.trim()) {
        // Check for duplicates
        const normalizedWebsite = website.toLowerCase().trim();
        if (seenWebsites.has(normalizedWebsite)) {
          errors.push(`Website ${index + 1}: Duplicate website detected`);
        } else {
          seenWebsites.add(normalizedWebsite);
        }
        
        // Basic URL validation
        try {
          const url = website.startsWith('http') ? website : `https://${website}`;
          new URL(url);
        } catch {
          errors.push(`Website ${index + 1}: Invalid URL format`);
        }
      }
    });
    
    return errors;
  };

  // Save Google Places listings
  const saveGooglePlacesListings = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/google-places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listings: googlePlacesListings }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save Google Places listings');
      }
    } catch (error) {
      console.error('Error saving Google Places listings:', error);
      throw error;
    }
  };

  if (loading) {
    return <div>Loading companies...</div>;
  }

  // Simplified form for creation only
  const renderCreateForm = () => (
    <form onSubmit={handleCreateCompany}>
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div className={styles.formGroup}>
        <label>Name *:</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Description:</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Websites:</label>
        <div style={{ marginBottom: '12px' }}>
          {websites.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              No websites added yet.
            </p>
          ) : (
            websites.map((website, index) => (
              <div key={index} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '12px', 
                marginBottom: '8px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={website}
                    onChange={e => updateWebsite(index, e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeWebsite(index)}
                    style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#dc2626', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={addWebsite}
          style={{
            padding: '8px 16px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '8px'
          }}
        >
          + Add Website
        </button>
        <small style={{ color: '#666', fontSize: '12px', display: 'block' }}>
          Add multiple websites/domains for this company.
        </small>
      </div>

      <div className={styles.formGroup}>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Phone:</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveButton}>
          Create
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => {
            setShowCreateForm(false);
            setError(null);
            setWebsites([]);
            setFormData({
              name: '',
              description: '',
              website: [],
              email: '',
              phone: '',
            });
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  // Full form for editing (preserving all functionality)
  const renderEditForm = (
    company: Company,
    onSubmit: (e: React.FormEvent) => void
  ) => (
    <form onSubmit={onSubmit}>
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div className={styles.formGroup}>
        <label>Name *:</label>
        <input
          type="text"
          value={company.name}
          onChange={e => setEditingCompany({ ...company, name: e.target.value })}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Description:</label>
        <textarea
          value={company.description || ''}
          onChange={e => setEditingCompany({ ...company, description: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Websites:</label>
        <div style={{ marginBottom: '12px' }}>
          {websites.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              No websites added yet.
            </p>
          ) : (
            websites.map((website, index) => (
              <div key={index} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '12px', 
                marginBottom: '8px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={website}
                    onChange={e => updateWebsite(index, e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeWebsite(index)}
                    style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#dc2626', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={addWebsite}
          style={{
            padding: '8px 16px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '8px'
          }}
        >
          + Add Website
        </button>
        <small style={{ color: '#666', fontSize: '12px', display: 'block' }}>
          Add multiple websites/domains for this company. The first website will be considered the primary domain.
        </small>
      </div>

      <div className={styles.formGroup}>
        <label>Email:</label>
        <input
          type="email"
          value={company.email || ''}
          onChange={e => setEditingCompany({ ...company, email: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Phone:</label>
        <input
          type="tel"
          value={company.phone || ''}
          onChange={e => setEditingCompany({ ...company, phone: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Address:</label>
        <input
          type="text"
          value={company.address || ''}
          onChange={e => setEditingCompany({ ...company, address: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>City:</label>
        <input
          type="text"
          value={company.city || ''}
          onChange={e => setEditingCompany({ ...company, city: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>State:</label>
        <input
          type="text"
          value={company.state || ''}
          onChange={e => setEditingCompany({ ...company, state: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>ZIP Code:</label>
        <input
          type="text"
          value={company.zip_code || ''}
          onChange={e => setEditingCompany({ ...company, zip_code: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Industry:</label>
        <input
          type="text"
          value={company.industry || ''}
          onChange={e => setEditingCompany({ ...company, industry: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Size:</label>
        <select
          value={company.size || ''}
          onChange={e => setEditingCompany({ ...company, size: e.target.value })}
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
          value={company.ga_property_id || ''}
          onChange={e => setEditingCompany({ ...company, ga_property_id: e.target.value })}
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
          value={company.callrail_api_token || ''}
          onChange={e => setEditingCompany({ ...company, callrail_api_token: e.target.value })}
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
          value={company.callrail_account_id || ''}
          onChange={e => setEditingCompany({ ...company, callrail_account_id: e.target.value })}
        />
        <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          Enter the specific CallRail Account ID to use for this company (found in CallRail dashboard URL)
        </small>
      </div>

      <div className={styles.formGroup}>
        <label>Google Places Listings:</label>
        <div style={{ marginBottom: '12px' }}>
          {googlePlacesListings.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              No Google Places listings added yet.
            </p>
          ) : (
            googlePlacesListings.map((listing, index) => (
              <div key={index} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '12px', 
                marginBottom: '8px',
                backgroundColor: listing.is_primary ? '#f0f9ff' : '#f9f9f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Google Place ID (e.g., ChIJN1t_tDeuEmsRUsoyG83frY4)"
                    value={listing.place_id}
                    onChange={e => updateGooglePlaceListing(index, 'place_id', e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeGooglePlaceListing(index)}
                    style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#dc2626', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Business name (optional)"
                    value={listing.place_name || ''}
                    onChange={e => updateGooglePlaceListing(index, 'place_name', e.target.value)}
                    style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={listing.is_primary}
                      onChange={e => updateGooglePlaceListing(index, 'is_primary', e.target.checked)}
                    />
                    Primary Location
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={addGooglePlaceListing}
          style={{
            padding: '8px 16px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '8px'
          }}
        >
          + Add Google Places Listing
        </button>
        <small style={{ color: '#666', fontSize: '12px', display: 'block' }}>
          Add multiple Google Places listings to aggregate review counts. Reviews from all listings will be combined and displayed on your widget. Find Place IDs using <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Google&apos;s Place ID Finder</a>
        </small>
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveButton}>
          Save
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => {
            setEditingCompany(null);
            setError(null);
            setWebsites([]);
            setGooglePlacesListings([]);
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
          onClick={() => {
            setShowCreateForm(true);
            setError(null);
            setWebsites([]);
          }}
        >
          Create Company
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create New Company</h3>
            {renderCreateForm()}
          </div>
        </div>
      )}

      {editingCompany && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit Company</h3>
            {renderEditForm(editingCompany, handleUpdateCompany)}
          </div>
        </div>
      )}

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Website</th>
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
                <td>
                  {company.website && company.website.length > 0 ? (
                    <span>
                      <a 
                        href={company.website[0].startsWith('http') ? company.website[0] : `https://${company.website[0]}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#1d4ed8', textDecoration: 'underline' }}
                      >
                        {company.website[0]}
                      </a>
                      {company.website.length > 1 && (
                        <small style={{ color: '#6b7280', marginLeft: '4px' }}>
                          (+{company.website.length - 1} more)
                        </small>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: '#6b7280' }}>-</span>
                  )}
                </td>
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
                      className={styles.manageButton}
                      onClick={() => router.push(`/admin/companies/${company.id}`)}
                    >
                      Manage
                    </button>
                    <button
                      className={styles.editButton}
                      onClick={() => {
                        setEditingCompany(company);
                        loadGooglePlacesListings(company.id);
                        // Load websites for editing
                        setWebsites(company.website || []);
                      }}
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
