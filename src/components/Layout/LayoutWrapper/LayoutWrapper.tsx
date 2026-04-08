'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { GlobalHeader } from '../GlobalHeader/GlobalHeader';
import { Sidebar } from '@/components/sidenav/Sidebar';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { NavigationGuardProvider } from '@/contexts/NavigationGuardContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import {
  PageActionsProvider,
  usePageActions,
} from '@/contexts/PageActionsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { GlobalLowerHeader } from '../GlobalLowerHeader/GlobalLowerHeader';
import { ProjectActionMenu } from '../GlobalLowerHeader/ProjectActionMenu';
import BackToTopButton from '@/components/Common/BackToTopButton/BackToTopButton';
import { Settings, ArrowLeft } from 'lucide-react';
import { WizardProvider } from '@/contexts/WizardContext';
import styles from './LayoutWrapper.module.scss';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const { getPageAction, pageHeader } = usePageActions();

  // Define which routes should show the header and sidebar
  const isPublicPage =
    pathname === '/login' ||
    pathname === '/sign-up' ||
    pathname === '/unsubscribe' ||
    pathname === '/recording' ||
    pathname.match(/^\/login\/[^\/]+$/);
  const isHomePage = pathname === '/';
  const isQuotePage = pathname.match(/^\/[^\/]+\/quote\/[^\/]+$/);
  const isCampaignLandingPage = pathname.match(/^\/campaign\/[^\/]+\/[^\/]+$/);
  const isProjectManagementPage =
    pathname === '/project-management' ||
    pathname === '/admin/project-management';

  const isTechLeadsPage = pathname.startsWith('/tech-leads');
  const isFieldMapPage = pathname.startsWith('/field-map');
  const isFieldOpsPage = pathname.startsWith('/field-ops');
  const isAppShellPage = isTechLeadsPage || isFieldMapPage || isFieldOpsPage;
  const hideSecondarySidebar = isTechLeadsPage || isFieldMapPage;

  // Pages that should have the full layout (header + sidebar)
  const shouldShowLayout =
    !isPublicPage && !isHomePage && !isQuotePage && !isCampaignLandingPage;

  const toggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
  };

  const closeSidebar = () => {
    setIsSidebarActive(false);
  };

  // Configure page-specific lower header props
  const getPageConfig = () => {
    switch (pathname) {
      case '/project-management':
        return {
          title: pageHeader?.title || 'Projects Dashboard',
          description:
            pageHeader?.description ||
            'Manage your projects across all phases.',
          showAddButton: false,
          customActions: (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              {pageHeader?.customActions}
              <ProjectActionMenu
                onNewProjectFromScratch={
                  getPageAction('add-project') || (() => {})
                }
                onNewProjectFromTemplate={
                  getPageAction('create-from-template') || (() => {})
                }
                onNewTaskFromScratch={getPageAction('add-task') || (() => {})}
                onNewTaskFromTemplate={
                  getPageAction('add-task-from-template') || (() => {})
                }
              />
            </div>
          ),
        };
      case '/project-management/tasks':
      case '/admin/project-management/tasks':
        return {
          title: pageHeader?.title || 'Tasks',
          description: pageHeader?.description || 'View and manage all tasks.',
          showAddButton: false,
          actionButtons: [
            {
              text: 'New Task',
              onClick: getPageAction('add-task') || (() => {}),
            },
          ],
          customActions: pageHeader?.customActions,
        };
      case '/dashboard':
        return {
          title: 'Dashboard',
          description: 'View your business analytics and metrics here.',
          showAddButton: true,
          addButtonText: 'Admin Settings',
          addButtonIcon: <Settings size={18} strokeWidth={1.75} />,
          onAddClick: () => router.push('/settings'),
        };
      case '/tickets/dashboard':
        // Use dynamic page header if set (allows user's name in title)
        if (pageHeader) {
          return {
            title: pageHeader.title,
            description: pageHeader.description,
            showAddButton: true,
            addButtonText: 'Add Ticket',
          };
        }
        return {
          title: 'Tickets Dashboard',
          description: '',
          showAddButton: true,
          addButtonText: 'Add Ticket',
        };
      case '/tickets/new':
      case '/tickets/calls-and-forms':
        return {
          title: 'New Tickets',
          description:
            'Review, qualify, and assign all your incoming customer communications here.',
          showAddButton: true,
          addButtonText: 'Add Ticket',
        };
      case '/customers':
        return {
          title: 'All Customers',
          description: 'Manage and view all your customer information here.',
          showAddButton: true,
          addButtonText: 'Add Customer',
        };
      case '/call-records':
        return {
          title: 'Call Records',
          description: 'Review detailed call logs and recordings here.',
          showAddButton: false,
        };
      case '/tickets/call-records':
        return {
          title: 'Call Records',
          description:
            'View and review all incoming and outgoing call activity and recordings.',
          showAddButton: false,
        };
      case '/tickets/form-submissions':
        return {
          title: 'Form Submissions',
          description:
            'Review and manage all incoming form submissions from your website.',
          showAddButton: false,
        };
      case '/settings':
        return {
          title: 'Settings',
          description:
            'Configure your account and application preferences here.',
          showAddButton: true,
          addButtonText: 'Back to Dashboard',
          addButtonIcon: <ArrowLeft size={18} strokeWidth={1.75} />,
          onAddClick: () => router.push('/dashboard'),
        };
      case '/projects':
        return {
          title: 'Projects',
          description: 'Manage your ongoing projects and tasks here.',
          showAddButton: false,
        };
      case '/brand':
        return {
          title: 'Brand',
          description: 'Customize your brand settings and appearance here.',
          showAddButton: false,
        };
      case '/field-map':
        return {
          title: 'Field Map',
          description: "View today's route and start inspections.",
          showAddButton: false,
        };
      case '/field-map/history':
        return {
          title: 'Inspection History',
          description: 'Review completed field map inspections.',
          showAddButton: false,
        };
      case '/field-map/new':
        return null;
      case '/admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage system settings and user administration here.',
          showAddButton: false,
        };
      case '/admin/project-management':
        return {
          title: pageHeader?.title || 'Admin Project Dashboard',
          description:
            pageHeader?.description || 'Internal Project and Task Management',
          showAddButton: false,
          customActions: (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              {pageHeader?.customActions}
              <ProjectActionMenu
                onNewProjectFromScratch={
                  getPageAction('add-project') || (() => {})
                }
                onNewProjectFromTemplate={
                  getPageAction('create-from-template') || (() => {})
                }
                onNewTaskFromScratch={getPageAction('add-task') || (() => {})}
                onNewTaskFromTemplate={
                  getPageAction('add-task-from-template') || (() => {})
                }
              />
            </div>
          ),
        };
      case '/admin/project-management/templates':
        return {
          title: pageHeader?.title || 'Project Templates',
          description:
            pageHeader?.description ||
            'Manage project templates with pre-configured tasks',
          showAddButton: true,
          addButtonText: 'New Template',
          onAddClick: getPageAction('add-template') || (() => {}),
        };
      case '/admin/monthly-services':
        return {
          title: pageHeader?.title || 'Monthly Services',
          description:
            pageHeader?.description ||
            'Track recurring marketing tasks for client companies',
          showAddButton: true,
          addButtonText: 'New Monthly Service',
          onAddClick: getPageAction('add-monthly-service') || (() => {}),
          customActions: pageHeader?.customActions,
        };
      case '/admin/content-calendar':
        return {
          title: pageHeader?.title || 'Content Calendar',
          description:
            pageHeader?.description ||
            'Year-wide view of planned content across all active monthly services',
          showAddButton: false,
          customActions: pageHeader?.customActions ? (
            <div className={styles.customActionsWrapper}>
              {pageHeader.customActions}
            </div>
          ) : undefined,
        };
      case '/tickets/leads':
        return {
          title: 'Leads',
          description: 'View and manage all your sales leads here.',
          showAddButton: true,
          addButtonText: 'Add Lead',
        };
      case '/tickets/scheduling':
        return {
          title: 'Scheduling',
          description:
            'Manage all your incoming calls and forms and assign them there.',
          showAddButton: false,
        };
      case '/tickets/my-sales-leads':
        return {
          title: 'Leads',
          description: 'View and manage all your sales leads here.',
          showAddButton: true,
          addButtonText: 'Add Lead',
        };
      case '/tickets/customer-service':
        return {
          title: 'Customer Service',
          description: 'View and manage all your support cases here.',
          showAddButton: true,
          addButtonText: 'Add Case',
        };
      case '/tickets/my-support-cases':
        return {
          title: 'Customer Service',
          description: 'View and manage all your support cases here.',
          showAddButton: true,
          addButtonText: 'Add Case',
        };
      case '/tickets/tasks':
        return {
          title: 'Tasks',
          description: 'View and manage all tasks here.',
          showAddButton: true,
          addButtonText: 'Create Task',
        };
      case '/tickets/my-tasks':
        return {
          title: 'My Tasks',
          description: 'View and manage your assigned tasks here.',
          showAddButton: true,
          addButtonText: 'Create Task',
        };
      case '/test-automation':
        return {
          title: 'Test Automation',
          description: 'Configure and test automated workflows here.',
          showAddButton: false,
        };
      case '/automation-status':
        return {
          title: 'Automation Status',
          description: 'Monitor the status of your automated processes here.',
          showAddButton: false,
        };
      case '/campaigns':
        return {
          title: 'Campaigns',
          description: 'Manage your outbound marketing campaigns',
          showAddButton: true,
          addButtonText: 'Create Campaign',
        };
      case '/campaigns/contact-lists':
        return {
          title: 'Contact Lists',
          description: 'Manage your contact lists for campaigns',
          showAddButton: true,
          addButtonText: 'Create List',
        };
      case '/reports':
      case '/tickets/reports':
        return {
          title: 'Reports',
          description: 'View detailed record reports here.',
          showAddButton: false,
        };
      case '/tickets/form-submissions':
        return {
          title: 'Form Submissions',
          description: 'View detailed data about your form submissions.',
          showAddButton: false,
        };
      case '/tickets/call-records':
        return {
          title: 'Call Records',
          description: 'View detailed data about all calls.',
          showAddButton: false,
        };
      case '/tickets/archived-leads':
        return {
          title: 'Archived Leads',
          description:
            'View leads that have been marked won, lost, or archived.',
          showAddButton: false,
        };
      // Handle individual record pages (hide lower header)
      default:
        // Show lower header for campaign detail pages
        if (pathname.match(/^\/campaigns\/[^\/]+$/)) {
          // Use dynamic page header if set, otherwise use default
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              description: pageHeader.description,
              showAddButton: false,
            };
          }
          return {
            title: 'Campaign Details',
            description:
              'View campaign performance, manage contacts and leads, and track execution metrics.',
            showAddButton: false,
          };
        }
        // Show lower header for lead detail pages
        if (pathname.match(/^\/tickets\/leads\/[^\/]+$/)) {
          // Use dynamic page header if set, otherwise hide header
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              description: pageHeader.description,
              showAddButton: false,
              leadAssignmentControls: pageHeader.leadAssignmentControls,
              customActions: pageHeader.customActions,
            };
          }
          return null;
        }

        // Show lower header for project detail pages
        if (
          pathname.match(/^\/project-management\/[^\/]+$/) ||
          pathname.match(/^\/admin\/project-management\/[^\/]+$/)
        ) {
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              titleLogo: pageHeader.titleLogo,
              description: pageHeader.description,
              showAddButton: false,
              customActions: pageHeader.customActions,
            };
          }
          return null;
        }

        // Show lower header for monthly service detail pages
        if (pathname.match(/^\/admin\/monthly-services\/[^\/]+$/)) {
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              description: pageHeader.description,
              showAddButton: false,
              customActions: pageHeader.customActions,
            };
          }
          return null;
        }

        // Show lower header for monthly service detail pages
        if (pathname.match(/^\/admin\/monthly-services\/[^\/]+$/)) {
          if (pageHeader) {
            return {
              title: pageHeader.title,
              description: pageHeader.description,
              showAddButton: false,
              customActions: pageHeader.customActions,
            };
          }
          return null;
        }

        // Show lower header for content piece detail pages
        if (pathname.match(/^\/admin\/content-pieces\/[^\/]+$/)) {
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              description: pageHeader.description,
              showAddButton: false,
              customActions: pageHeader.customActions,
            };
          }
          return null;
        }

        // Show lower header for task detail pages
        if (pathname.match(/^\/tickets\/tasks\/[^\/]+$/)) {
          // Use dynamic page header if set, otherwise hide header
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              description: pageHeader.description,
              showAddButton: false,
              customActions: pageHeader.customActions,
            };
          }
          return null;
        }

        // Show lower header for support case detail pages
        if (pathname.match(/^\/tickets\/customer-service\/[^\/]+$/)) {
          // Use dynamic page header if set, otherwise hide header
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              description: pageHeader.description,
              showAddButton: false,
              supportCaseAssignmentControls:
                pageHeader.supportCaseAssignmentControls,
            };
          }
          return null;
        }

        // Show lower header for customer detail pages
        if (pathname.match(/^\/customers\/[^\/]+$/)) {
          // Use dynamic page header if set, otherwise use default
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              description: pageHeader.description,
              showAddButton: true,
              addButtonText: 'Open Tickets',
            };
          }
          return {
            title: 'Customer Details',
            description: 'View and manage this customer information.',
            showAddButton: true,
            addButtonText: 'Open Tickets',
          };
        }

        if (
          pathname.includes('/customers/') ||
          pathname.includes('/tickets/new/')
        ) {
          return null; // Don't show lower header on individual record pages
        }

        // Handle other customer sub-paths
        if (
          pathname.startsWith('/customers/') &&
          !pathname.match(/\/customers\/[^\/]+$/)
        ) {
          return {
            title: 'Customers',
            description: 'Manage and view all your customer information here.',
            showAddButton: true,
            addButtonText: 'Add Customer',
          };
        }

        // Show lower header for company detail pages
        if (pathname.match(/^\/admin\/companies\/[^\/]+$/)) {
          if (pageHeader) {
            return {
              title: pageHeader.title,
              titleLeading: pageHeader.titleLeading,
              description: pageHeader.description,
              showAddButton: false,
            };
          }
          return null;
        }
        if (pathname.match(/^\/field-map\/service\/[^\/]+\/wizard$/)) {
          return null;
        }

        return {
          title: 'Page',
          description: 'Welcome to this section of the application.',
          showAddButton: false,
        };
    }
  };

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  const pageConfig = getPageConfig();

  return (
    <div className={styles.layoutWrapper}>
      <div className={styles.contentWrapper}>
        <Sidebar isActive={isSidebarActive} onLinkClick={closeSidebar} hideSecondary={hideSecondarySidebar} />
        <div className={styles.rightContent}>
          <GlobalHeader onMenuToggle={toggleSidebar} />
          {!isAppShellPage && pageConfig && (
            <GlobalLowerHeader
              title={pageConfig.title}
              titleLeading={
                'titleLeading' in pageConfig
                  ? pageConfig.titleLeading
                  : undefined
              }
              titleLogo={
                'titleLogo' in pageConfig ? pageConfig.titleLogo : undefined
              }
              description={pageConfig.description}
              showAddButton={pageConfig.showAddButton}
              addButtonText={pageConfig.addButtonText}
              addButtonIcon={pageConfig.addButtonIcon}
              onAddClick={
                pageConfig.showAddButton
                  ? pageConfig.onAddClick || getPageAction('add') || undefined
                  : undefined
              }
              actionButtons={pageConfig.actionButtons}
              leadAssignmentControls={pageConfig.leadAssignmentControls}
              supportCaseAssignmentControls={
                pageConfig.supportCaseAssignmentControls
              }
              customActions={pageConfig.customActions}
            />
          )}
          <main
            className={[
              styles.mainContent,
              isProjectManagementPage ? styles.projectManagementMainContent : '',
              isAppShellPage ? styles.techLeadsMainContent : '',
            ].filter(Boolean).join(' ')}
            data-scroll-container="main"
          >
            <section
              className={`pageWrapper ${
                isProjectManagementPage
                  ? styles.projectManagementPageWrapper
                  : isAppShellPage
                  ? styles.techLeadsPageWrapper
                  : ''
              }`}
            >
              {children}
            </section>
          </main>
          <BackToTopButton />
        </div>
      </div>
    </div>
  );
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <NavigationGuardProvider>
      <NavigationProvider>
        <CompanyProvider>
          <NotificationProvider>
            <PageActionsProvider>
              <WizardProvider>
                <LayoutContent>{children}</LayoutContent>
              </WizardProvider>
            </PageActionsProvider>
          </NotificationProvider>
        </CompanyProvider>
      </NavigationProvider>
    </NavigationGuardProvider>
  );
}
