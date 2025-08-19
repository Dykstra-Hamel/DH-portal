import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Star,
  Eye,
  Users,
  Activity,
  ChevronRight,
  X,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import styles from './TemplateLibraryBrowser.module.scss';

interface LibraryTemplate {
  id: string;
  name: string;
  description: string;
  template_category: string;
  subject_line: string;
  variables: string[];
  is_featured: boolean;
  usage_count: number;
  performance_score: number;
  created_at: string;
  updated_at: string;
  html_content?: string;
  text_content?: string;
}

interface TemplateCategories {
  categories: string[];
}

interface TemplateLibraryBrowserProps {
  companyId: string;
  companyName?: string;
  onTemplateImported?: (template: any) => void;
}

export default function TemplateLibraryBrowser({ companyId, companyName, onTemplateImported }: TemplateLibraryBrowserProps) {
  const [templates, setTemplates] = useState<LibraryTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategories>({
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<LibraryTemplate | null>(null);
  const [fullPreviewTemplate, setFullPreviewTemplate] = useState<LibraryTemplate | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importingTemplate, setImportingTemplate] = useState<LibraryTemplate | null>(null);
  const [customName, setCustomName] = useState('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (featuredFilter !== 'all') params.set('featured', featuredFilter);

      const response = await fetch(`/api/admin/template-library?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error('Failed to fetch templates');
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, featuredFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      // Use hardcoded categories since the endpoint doesn't exist
      setCategories({
        categories: ['welcome', 'followup', 'quote', 'reminder', 'general']
      });
    } catch (error) {
      console.error('Error setting categories:', error);
      setCategories({ categories: [] });
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, [fetchTemplates, fetchCategories]);


  // Sample variables for preview - similar to EmailTemplateEditor
  const SAMPLE_VARIABLES: Record<string, string> = {
    customerName: 'John Smith',
    companyName: companyName || 'Your Company',
    leadName: 'John Smith',
    leadEmail: 'john.smith@email.com',
    leadPhone: '(555) 123-4567',
    pestType: 'Termites',
    serviceAddress: '123 Main Street, Anytown, ST 12345',
    appointmentDate: 'Thursday, March 15th at 2:00 PM',
    technicianName: 'Mike Johnson',
    estimateAmount: '$299'
  };

  const replaceVariablesWithSample = (content: string): string => {
    let result = content;
    Object.entries(SAMPLE_VARIABLES).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const handlePreview = async (template: LibraryTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
    setLoadingPreview(true);
    
    try {
      // Fetch full template details including HTML content
      const response = await fetch(`/api/admin/template-library/${template.id}`);
      if (response.ok) {
        const data = await response.json();
        setFullPreviewTemplate(data.template);
      } else {
        console.error('Failed to fetch template details');
        setFullPreviewTemplate(template);
      }
    } catch (error) {
      console.error('Error fetching template details:', error);
      setFullPreviewTemplate(template);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImportClick = (template: LibraryTemplate) => {
    setImportingTemplate(template);
    setCustomName(template.name);
    setShowImportDialog(true);
  };

  const handleImport = async () => {
    if (!importingTemplate) return;

    try {
      setImporting(true);
      const response = await fetch(`/api/companies/${companyId}/templates/import/${importingTemplate.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          custom_name: customName !== importingTemplate.name ? customName : null,
          customizations: {}
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Template imported successfully!' });
        setShowImportDialog(false);
        onTemplateImported?.(result.template);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to import template' });
      }
    } catch (error) {
      console.error('Error importing template:', error);
      setMessage({ type: 'error', text: 'Error importing template' });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading template library...</p>
      </div>
    );
  }

  return (
    <div className={styles.templateLibraryBrowser}>
      <div className={styles.header}>
        <div>
          <h3>Template Library</h3>
          <p>Browse and import professional email templates created by our team</p>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories?.categories?.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          )) || []}
        </select>


        <select value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value)}>
          <option value="all">All Templates</option>
          <option value="true">Featured Only</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className={styles.templatesGrid}>
        {templates.map((template) => (
          <div key={template.id} className={styles.templateCard}>
            <div className={styles.templateHeader}>
              <div className={styles.templateMeta}>
                <h4>{template.name}</h4>
                <span className={styles.category}>{template.template_category}</span>
                {template.is_featured && (
                  <Star size={14} className={styles.featuredIcon} />
                )}
              </div>
            </div>

            <p className={styles.description}>{template.description}</p>
            
            <div className={styles.subject}>
              <strong>Subject:</strong> {template.subject_line}
            </div>


            <div className={styles.templateStats}>
              <div className={styles.stat}>
                <Users size={14} />
                <span>{template.usage_count} uses</span>
              </div>
              <div className={styles.stat}>
                <Activity size={14} />
                <span>{(template.performance_score * 100).toFixed(0)}% score</span>
              </div>
            </div>

            <div className={styles.templateActions}>
              <button 
                onClick={() => handlePreview(template)}
                className={styles.previewButton}
              >
                <Eye size={14} />
                Preview
              </button>
              <button 
                onClick={() => handleImportClick(template)}
                className={styles.importButton}
              >
                <Download size={14} />
                Import
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className={styles.emptyState}>
          <Search size={48} />
          <h3>No templates found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Template Preview</h3>
              <button onClick={() => setShowPreview(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.previewContainer}>
                {/* Left side - Template metadata */}
                <div className={styles.previewMeta}>
                  <h4>{previewTemplate.name}</h4>
                  <p className={styles.previewDescription}>{previewTemplate.description}</p>
                  
                  <div className={styles.previewDetails}>
                    <div className={styles.previewDetail}>
                      <strong>Category:</strong> {previewTemplate.template_category}
                    </div>
                    <div className={styles.previewDetail}>
                      <strong>Subject:</strong> {previewTemplate.subject_line}
                    </div>
                  </div>

                  {previewTemplate.variables.length > 0 && (
                    <div className={styles.previewVariables}>
                      <strong>Variables Used:</strong>
                      <div className={styles.variablesList}>
                        {previewTemplate.variables.map(variable => (
                          <span key={variable} className={styles.variableTag}>
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.previewStats}>
                    <div className={styles.stat}>
                      <Users size={16} />
                      <span>Used by {previewTemplate.usage_count} companies</span>
                    </div>
                    <div className={styles.stat}>
                      <Activity size={16} />
                      <span>{(previewTemplate.performance_score * 100).toFixed(0)}% performance score</span>
                    </div>
                  </div>
                </div>

                {/* Right side - HTML email preview */}
                <div className={styles.previewEmail}>
                  <div className={styles.previewEmailHeader}>
                    <h5>Email Preview</h5>
                  </div>
                  
                  {loadingPreview ? (
                    <div className={styles.previewLoading}>
                      <div className={styles.spinner} />
                      <p>Loading email preview...</p>
                    </div>
                  ) : fullPreviewTemplate?.html_content ? (
                    <div className={styles.emailContainer}>
                      <div className={styles.emailSubject}>
                        <strong>Subject:</strong> {replaceVariablesWithSample(fullPreviewTemplate.subject_line)}
                      </div>
                      <div 
                        className={styles.emailContent}
                        dangerouslySetInnerHTML={{ 
                          __html: replaceVariablesWithSample(fullPreviewTemplate.html_content) 
                        }}
                      />
                    </div>
                  ) : fullPreviewTemplate?.text_content ? (
                    <div className={styles.emailContainer}>
                      <div className={styles.emailSubject}>
                        <strong>Subject:</strong> {replaceVariablesWithSample(fullPreviewTemplate.subject_line)}
                      </div>
                      <div className={styles.textContent}>
                        {replaceVariablesWithSample(fullPreviewTemplate.text_content).split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.previewUnavailable}>
                      <p>Email preview not available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowPreview(false)} className={styles.cancelButton}>
                Close
              </button>
              <button 
                onClick={() => {
                  setShowPreview(false);
                  handleImportClick(previewTemplate);
                }}
                className={styles.importButton}
              >
                <Download size={16} />
                Import Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && importingTemplate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Import Template</h3>
              <button onClick={() => setShowImportDialog(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.importSection}>
                <p>Import &quot;{importingTemplate.name}&quot; to your email templates?</p>
                
                <div className={styles.formGroup}>
                  <label>Template Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter custom name (optional)"
                  />
                  <small>Leave as is to use the original name</small>
                </div>

                <div className={styles.importPreview}>
                  <div className={styles.previewDetail}>
                    <strong>Category:</strong> {importingTemplate.template_category}
                  </div>
                  <div className={styles.previewDetail}>
                    <strong>Subject:</strong> {importingTemplate.subject_line}
                  </div>
                  <div className={styles.previewDetail}>
                    <strong>Variables:</strong> {importingTemplate.variables.join(', ') || 'None'}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                onClick={() => setShowImportDialog(false)} 
                className={styles.cancelButton}
                disabled={importing}
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                className={styles.saveButton}
                disabled={importing || !customName.trim()}
              >
                <Save size={16} />
                {importing ? 'Importing...' : 'Import Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}