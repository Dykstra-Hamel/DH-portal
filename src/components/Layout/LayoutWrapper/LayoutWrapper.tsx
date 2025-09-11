'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { GlobalHeader } from '../GlobalHeader/GlobalHeader';
import { Sidebar } from '@/components/sidenav/Sidebar';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { DateFilterProvider } from '@/contexts/DateFilterContext';
import { GlobalLowerHeader } from '../GlobalLowerHeader/GlobalLowerHeader';
import styles from './LayoutWrapper.module.scss';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [isSidebarActive, setIsSidebarActive] = useState(false);

  // Define which routes should show the header and sidebar
  const isPublicPage = pathname === '/login' || pathname === '/sign-up';
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
          showFilter: true,
          showAddLead: true,
        };
      case '/conversations/calls-and-forms':
        return {
          title: 'Calls & Forms',
          description: 'Review, qualify, and assign all your incoming leads here.',
          showFilter: true,
          showAddLead: true,
        };
      case '/customers':
      case '/dashboard/customers':
        return {
          title: 'All Customers',
          description: 'Manage and view all your customer information here.',
          showFilter: false,
          showAddLead: true,
        };
      case '/tickets':
        return {
          title: 'Tickets',
          description: 'Track and manage all support tickets here.',
          showFilter: true,
          showAddLead: false,
        };
      case '/call-records':
        return {
          title: 'Call Records',
          description: 'Review detailed call logs and recordings here.',
          showFilter: true,
          showAddLead: false,
        };
      case '/settings':
        return {
          title: 'Settings',
          description: 'Configure your account and application preferences here.',
          showFilter: false,
          showAddLead: false,
        };
      case '/projects':
        return {
          title: 'Projects',
          description: 'Manage your ongoing projects and tasks here.',
          showFilter: false,
          showAddLead: false,
        };
      case '/brand':
        return {
          title: 'Brand',
          description: 'Customize your brand settings and appearance here.',
          showFilter: false,
          showAddLead: false,
        };
      case '/admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage system settings and user administration here.',
          showFilter: false,
          showAddLead: false,
        };
      case '/conversations/leads':
        return {
          title: 'Leads',
          description: 'View and manage all your sales leads here.',
          showFilter: true,
          showAddLead: true,
        };
      case '/test-automation':
        return {
          title: 'Test Automation',
          description: 'Configure and test automated workflows here.',
          showFilter: false,
          showAddLead: false,
        };
      case '/automation-status':
        return {
          title: 'Automation Status',
          description: 'Monitor the status of your automated processes here.',
          showFilter: false,
          showAddLead: false,
        };
      // Handle individual record pages (hide lower header)
      default:
        if (pathname.includes('/customers/') || 
            pathname.includes('/tickets/') || 
            pathname.includes('/conversations/leads/')) {
          return null; // Don't show lower header on individual record pages
        }
        return {
          title: 'Page',
          description: 'Welcome to this section of the application.',
          showFilter: false,
          showAddLead: false,
        };
    }
  };

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  const pageConfig = getPageConfig();

  return (
    <NavigationProvider>
      <CompanyProvider>
        <DateFilterProvider>
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
                  showFilter={pageConfig.showFilter}
                  showAddLead={pageConfig.showAddLead}
                />
              )}
              <main className={styles.mainContent}>{children}</main>
            </div>
          </div>
          </div>
        </DateFilterProvider>
      </CompanyProvider>
    </NavigationProvider>
  );
}
