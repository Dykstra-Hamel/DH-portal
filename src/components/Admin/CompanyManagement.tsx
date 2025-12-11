'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { adminAPI } from '@/lib/api-client';
import { ArrowLeft, Building, Globe, Mail, Phone, MapPin, BarChart3, Settings, Monitor, DollarSign, Target, Tag } from 'lucide-react';
import Image from 'next/image';
import PricingSettingsManager from './PricingSettingsManager';
import SalesConfigManager from './SalesConfigManager';
import DiscountManager from './DiscountManager';
import EmailDomainManager from './EmailDomainManager';
import BusinessHoursEditor, { BusinessHoursData } from './BusinessHoursEditor';
import styles from './CompanyManagement.module.scss';

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
  website: string[] | null;
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
  google_place_id: string | null;
  google_places_listings?: GooglePlaceListing[];
  created_at: string;
}

interface CompanyManagementProps {
  companyId: string;
  user: User;
}

type ActiveSection = 'overview' | 'contact' | 'address' | 'business' | 'analytics' | 'google-places' | 'login-page' | 'pricing-settings' | 'sales-config' | 'discounts' | 'email-domain';

// URL normalization utility function
function normalizeWebsiteUrl(url: string): string {
  if (!url || !url.trim()) return '';
  // Strip http:// or https:// (case-insensitive), trim, and remove trailing slashes
  const normalized = url.replace(/^https?:\/\//i, '').trim().replace(/\/+$/, '');
  // Add https:// prefix
  return normalized ? `https://${normalized}` : '';
}

export default function CompanyManagement({ companyId, user }: CompanyManagementProps) {
  const router = useRouter();
  const supabase = createClient();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [googlePlacesListings, setGooglePlacesListings] = useState<GooglePlaceListing[]>([]);
  const [websites, setWebsites] = useState<string[]>([]);
  const [loginPageImages, setLoginPageImages] = useState<string[]>([]);
  const [loginSlogans, setLoginSlogans] = useState({
    line1: '',
    line2: '',
    line3: ''
  });

  useEffect(() => {
    loadCompany();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCompany = async () => {
    try {
      setLoading(true);
      const companies = await adminAPI.getCompanies();
      const foundCompany = companies.find((c: Company) => c.id === companyId);
      
      if (!foundCompany) {
        setError('Company not found');
        return;
      }

      // Load company settings
      try {
        const response = await fetch(`/api/companies/${companyId}/settings`);
        if (response.ok) {
          const { settings } = await response.json();
          setCompany({
            ...foundCompany,
            ga_property_id: settings.ga_property_id?.value || null,
            callrail_api_token: settings.callrail_api_token?.value || null,
            callrail_account_id: settings.callrail_account_id?.value || null,
            google_place_id: settings.google_place_id?.value || null
          });
          
          // Load login page settings
          setLoginSlogans({
            line1: settings.login_slogan_line_1?.value || '',
            line2: settings.login_slogan_line_2?.value || '',
            line3: settings.login_slogan_line_3?.value || ''
          });
          
          // Load login page images
          const loginImages = settings.login_page_images?.value;
          if (loginImages) {
            try {
              const imageArray = JSON.parse(loginImages);
              setLoginPageImages(Array.isArray(imageArray) ? imageArray : []);
            } catch (error) {
              console.error('Error parsing login page images:', error);
              setLoginPageImages([]);
            }
          } else {
            setLoginPageImages([]);
          }
        } else {
          setCompany(foundCompany);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setCompany(foundCompany);
      }

      // Load Google Places listings
      try {
        const response = await fetch(`/api/companies/${companyId}/google-places`);
        if (response.ok) {
          const { listings } = await response.json();
          setGooglePlacesListings(listings || []);
        }
      } catch (error) {
        console.error('Error loading Google Places listings:', error);
      }

      // Set websites for editing
      setWebsites(foundCompany.website || []);
    } catch (error) {
      console.error('Error loading company:', error);
      setError('Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: ActiveSection, updatedData: Partial<Company>) => {
    if (!company) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (section === 'analytics') {
        // Save analytics settings
        const { ga_property_id, callrail_api_token, callrail_account_id } = updatedData;
        
        await fetch(`/api/companies/${companyId}/settings`, {
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
      } else if (section === 'google-places') {
        // Save Google Places listings
        await fetch(`/api/companies/${companyId}/google-places`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listings: googlePlacesListings }),
        });
      } else if (section === 'login-page') {
        // Save login page settings
        await fetch(`/api/companies/${companyId}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              login_slogan_line_1: {
                value: loginSlogans.line1.trim(),
                type: 'string'
              },
              login_slogan_line_2: {
                value: loginSlogans.line2.trim(),
                type: 'string'
              },
              login_slogan_line_3: {
                value: loginSlogans.line3.trim(),
                type: 'string'
              },
              login_page_images: {
                value: JSON.stringify(loginPageImages),
                type: 'string'
              }
            }
          }),
        });
      } else {
        // Save company basic data
        const dataToUpdate = { ...updatedData };
        if (section === 'contact' && websites.length > 0) {
          dataToUpdate.website = websites.filter(url => url && url.trim().length > 0);
        }
        
        await adminAPI.updateCompany(companyId, dataToUpdate);
      }

      setSuccess('Changes saved successfully');
      await loadCompany(); // Reload to show updated data
    } catch (error) {
      console.error('Error saving company:', error);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Website management functions
  const addWebsite = () => {
    setWebsites([...websites, '']);
  };

  const removeWebsite = (index: number) => {
    setWebsites(websites.filter((_, i) => i !== index));
  };

  const updateWebsite = (index: number, value: string) => {
    const updatedWebsites = [...websites];
    updatedWebsites[index] = value;
    setWebsites(updatedWebsites);
  };

  // Google Places management functions
  const addGooglePlaceListing = () => {
    const newListing: GooglePlaceListing = {
      place_id: '',
      place_name: '',
      is_primary: googlePlacesListings.length === 0
    };
    setGooglePlacesListings([...googlePlacesListings, newListing]);
  };

  const removeGooglePlaceListing = (index: number) => {
    const updatedListings = googlePlacesListings.filter((_, i) => i !== index);
    if (googlePlacesListings[index]?.is_primary && updatedListings.length > 0) {
      updatedListings[0].is_primary = true;
    }
    setGooglePlacesListings(updatedListings);
  };

  const updateGooglePlaceListing = (index: number, field: keyof GooglePlaceListing, value: any) => {
    const updatedListings = [...googlePlacesListings];
    
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

  // File upload utilities (based on BrandManager implementation)
  const createAssetPath = (companyName: string, category: string, fileName: string): string => {
    const cleanCompanyName = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const fileExt = fileName.split('.').pop();
    const cleanFileName = fileName
      .replace(`.${fileExt}`, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    const timestamp = Date.now();
    const finalFileName = `${cleanFileName}_${timestamp}.${fileExt}`;

    return `${cleanCompanyName}/${category}/${finalFileName}`;
  };

  const uploadFile = async (file: File, bucket: string, category: string): Promise<string | null> => {
    if (!company) return null;

    try {
      const filePath = createAssetPath(company.name, category, file.name);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
    try {
      const urlParts = fileUrl.split('/storage/v1/object/public/brand-assets/');
      if (urlParts.length !== 2) {
        console.error('Invalid file URL format:', fileUrl);
        return false;
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('brand-assets')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file from storage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting file:', error);
      return false;
    }
  };

  // Login page specific handlers
  const handleLoginPageImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit of 3
    if (loginPageImages.length + files.length > 3) {
      setError('Maximum 3 login page images allowed');
      return;
    }

    const uploadPromises = Array.from(files).map(file =>
      uploadFile(file, 'brand-assets', 'login-page-images')
    );
    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter(url => url !== null) as string[];

    if (validUrls.length > 0) {
      setLoginPageImages(prev => [...prev, ...validUrls]);
      event.target.value = '';
      setSuccess('Login page images uploaded successfully');
    }
  };

  const removeLoginPageImage = async (indexToRemove: number) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    const imageToDelete = loginPageImages[indexToRemove];
    const deleted = await deleteFileFromStorage(imageToDelete);

    if (deleted) {
      setLoginPageImages(prev => prev.filter((_, index) => index !== indexToRemove));
      setSuccess('Image deleted successfully');
    } else {
      setError('Failed to delete image file from storage');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading company...</div>;
  }

  if (!company) {
    return (
      <div className={styles.error}>
        <h2>Company not found</h2>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Admin
        </button>
      </div>
    );
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'contact', label: 'Contact Info', icon: Mail },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'business', label: 'Business Info', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'google-places', label: 'Google Places', icon: Settings },
    { id: 'login-page', label: 'Login Page', icon: Monitor },
    { id: 'pricing-settings', label: 'Pricing Settings', icon: DollarSign },
    { id: 'sales-config', label: 'Sales Config', icon: Target },
    { id: 'discounts', label: 'Discounts', icon: Tag },
    { id: 'email-domain', label: 'Email Domain', icon: Mail },
  ] as const;

  return (
    <div className={styles.companyManagement}>
      <div className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Admin
        </button>
        <div className={styles.companyTitle}>
          <h1>{company.name}</h1>
          <p>Company Management</p>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <strong>Success:</strong> {success}
        </div>
      )}

      <div className={styles.content}>
        {/* Navigation */}
        <nav className={styles.navigation}>
          {sections.map(section => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                className={`${styles.navButton} ${activeSection === section.id ? styles.active : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <IconComponent size={18} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className={styles.mainContent}>
          {activeSection === 'overview' && (
            <OverviewSection company={company} />
          )}
          {activeSection === 'contact' && (
            <ContactSection
              company={company}
              websites={websites}
              onWebsiteAdd={addWebsite}
              onWebsiteRemove={removeWebsite}
              onWebsiteUpdate={updateWebsite}
              onSave={(data) => handleSave('contact', data)}
              saving={saving}
            />
          )}
          {activeSection === 'address' && (
            <AddressSection
              company={company}
              onSave={(data) => handleSave('address', data)}
              saving={saving}
            />
          )}
          {activeSection === 'business' && (
            <BusinessSection
              company={company}
              onSave={(data) => handleSave('business', data)}
              saving={saving}
            />
          )}
          {activeSection === 'analytics' && (
            <AnalyticsSection
              company={company}
              onSave={(data) => handleSave('analytics', data)}
              saving={saving}
            />
          )}
          {activeSection === 'google-places' && (
            <GooglePlacesSection
              listings={googlePlacesListings}
              onAdd={addGooglePlaceListing}
              onRemove={removeGooglePlaceListing}
              onUpdate={updateGooglePlaceListing}
              onSave={() => handleSave('google-places', {})}
              saving={saving}
            />
          )}
          {activeSection === 'login-page' && (
            <LoginPageSection
              images={loginPageImages}
              slogans={loginSlogans}
              onImageUpload={handleLoginPageImageUpload}
              onImageRemove={removeLoginPageImage}
              onSloganChange={setLoginSlogans}
              onSave={() => handleSave('login-page', {})}
              saving={saving}
            />
          )}
          {activeSection === 'pricing-settings' && (
            <PricingSettingsManager companyId={companyId} />
          )}
          {activeSection === 'sales-config' && (
            <SalesConfigManager companyId={companyId} />
          )}
          {activeSection === 'discounts' && (
            <DiscountManager companyId={companyId} />
          )}
          {activeSection === 'email-domain' && (
            <EmailDomainManager companyId={companyId} />
          )}
        </div>
      </div>
    </div>
  );
}

// Section Components
function OverviewSection({ company }: { company: Company }) {
  return (
    <div className={styles.section}>
      <h2>Company Overview</h2>
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <h3>Basic Information</h3>
          <p><strong>Name:</strong> {company.name}</p>
          <p><strong>Slug:</strong> {company.slug}</p>
          <p><strong>Login URL:</strong> <a href={`/login/${company.slug}`} target="_blank" rel="noopener noreferrer">/login/{company.slug}</a></p>
          <p><strong>Description:</strong> {company.description || 'Not provided'}</p>
          <p><strong>Created:</strong> {new Date(company.created_at).toLocaleDateString()}</p>
        </div>
        <div className={styles.overviewCard}>
          <h3>Contact</h3>
          <p><strong>Email:</strong> {company.email || 'Not provided'}</p>
          <p><strong>Phone:</strong> {company.phone || 'Not provided'}</p>
          <p><strong>Websites:</strong> {company.website?.length ? `${company.website.length} website(s)` : 'None'}</p>
        </div>
        <div className={styles.overviewCard}>
          <h3>Business</h3>
          <p><strong>Industry:</strong> {company.industry || 'Not specified'}</p>
          <p><strong>Size:</strong> {company.size || 'Not specified'}</p>
        </div>
        <div className={styles.overviewCard}>
          <h3>Analytics</h3>
          <p><strong>GA Property:</strong> {company.ga_property_id || 'Not configured'}</p>
          <p><strong>CallRail:</strong> {company.callrail_api_token ? 'Configured' : 'Not configured'}</p>
        </div>
      </div>
    </div>
  );
}

interface ContactSectionProps {
  company: Company;
  websites: string[];
  onWebsiteAdd: () => void;
  onWebsiteRemove: (index: number) => void;
  onWebsiteUpdate: (index: number, value: string) => void;
  onSave: (data: Partial<Company>) => void;
  saving: boolean;
}

function ContactSection({ 
  company, 
  websites, 
  onWebsiteAdd, 
  onWebsiteRemove, 
  onWebsiteUpdate, 
  onSave, 
  saving 
}: ContactSectionProps) {
  const [formData, setFormData] = useState({
    email: company.email || '',
    phone: company.phone || '',
  });

  return (
    <div className={styles.section}>
      <h2>Contact Information</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}>
        <div className={styles.formGroup}>
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Phone:</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Websites:</label>
          {websites.map((website, index) => (
            <div key={index} className={styles.websiteRow}>
              <input
                type="text"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => onWebsiteUpdate(index, e.target.value)}
                onBlur={(e) => {
                  const normalized = normalizeWebsiteUrl(e.target.value);
                  if (normalized !== e.target.value) {
                    onWebsiteUpdate(index, normalized);
                  }
                }}
              />
              <button type="button" onClick={() => onWebsiteRemove(index)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={onWebsiteAdd} className={styles.addButton}>
            + Add Website
          </button>
        </div>

        <button type="submit" disabled={saving} className={styles.saveButton}>
          {saving ? 'Saving...' : 'Save Contact Info'}
        </button>
      </form>
    </div>
  );
}

interface AddressSectionProps {
  company: Company;
  onSave: (data: Partial<Company>) => void;
  saving: boolean;
}

function AddressSection({ company, onSave, saving }: AddressSectionProps) {
  const [formData, setFormData] = useState({
    address: company.address || '',
    city: company.city || '',
    state: company.state || '',
    zip_code: company.zip_code || '',
    country: company.country || 'United States',
  });

  return (
    <div className={styles.section}>
      <h2>Address Information</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}>
        <div className={styles.formGroup}>
          <label>Address:</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>City:</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label>State:</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label>ZIP Code:</label>
            <input
              type="text"
              value={formData.zip_code}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Country:</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className={styles.saveButton}>
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </form>
    </div>
  );
}

interface BusinessSectionProps {
  company: Company;
  onSave: (data: Partial<Company>) => void;
  saving: boolean;
}

function BusinessSection({ company, onSave, saving }: BusinessSectionProps) {
  const [formData, setFormData] = useState({
    industry: company.industry || '',
    size: company.size || '',
  });
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [businessHours, setBusinessHours] = useState<BusinessHoursData>({
    monday: { start: '09:00', end: '17:00', closed: false },
    tuesday: { start: '09:00', end: '17:00', closed: false },
    wednesday: { start: '09:00', end: '17:00', closed: false },
    thursday: { start: '09:00', end: '17:00', closed: false },
    friday: { start: '09:00', end: '17:00', closed: false },
    saturday: { start: '09:00', end: '17:00', closed: true },
    sunday: { start: '09:00', end: '17:00', closed: true },
  });
  const [loadingTimezone, setLoadingTimezone] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/companies/${company.id}/settings`);
        if (response.ok) {
          const { settings } = await response.json();
          setTimezone(settings.company_timezone?.value || 'America/New_York');

          // Load business hours if they exist
          if (settings.business_hours?.value) {
            setBusinessHours(settings.business_hours.value);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoadingTimezone(false);
      }
    };
    loadSettings();
  }, [company.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save business info
    await onSave(formData);

    // Save timezone and business hours settings separately
    try {
      await fetch(`/api/companies/${company.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            company_timezone: {
              value: timezone,
              type: 'string'
            },
            business_hours: {
              value: businessHours,
              type: 'json'
            }
          }
        }),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className={styles.section}>
      <h2>Business Information</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Industry:</label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Company Size:</label>
          <select
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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
          <label>Company Timezone:</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={loadingTimezone}
          >
            <optgroup label="US Timezones">
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Phoenix">Mountain Time - Arizona (no DST)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
            </optgroup>
            <optgroup label="Other Timezones">
              <option value="UTC">UTC</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Paris">Paris (CET/CEST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
            </optgroup>
          </select>
          <small>This timezone will be used for scheduling tasks and business hours</small>
        </div>

        <div className={styles.formGroup}>
          <BusinessHoursEditor
            businessHours={businessHours}
            onChange={setBusinessHours}
          />
        </div>

        <button type="submit" disabled={saving} className={styles.saveButton}>
          {saving ? 'Saving...' : 'Save Business Info'}
        </button>
      </form>
    </div>
  );
}

interface AnalyticsSectionProps {
  company: Company;
  onSave: (data: Partial<Company>) => void;
  saving: boolean;
}

function AnalyticsSection({ company, onSave, saving }: AnalyticsSectionProps) {
  const [formData, setFormData] = useState({
    ga_property_id: company.ga_property_id || '',
    callrail_api_token: company.callrail_api_token || '',
    callrail_account_id: company.callrail_account_id || '',
  });

  return (
    <div className={styles.section}>
      <h2>Analytics Configuration</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}>
        <div className={styles.formGroup}>
          <label>Google Analytics Property ID:</label>
          <input
            type="text"
            placeholder="e.g., 123456789"
            value={formData.ga_property_id}
            onChange={(e) => setFormData({ ...formData, ga_property_id: e.target.value })}
          />
          <small>Enter the GA4 Property ID (numbers only) to enable analytics dashboard</small>
        </div>

        <div className={styles.formGroup}>
          <label>CallRail API Token:</label>
          <input
            type="password"
            placeholder="Enter CallRail API token"
            value={formData.callrail_api_token}
            onChange={(e) => setFormData({ ...formData, callrail_api_token: e.target.value })}
          />
          <small>Enter your CallRail API token to enable call analytics</small>
        </div>

        <div className={styles.formGroup}>
          <label>CallRail Account ID:</label>
          <input
            type="text"
            placeholder="e.g., ACC28a0b8ba54bf4a1bbc85e8c5bb9aa15d"
            value={formData.callrail_account_id}
            onChange={(e) => setFormData({ ...formData, callrail_account_id: e.target.value })}
          />
          <small>Enter the specific CallRail Account ID (found in CallRail dashboard URL)</small>
        </div>

        <button type="submit" disabled={saving} className={styles.saveButton}>
          {saving ? 'Saving...' : 'Save Analytics Config'}
        </button>
      </form>
    </div>
  );
}

interface GooglePlacesSectionProps {
  listings: GooglePlaceListing[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof GooglePlaceListing, value: any) => void;
  onSave: () => void;
  saving: boolean;
}

function GooglePlacesSection({ 
  listings, 
  onAdd, 
  onRemove, 
  onUpdate, 
  onSave, 
  saving 
}: GooglePlacesSectionProps) {
  return (
    <div className={styles.section}>
      <h2>Google Places Listings</h2>
      <p>Add multiple Google Places listings to aggregate review counts.</p>
      
      {listings.map((listing, index) => (
        <div key={index} className={styles.googlePlaceRow}>
          <input
            type="text"
            placeholder="Google Place ID (e.g., ChIJN1t_tDeuEmsRUsoyG83frY4)"
            value={listing.place_id}
            onChange={(e) => onUpdate(index, 'place_id', e.target.value)}
          />
          <input
            type="text"
            placeholder="Business name (optional)"
            value={listing.place_name || ''}
            onChange={(e) => onUpdate(index, 'place_name', e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={listing.is_primary}
              onChange={(e) => onUpdate(index, 'is_primary', e.target.checked)}
            />
            Primary Location
          </label>
          <button type="button" onClick={() => onRemove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={onAdd} className={styles.addButton}>
        + Add Google Places Listing
      </button>

      <button onClick={onSave} disabled={saving} className={styles.saveButton}>
        {saving ? 'Saving...' : 'Save Google Places'}
      </button>
    </div>
  );
}

interface LoginPageSectionProps {
  images: string[];
  slogans: {
    line1: string;
    line2: string;
    line3: string;
  };
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: (index: number) => void;
  onSloganChange: (slogans: { line1: string; line2: string; line3: string }) => void;
  onSave: () => void;
  saving: boolean;
}

function LoginPageSection({
  images,
  slogans,
  onImageUpload,
  onImageRemove,
  onSloganChange,
  onSave,
  saving
}: LoginPageSectionProps) {
  const handleSloganChange = (field: 'line1' | 'line2' | 'line3', value: string) => {
    onSloganChange({ ...slogans, [field]: value });
  };

  return (
    <div className={styles.section}>
      <h2>Login Page Configuration</h2>
      <p>Configure the images and slogans that will appear on your company&apos;s login page.</p>
      
      {/* Login Page Images */}
      <div className={styles.formGroup}>
        <label>Login Page Images (Maximum 3):</label>
        <div className={styles.imageUploadSection}>
          {images.length < 3 && (
            <div className={styles.uploadControls}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageUpload}
                className={styles.fileInput}
                disabled={saving}
              />
              <small className={styles.uploadHint}>
                Upload images that will be displayed on your login page. Supported formats: JPG, PNG, WebP. Maximum 3 images.
              </small>
            </div>
          )}
          
          {images.length > 0 && (
            <div className={styles.imageGrid}>
              {images.map((image, index) => (
                <div key={index} className={styles.imageItem}>
                  <Image
                    src={image}
                    alt={`Login page image ${index + 1}`}
                    className={styles.imagePreview}
                    width={200}
                    height={150}
                    style={{ objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => onImageRemove(index)}
                    className={styles.removeImageButton}
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {images.length === 0 && (
            <div className={styles.emptyState}>
              <p>No login page images uploaded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Company Slogans */}
      <div className={styles.formGroup}>
        <label>Company Slogans:</label>
        <div className={styles.sloganFields}>
          <div className={styles.sloganField}>
            <label htmlFor="slogan-line1">Slogan Line 1:</label>
            <input
              id="slogan-line1"
              type="text"
              value={slogans.line1}
              onChange={(e) => handleSloganChange('line1', e.target.value)}
              placeholder="Enter your primary slogan (e.g., 'Your Trusted Pest Control Partner')"
              maxLength={60}
              disabled={saving}
            />
            <small>{slogans.line1.length}/60 characters</small>
          </div>
          
          <div className={styles.sloganField}>
            <label htmlFor="slogan-line2">Slogan Line 2:</label>
            <input
              id="slogan-line2"
              type="text"
              value={slogans.line2}
              onChange={(e) => handleSloganChange('line2', e.target.value)}
              placeholder="Enter your secondary slogan (e.g., 'Professional • Reliable • Effective')"
              maxLength={60}
              disabled={saving}
            />
            <small>{slogans.line2.length}/60 characters</small>
          </div>
          
          <div className={styles.sloganField}>
            <label htmlFor="slogan-line3">Slogan Line 3:</label>
            <input
              id="slogan-line3"
              type="text"
              value={slogans.line3}
              onChange={(e) => handleSloganChange('line3', e.target.value)}
              placeholder="Enter your tertiary slogan (e.g., 'Protecting Your Home Since 1995')"
              maxLength={60}
              disabled={saving}
            />
            <small>{slogans.line3.length}/60 characters</small>
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <button onClick={onSave} disabled={saving} className={styles.saveButton}>
          {saving ? 'Saving...' : 'Save Login Page Settings'}
        </button>
      </div>
    </div>
  );
}