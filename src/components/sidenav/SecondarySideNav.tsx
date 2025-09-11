'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';
import { useCompany } from '@/contexts/CompanyContext';
import { adminAPI } from '@/lib/api-client';
import styles from './secondarySidenav.module.scss';

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
}

interface NavGroup {
  items: NavItem[];
  showDividerAfter?: boolean;
}

interface Counts {
  tickets: number;
  leads: number;
  customers: number;
  projects: number;
  calls: number;
}

export function SecondarySideNav({
  collapsed = false,
  isActive = false,
  onLinkClick,
}: SidebarProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [counts, setCounts] = useState<Counts>({
    tickets: 0,
    leads: 0,
    customers: 0,
    projects: 0,
    calls: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(false);

  const pathname = usePathname();
  const { activePrimaryNav } = useNavigation();
  const { selectedCompany, isAdmin } = useCompany();
  const isPublicPage = pathname === '/login' || pathname === '/sign-up';

  // Handle client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch counts for navigation items
  const fetchCounts = useCallback(async (companyId: string) => {
    setLoadingCounts(true);
    try {
      const [ticketsData, leadsData, customersData, projectsData, callsData] = await Promise.allSettled([
        // Fetch tickets
        isAdmin 
          ? adminAPI.tickets.list({ companyId, includeArchived: false })
          : fetch(`/api/tickets?companyId=${companyId}&includeArchived=false`).then(res => res.ok ? res.json() : []),
        
        // Fetch leads
        isAdmin 
          ? adminAPI.getLeads({ companyId })
          : adminAPI.getUserLeads(companyId),
        
        // Fetch customers
        isAdmin 
          ? adminAPI.getCustomers({ companyId })
          : adminAPI.getUserCustomers({ companyId }),
        
        // Fetch projects
        isAdmin 
          ? adminAPI.getProjects({ companyId })
          : adminAPI.getUserProjects(companyId),
        
        // Fetch calls (if available)
        isAdmin 
          ? adminAPI.getAllCalls({ companyId })
          : adminAPI.getUserCalls({ companyId }),
      ]);

      setCounts({
        tickets: ticketsData.status === 'fulfilled' ? (Array.isArray(ticketsData.value) ? ticketsData.value.length : 0) : 0,
        leads: leadsData.status === 'fulfilled' ? (Array.isArray(leadsData.value) ? leadsData.value.length : 0) : 0,
        customers: customersData.status === 'fulfilled' ? (Array.isArray(customersData.value) ? customersData.value.length : 0) : 0,
        projects: projectsData.status === 'fulfilled' ? (Array.isArray(projectsData.value) ? projectsData.value.length : 0) : 0,
        calls: callsData.status === 'fulfilled' ? (Array.isArray(callsData.value) ? callsData.value.length : 0) : 0,
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
      // Keep counts at 0 on error
    } finally {
      setLoadingCounts(false);
    }
  }, [isAdmin]);

  // Fetch counts when company changes
  useEffect(() => {
    if (selectedCompany?.id && isHydrated) {
      fetchCounts(selectedCompany.id);
    }
  }, [selectedCompany?.id, isHydrated, isAdmin, fetchCounts]);



  // Get the icon for the current primary nav
  const getPrimaryNavIcon = () => {
    switch (activePrimaryNav) {
      case 'dashboard':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
      case 'conversations':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
            width="18"
            height="15"
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
      case 'brand':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
            items: [
              { text: 'Dashboard', href: '/dashboard' },
              { 
                text: 'All Customers', 
                href: '/dashboard/customers',
                count: counts.customers
              }
            ]
          }
        ];
      case 'brand':
        return [
          {
            items: [
              { text: 'Brand', href: '/brand' }
            ]
          }
        ];
      case 'conversations':
      default:
        return [
          {
            items: [
              {
                text: 'Calls & Forms',
                href: '/conversations/calls-and-forms',
                count: counts.tickets,
              },
              { 
                text: 'Sales Leads', 
                href: '/conversations/leads', 
                count: counts.leads 
              },
              { 
                text: 'Scheduling', 
                href: '/conversations/scheduling', 
                count: 0, // No data source yet
                disabled: true
              },
              {
                text: 'Customer Service',
                href: '/conversations/customer-service',
                count: 0, // No data source yet
                disabled: true
              }
            ],
            showDividerAfter: true
          },
          {
            items: [
              {
                text: 'My Tasks',
                href: '/conversations/my-tasks',
                count: 0, // No data source yet
                disabled: true,
              },
              {
                text: 'Assigned To Me',
                href: '/conversations/assigned-to-me',
                count: 0, // No data source yet
                disabled: true
              }
            ],
            showDividerAfter: true
          },
          {
            items: [
              { 
                text: 'Reports', 
                href: '/conversations/reports',
                disabled: true 
              },
              { 
                text: 'Calls', 
                href: '/conversations/call-records',
                count: counts.calls
              },
              { 
                text: 'All Customers', 
                href: '/dashboard/customers',
                count: counts.customers
              }
            ]
          }
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
            {activePrimaryNav.charAt(0).toUpperCase() + activePrimaryNav.slice(1)}
          </h2>
        </div>
        <nav className={styles.contextNav}>
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <div className={styles.navGroup}>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === '/conversations/calls-and-forms' &&
                      pathname.startsWith('/conversations/calls-and-forms'));

                  return (
                    <div key={item.text} className={styles.navItemContainer}>
                      {item.disabled ? (
                        <div className={`${styles.navItem} ${styles.disabled}`}>
                          <span className={styles.navItemText}>{item.text}</span>
                          {item.count !== undefined && (
                            <span className={`${styles.countBox} ${styles.neutral}`}>
                              {loadingCounts ? '•' : item.count}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                          onClick={onLinkClick}
                        >
                          <span className={styles.navItemText}>{item.text}</span>
                          {item.count !== undefined && (
                            <span
                              className={`${styles.countBox} ${
                                isActive
                                  ? styles.activeCount
                                  : item.countColor === 'error'
                                    ? styles.errorCount
                                    : styles.defaultCount
                              }`}
                            >
                              {loadingCounts ? '•' : item.count}
                            </span>
                          )}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
              {group.showDividerAfter && (
                <div className={styles.divider}></div>
              )}
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
