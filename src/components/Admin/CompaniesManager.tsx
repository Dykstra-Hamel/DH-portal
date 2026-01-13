'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import styles from './AdminManager.module.scss';
import { generateSlug } from '@/lib/slug-utils';

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [googlePlacesListings, setGooglePlacesListings] = useState<GooglePlaceListing[]>([]);
  const [websites, setWebsites] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
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
        slug: '',
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

  // Filter and sort companies
  const filteredAndSortedCompanies = companies
    .filter(company => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const nameMatch = company.name.toLowerCase().includes(query);
      const websiteMatch = company.website?.some(w => w.toLowerCase().includes(query));
      const emailMatch = company.email?.toLowerCase().includes(query);
      const industryMatch = company.industry?.toLowerCase().includes(query);

      return nameMatch || websiteMatch || emailMatch || industryMatch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

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
          onChange={e => {
            const newName = e.target.value;
            setFormData({
              ...formData,
              name: newName,
              // Auto-generate slug from name if slug hasn't been manually edited
              slug: generateSlug(newName)
            });
          }}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Slug (URL identifier) *:</label>
        <input
          type="text"
          value={formData.slug}
          onChange={e => setFormData({ ...formData, slug: e.target.value })}
          placeholder="company-name"
          required
        />
        <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
          Used for company login page: yoursite.com/login/{formData.slug || 'slug'}
        </small>
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
              slug: '',
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

      <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search companies by name, website, email, or industry..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            outline: 'none',
          }}
        />
      </div>

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
            {filteredAndSortedCompanies.map(company => (
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
