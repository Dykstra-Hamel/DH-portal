'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
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
  const { getPageAction } = usePageActions();

  // Define which routes should show the header and sidebar
  const isPublicPage =
    pathname === '/login' ||
    pathname === '/sign-up' ||
    pathname.match(/^\/login\/[^\/]+$/);
  const isHomePage = pathname === '/';

  // Pages that should have the full layout (header + sidebar)
  const shouldShowLayout = !isPublicPage && !isHomePage;

  const toggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
  };

  const closeSidebar = () => {
    setIsSidebarActive(false);
  };

  // Configure page-specific lower header props
  const getPageConfig = () => {
    switch (pathname) {
      case '/dashboard':
        return {
          title: 'Dashboard',
          description: 'View your business analytics and metrics here.',
          showAddButton: true,
          addButtonText: 'Add Lead',
        };
      case '/tickets':
      case '/connections/tickets':
      case '/connections/calls-and-forms':
        return {
          title: 'Tickets',
          description:
            'Review, qualify, and assign all your incoming leads here.',
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
      case '/connections/leads':
        return {
          title: 'Leads',
          description: 'View and manage all your sales leads here.',
          showAddButton: true,
          addButtonText: 'Add Lead',
        };
      case '/connections/scheduling':
        return {
          title: 'Scheduling',
          description:
            'Manage all your incoming calls and forms and assign them there.',
          showAddButton: false,
        };
      case '/connections/my-sales-leads':
        return {
          title: 'Leads',
          description: 'View and manage all your sales leads here.',
          showAddButton: true,
          addButtonText: 'Add Lead',
        };
      case '/connections/customer-service':
        return {
          title: 'Customer Service',
          description: 'View and manage all your support cases here.',
          showAddButton: true,
          addButtonText: 'Add Case',
        };
      case '/connections/my-support-cases':
        return {
          title: 'Customer Service',
          description: 'View and manage all your support cases here.',
          showAddButton: true,
          addButtonText: 'Add Case',
        };
      case '/connections/tasks':
        return {
          title: 'Tasks',
          description: 'View and manage all tasks here.',
          showAddButton: true,
          addButtonText: 'Create Task',
        };
      case '/connections/my-tasks':
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
      case '/reports':
        return {
          title: 'Reports',
          description: 'Run detailed record reports here.',
          showAddButton: false,
        };
      // Handle individual record pages (hide lower header)
      default:
        // Show lower header for lead detail pages
        if (pathname.match(/^\/connections\/leads\/[^\/]+$/)) {
          return {
            title: 'Lead Details',
            description: 'View and manage this lead information.',
            showAddButton: false,
          };
        }

        if (
          pathname.includes('/customers/') ||
          pathname.includes('/tickets/')
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
      {/* Mobile Menu Button */}
      <div className="mobileMenuButton" onClick={toggleSidebar}>
        <Menu size={32} />
      </div>

      <div className={styles.contentWrapper}>
        <Sidebar isActive={isSidebarActive} onLinkClick={closeSidebar} />
        <div className={styles.rightContent}>
          <GlobalHeader />
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
