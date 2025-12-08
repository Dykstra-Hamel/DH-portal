'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, Plus, Trash2, Palette } from 'lucide-react';
import styles from './BrandManager.module.scss';
import { useCompany } from '@/contexts/CompanyContext';
import { BrandData, ColorInfo, LogoInfo } from '@/types/branding';
import { Toast } from '@/components/Common/Toast/Toast';
import ColorPickerModal from './ColorPickerModal';

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  icon,
  isExpanded,
  onToggle,
  children,
}) => {
  return (
    <div className={styles.section}>
      <div
        className={`${styles.sectionHeader} ${isExpanded ? styles.expanded : ''}`}
        onClick={onToggle}
      >
        <div className={styles.sectionHeaderContent}>
          <h3>
            {icon && icon}
            {title}
          </h3>
          <ChevronDown
            size={20}
            className={`${styles.chevron} ${isExpanded ? styles.rotated : ''}`}
          />
        </div>
        {description && <p className={styles.sectionDescription}>{description}</p>}
      </div>
      {isExpanded && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
};

export default function BrandManager() {
  // Use global company context
  const { selectedCompany, isLoading: contextLoading } = useCompany();

  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const supabase = createClient();

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    guidelines: true,
    logos: false,
    colors: false,
    fonts: false,
    photography: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchBrandData = useCallback(async (companyId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
        throw error;
      }

      setBrandData(
        data || {
          company_id: companyId,
          alternative_colors: [],
          alternate_logos: [],
          photography_images: [],
        }
      );
    } catch (error) {
      console.error('Error fetching brand data:', error);
      setToastMessage(`Failed to load brand data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch brand data when selected company changes
  useEffect(() => {
    if (!contextLoading && selectedCompany) {
      fetchBrandData(selectedCompany.id);
    } else if (!selectedCompany) {
      setBrandData(null);
    }
  }, [contextLoading, selectedCompany, fetchBrandData]);

  const handleInputChange = (field: keyof BrandData, value: string) => {
    setBrandData(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleColorChange = (
    type: 'primary' | 'secondary',
    field: 'hex' | 'cmyk' | 'pantone',
    value: string
  ) => {
    setBrandData(prev => {
      if (!prev) return null;
      return { ...prev, [`${type}_color_${field}`]: value };
    });
  };

  const addAlternativeColor = () => {
    setBrandData(prev => {
      if (!prev) return null;
      const newColors = prev.alternative_colors || [];
      return {
        ...prev,
        alternative_colors: [...newColors, { name: '', hex: '', cmyk: '', pantone: '' }],
      };
    });
  };

  const updateAlternativeColor = (
    index: number,
    field: keyof ColorInfo,
    value: string
  ) => {
    setBrandData(prev => {
      if (!prev) return null;
      const updated = [...(prev.alternative_colors || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, alternative_colors: updated };
    });
  };

  const removeAlternativeColor = (index: number) => {
    setBrandData(prev => {
      if (!prev) return null;
      const updated = (prev.alternative_colors || []).filter((_, i) => i !== index);
      return { ...prev, alternative_colors: updated };
    });
  };

  const addAlternateLogo = () => {
    setBrandData(prev => {
      if (!prev) return null;
      const newLogos = prev.alternate_logos || [];
      return {
        ...prev,
        alternate_logos: [...newLogos, { name: '', url: '', description: '' }],
      };
    });
  };

  const updateAlternateLogo = (
    index: number,
    field: keyof LogoInfo,
    value: string
  ) => {
    setBrandData(prev => {
      if (!prev) return null;
      const updated = [...(prev.alternate_logos || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, alternate_logos: updated };
    });
  };

  const removeAlternateLogo = async (index: number) => {
    if (!selectedCompany) return;

    const logoUrl = brandData?.alternate_logos?.[index]?.url;
    if (logoUrl) {
      try {
        const path = logoUrl.split('/').pop();
        if (path) {
          await supabase.storage
            .from('brand-assets')
            .remove([`${selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/alternate-logos/${path}`]);
        }
      } catch (error) {
        console.error('Error deleting logo file:', error);
      }
    }

    setBrandData(prev => {
      if (!prev) return null;
      const updated = (prev.alternate_logos || []).filter((_, i) => i !== index);
      return { ...prev, alternate_logos: updated };
    });
  };

  const handleAlternateLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const folderPath = `${selectedCompany.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')}/alternate-logos`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      updateAlternateLogo(index, 'url', urlData.publicUrl);

      setToastMessage('Logo uploaded successfully');
      setToastType('success');
      setToastVisible(true);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage('Failed to upload logo');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const folderPath = `${selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/logos`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('brand-assets').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(filePath);
      handleInputChange('logo_url', urlData.publicUrl);

      setToastMessage('Logo uploaded successfully');
      setToastType('success');
      setToastVisible(true);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage('Failed to upload logo');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const handleIconLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `icon-logo.${fileExt}`;
      const folderPath = `${selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/icon-logos`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('brand-assets').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(filePath);
      handleInputChange('icon_logo_url', urlData.publicUrl);

      setToastMessage('Icon logo uploaded successfully');
      setToastType('success');
      setToastVisible(true);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage('Failed to upload icon logo');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `signature.${fileExt}`;
      const folderPath = `${selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/signature`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('brand-assets').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(filePath);
      handleInputChange('signature_url', urlData.publicUrl);

      setToastMessage('Signature uploaded successfully');
      setToastType('success');
      setToastVisible(true);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage('Failed to upload signature');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const handlePhotographyUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedCompany) return;

    try {
      const uploadPromises = Array.from(files).map(async file => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const folderPath = `${selectedCompany.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')}/photography`;
        const filePath = `${folderPath}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);

      setBrandData(prev => {
        if (!prev) return null;
        const existingImages = prev.photography_images || [];
        return {
          ...prev,
          photography_images: [...existingImages, ...urls],
        };
      });

      setToastMessage('Images uploaded successfully');
      setToastType('success');
      setToastVisible(true);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage('Failed to upload images');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const removePhotographyImage = async (indexToRemove: number) => {
    if (!selectedCompany || !brandData) return;

    const imageUrl = brandData.photography_images?.[indexToRemove];
    if (imageUrl) {
      try {
        const path = imageUrl.split('/').pop();
        if (path) {
          await supabase.storage
            .from('brand-assets')
            .remove([`${selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/photography/${path}`]);
        }
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }

    setBrandData(prev => {
      if (!prev) return null;
      const updatedImages = (prev.photography_images || []).filter(
        (_, index) => index !== indexToRemove
      );
      return { ...prev, photography_images: updatedImages };
    });
  };

  const saveBrandData = async () => {
    if (!brandData || !selectedCompany) return;

    setSaving(true);

    try {
      const { error } = await supabase.from('brands').upsert(brandData);

      if (error) throw error;

      setToastMessage('Brand data saved successfully!');
      setToastType('success');
      setToastVisible(true);

      // Refresh data
      await fetchBrandData(selectedCompany.id);
    } catch (error) {
      console.error('Error saving brand data:', error);
      setToastMessage('Failed to save brand data');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleColorFromPicker = (color: string, colorName?: string) => {
    if (colorName) {
      // Add as alternative color
      addAlternativeColor();
      // Update the newly added color
      setTimeout(() => {
        setBrandData(prev => {
          if (!prev) return null;
          const colors = [...(prev.alternative_colors || [])];
          const lastIndex = colors.length - 1;
          colors[lastIndex] = { ...colors[lastIndex], name: colorName, hex: color };
          return { ...prev, alternative_colors: colors };
        });
      }, 0);
    }
    setToastMessage('Color added!');
    setToastType('success');
    setToastVisible(true);
  };

  if (contextLoading || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Brand Management</h2>
        {selectedCompany && <p>Managing brand for {selectedCompany.name}</p>}
        <small>Use the company dropdown in the header to switch companies.</small>

        {selectedCompany && brandData && (
          <div className={styles.headerActions}>
            <button
              onClick={saveBrandData}
              disabled={saving}
              className={styles.primaryButton}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <a
              href="/brand"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryButton}
            >
              Preview Brand Page
            </a>
          </div>
        )}
      </div>

      {selectedCompany && brandData ? (
        <div>
          {/* Brand Guidelines Section */}
          <CollapsibleSection
            title="Brand Guidelines"
            description="Define your brand strategy, personality, and core guidelines"
            isExpanded={expandedSections.guidelines}
            onToggle={() => toggleSection('guidelines')}
          >
            <div className={styles.formGroup}>
              <label>Brand Guidelines</label>
              <textarea
                value={brandData.brand_guidelines || ''}
                onChange={e => handleInputChange('brand_guidelines', e.target.value)}
                placeholder="Describe your brand guidelines, mission, values, and core principles..."
                rows={5}
              />
              <small>Provide an overview of your brand guidelines</small>
            </div>

            <div className={styles.formGroup}>
              <label>Brand Strategy</label>
              <textarea
                value={brandData.brand_strategy || ''}
                onChange={e => handleInputChange('brand_strategy', e.target.value)}
                placeholder="Outline your brand strategy, positioning, and market approach..."
                rows={6}
              />
              <small>Describe your brand strategy and positioning</small>
            </div>

            <div className={styles.formGroup}>
              <label>Brand Personality</label>
              <textarea
                value={brandData.personality || ''}
                onChange={e => handleInputChange('personality', e.target.value)}
                placeholder="Define your brand personality traits, tone, and character..."
                rows={4}
              />
              <small>List the key personality traits that define your brand</small>
            </div>

            <div className={styles.formGroup}>
              <label>Company Representative Signature</label>
              <small>Upload a signature image to be used on landing pages, emails, etc.</small>
              <div className={styles.fileUploadButton}>
                <span>Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                />
              </div>
              <small>
                Will be saved to: {selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/signature/
              </small>
            </div>

            {brandData.signature_url && brandData.signature_url.trim() && (
              <div className={styles.formGroup}>
                <label>Signature Preview</label>
                <div className={styles.imagePreviewLarge}>
                  <Image
                    src={brandData.signature_url}
                    alt="Signature preview"
                    width={200}
                    height={80}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Signature Description</label>
              <textarea
                value={brandData.signature_description || ''}
                onChange={e => handleInputChange('signature_description', e.target.value)}
                placeholder="Describe how and where this signature should be used..."
                rows={2}
              />
            </div>
          </CollapsibleSection>

          {/* Logos Section */}
          <CollapsibleSection
            title="Logos"
            description="Upload and manage your brand logos and variations"
            isExpanded={expandedSections.logos}
            onToggle={() => toggleSection('logos')}
          >
            {/* Main Logo */}
            <div className={styles.formGroup}>
              <label>Main Logo</label>
              <div className={styles.fileUploadButton}>
                <span>Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </div>
              <small>
                Will be saved to: {selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/logos/
              </small>
            </div>

            {brandData.logo_url && brandData.logo_url.trim() && (
              <div className={styles.formGroup}>
                <label>Logo Preview</label>
                <div className={styles.imagePreviewLarge}>
                  <Image
                    src={brandData.logo_url}
                    alt="Logo preview"
                    width={200}
                    height={200}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Logo Description</label>
              <textarea
                value={brandData.logo_description || ''}
                onChange={e => handleInputChange('logo_description', e.target.value)}
                placeholder="Describe your main logo, its usage, and any specific guidelines..."
                rows={3}
              />
            </div>

            {/* Icon Logo */}
            <div className={styles.formGroup}>
              <label>Icon Logo</label>
              <small>Upload a small icon version of your logo (for favicons, app icons, etc.)</small>
              <div className={styles.fileUploadButton}>
                <span>Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconLogoUpload}
                />
              </div>
              <small>
                Will be saved to: {selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/icon-logos/
              </small>
            </div>

            {brandData.icon_logo_url && brandData.icon_logo_url.trim() && (
              <div className={styles.formGroup}>
                <label>Icon Logo Preview</label>
                <div className={styles.imagePreview}>
                  <Image
                    src={brandData.icon_logo_url}
                    alt="Icon logo preview"
                    width={64}
                    height={64}
                    style={{ maxWidth: '64px', maxHeight: '64px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Icon Logo Description</label>
              <textarea
                value={brandData.icon_logo_description || ''}
                onChange={e => handleInputChange('icon_logo_description', e.target.value)}
                placeholder="Describe your icon logo usage..."
                rows={2}
              />
            </div>

            {/* Alternate Logos */}
            <div className={styles.formGroup}>
              <label>Alternate Logo Variations</label>
              <small>Add different logo variations (horizontal, stacked, white version, etc.)</small>
              <button
                onClick={addAlternateLogo}
                className={styles.addButton}
              >
                <Plus size={16} />
                Add Logo Variation
              </button>
              <div style={{ marginTop: '20px' }}>
              {brandData.alternate_logos?.map((logo, index) => (
                <div key={index} className={styles.arrayItem}>
                  <div className={styles.arrayItemHeader}>
                    <h4>Logo Variation {index + 1}</h4>
                    <button
                      onClick={() => removeAlternateLogo(index)}
                      className={styles.dangerButton}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                      Logo Name
                    </label>
                    <input
                      type="text"
                      value={logo.name || ''}
                      onChange={e => updateAlternateLogo(index, 'name', e.target.value)}
                      placeholder="Logo name (e.g., 'Horizontal', 'Stacked', 'White Version')"
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                      Upload Logo File
                    </label>
                    <div className={styles.fileUploadButton}>
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleAlternateLogoUpload(e, index)}
                      />
                    </div>
                    <small>
                      Will be saved to: {selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/alternate-logos/
                    </small>
                  </div>

                  {logo.url && logo.url.trim() && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                        Logo Preview
                      </label>
                      <div className={styles.imagePreviewLarge}>
                        <Image
                          src={logo.url}
                          alt={`${logo.name || 'Alternate'} logo preview`}
                          width={200}
                          height={200}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                      Description
                    </label>
                    <textarea
                      value={logo.description || ''}
                      onChange={e => updateAlternateLogo(index, 'description', e.target.value)}
                      placeholder="Describe this logo variation and when to use it..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* Colors Section */}
          <CollapsibleSection
            title="Colors"
            description="Define your brand color palette"
            icon={<Palette size={20} />}
            isExpanded={expandedSections.colors}
            onToggle={() => toggleSection('colors')}
          >
            {/* Color Picker Widget Button */}
            <div className={styles.formGroup}>
              <button
                onClick={() => setColorPickerOpen(true)}
                className={styles.secondaryButton}
              >
                <Palette size={16} />
                Open Color Picker Widget
              </button>
              <small>Use the color picker to generate palettes and find complementary colors</small>
            </div>

            {/* Primary Color */}
            <div className={styles.formGroup}>
              <label>Primary Color</label>
              <div className={styles.formRow}>
                <div className={styles.colorInputGroup}>
                  <div
                    className={styles.colorPreview}
                    style={{ backgroundColor: brandData.primary_color_hex || '#000000' }}
                    title="Color preview"
                  />
                  <input
                    type="text"
                    value={brandData.primary_color_hex || ''}
                    onChange={e => handleColorChange('primary', 'hex', e.target.value)}
                    placeholder="Hex (e.g., #3B82F6)"
                  />
                </div>
                <input
                  type="text"
                  value={brandData.primary_color_cmyk || ''}
                  onChange={e => handleColorChange('primary', 'cmyk', e.target.value)}
                  placeholder="CMYK (e.g., 76, 44, 0, 4)"
                />
                <input
                  type="text"
                  value={brandData.primary_color_pantone || ''}
                  onChange={e => handleColorChange('primary', 'pantone', e.target.value)}
                  placeholder="Pantone (e.g., PMS 2935)"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className={styles.formGroup}>
              <label>Secondary Color</label>
              <div className={styles.formRow}>
                <div className={styles.colorInputGroup}>
                  <div
                    className={styles.colorPreview}
                    style={{ backgroundColor: brandData.secondary_color_hex || '#000000' }}
                    title="Color preview"
                  />
                  <input
                    type="text"
                    value={brandData.secondary_color_hex || ''}
                    onChange={e => handleColorChange('secondary', 'hex', e.target.value)}
                    placeholder="Hex (e.g., #1E293B)"
                  />
                </div>
                <input
                  type="text"
                  value={brandData.secondary_color_cmyk || ''}
                  onChange={e => handleColorChange('secondary', 'cmyk', e.target.value)}
                  placeholder="CMYK"
                />
                <input
                  type="text"
                  value={brandData.secondary_color_pantone || ''}
                  onChange={e => handleColorChange('secondary', 'pantone', e.target.value)}
                  placeholder="Pantone"
                />
              </div>
            </div>

            {/* Alternative Colors */}
            <div className={styles.formGroup}>
              <label>Alternative Colors</label>
              <button
                onClick={addAlternativeColor}
                className={styles.addButton}
              >
                <Plus size={16} />
                Add Color
              </button>
              {brandData.alternative_colors?.map((color, index) => (
                <div key={index} className={styles.arrayItem}>
                  <div className={styles.arrayItemHeader}>
                    <h4>Color {index + 1}</h4>
                    <button
                      onClick={() => removeAlternativeColor(index)}
                      className={styles.dangerButton}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.colorInputGroup}>
                      <div
                        className={styles.colorPreview}
                        style={{ backgroundColor: color.hex || '#000000' }}
                        title="Color preview"
                      />
                      <input
                        type="text"
                        value={color.name || ''}
                        onChange={e => updateAlternativeColor(index, 'name', e.target.value)}
                        placeholder="Color name"
                      />
                    </div>
                    <input
                      type="text"
                      value={color.hex || ''}
                      onChange={e => updateAlternativeColor(index, 'hex', e.target.value)}
                      placeholder="Hex"
                    />
                    <input
                      type="text"
                      value={color.cmyk || ''}
                      onChange={e => updateAlternativeColor(index, 'cmyk', e.target.value)}
                      placeholder="CMYK"
                    />
                    <input
                      type="text"
                      value={color.pantone || ''}
                      onChange={e => updateAlternativeColor(index, 'pantone', e.target.value)}
                      placeholder="Pantone"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Fonts Section */}
          <CollapsibleSection
            title="Typography"
            description="Configure your brand fonts and typography"
            isExpanded={expandedSections.fonts}
            onToggle={() => toggleSection('fonts')}
          >
            <small style={{ display: 'block', marginBottom: '20px', color: '#6b7280' }}>
              Provide Google Fonts URLs for easy reference and direct font URLs for loading/displaying fonts.
            </small>

            {/* Primary Font */}
            <div className={styles.formGroup}>
              <label>Primary Font</label>
              <input
                type="text"
                value={brandData.font_primary_name || ''}
                onChange={e => handleInputChange('font_primary_name', e.target.value)}
                placeholder="Font name (e.g., Roboto, Open Sans, Lato)"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Link to the font&apos;s page on Google Fonts</label>
              <input
                type="url"
                value={brandData.font_primary_google_url || ''}
                onChange={e => handleInputChange('font_primary_google_url', e.target.value)}
                placeholder="https://fonts.google.com/specimen/Roboto"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Direct link to font file or embed URL</label>
              <input
                type="url"
                value={brandData.font_primary_url || ''}
                onChange={e => handleInputChange('font_primary_url', e.target.value)}
                placeholder="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Example Text</label>
              <textarea
                value={brandData.font_primary_example || ''}
                onChange={e => handleInputChange('font_primary_example', e.target.value)}
                placeholder="Example text in this font"
                rows={2}
              />
            </div>

            {/* Secondary Font */}
            <div className={styles.formGroup}>
              <label>Secondary Font</label>
              <input
                type="text"
                value={brandData.font_secondary_name || ''}
                onChange={e => handleInputChange('font_secondary_name', e.target.value)}
                placeholder="Font name (e.g., Montserrat, Raleway, Poppins)"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Link to the font&apos;s page on Google Fonts</label>
              <input
                type="url"
                value={brandData.font_secondary_google_url || ''}
                onChange={e => handleInputChange('font_secondary_google_url', e.target.value)}
                placeholder="https://fonts.google.com/specimen/Montserrat"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Direct link to font file or embed URL</label>
              <input
                type="url"
                value={brandData.font_secondary_url || ''}
                onChange={e => handleInputChange('font_secondary_url', e.target.value)}
                placeholder="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Example Text</label>
              <textarea
                value={brandData.font_secondary_example || ''}
                onChange={e => handleInputChange('font_secondary_example', e.target.value)}
                placeholder="Example text in this font"
                rows={2}
              />
            </div>

            {/* Tertiary Font */}
            <div className={styles.formGroup}>
              <label>Tertiary Font (Optional)</label>
              <input
                type="text"
                value={brandData.font_tertiary_name || ''}
                onChange={e => handleInputChange('font_tertiary_name', e.target.value)}
                placeholder="Font name (e.g., Playfair Display, Merriweather)"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Link to the font&apos;s page on Google Fonts</label>
              <input
                type="url"
                value={brandData.font_tertiary_google_url || ''}
                onChange={e => handleInputChange('font_tertiary_google_url', e.target.value)}
                placeholder="https://fonts.google.com/specimen/Playfair+Display"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Direct link to font file or embed URL</label>
              <input
                type="url"
                value={brandData.font_tertiary_url || ''}
                onChange={e => handleInputChange('font_tertiary_url', e.target.value)}
                placeholder="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Example Text</label>
              <textarea
                value={brandData.font_tertiary_example || ''}
                onChange={e => handleInputChange('font_tertiary_example', e.target.value)}
                placeholder="Example text in this font"
                rows={2}
              />
            </div>
          </CollapsibleSection>

          {/* Photography Section */}
          <CollapsibleSection
            title="Photography"
            description="Define your photography style and upload example images"
            isExpanded={expandedSections.photography}
            onToggle={() => toggleSection('photography')}
          >
            <div className={styles.formGroup}>
              <label>Photography Style Description</label>
              <textarea
                value={brandData.photography_description || ''}
                onChange={e => handleInputChange('photography_description', e.target.value)}
                placeholder="Describe your photography style, mood, lighting preferences, composition guidelines..."
                rows={5}
              />
              <small>Provide guidelines for photography style and composition</small>
            </div>

            <div className={styles.formGroup}>
              <label>Photography Examples</label>
              <div className={styles.fileUploadButton}>
                <span>Choose Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotographyUpload}
                />
              </div>
              <small>
                Will be saved to: {selectedCompany.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/photography/
              </small>
              {brandData.photography_images && brandData.photography_images.length > 0 && (
                <div className={styles.formRow}>
                  {brandData.photography_images
                    .filter(image => image && image.trim())
                    .map((image, index) => (
                      <div key={index} className={styles.arrayItem}>
                        <div className={styles.imagePreviewLarge}>
                          <Image
                            src={image}
                            alt={`Photography ${index + 1}`}
                            width={300}
                            height={200}
                            style={{ maxWidth: '100%', height: 'auto', objectFit: 'cover' }}
                          />
                        </div>
                        <button
                          onClick={() => removePhotographyImage(index)}
                          className={styles.dangerButton}
                        >
                          <Trash2 size={16} />
                          Remove Image
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Google Drive Link</label>
              <input
                type="url"
                value={brandData.photography_google_drive_link || ''}
                onChange={e => handleInputChange('photography_google_drive_link', e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
              />
              <small>Link to a Google Drive folder with additional photography resources</small>
            </div>
          </CollapsibleSection>

          {/* Bottom Save Button */}
          <div className={styles.headerActions} style={{ marginTop: '24px' }}>
            <button
              onClick={saveBrandData}
              disabled={saving}
              className={styles.primaryButton}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <a
              href="/brand"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryButton}
            >
              Preview Brand Page
            </a>
          </div>
        </div>
      ) : (
        <div className={styles.placeholder}>
          <h3>No Company Selected</h3>
          <p>
            Please select a company from the dropdown in the header to view and edit its brand guidelines.
          </p>
        </div>
      )}

      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        type={toastType}
        duration={3000}
      />

      {colorPickerOpen && (
        <ColorPickerModal
          onClose={() => setColorPickerOpen(false)}
          onSelectColor={handleColorFromPicker}
        />
      )}
    </div>
  );
}
