'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mails } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCurrentUserPageAccess } from '@/hooks/useUserDepartments';
import { useRealtimeCounts } from '@/hooks/useRealtimeCounts';
import styles from './secondarySidenav.module.scss';

// Simple RedDot component for new item indicators
const RedDot = () => <div className={styles.redDot} />;

// Icon components for Records & Reports section
const ReportsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 19"
    fill="none"
  >
    <path
      d="M9 12.25V16M12 10.75V16M15 7.75V16M16.5 2.5L10.0155 8.9845C9.98067 9.01942 9.93928 9.04713 9.89372 9.06603C9.84817 9.08494 9.79933 9.09467 9.75 9.09467C9.70067 9.09467 9.65183 9.08494 9.60628 9.06603C9.56072 9.04713 9.51933 9.01942 9.4845 8.9845L7.0155 6.5155C6.94518 6.4452 6.84981 6.4057 6.75037 6.4057C6.65094 6.4057 6.55557 6.4452 6.48525 6.5155L1.5 11.5M3 13.75V16M6 10.75V16"
      stroke="#6A7282"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CallsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 19"
    fill="none"
  >
    <path
      d="M3 6.75V15C3 15.3978 3.15804 15.7794 3.43934 16.0607C3.72064 16.342 4.10218 16.5 4.5 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V6.75M7.5 9.75H10.5M2.25 3H15.75C16.1642 3 16.5 3.33579 16.5 3.75V6C16.5 6.41421 16.1642 6.75 15.75 6.75H2.25C1.83579 6.75 1.5 6.41421 1.5 6V3.75C1.5 3.33579 1.83579 3 2.25 3Z"
      stroke="#6A7282"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CustomerLibraryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 19"
    fill="none"
  >
    <path
      d="M12 1.75V3.25M13.4363 16.75C13.4363 15.5565 12.9621 14.4119 12.1182 13.568C11.2743 12.7241 10.1297 12.25 8.93625 12.25C7.74278 12.25 6.59818 12.7241 5.75427 13.568C4.91036 14.4119 4.43625 15.5565 4.43625 16.75M6 1.75V3.25M12 9.25C12 10.9069 10.6569 12.25 9 12.25C7.34315 12.25 6 10.9069 6 9.25C6 7.59315 7.34315 6.25 9 6.25C10.6569 6.25 12 7.59315 12 9.25ZM3.75 3.25H14.25C15.0784 3.25 15.75 3.92157 15.75 4.75V15.25C15.75 16.0784 15.0784 16.75 14.25 16.75H3.75C2.92157 16.75 2.25 16.0784 2.25 15.25V4.75C2.25 3.92157 2.92157 3.25 3.75 3.25Z"
      stroke="#6A7282"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface SidebarProps {
  collapsed?: boolean;
  isActive?: boolean;
  onLinkClick?: () => void;
}

interface NavItem {
  text: string;
  href: string;
  count?: number;
  disabled?: boolean;
  countColor?: 'default' | 'error';
  countType?: string; // For animation tracking
  hasNewItems?: boolean; // For red count badge (My sections)
  showRedDot?: boolean; // For red dot indicator (main sections)
  icon?: React.ReactNode; // Optional icon for navigation items
}

interface NavGroup {
  title?: string;
  showDivider?: boolean;
  items: NavItem[];
}

