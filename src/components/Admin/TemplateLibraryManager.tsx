import React, { useState, useEffect, useCallback } from 'react';
import { createSampleVariables, replaceVariablesWithSample, extractVariables } from '@/lib/email/variables';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Eye,
  Download,
  Search,
  Filter,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  Activity,
  BarChart3,
  Code,
  Type,
  Mail,
} from 'lucide-react';
import styles from './TemplateLibraryManager.module.scss';

// Quote-specific variables that should only show for quote templates
const QUOTE_VARIABLES = [
  'quoteUrl',
  'quoteId',
  'quoteTotalInitialPrice',
  'quoteTotalRecurringPrice',
  'quoteLineItems',
  'quotePestConcerns',
  'quoteHomeSize',
  'quoteYardSize',
];

interface LibraryTemplate {
  id: string;
  name: string;
  description: string;
  template_category: string;
  subject_line: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_featured: boolean;
  is_active: boolean;
  usage_count: number;
  performance_score: number;
  created_at: string;
  updated_at: string;
}

export default function TemplateLibraryManager() {
  const [templates, setTemplates] = useState<LibraryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<LibraryTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] =
    useState<LibraryTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'preview'>('html');
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_category: 'welcome',
    subject_line: '',
    html_content: '',
    text_content: '',
    variables: [] as string[],
    is_featured: false,
    is_active: true,
  });

  // Use shared sample variables
  const sampleVariables = createSampleVariables();

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
        setTemplates(data.templates);
      } else {
        console.error('Failed to fetch templates');
        setMessage({ type: 'error', text: 'Failed to load templates' });
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setMessage({ type: 'error', text: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, featuredFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    // Detect variables whenever content changes
    const variables = extractVariables(
      formData.html_content + ' ' + formData.text_content + ' ' + formData.subject_line
    );
    setDetectedVariables(variables);
  }, [formData.html_content, formData.text_content, formData.subject_line]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      template_category: 'welcome',
      subject_line: '',
      html_content: '',
      text_content: '',
      variables: [],
      is_featured: false,
      is_active: true,
    });
    setActiveTab('html');
    setShowEditor(true);
  };

  const handleEdit = (template: LibraryTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      template_category: template.template_category,
      subject_line: template.subject_line,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables,
      is_featured: template.is_featured,
      is_active: template.is_active,
    });
    setActiveTab('html');
    setShowEditor(true);
  };

  const handleSave = async () => {
    try {
      const url = editingTemplate
        ? `/api/admin/template-library/${editingTemplate.id}`
        : '/api/admin/template-library';

      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        setShowEditor(false);
        fetchTemplates();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving template' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/template-library/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        fetchTemplates();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting template' });
    }
  };


  const handlePreview = (template: LibraryTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const insertVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;

    if (activeTab === 'html') {
      const textarea = document.getElementById('html-content') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          formData.html_content.substring(0, start) +
          placeholder +
          formData.html_content.substring(end);
        handleContentChange('html_content', newContent);

        // Restore cursor position
        setTimeout(() => {
          textarea.setSelectionRange(
            start + placeholder.length,
            start + placeholder.length
          );
          textarea.focus();
        }, 0);
      }
    } else if (activeTab === 'text') {
      const textarea = document.getElementById('text-content') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          formData.text_content.substring(0, start) +
          placeholder +
          formData.text_content.substring(end);
        handleContentChange('text_content', newContent);

        // Restore cursor position
        setTimeout(() => {
          textarea.setSelectionRange(
            start + placeholder.length,
            start + placeholder.length
          );
          textarea.focus();
        }, 0);
      }
    }
  };

  const handleContentChange = (
    field: 'html_content' | 'text_content' | 'subject_line',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      variables: extractVariables(
        value + (prev.html_content || '') + (prev.subject_line || '')
      ),
    }));
  };


  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || template.template_category === categoryFilter;
    const matchesFeatured =
      featuredFilter === 'all' ||
      (featuredFilter === 'true' && template.is_featured) ||
      (featuredFilter === 'false' && !template.is_featured);

    return matchesSearch && matchesCategory && matchesFeatured;
  });

  if (loading) {
    return <div className={styles.loading}>Loading template library...</div>;
  }

  return (
    <div className={styles.templateLibraryManager}>
      <div className={styles.header}>
        <div>
          <h2>Template Library Management</h2>
          <p>Manage global email templates that all companies can access</p>
        </div>
        <button className={styles.createButton} onClick={handleCreate}>
          <Plus size={16} />
          Create Template
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
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
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="welcome">Welcome</option>
          <option value="welcome">Service Request</option>
          <option value="followup">Follow-up</option>
          <option value="quote">Quote</option>
          <option value="reminder">Reminder</option>
          <option value="general">General</option>
        </select>

        <select
          value={featuredFilter}
          onChange={e => setFeaturedFilter(e.target.value)}
        >
          <option value="all">All Templates</option>
          <option value="true">Featured Only</option>
          <option value="false">Regular Templates</option>
        </select>

        <button onClick={fetchTemplates} className={styles.refreshButton}>
          <Filter size={16} />
          Refresh
        </button>
      </div>

      {/* Templates Grid */}
      <div className={styles.templatesGrid}>
        {filteredTemplates.map(template => (
          <div key={template.id} className={styles.templateCard}>
            <div className={styles.templateHeader}>
              <div className={styles.templateMeta}>
                <h3>{template.name}</h3>
                <span className={styles.category}>
                  {template.template_category}
                </span>
                {template.is_featured && (
                  <Star size={14} className={styles.featuredIcon} />
                )}
              </div>
              <div className={styles.templateActions}>
                <button onClick={() => handleEdit(template)} title="Edit">
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  className={styles.deleteButton}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <p className={styles.description}>{template.description}</p>

            <div className={styles.subject}>
              <strong>Subject:</strong> {template.subject_line}
            </div>

            <div className={styles.templateActions}>
              <button onClick={() => handlePreview(template)} title="Preview">
                <Eye size={14} />
              </button>
            </div>

            <div className={styles.templateStats}>
              <div className={styles.stat}>
                <Users size={14} />
                <span>{template.usage_count} uses</span>
              </div>
              <div className={styles.stat}>
                <Activity size={14} />
                <span>
                  {(template.performance_score * 100).toFixed(0)}% score
                </span>
              </div>
              <div className={styles.status}>
                <span
                  className={`${styles.statusBadge} ${template.is_active ? styles.active : styles.inactive}`}
                >
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className={styles.emptyState}>
          <BarChart3 size={48} />
          <h3>No templates found</h3>
          <p>Create your first template or adjust your filters</p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Preview: {previewTemplate.name}</h3>
              <button onClick={() => setShowPreview(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.previewContainer}>
                <div className={styles.previewHeader}>
                  <div className={styles.previewSubject}>
                    <strong>Subject:</strong>{' '}
                    {replaceVariablesWithSample(previewTemplate.subject_line, sampleVariables) ||
                      'No subject line'}
                  </div>
                </div>
                <div className={styles.previewContent}>
                  {previewTemplate.html_content ? (
                    <div
                      className={styles.htmlPreview}
                      dangerouslySetInnerHTML={{
                        __html: replaceVariablesWithSample(
                          previewTemplate.html_content,
                          sampleVariables
                        ),
                      }}
                    />
                  ) : previewTemplate.text_content ? (
                    <div className={styles.textPreview}>
                      {replaceVariablesWithSample(previewTemplate.text_content, sampleVariables)
                        .split('\n')
                        .map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                    </div>
                  ) : (
                    <div className={styles.emptyPreview}>
                      <Eye size={48} />
                      <p>No content to preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowPreview(false)}
                className={styles.cancelButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
              <button onClick={() => setShowEditor(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.editorLayout}>
                {/* Left Panel - Form and Variables */}
                <div className={styles.leftPanel}>
                  <div className={styles.formSection}>
                    <h4>Basic Information</h4>
                    
                    <div className={styles.formGroup}>
                      <label>Template Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter template name"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <select
                        value={formData.template_category}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            template_category: e.target.value,
                          })
                        }
                      >
                        <option value="welcome">Welcome</option>
                        <option value="service_request">Service Request</option>
                        <option value="followup">Follow-up</option>
                        <option value="quote">Quote</option>
                        <option value="reminder">Reminder</option>
                        <option value="general">General</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              is_featured: e.target.checked,
                            })
                          }
                        />
                        Featured Template
                      </label>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Description</label>
                      <textarea
                        value={formData.description}
                        onChange={e =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Describe this template..."
                        rows={2}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Subject Line *</label>
                      <input
                        type="text"
                        value={formData.subject_line}
                        onChange={e =>
                          handleContentChange('subject_line', e.target.value)
                        }
                        placeholder="Email subject line with {{variables}}"
                      />
                    </div>

                    <div className={styles.checkboxSection}>
                      <div className={styles.formGroup}>
                        <label className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                is_active: e.target.checked,
                              })
                            }
                          />
                          Active (template can be used)
                        </label>
                      </div>
                    </div>

                  </div>

                  {/* Variables Sidebar */}
                  <div className={styles.variablesSection}>
                    <h4>Variables</h4>

                    {/* Common Variables - filtered to exclude quote variables */}
                    <div className={styles.variableGroup}>
                      <h5>Common Variables</h5>
                      {Object.keys(createSampleVariables())
                        .filter(variable => !QUOTE_VARIABLES.includes(variable))
                        .map(variable => (
                          <button
                            key={variable}
                            className={styles.variableButton}
                            onClick={() => insertVariable(variable)}
                            title={`Insert ${'{{'}${variable}${'}}'}`}
                          >
                            {variable}
                          </button>
                        ))}
                    </div>

                    {/* Quote Variables - only show for quote templates */}
                    {formData.template_category === 'quote' && (
                      <div className={styles.variableGroup}>
                        <h5>Quote Variables</h5>
                        {QUOTE_VARIABLES.map(variable => (
                          <button
                            key={variable}
                            className={styles.variableButton}
                            onClick={() => insertVariable(variable)}
                            title={`Insert ${'{{'}${variable}${'}}'}`}
                          >
                            {variable}
                          </button>
                        ))}
                      </div>
                    )}

                    {detectedVariables.length > 0 && (
                      <div className={styles.variableGroup}>
                        <h5>Detected Variables</h5>
                        {detectedVariables.map(variable => (
                          <div key={variable} className={styles.detectedVariable}>
                            {`{{${variable}}}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Content Editor and Preview */}
                <div className={styles.rightPanel}>
                  <div className={styles.contentHeader}>
                    <h4>Email Content</h4>
                    <div className={styles.contentTabs}>
                      <button
                        className={`${styles.tab} ${activeTab === 'html' ? styles.active : ''}`}
                        onClick={() => setActiveTab('html')}
                      >
                        <Code size={16} />
                        HTML
                      </button>
                      <button
                        className={`${styles.tab} ${activeTab === 'text' ? styles.active : ''}`}
                        onClick={() => setActiveTab('text')}
                      >
                        <Type size={16} />
                        Text
                      </button>
                      <button
                        className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
                        onClick={() => setActiveTab('preview')}
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                    </div>
                  </div>

                  <div className={styles.contentEditor}>
                    {activeTab === 'html' && (
                      <textarea
                        id="html-content"
                        className={styles.contentTextarea}
                        value={formData.html_content}
                        onChange={e =>
                          handleContentChange('html_content', e.target.value)
                        }
                        placeholder="Enter HTML content here... Use {{variable_name}} for dynamic content."
                        rows={20}
                      />
                    )}

                    {activeTab === 'text' && (
                      <textarea
                        id="text-content"
                        className={styles.contentTextarea}
                        value={formData.text_content}
                        onChange={e =>
                          handleContentChange('text_content', e.target.value)
                        }
                        placeholder="Enter plain text content here... Use {{variable_name}} for dynamic content."
                        rows={20}
                      />
                    )}

                    {activeTab === 'preview' && (
                      <div className={styles.previewContainer}>
                        <div className={styles.previewHeader}>
                          <div className={styles.previewSubject}>
                            <Mail size={16} />
                            <strong>Subject:</strong>{' '}
                            {replaceVariablesWithSample(formData.subject_line, sampleVariables) ||
                              'No subject line'}
                          </div>
                        </div>
                        <div className={styles.previewContent}>
                          {formData.html_content ? (
                            <div
                              className={styles.htmlPreview}
                              dangerouslySetInnerHTML={{
                                __html: replaceVariablesWithSample(
                                  formData.html_content,
                                  sampleVariables
                                ),
                              }}
                            />
                          ) : formData.text_content ? (
                            <div className={styles.textPreview}>
                              {replaceVariablesWithSample(formData.text_content, sampleVariables)
                                .split('\n')
                                .map((line, i) => (
                                  <p key={i}>{line}</p>
                                ))}
                            </div>
                          ) : (
                            <div className={styles.emptyPreview}>
                              <Mail size={48} />
                              <p>Add content to see preview</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowEditor(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={styles.saveButton}
                disabled={
                  !formData.name ||
                  !formData.subject_line ||
                  (!formData.html_content && !formData.text_content)
                }
              >
                <Save size={16} />
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
