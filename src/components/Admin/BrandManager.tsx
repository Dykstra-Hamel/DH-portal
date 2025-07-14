'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './AdminManager.module.scss';

interface Company {
  id: string;
  name: string;
}

interface ColorInfo {
  hex: string;
  cmyk: string;
  pantone: string;
  name?: string;
}

interface BrandData {
  id?: string;
  company_id: string;
  brand_guidelines?: string;
  brand_strategy?: string;
  personality?: string;
  logo_url?: string;
  logo_description?: string;
  primary_color_hex?: string;
  primary_color_cmyk?: string;
  primary_color_pantone?: string;
  secondary_color_hex?: string;
  secondary_color_cmyk?: string;
  secondary_color_pantone?: string;
  alternative_colors?: ColorInfo[];
  font_primary_name?: string;
  font_primary_example?: string;
  font_primary_url?: string;
  font_secondary_name?: string;
  font_secondary_example?: string;
  font_secondary_url?: string;
  font_tertiary_name?: string;
  font_tertiary_example?: string;
  font_tertiary_url?: string;
  photography_description?: string;
  photography_images?: string[];
}

export default function BrandManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandData = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
        throw error;
      }

      setBrandData(data || {
        company_id: companyId,
        alternative_colors: [],
        photography_images: []
      });
    } catch (error) {
      console.error('Error fetching brand data:', error);
      setMessage({ type: 'error', text: `Failed to load brand data: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    fetchBrandData(company.id);
    setMessage(null);
  };

  const handleInputChange = (field: keyof BrandData, value: string) => {
    setBrandData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleColorChange = (colorType: 'primary' | 'secondary', colorField: 'hex' | 'cmyk' | 'pantone', value: string) => {
    const field = `${colorType}_color_${colorField}` as keyof BrandData;
    setBrandData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const addAlternativeColor = () => {
    setBrandData(prev => {
      if (!prev) return null;
      const newColor: ColorInfo = { hex: '', cmyk: '', pantone: '', name: '' };
      return {
        ...prev,
        alternative_colors: [...(prev.alternative_colors || []), newColor]
      };
    });
  };

  const updateAlternativeColor = (index: number, field: keyof ColorInfo, value: string) => {
    setBrandData(prev => {
      if (!prev || !prev.alternative_colors) return prev;
      const updated = [...prev.alternative_colors];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, alternative_colors: updated };
    });
  };

  const removeAlternativeColor = (index: number) => {
    setBrandData(prev => {
      if (!prev || !prev.alternative_colors) return prev;
      const updated = prev.alternative_colors.filter((_, i) => i !== index);
      return { ...prev, alternative_colors: updated };
    });
  };

  const createAssetPath = (companyName: string, category: string, fileName: string): string => {
    // Create clean company name for folder structure
    const cleanCompanyName = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Clean and timestamp the filename
    const fileExt = fileName.split('.').pop();
    const cleanFileName = fileName
      .replace(`.${fileExt}`, '') // Remove extension temporarily
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase();
    
    const timestamp = Date.now();
    const finalFileName = `${cleanFileName}_${timestamp}.${fileExt}`;

    return `${cleanCompanyName}/${category}/${finalFileName}`;
  };

  const uploadFile = async (file: File, bucket: string, category: string): Promise<string | null> => {
    if (!selectedCompany) return null;

    try {
      const filePath = createAssetPath(selectedCompany.name, category, file.name);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If there's an existing logo, delete it from storage first
    if (brandData?.logo_url) {
      await deleteFileFromStorage(brandData.logo_url);
    }

    const url = await uploadFile(file, 'brand-assets', 'logos');
    if (url) {
      handleInputChange('logo_url', url);
      // Clear the input so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const handlePhotographyUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadPromises = Array.from(files).map(file => uploadFile(file, 'brand-assets', 'photography'));
    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter(url => url !== null) as string[];

    if (validUrls.length > 0) {
      setBrandData(prev => {
        if (!prev) return null;
        const currentImages = prev.photography_images || [];
        return {
          ...prev,
          photography_images: [...currentImages, ...validUrls]
        };
      });
      // Clear the input so the same files can be selected again if needed
      event.target.value = '';
    }
  };

  const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
    try {
      // Extract the file path from the full URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/brand-assets/[path]
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

  const removePhotographyImage = async (indexToRemove: number) => {
    if (!brandData?.photography_images) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }
    
    const imageToDelete = brandData.photography_images[indexToRemove];
    
    // Delete from storage first
    const deleted = await deleteFileFromStorage(imageToDelete);
    
    if (deleted) {
      // Remove from brand data only if storage deletion was successful
      setBrandData(prev => {
        if (!prev || !prev.photography_images) return prev;
        return {
          ...prev,
          photography_images: prev.photography_images.filter((_, index) => index !== indexToRemove)
        };
      });
      setMessage({ type: 'success', text: 'Image deleted successfully' });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete image file from storage' });
    }
  };

  const saveBrandData = async () => {
    if (!brandData || !selectedCompany) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('brands')
        .upsert(brandData);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Brand data saved successfully!' });
      
      // Refresh data
      await fetchBrandData(selectedCompany.id);
    } catch (error) {
      console.error('Error saving brand data:', error);
      setMessage({ type: 'error', text: 'Failed to save brand data' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Brand Management</h2>
        <p>Create and edit brand guidelines for companies</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h3>Companies</h3>
          <div className={styles.list}>
            {companies.map(company => (
              <div
                key={company.id}
                className={`${styles.listItem} ${selectedCompany?.id === company.id ? styles.selected : ''}`}
                onClick={() => handleCompanySelect(company)}
              >
                <span>{company.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.main}>
          {selectedCompany && brandData ? (
            <div className={styles.form}>
              <div className={styles.formHeader}>
                <h3>Brand Guidelines for {selectedCompany.name}</h3>
                <button
                  onClick={saveBrandData}
                  disabled={saving}
                  className={styles.saveButton}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className={styles.formSection}>
                <h4>Brand Guidelines</h4>
                <textarea
                  value={brandData.brand_guidelines || ''}
                  onChange={(e) => handleInputChange('brand_guidelines', e.target.value)}
                  placeholder="Brand guidelines overview..."
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.formSection}>
                <h4>Brand Strategy</h4>
                <textarea
                  value={brandData.brand_strategy || ''}
                  onChange={(e) => handleInputChange('brand_strategy', e.target.value)}
                  placeholder="Brand strategy description..."
                  className={styles.textarea}
                  rows={6}
                />
              </div>

              <div className={styles.formSection}>
                <h4>Personality</h4>
                <textarea
                  value={brandData.personality || ''}
                  onChange={(e) => handleInputChange('personality', e.target.value)}
                  placeholder="Brand personality traits..."
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.formSection}>
                <h4>Logo</h4>
                <div className={styles.logoSection}>
                  <div className={styles.uploadInfo}>
                    <small>Files will be organized: <code>{selectedCompany?.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/logos/</code></small>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className={styles.fileInput}
                  />
                  {brandData.logo_url && (
                    <div className={styles.logoPreview}>
                      <img src={brandData.logo_url} alt="Logo preview" />
                    </div>
                  )}
                  <textarea
                    value={brandData.logo_description || ''}
                    onChange={(e) => handleInputChange('logo_description', e.target.value)}
                    placeholder="Logo description..."
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Colors</h4>
                
                <div className={styles.colorSection}>
                  <h5>Primary Color</h5>
                  <div className={styles.colorInputs}>
                    <input
                      type="color"
                      value={brandData.primary_color_hex || '#000000'}
                      onChange={(e) => handleColorChange('primary', 'hex', e.target.value)}
                      className={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={brandData.primary_color_hex || ''}
                      onChange={(e) => handleColorChange('primary', 'hex', e.target.value)}
                      placeholder="Hex"
                      className={styles.input}
                    />
                    <input
                      type="text"
                      value={brandData.primary_color_cmyk || ''}
                      onChange={(e) => handleColorChange('primary', 'cmyk', e.target.value)}
                      placeholder="CMYK"
                      className={styles.input}
                    />
                    <input
                      type="text"
                      value={brandData.primary_color_pantone || ''}
                      onChange={(e) => handleColorChange('primary', 'pantone', e.target.value)}
                      placeholder="Pantone"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.colorSection}>
                  <h5>Secondary Color</h5>
                  <div className={styles.colorInputs}>
                    <input
                      type="color"
                      value={brandData.secondary_color_hex || '#000000'}
                      onChange={(e) => handleColorChange('secondary', 'hex', e.target.value)}
                      className={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={brandData.secondary_color_hex || ''}
                      onChange={(e) => handleColorChange('secondary', 'hex', e.target.value)}
                      placeholder="Hex"
                      className={styles.input}
                    />
                    <input
                      type="text"
                      value={brandData.secondary_color_cmyk || ''}
                      onChange={(e) => handleColorChange('secondary', 'cmyk', e.target.value)}
                      placeholder="CMYK"
                      className={styles.input}
                    />
                    <input
                      type="text"
                      value={brandData.secondary_color_pantone || ''}
                      onChange={(e) => handleColorChange('secondary', 'pantone', e.target.value)}
                      placeholder="Pantone"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.colorSection}>
                  <div className={styles.sectionHeader}>
                    <h5>Alternative Colors</h5>
                    <button onClick={addAlternativeColor} className={styles.addButton}>
                      Add Color
                    </button>
                  </div>
                  {brandData.alternative_colors?.map((color, index) => (
                    <div key={index} className={styles.alternativeColor}>
                      <div className={styles.colorInputs}>
                        <input
                          type="color"
                          value={color.hex || '#000000'}
                          onChange={(e) => updateAlternativeColor(index, 'hex', e.target.value)}
                          className={styles.colorPicker}
                        />
                        <input
                          type="text"
                          value={color.name || ''}
                          onChange={(e) => updateAlternativeColor(index, 'name', e.target.value)}
                          placeholder="Color name"
                          className={styles.input}
                        />
                        <input
                          type="text"
                          value={color.hex || ''}
                          onChange={(e) => updateAlternativeColor(index, 'hex', e.target.value)}
                          placeholder="Hex"
                          className={styles.input}
                        />
                        <input
                          type="text"
                          value={color.cmyk || ''}
                          onChange={(e) => updateAlternativeColor(index, 'cmyk', e.target.value)}
                          placeholder="CMYK"
                          className={styles.input}
                        />
                        <input
                          type="text"
                          value={color.pantone || ''}
                          onChange={(e) => updateAlternativeColor(index, 'pantone', e.target.value)}
                          placeholder="Pantone"
                          className={styles.input}
                        />
                        <button
                          onClick={() => removeAlternativeColor(index)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Typography</h4>
                
                <div className={styles.fontSection}>
                  <h5>Primary Font</h5>
                  <div className={styles.fontInputs}>
                    <input
                      type="text"
                      value={brandData.font_primary_name || ''}
                      onChange={(e) => handleInputChange('font_primary_name', e.target.value)}
                      placeholder="Font name"
                      className={styles.input}
                    />
                    <input
                      type="url"
                      value={brandData.font_primary_url || ''}
                      onChange={(e) => handleInputChange('font_primary_url', e.target.value)}
                      placeholder="Font URL"
                      className={styles.input}
                    />
                    <textarea
                      value={brandData.font_primary_example || ''}
                      onChange={(e) => handleInputChange('font_primary_example', e.target.value)}
                      placeholder="Example text"
                      className={styles.textarea}
                      rows={2}
                    />
                  </div>
                </div>

                <div className={styles.fontSection}>
                  <h5>Secondary Font</h5>
                  <div className={styles.fontInputs}>
                    <input
                      type="text"
                      value={brandData.font_secondary_name || ''}
                      onChange={(e) => handleInputChange('font_secondary_name', e.target.value)}
                      placeholder="Font name"
                      className={styles.input}
                    />
                    <input
                      type="url"
                      value={brandData.font_secondary_url || ''}
                      onChange={(e) => handleInputChange('font_secondary_url', e.target.value)}
                      placeholder="Font URL"
                      className={styles.input}
                    />
                    <textarea
                      value={brandData.font_secondary_example || ''}
                      onChange={(e) => handleInputChange('font_secondary_example', e.target.value)}
                      placeholder="Example text"
                      className={styles.textarea}
                      rows={2}
                    />
                  </div>
                </div>

                <div className={styles.fontSection}>
                  <h5>Tertiary Font</h5>
                  <div className={styles.fontInputs}>
                    <input
                      type="text"
                      value={brandData.font_tertiary_name || ''}
                      onChange={(e) => handleInputChange('font_tertiary_name', e.target.value)}
                      placeholder="Font name"
                      className={styles.input}
                    />
                    <input
                      type="url"
                      value={brandData.font_tertiary_url || ''}
                      onChange={(e) => handleInputChange('font_tertiary_url', e.target.value)}
                      placeholder="Font URL"
                      className={styles.input}
                    />
                    <textarea
                      value={brandData.font_tertiary_example || ''}
                      onChange={(e) => handleInputChange('font_tertiary_example', e.target.value)}
                      placeholder="Example text"
                      className={styles.textarea}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Photography</h4>
                <textarea
                  value={brandData.photography_description || ''}
                  onChange={(e) => handleInputChange('photography_description', e.target.value)}
                  placeholder="Photography style description..."
                  className={styles.textarea}
                  rows={4}
                />
                
                <div className={styles.photographyUpload}>
                  <h5>Photography Images</h5>
                  <div className={styles.uploadInfo}>
                    <small>Files will be organized: <code>{selectedCompany?.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}/photography/</code></small>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotographyUpload}
                    className={styles.fileInput}
                  />
                  
                  {brandData.photography_images && brandData.photography_images.length > 0 && (
                    <div className={styles.photographyGrid}>
                      {brandData.photography_images.map((image, index) => (
                        <div key={index} className={styles.photographyImageItem}>
                          <img src={image} alt={`Photography ${index + 1}`} className={styles.photographyPreview} />
                          <button
                            type="button"
                            onClick={() => removePhotographyImage(index)}
                            className={styles.removeImageButton}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formFooter}>
                <button
                  onClick={saveBrandData}
                  disabled={saving}
                  className={styles.saveButton}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <a
                  href="/brand"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.previewLink}
                >
                  Preview Brand Page
                </a>
              </div>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <h3>Select a company to manage its brand</h3>
              <p>Choose a company from the list to create or edit its brand guidelines.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}