export function SecondarySideNav({
  collapsed = false,
  isActive = false,
  onLinkClick,
}: SidebarProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  const pathname = usePathname();
  const { activePrimaryNav } = useNavigation();
  const { selectedCompany, isAdmin } = useCompany();
  const {
    counts,
    animations,
    newItemIndicators,
    loading: loadingCounts,
    clearNewItemIndicator,
  } = useRealtimeCounts();
  const isPublicPage = pathname === '/login' || pathname === '/sign-up';

  // Always call hooks (React requirement), but prioritize admin status
  const { hasAccess: hasSalesAccess } = useCurrentUserPageAccess('sales');
  const { hasAccess: hasSchedulingAccess } =
    useCurrentUserPageAccess('scheduling');
  const { hasAccess: hasSupportAccess } = useCurrentUserPageAccess('support');

  // Global admins see everything, otherwise check department access
  const shouldShowSales = isAdmin || hasSalesAccess;
  const shouldShowScheduling = isAdmin || hasSchedulingAccess;
  const shouldShowSupport = isAdmin || hasSupportAccess;

  // Handle client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Handle navigation click to clear new item indicators
  const handleNavClick = useCallback(
    (countType?: string) => {
      if (countType) {
        clearNewItemIndicator(countType);
      }
      onLinkClick?.();
    },
    [clearNewItemIndicator, onLinkClick]
  );

  // Get the icon for the current primary nav
  const getPrimaryNavIcon = () => {
    switch (activePrimaryNav) {
      case 'dashboard':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 3H4C3.44772 3 3 3.44772 3 4V11C3 11.5523 3.44772 12 4 12H9C9.55228 12 10 11.5523 10 11V4C10 3.44772 9.55228 3 9 3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 3H15C14.4477 3 14 3.44772 14 4V7C14 7.55229 14.4477 8 15 8H20C20.5523 8 21 7.55229 21 7V4C21 3.44772 20.5523 3 20 3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 12H15C14.4477 12 14 12.4477 14 13V20C14 20.5523 14.4477 21 15 21H20C20.5523 21 21 20.5523 21 20V13C21 12.4477 20.5523 12 20 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 16H4C3.44772 16 3 16.4477 3 17V20C3 20.5523 3.44772 21 4 21H9C9.55228 21 10 20.5523 10 20V17C10 16.4477 9.55228 16 9 16Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'tickets':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M3 11H6C6.53043 11 7.03914 11.2107 7.41421 11.5858C7.78929 11.9609 8 12.4696 8 13V16C8 16.5304 7.78929 17.0391 7.41421 17.4142C7.03914 17.7893 6.53043 18 6 18H5C4.46957 18 3.96086 17.7893 3.58579 17.4142C3.21071 17.0391 3 16.5304 3 16V11ZM3 11C3 9.8181 3.23279 8.64778 3.68508 7.55585C4.13738 6.46392 4.80031 5.47177 5.63604 4.63604C6.47177 3.80031 7.46392 3.13738 8.55585 2.68508C9.64778 2.23279 10.8181 2 12 2C13.1819 2 14.3522 2.23279 15.4442 2.68508C16.5361 3.13738 17.5282 3.80031 18.364 4.63604C19.1997 5.47177 19.8626 6.46392 20.3149 7.55585C20.7672 8.64778 21 9.8181 21 11M21 11V16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H18C17.4696 18 16.9609 17.7893 16.5858 17.4142C16.2107 17.0391 16 16.5304 16 16V13C16 12.4696 16.2107 11.9609 16.5858 11.5858C16.9609 11.2107 17.4696 11 18 11H21Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 16V18C21 19.0609 20.5786 20.0783 19.8284 20.8284C19.0783 21.5786 18.0609 22 17 22H12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'tasks':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 20"
            fill="none"
          >
            <path
              d="M6.83333 1H2.16667C1.52233 1 1 1.59695 1 2.33333V7.66667C1 8.40305 1.52233 9 2.16667 9H6.83333C7.47767 9 8 8.40305 8 7.66667V2.33333C8 1.59695 7.47767 1 6.83333 1Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M1 16.5L3.33333 19L8 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 2H23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 10H23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 18H23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'project-management':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M6.83333 1H2.16667C1.52233 1 1 1.59695 1 2.33333V7.66667C1 8.40305 1.52233 9 2.16667 9H6.83333C7.47767 9 8 8.40305 8 7.66667V2.33333C8 1.59695 7.47767 1 6.83333 1Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M1 16.5L3.33333 19L8 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 2H23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'brand':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12.7377 19.7014C13.027 19.7013 13.3134 19.6442 13.5806 19.5332C13.8477 19.4223 14.0904 19.2597 14.2946 19.0548L21.0612 12.2685C22.2991 11.0306 22.9946 9.35159 22.9946 7.60092C22.9946 5.85024 22.2991 4.17128 21.0612 2.93336C19.8233 1.69545 18.1443 1 16.3937 1C14.643 1 12.964 1.69545 11.7261 2.93336L4.94853 9.71094C4.53609 10.1232 4.30432 10.6825 4.3042 11.2657V18.6018C4.3042 18.8934 4.42004 19.1731 4.62625 19.3793C4.83245 19.5855 5.11212 19.7014 5.40374 19.7014H12.7377Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16.3992 7.60645L1.00562 23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.0485 15.3032H8.70239"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'customers':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="21"
            viewBox="0 0 24 21"
            fill="none"
          >
            <path
              d="M18.6 20C18.6 17.7604 17.6729 15.6125 16.0225 14.0289C14.3722 12.4452 12.1339 11.5556 9.8 11.5556M9.8 11.5556C7.46609 11.5556 5.22778 12.4452 3.57746 14.0289C1.92714 15.6125 1 17.7604 1 20M9.8 11.5556C12.8376 11.5556 15.3 9.19261 15.3 6.27778C15.3 3.36294 12.8376 1 9.8 1C6.76243 1 4.3 3.36294 4.3 6.27778C4.3 9.19261 6.76243 11.5556 9.8 11.5556ZM23 18.9444C23 15.3872 20.8 12.0833 18.6 10.5C19.3232 9.97937 19.9014 9.2957 20.2836 8.50951C20.6658 7.72331 20.8402 6.85883 20.7912 5.99257C20.7423 5.12631 20.4716 4.28498 20.003 3.54304C19.5345 2.80111 18.8826 2.18144 18.105 1.73889"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'campaigns':
        return <Mails size={24} />;
      default:
        return null;
    }
  };

  // Get navigation groups based on primary nav context
  const getNavigationGroups = (): NavGroup[] => {
    switch (activePrimaryNav) {
      case 'dashboard':
        return [
          {
            items: [{ text: 'Dashboard', href: '/dashboard' }],
          },
        ];
      case 'campaigns':
        return [
          {
            items: [{ text: 'Dashboard', href: '/campaigns' }],
          },
        ];
      case 'customers':
        return [
          {
            items: [
              {
                text: 'All Customers',
                href: '/customers',
              },
            ],
          },
          {
            showDivider: true,
            items: [
              {
                text: 'One Times',
                href: '/customers/one-times',
                disabled: true,
              },
              {
                text: 'Monthly Recurring',
                href: '/customers/monthly-recurring',
                disabled: true,
              },
              {
                text: 'Termite Customers',
                href: '/customers/termite',
                disabled: true,
              },
              {
                text: 'Lost Leads',
                href: '/customers/lost-leads',
                disabled: true,
              },
              {
                text: 'Cancelled Customers',
                href: '/customers/cancelled',
                disabled: true,
              },
              {
                text: 'Junk/Trash',
                href: '/customers/junk',
                disabled: true,
              },
            ],
          },
        ];
      case 'brand':
        return [
          {
            items: [{ text: 'Brand', href: '/brand' }],
          },
        ];
      case 'project-management':
        return [
          {
            items: [
              {
                text: 'Dashboard',
                href: '/project-management',
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M7 2H3C2.44772 2 2 2.44772 2 3V8C2 8.55228 2.44772 9 3 9H7C7.55228 9 8 8.55228 8 8V3C8 2.44772 7.55228 2 7 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 2H11C10.4477 2 10 2.44772 10 3V5C10 5.55228 10.4477 6 11 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 8H11C10.4477 8 10 8.44772 10 9V15C10 15.5523 10.4477 16 11 16H15C15.5523 16 16 15.5523 16 15V9C16 8.44772 15.5523 8 15 8Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 11H3C2.44772 11 2 11.4477 2 12V15C2 15.5523 2.44772 16 3 16H7C7.55228 16 8 15.5523 8 15V12C8 11.4477 7.55228 11 7 11Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
              {
                text: 'Tasks',
                href: '/project-management/tasks',
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M15 2H3C2.44772 2 2 2.44772 2 3V15C2 15.5523 2.44772 16 3 16H15C15.5523 16 16 15.5523 16 15V3C16 2.44772 15.5523 2 15 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 9L8 11L12 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
              {
                text: 'Reports',
                href: '/project-management/reports',
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M15 2H3C2.44772 2 2 2.44772 2 3V15C2 15.5523 2.44772 16 3 16H15C15.5523 16 16 15.5523 16 15V3C16 2.44772 15.5523 2 15 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 13V10M9 13V7M12 13V4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
            ],
          },
        ];
      case 'tickets':
      default:
        return [
          {
            items: [
              {
                text: 'New',
                href: '/tickets/incoming',
                count: counts.tickets,
                countType: 'tickets',
                showRedDot:
                  newItemIndicators.tickets &&
                  pathname !== '/tickets/incoming' &&
                  !pathname.startsWith('/tickets/incoming/') &&
                  !pathname.startsWith('/tickets/calls-and-forms'),
              },
              {
                text: 'Sales Leads',
                href: '/tickets/leads',
                count: counts.leads,
                countType: 'leads',
                showRedDot: counts.unassigned_leads > 0,
              },
              {
                text: 'Scheduling',
                href: '/tickets/scheduling',
                count: counts.scheduling,
                countType: 'scheduling',
                showRedDot:
                  newItemIndicators.scheduling &&
                  pathname !== '/tickets/scheduling' &&
                  !pathname.startsWith('/tickets/scheduling/'),
              },
              {
                text: 'Customer Service',
                href: '/tickets/customer-service',
                count: counts.cases,
                countType: 'cases',
                showRedDot: counts.unassigned_cases > 0,
              },
            ],
          },
          {
            title: 'My Assignments',
            items: [
              ...(shouldShowSales
                ? [
                    {
                      text: 'My Sales Leads',
                      href: '/tickets/my-sales-leads',
                      count: counts.my_leads,
                      countType: 'my_leads',
                      hasNewItems:
                        newItemIndicators.my_leads &&
                        pathname !== '/tickets/my-sales-leads' &&
                        !pathname.startsWith('/tickets/my-sales-leads/'),
                    },
                  ]
                : []),
              ...(shouldShowSupport
                ? [
                    {
                      text: 'My Support Cases',
                      href: '/tickets/my-support-cases',
                      count: counts.my_cases,
                      countType: 'my_cases',
                      hasNewItems:
                        newItemIndicators.my_cases &&
                        pathname !== '/tickets/my-support-cases' &&
                        !pathname.startsWith('/tickets/my-support-cases/'),
                    },
                  ]
                : []),
              {
                text: 'My Tasks',
                href: '/tickets/my-tasks',
                count: counts.my_tasks,
                countType: 'my_tasks',
                hasNewItems:
                  newItemIndicators.my_tasks &&
                  pathname !== '/tickets/my-tasks' &&
                  !pathname.startsWith('/tickets/my-tasks/'),
              },
            ],
          },
          {
            title: 'Records & Reports',
            items: [
              {
                text: 'Reports',
                href: '/tickets/reports',
                disabled: false,
                icon: <ReportsIcon />,
              },
              {
                text: 'Calls',
                href: '/tickets/call-records',
                icon: <CallsIcon />,
              },
              {
                text: 'Forms',
                href: '/tickets/form-submissions',
                icon: <CallsIcon />,
              },
              {
                text: 'Customer Library',
                href: '/customers',
                icon: <CustomerLibraryIcon />,
              },
            ],
          },
        ];
    }
  };

  const renderContextNav = () => {
    const navGroups = getNavigationGroups();

    return (
      <>
        <div className={styles.sectionHeader}>
          <div className={styles.iconHeader}>{getPrimaryNavIcon()}</div>
          <h2 className={styles.sectionTitle}>
            {activePrimaryNav === 'project-management'
              ? 'Tracker'
              : activePrimaryNav.charAt(0).toUpperCase() +
                activePrimaryNav.slice(1)}
          </h2>
        </div>
        <nav className={styles.contextNav}>
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.showDivider && <div className={styles.divider} />}
              {group.title && (
                <div className={styles.groupTitleWrapper}>
                  <h3 className={styles.groupTitle}>{group.title}</h3>
                </div>
              )}
              <div className={styles.navGroup}>
                {group.items.map(item => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === '/customers' &&
                      pathname.startsWith('/customers/')) ||
                    (item.href === '/tickets/incoming' &&
                      (pathname.startsWith('/tickets/incoming') ||
                        pathname.startsWith('/tickets/calls-and-forms'))) ||
                    (item.href.startsWith('/tickets/') &&
                      pathname.startsWith(item.href));

                  return (
                    <div key={item.text} className={styles.navItemContainer}>
                      {item.disabled ? (
                        <div className={`${styles.navItem} ${styles.disabled}`}>
                          <span className={styles.navItemText}>
                            {item.icon && (
                              <span className={styles.navItemIcon}>
                                {item.icon}
                              </span>
                            )}
                            {item.text}
                          </span>
                          {item.count !== undefined && (
                            <span
                              className={`${styles.countBadge} ${
                                item.countType && animations[item.countType]
                                  ? styles.animating
                                  : ''
                              } ${item.countColor === 'error' ? styles.error : ''} ${styles.neutral} ${
                                item.hasNewItems ? styles.hasNewItems : ''
                              }`}
                            >
                              {loadingCounts ? '•' : item.count}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                          onClick={() => handleNavClick(item.countType)}
                        >
                          <span className={styles.navItemText}>
                            {item.icon && (
                              <span className={styles.navItemIcon}>
                                {item.icon}
                              </span>
                            )}
                            {item.text}
                          </span>
                          <div className={styles.navItemRight}>
                            {item.count !== undefined && (
                              <span
                                className={`${styles.countBadge} ${
                                  isActive ? styles.active : ''
                                } ${
                                  item.countType && animations[item.countType]
                                    ? styles.animating
                                    : ''
                                } ${item.countColor === 'error' ? styles.error : ''} ${
                                  item.hasNewItems ? styles.hasNewItems : ''
                                }`}
                              >
                                {loadingCounts ? '•' : item.count}
                              </span>
                            )}
                            {item.showRedDot && <RedDot />}
                          </div>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </>
    );
  };

  if (collapsed) {
    return null;
  }

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return null;
  }

  if (!isPublicPage && pathname !== '/') {
    return (
      <div className={`${styles.sidebar} ${isActive ? styles.active : ''}`}>
        {renderContextNav()}
      </div>
    );
  }

  return null;
}
