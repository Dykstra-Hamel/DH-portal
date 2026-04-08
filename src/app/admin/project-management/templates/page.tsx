'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useUser } from '@/hooks/useUser';
import { adminAPI } from '@/lib/api-client';
import TemplateForm from '@/components/ProjectTemplates/TemplateForm/TemplateForm';
import TemplateList from '@/components/ProjectTemplates/TemplateList/TemplateList';
import { ProjectTemplate } from '@/types/project';
import { Search } from 'lucide-react';
import styles from './templates.module.scss';

export default function ProjectTemplatesPage() {
  const router = useRouter();
  const { registerPageAction, setPageHeader } = usePageActions();
  const { profile } = useUser();

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | undefined>();
  const [duplicateTemplate, setDuplicateTemplate] = useState<ProjectTemplate | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectType, setFilterProjectType] = useState<string>('all');
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Admin and project_manager access check
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'project_manager';

  // Redirect non-admins
  useEffect(() => {
    if (profile && !isAdmin) {
      router.push('/dashboard');
    }
  }, [profile, isAdmin, router]);

  // Fetch admin users using the same pattern as other components
  useEffect(() => {
    if (!isAdmin) return;

    adminAPI.getUsers()
      .then(data => {
        const fetchedUsers = Array.isArray(data)
          ? data
          : (data as { users?: any[] })?.users || [];
        setUsers(fetchedUsers);
      })
      .catch(error => {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      });
  }, [isAdmin]);

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: 'Project Templates',
      description: 'Manage project templates with pre-configured tasks',
    });

    return () => setPageHeader(null);
  }, [setPageHeader]);

  // Register page actions
  useEffect(() => {
    registerPageAction('add-template', () => {
      setSelectedTemplate(undefined);
      setDuplicateTemplate(undefined);
      setShowTemplateForm(true);
    });

    return () => {
      // Cleanup handled by PageActionsProvider
    };
  }, [registerPageAction]);

  const handleEditTemplate = (template: ProjectTemplate) => {
    setDuplicateTemplate(undefined);
    setSelectedTemplate(template);
    setShowTemplateForm(true);
  };

  const handleDuplicateTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(undefined);
    setDuplicateTemplate(template);
    setShowTemplateForm(true);
  };

  const handleFormSuccess = () => {
    setShowTemplateForm(false);
    setSelectedTemplate(undefined);
    setDuplicateTemplate(undefined);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormClose = () => {
    setShowTemplateForm(false);
    setSelectedTemplate(undefined);
    setDuplicateTemplate(undefined);
  };

  // Don't render for non-admins
  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Search and Filters */}
      <div className={styles.filtersRow}>
        <div className={styles.searchSection}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className={styles.searchIcon} />
        </div>

        <div className={styles.filterControls}>
          <select
            className={styles.filterSelect}
            value={filterProjectType}
            onChange={(e) => setFilterProjectType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="website">Website</option>
            <option value="social">Social Media</option>
            <option value="email">Email Media</option>
            <option value="print">Print Media</option>
            <option value="vehicle">Vehicle Design</option>
            <option value="digital">Digital Designs</option>
            <option value="ads">Paid Ad Designs</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterIsActive === null ? 'all' : filterIsActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value;
              setFilterIsActive(value === 'all' ? null : value === 'active');
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Template List */}
      <div className={styles.templateListContainer}>
        <TemplateList
          onEdit={handleEditTemplate}
          onDuplicate={handleDuplicateTemplate}
          onRefresh={refreshTrigger}
          searchQuery={searchQuery}
          filterProjectType={filterProjectType}
          filterIsActive={filterIsActive}
        />
      </div>

      {/* Template Form Modal */}
      {showTemplateForm && (
        <TemplateForm
          template={selectedTemplate}
          initialTemplate={duplicateTemplate}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          users={users}
        />
      )}
    </div>
  );
}
