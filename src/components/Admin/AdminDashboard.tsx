'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { adminAPI } from '@/lib/api-client';
import { Users, Building, BarChart3, Bot, Settings } from 'lucide-react';
import UsersManager from './UsersManager';
import CompaniesManager from './CompaniesManager';
import UserCompanyManager from './UserCompanyManager';
import BrandManager from './BrandManager';
import ProjectsManager from './ProjectsManager';
import WidgetManager from './WidgetManager';
import CallsManager from './CallsManager';
import PartialLeadsManager from './PartialLeadsManager';
import AttributionAnalytics from './AttributionAnalytics';
import FormAnalytics from './FormAnalytics';
import PestManager from './PestManager';
import TemplateLibraryManager from './TemplateLibraryManager';
import ExecutionManager from '../Automation/ExecutionManager';
import styles from './AdminDashboard.module.scss';

interface AdminDashboardProps {
  user: User;
}

type AdminCategory = 'users' | 'companies' | 'analytics' | 'automation' | 'system';

type UserSubsection = 'users' | 'relationships';
type CompanySubsection = 'companies' | 'projects' | 'brands';
type AnalyticsSubsection = 'attribution' | 'forms' | 'calls' | 'partial-leads';
type AutomationSubsection = 'templates' | 'executions';
type SystemSubsection = 'widgets' | 'pest-management';

type AdminSubsection = UserSubsection | CompanySubsection | AnalyticsSubsection | AutomationSubsection | SystemSubsection;

// Legacy type for backward compatibility during migration
type AdminSection =
  | 'users'
  | 'companies'
  | 'relationships'
  | 'brands'
  | 'projects'
  | 'widgets'
  | 'calls'
  | 'partial-leads'
  | 'attribution-analytics'
  | 'form-analytics'
  | 'pest-management'
  | 'template-library'
  | 'workflow-executions';

interface Company {
  id: string;
  name: string;
}

interface CategoryConfig {
  id: AdminCategory;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  subsections: SubsectionConfig[];
}

interface SubsectionConfig {
  id: AdminSubsection;
  label: string;
  legacySection?: AdminSection; // For mapping to old sections
}

// Configuration for the hierarchical navigation
const ADMIN_CATEGORIES: CategoryConfig[] = [
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    subsections: [
      { id: 'users', label: 'Users', legacySection: 'users' },
      { id: 'relationships', label: 'User-Company Links', legacySection: 'relationships' },
    ],
  },
  {
    id: 'companies',
    label: 'Company Management',
    icon: Building,
    subsections: [
      { id: 'companies', label: 'Companies', legacySection: 'companies' },
      { id: 'projects', label: 'Projects', legacySection: 'projects' },
      { id: 'brands', label: 'Brand Management', legacySection: 'brands' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    subsections: [
      { id: 'attribution', label: 'Attribution Analytics', legacySection: 'attribution-analytics' },
      { id: 'forms', label: 'Form Analytics', legacySection: 'form-analytics' },
      { id: 'calls', label: 'Calls', legacySection: 'calls' },
      { id: 'partial-leads', label: 'Partial Leads', legacySection: 'partial-leads' },
    ],
  },
  {
    id: 'automation',
    label: 'Automation & Templates',
    icon: Bot,
    subsections: [
      { id: 'templates', label: 'Template Library', legacySection: 'template-library' },
      { id: 'executions', label: 'Workflow Executions', legacySection: 'workflow-executions' },
    ],
  },
  {
    id: 'system',
    label: 'System Configuration',
    icon: Settings,
    subsections: [
      { id: 'widgets', label: 'Widget Config', legacySection: 'widgets' },
      { id: 'pest-management', label: 'Pest Management', legacySection: 'pest-management' },
    ],
  },
];

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeCategory, setActiveCategory] = useState<AdminCategory>('users');
  const [activeSubsection, setActiveSubsection] = useState<AdminSubsection>('users');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Helper function to get legacy section for renderSection compatibility
  const getCurrentLegacySection = (): AdminSection => {
    for (const category of ADMIN_CATEGORIES) {
      const subsection = category.subsections.find(sub => sub.id === activeSubsection);
      if (subsection?.legacySection) {
        return subsection.legacySection;
      }
    }
    return 'users'; // fallback
  };

  // Helper function to handle category changes
  const handleCategoryChange = (categoryId: AdminCategory) => {
    setActiveCategory(categoryId);
    // Set to first subsection of the category
    const category = ADMIN_CATEGORIES.find(cat => cat.id === categoryId);
    if (category && category.subsections.length > 0) {
      setActiveSubsection(category.subsections[0].id);
    }
  };

  // Helper function to handle subsection changes
  const handleSubsectionChange = (subsectionId: AdminSubsection) => {
    setActiveSubsection(subsectionId);
    // Update category if needed
    for (const category of ADMIN_CATEGORIES) {
      if (category.subsections.some(sub => sub.id === subsectionId)) {
        setActiveCategory(category.id);
        break;
      }
    }
  };

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await adminAPI.getCompanies();
        setCompanies(companiesData);
        if (companiesData.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(companiesData[0].id);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    };

    loadCompanies();
  }, [selectedCompanyId]);

  const renderSection = () => {
    const currentSection = getCurrentLegacySection();
    switch (currentSection) {
      case 'users':
        return <UsersManager />;
      case 'companies':
        return <CompaniesManager />;
      case 'relationships':
        return <UserCompanyManager />;
      case 'brands':
        return <BrandManager />;
      case 'projects':
        return <ProjectsManager user={user} />;
      case 'widgets':
        return <WidgetManager />;
      case 'calls':
        return <CallsManager />;
      case 'partial-leads':
        return <PartialLeadsManager />;
      case 'attribution-analytics':
        return <AttributionAnalytics />;
      case 'form-analytics':
        return <FormAnalytics />;
      case 'pest-management':
        return <PestManager />;
      case 'template-library':
        return <TemplateLibraryManager />;
      case 'workflow-executions':
        return selectedCompanyId ? <ExecutionManager companyId={selectedCompanyId} /> : <div>Loading...</div>;
      default:
        return <UsersManager />;
    }
  };

  return (
    <div className={styles.adminDashboard}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Welcome, {user.email}</p>
      </div>

      {/* Primary Navigation - Main Categories */}
      <nav className={styles.primaryNavigation}>
        {ADMIN_CATEGORIES.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              className={`${styles.primaryNavButton} ${
                activeCategory === category.id ? styles.active : ''
              }`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <IconComponent size={18} className={styles.navIcon} />
              <span>{category.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Secondary Navigation - Subsections */}
      {(() => {
        const currentCategory = ADMIN_CATEGORIES.find(cat => cat.id === activeCategory);
        if (!currentCategory || currentCategory.subsections.length <= 1) return null;
        
        return (
          <nav className={styles.secondaryNavigation}>
            {currentCategory.subsections.map((subsection) => (
              <button
                key={subsection.id}
                className={`${styles.secondaryNavButton} ${
                  activeSubsection === subsection.id ? styles.active : ''
                }`}
                onClick={() => handleSubsectionChange(subsection.id)}
              >
                {subsection.label}
              </button>
            ))}
          </nav>
        );
      })()}

      {/* Company Selection for Workflow Executions */}
      {activeSubsection === 'executions' && companies.length > 0 && (
        <div className={styles.companySelector}>
          <label htmlFor="company-select">Select Company:</label>
          <select
            id="company-select"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className={styles.companySelect}
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <main className={styles.content}>{renderSection()}</main>
    </div>
  );
}
