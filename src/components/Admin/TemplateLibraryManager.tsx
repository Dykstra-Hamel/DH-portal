import React, { useState, useEffect } from 'react';
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
  BarChart3
} from 'lucide-react';
import styles from './TemplateLibraryManager.module.scss';

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

interface TemplateCategories {
  categories: string[];
}

export default function TemplateLibraryManager() {
  const [templates, setTemplates] = useState<LibraryTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategories>({
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LibraryTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<LibraryTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
    is_active: true
  });

  // Sample variables for preview
  const SAMPLE_VARIABLES = {
    customerName: 'John Smith',
    companyName: 'Acme Pest Control',
    pestType: 'ants',
    urgency: 'high',
    address: '123 Main St, Anytown ST 12345',
    companyPhone: '(555) 123-4567'
  };

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchTemplates = async () => {
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
        setMessage(null); // Clear any previous errors
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to fetch templates';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/template-library/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      // Categories fetch failure is not critical, silently continue
    }
  };

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
      is_active: true
    });
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
      is_active: template.is_active
    });
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
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
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

  const extractVariables = (content: string) => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  const replaceVariablesWithSample = (content: string): string => {
    let result = content;
    Object.entries(SAMPLE_VARIABLES).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const handlePreview = (template: LibraryTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleContentChange = (field: 'html_content' | 'text_content' | 'subject_line', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      variables: extractVariables(value + (prev.html_content || '') + (prev.subject_line || ''))
    }));
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.template_category === categoryFilter;
    const matchesFeatured = featuredFilter === 'all' || 
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
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="welcome">Welcome</option>
          <option value="followup">Follow-up</option>
          <option value="quote">Quote</option>
          <option value="reminder">Reminder</option>
          <option value="general">General</option>
        </select>

        <select value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value)}>
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
        {filteredTemplates.map((template) => (
          <div key={template.id} className={styles.templateCard}>
            <div className={styles.templateHeader}>
              <div className={styles.templateMeta}>
                <h3>{template.name}</h3>
                <span className={styles.category}>{template.template_category}</span>
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
                <span>{(template.performance_score * 100).toFixed(0)}% score</span>
              </div>
              <div className={styles.status}>
                <span className={`${styles.statusBadge} ${template.is_active ? styles.active : styles.inactive}`}>
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
                    <strong>Subject:</strong> {replaceVariablesWithSample(previewTemplate.subject_line) || 'No subject line'}
                  </div>
                </div>
                <div className={styles.previewContent}>
                  {previewTemplate.html_content ? (
                    <div 
                      className={styles.htmlPreview}
                      dangerouslySetInnerHTML={{ 
                        __html: replaceVariablesWithSample(previewTemplate.html_content) 
                      }}
                    />
                  ) : previewTemplate.text_content ? (
                    <div className={styles.textPreview}>
                      {replaceVariablesWithSample(previewTemplate.text_content).split('\n').map((line, i) => (
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
              <button onClick={() => setShowPreview(false)} className={styles.cancelButton}>
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
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Template Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter template name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select
                    value={formData.template_category}
                    onChange={(e) => setFormData({...formData, template_category: e.target.value})}
                  >
                    <option value="welcome">Welcome</option>
                    <option value="followup">Follow-up</option>
                    <option value="quote">Quote</option>
                    <option value="reminder">Reminder</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe this template..."
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Subject Line</label>
                  <input
                    type="text"
                    value={formData.subject_line}
                    onChange={(e) => handleContentChange('subject_line', e.target.value)}
                    placeholder="Email subject line with {{variables}}"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>HTML Content</label>
                  <textarea
                    value={formData.html_content}
                    onChange={(e) => handleContentChange('html_content', e.target.value)}
                    placeholder="HTML email content with {{variables}}"
                    rows={8}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Text Content</label>
                  <textarea
                    value={formData.text_content}
                    onChange={(e) => handleContentChange('text_content', e.target.value)}
                    placeholder="Plain text version"
                    rows={6}
                  />
                </div>


                <div className={styles.checkboxes}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    />
                    Featured Template
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    Active
                  </label>
                </div>

                {formData.variables.length > 0 && (
                  <div className={styles.variablesPreview}>
                    <label>Detected Variables:</label>
                    <div className={styles.variablesList}>
                      {formData.variables.map(variable => (
                        <span key={variable} className={styles.variableTag}>
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowEditor(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className={styles.saveButton}
                disabled={!formData.name || !formData.subject_line || !formData.html_content}
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