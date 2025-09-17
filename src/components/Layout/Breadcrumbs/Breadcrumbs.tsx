'use client';

import { usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api-client';
import { useNavigation } from '@/contexts/NavigationContext';
import styles from './Breadcrumbs.module.scss';

const BreadcrumbArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="6" height="10" viewBox="0 0 6 10" fill="none">
    <path d="M1 1.25L4.65132 5L1 8.75" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const params = useParams();
  const { activePrimaryNav } = useNavigation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const pathSegments = pathname.split('/').filter(Boolean);
      const crumbs: BreadcrumbItem[] = [];

      // Get the primary nav root based on current active nav
      const getPrimaryNavRoot = () => {
        switch (activePrimaryNav) {
          case 'dashboard':
            return { label: 'Dashboard', href: '/dashboard' };
          case 'connections':
            return { label: 'Connections', href: '/tickets' };
          case 'tasks':
            return { label: 'Tasks', href: '/tickets' };
          case 'brand':
            return { label: 'Brand', href: '/brand' };
          default:
            return { label: 'Dashboard', href: '/dashboard' };
        }
      };

      const primaryNavRoot = getPrimaryNavRoot();

      if (pathSegments.length === 0) {
        setBreadcrumbs([{ label: primaryNavRoot.label }]);
        return;
      }

      // Handle different routes
      switch (pathSegments[0]) {
        case 'dashboard':
          setBreadcrumbs([{ label: primaryNavRoot.label }]);
          return;

        case 'leads':
          // Start with primary nav root only if not already there
          if (activePrimaryNav === 'connections') {
            // For /leads route under connections
            crumbs.push({ label: 'Sales Leads', href: '/connections/leads' });
          } else {
            crumbs.push({ label: 'Leads', href: '/leads' });
          }
          
          // If viewing specific lead
          if (pathSegments[1] && params?.id) {
            try {
              setLoading(true);
              const lead = await adminAPI.getLead(params.id as string);
              if (lead?.customer) {
                const customerName = `${lead.customer.first_name} ${lead.customer.last_name}`.trim();
                crumbs.push({ label: customerName });
              } else {
                crumbs.push({ label: `Lead ${(params.id as string).slice(0, 8)}` });
              }
            } catch (error) {
              console.error('Error fetching lead for breadcrumb:', error);
              crumbs.push({ label: `Lead ${(params.id as string).slice(0, 8)}` });
            } finally {
              setLoading(false);
            }
          }
          break;

        case 'tickets':
          // Don't add root again if we're in tasks nav
          if (activePrimaryNav !== 'tasks') {
            crumbs.push({ label: 'Tickets', href: '/tickets' });
          }
          
          // If viewing specific ticket
          if (pathSegments[1] && params?.id) {
            try {
              setLoading(true);
              const ticket = await adminAPI.getTicket(params.id as string);
              if (ticket?.customer) {
                const customerName = `${ticket.customer.first_name} ${ticket.customer.last_name}`.trim();
                crumbs.push({ label: customerName });
              } else {
                crumbs.push({ label: `Ticket ${(params.id as string).slice(0, 8)}` });
              }
            } catch (error) {
              console.error('Error fetching ticket for breadcrumb:', error);
              crumbs.push({ label: `Ticket ${(params.id as string).slice(0, 8)}` });
            } finally {
              setLoading(false);
            }
          }
          break;

        case 'customers':
          crumbs.push({ label: 'Customers', href: '/customers' });
          
          // If viewing specific customer
          if (pathSegments[1] && params?.id) {
            try {
              setLoading(true);
              const customer = await adminAPI.getCustomer(params.id as string);
              if (customer) {
                const customerName = `${customer.first_name} ${customer.last_name}`.trim();
                crumbs.push({ label: customerName });
              } else {
                crumbs.push({ label: `Customer ${(params.id as string).slice(0, 8)}` });
              }
            } catch (error) {
              console.error('Error fetching customer for breadcrumb:', error);
              crumbs.push({ label: `Customer ${(params.id as string).slice(0, 8)}` });
            } finally {
              setLoading(false);
            }
          }
          break;

        case 'connections':
          // Don't add Conversations again if it's already the primary nav root
          if (activePrimaryNav !== 'connections') {
            crumbs.push({ label: 'Conversations', href: '/tickets' });
          }
          
          // Handle conversation sub-pages
          if (pathSegments[1]) {
            const conversationPageMap: { [key: string]: string } = {
              'calls-and-forms': 'Tickets',
              'leads': 'Sales Leads', 
              'scheduling': 'Scheduling',
              'customer-service': 'Customer Service',
              'my-tasks': 'My Tasks',
              'assigned-to-me': 'Assigned To Me',
              'reports': 'Reports',
              'archived-calls': 'Archived Calls'
            };
            
            const pageLabel = conversationPageMap[pathSegments[1]] || 
              pathSegments[1].split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
            
            crumbs.push({
              label: pageLabel,
              href: `/connections/${pathSegments[1]}`
            });
            
            // If viewing specific conversation item (e.g., specific lead or ticket)
            if (pathSegments[2] && params?.id) {
              try {
                setLoading(true);
                let itemData = null;
                let itemLabel = '';
                
                if (pathSegments[1] === 'leads') {
                  itemData = await adminAPI.getLead(params.id as string);
                  if (itemData?.customer) {
                    itemLabel = `${itemData.customer.first_name} ${itemData.customer.last_name}`.trim();
                  } else {
                    itemLabel = `Lead ${(params.id as string).slice(0, 8)}`;
                  }
                } else if (pathSegments[1] === 'calls-and-forms') {
                  // Could be a ticket or call record
                  try {
                    itemData = await adminAPI.getTicket(params.id as string);
                    if (itemData?.customer) {
                      itemLabel = `${itemData.customer.first_name} ${itemData.customer.last_name}`.trim();
                    } else {
                      itemLabel = `Ticket ${(params.id as string).slice(0, 8)}`;
                    }
                  } catch {
                    // Fallback to call record if ticket fails
                    itemLabel = `Call ${(params.id as string).slice(0, 8)}`;
                  }
                } else {
                  itemLabel = `${pageLabel} ${(params.id as string).slice(0, 8)}`;
                }
                
                crumbs.push({ label: itemLabel });
              } catch (error) {
                console.error('Error fetching conversation item for breadcrumb:', error);
                crumbs.push({ label: `${pageLabel} ${(params.id as string).slice(0, 8)}` });
              } finally {
                setLoading(false);
              }
            }
          }
          break;

        case 'call-records':
          crumbs.push({ label: 'Call Records' });
          break;

        case 'admin':
          crumbs.push({ label: 'Admin Dashboard' });
          break;

        case 'settings':
          crumbs.push({ label: 'Settings' });
          break;

        case 'brand':
          // Don't add Brand again if it's already the primary nav root
          if (activePrimaryNav !== 'brand') {
            crumbs.push({ label: 'Brand' });
          }
          break;

        default:
          // For any other routes, capitalize the segment
          crumbs.push({ 
            label: pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1).replace('-', ' ') 
          });
      }

      // Add primary nav root to all cases except dashboard (which is handled separately)
      if (pathSegments[0] !== 'dashboard' && crumbs.length > 0) {
        crumbs.unshift(primaryNavRoot);
      }

      setBreadcrumbs(crumbs);
    };

    generateBreadcrumbs();
  }, [pathname, params, activePrimaryNav]);

  if (breadcrumbs.length <= 1) {
    return (
      <div className={styles.breadcrumbs}>
        <span className={styles.breadcrumbItem}>
          {breadcrumbs[0]?.label || 'Dashboard'}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.breadcrumbs}>
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className={styles.breadcrumbGroup}>
          {index > 0 && <div className={styles.separator}><BreadcrumbArrow /></div>}
          {crumb.href && index < breadcrumbs.length - 1 ? (
            <Link href={crumb.href} className={styles.breadcrumbLink}>
              {crumb.label}
            </Link>
          ) : (
            <span className={`${styles.breadcrumbItem} ${index === breadcrumbs.length - 1 ? styles.current : ''}`}>
              {loading && index === breadcrumbs.length - 1 ? 'Loading...' : crumb.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}