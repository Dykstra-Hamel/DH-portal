'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { GlobalHeader } from '../GlobalHeader/GlobalHeader';
import { Sidebar } from '@/components/sidenav/Sidebar';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import {
  PageActionsProvider,
  usePageActions,
} from '@/contexts/PageActionsContext';
import { GlobalLowerHeader } from '../GlobalLowerHeader/GlobalLowerHeader';
import styles from './LayoutWrapper.module.scss';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const { getPageAction, pageHeader } = usePageActions();

  // Define which routes should show the header and sidebar
  const isPublicPage =
    pathname === '/login' ||
    pathname === '/sign-up' ||
    pathname === '/unsubscribe' ||
    pathname.match(/^\/login\/[^\/]+$/);
  const isHomePage = pathname === '/';
  const isQuotePage = pathname.match(/^\/[^\/]+\/quote\/[^\/]+$/);
  const isCampaignLandingPage = pathname.match(/^\/campaign\/[^\/]+\/[^\/]+$/);

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
          title: 'Projects Dashboard',
          description: 'Manage your projects across all phases.',
          showAddButton: false,
          actionButtons: [
            {
              text: 'New Project',
              onClick: getPageAction('add-project') || (() => {}),
            },
            {
              text: 'Create from Template',
              onClick: getPageAction('create-from-template') || (() => {}),
            },
            {
              text: 'New Task',
              onClick: getPageAction('add-task') || (() => {}),
            },
          ],
        };
      case '/project-management/tasks':
        return {
          title: 'Tasks',
          description: 'View and manage all tasks.',
          showAddButton: false,
          actionButtons: [
            {
              text: 'New Task',
              onClick: getPageAction('add-task') || (() => {}),
            },
          ],
        };
      case '/dashboard':
        return {
          title: 'Dashboard',
          description: 'View your business analytics and metrics here.',
          showAddButton: true,
          addButtonText: 'Add Lead',
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
          description: 'View and review all incoming and outgoing call activity and recordings.',
          showAddButton: false,
        };
      case '/tickets/form-submissions':
        return {
          title: 'Form Submissions',
          description: 'Review and manage all incoming form submissions from your website.',
          showAddButton: false,
        };
      case '/settings':
        return {
          title: 'Settings',
          description:
            'Configure your account and application preferences here.',
          showAddButton: false,
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
      case '/admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage system settings and user administration here.',
          showAddButton: false,
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
              description: pageHeader.description,
              showAddButton: false,
              leadAssignmentControls: pageHeader.leadAssignmentControls,
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
        <Sidebar isActive={isSidebarActive} onLinkClick={closeSidebar} />
        <div className={styles.rightContent}>
          <GlobalHeader onMenuToggle={toggleSidebar} />
          {pageConfig && (
            <GlobalLowerHeader
              title={pageConfig.title}
              description={pageConfig.description}
              showAddButton={pageConfig.showAddButton}
              addButtonText={pageConfig.addButtonText}
              onAddClick={
                pageConfig.showAddButton
                  ? getPageAction('add') || undefined
                  : undefined
              }
              actionButtons={pageConfig.actionButtons}
              leadAssignmentControls={pageConfig.leadAssignmentControls}
            />
          )}
          <main className={styles.mainContent}>
            <section className="pageWrapper">{children}</section>
          </main>
        </div>
      </div>
    </div>
  );
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <NavigationProvider>
      <CompanyProvider>
        <PageActionsProvider>
          <LayoutContent>{children}</LayoutContent>
        </PageActionsProvider>
      </CompanyProvider>
    </NavigationProvider>
  );
}
