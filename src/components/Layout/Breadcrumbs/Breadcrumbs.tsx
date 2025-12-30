'use client';

import { usePathname, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api-client';
import { useNavigation } from '@/contexts/NavigationContext';
import { useUser } from '@/hooks/useUser';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import {
  createCustomerChannel,
  subscribeToCustomerUpdates,
  removeCustomerChannel,
  CustomerUpdatePayload,
} from '@/lib/realtime/customer-channel';
import { RealtimeChannel } from '@supabase/supabase-js';
import styles from './Breadcrumbs.module.scss';

const BreadcrumbArrow = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="6"
    height="10"
    viewBox="0 0 6 10"
    fill="none"
  >
    <path
      d="M1 1.25L4.65132 5L1 8.75"
      stroke="var(--brand-gray)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  const { user, profile } = useUser();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const customerChannelRef = useRef<RealtimeChannel | null>(null);

  // Check if user is admin
  const isAdmin = profile ? isAuthorizedAdminSync(profile) : false;

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const pathSegments = pathname.split('/').filter(Boolean);
      const crumbs: BreadcrumbItem[] = [];

      // Get the primary nav root based on current active nav
      const getPrimaryNavRoot = () => {
        switch (activePrimaryNav) {
          case 'dashboard':
            return { label: 'Dashboard', href: '/dashboard' };
          case 'tickets':
            return { label: 'Tickets', href: '/tickets' };
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
          if (activePrimaryNav === 'tickets') {
            // For /leads route under tickets
            crumbs.push({ label: 'Sales Leads', href: '/tickets/leads' });
          } else {
            crumbs.push({ label: 'Leads', href: '/leads' });
          }

          // If viewing specific lead
          if (pathSegments[1] && params?.id) {
            try {
              setLoading(true);
              // Use appropriate API based on admin status
              const lead = isAdmin
                ? await adminAPI.getLead(params.id as string)
                : await adminAPI.getUserLead(params.id as string);
              if (lead?.customer) {
                const customerName =
                  `${lead.customer.first_name} ${lead.customer.last_name}`.trim();
                crumbs.push({ label: customerName });
                // Store customer ID for realtime updates
                setCustomerId(lead.customer.id);
              } else {
                crumbs.push({ label: `Lead` });
                setCustomerId(null);
              }
            } catch (error) {
              console.error('Error fetching lead for breadcrumb:', error);
              crumbs.push({ label: `Lead` });
              setCustomerId(null);
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
              // Use appropriate API based on admin status
              const customer = isAdmin
                ? await adminAPI.getCustomer(params.id as string)
                : await adminAPI.getUserCustomer(params.id as string);
              if (customer) {
                const customerName =
                  `${customer.first_name} ${customer.last_name}`.trim();
                crumbs.push({ label: customerName });
              } else {
                crumbs.push({ label: `Customer` });
              }
            } catch (error) {
              console.error('Error fetching customer for breadcrumb:', error);
              crumbs.push({ label: `Customer` });
            } finally {
              setLoading(false);
            }
          }
          break;

        case 'tickets':
          // Don't add Tickets again if it's already the primary nav root
          if (activePrimaryNav !== 'tickets') {
            crumbs.push({ label: 'Tickets', href: '/tickets' });
          }

          // Handle conversation sub-pages
          if (pathSegments[1]) {
            const conversationPageMap: {
              [key: string]: { label: string; href: string };
            } = {
              'calls-and-forms': {
                label: 'Tickets',
                href: '/tickets/calls-and-forms',
              },
              leads: { label: 'Sales Leads', href: '/tickets/leads' },
              scheduling: {
                label: 'Scheduling',
                href: '/tickets/scheduling',
              },
              'customer-service': {
                label: 'Customer Service',
                href: '/tickets/customer-service',
              },
              'support-cases': {
                label: 'Support Cases',
                href: '/tickets/customer-service',
              },
              'my-sales-leads': {
                label: 'My Sales Leads',
                href: '/tickets/my-sales-leads',
              },
              'my-support-cases': {
                label: 'My Support Cases',
                href: '/tickets/my-support-cases',
              },
              'my-tasks': { label: 'My Tasks', href: '/tickets/my-tasks' },
              tasks: { label: 'Tasks', href: '/tickets/tasks' },
              'assigned-to-me': {
                label: 'Assigned To Me',
                href: '/tickets/assigned-to-me',
              },
              reports: { label: 'Reports', href: '/tickets/reports' },
              'archived-calls': {
                label: 'Archived Calls',
                href: '/tickets/archived-calls',
              },
            };

            const pageConfig = conversationPageMap[pathSegments[1]] || {
              label: pathSegments[1]
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
              href: `/tickets/${pathSegments[1]}`,
            };

            crumbs.push({
              label: pageConfig.label,
              href: pageConfig.href,
            });

            // If viewing specific conversation item (e.g., specific lead or ticket)
            if (pathSegments[2] && params?.id) {
              try {
                setLoading(true);
                let itemData = null;
                let itemLabel = '';

                if (pathSegments[1] === 'leads') {
                  if (isAdmin) {
                    itemData = await adminAPI.getLead(params.id as string);
                  } else {
                    itemData = await adminAPI.getUserLead(params.id as string);
                  }
                  if (itemData?.customer) {
                    itemLabel =
                      `${itemData.customer.first_name} ${itemData.customer.last_name}`.trim();
                    // Store customer ID for realtime updates
                    setCustomerId(itemData.customer.id);
                  } else {
                    itemLabel = `Lead`;
                    setCustomerId(null);
                  }
                } else if (pathSegments[1] === 'support-cases') {
                  if (isAdmin) {
                    itemData = await adminAPI.getSupportCase(
                      params.id as string
                    );
                  } else {
                    itemData = await adminAPI.getUserSupportCase(
                      params.id as string
                    );
                  }
                  if (itemData?.customer) {
                    itemLabel =
                      `${itemData.customer.first_name} ${itemData.customer.last_name}`.trim();
                  } else {
                    itemLabel = `Support Case`;
                  }
                } else if (pathSegments[1] === 'customer-service') {
                  if (isAdmin) {
                    itemData = await adminAPI.getSupportCase(
                      params.id as string
                    );
                  } else {
                    itemData = await adminAPI.getUserSupportCase(
                      params.id as string
                    );
                  }
                  if (itemData?.customer) {
                    itemLabel =
                      `${itemData.customer.first_name} ${itemData.customer.last_name}`.trim();
                  } else {
                    itemLabel = `Support Case`;
                  }
                } else if (pathSegments[1] === 'calls-and-forms') {
                  // Could be a ticket or call record
                  try {
                    itemData = await adminAPI.getTicket(params.id as string);
                    if (itemData?.customer) {
                      itemLabel =
                        `${itemData.customer.first_name} ${itemData.customer.last_name}`.trim();
                    } else {
                      itemLabel = `Ticket`;
                    }
                  } catch {
                    // Fallback to call record if ticket fails
                    itemLabel = `Call`;
                  }
                } else if (pathSegments[1] === 'tasks') {
                  // Fetch task data to get the task title
                  try {
                    const response = await fetch(`/api/tasks/${params.id}`);
                    if (response.ok) {
                      const data = await response.json();
                      itemLabel = data.task?.title || 'Task';
                    } else {
                      itemLabel = 'Task';
                    }
                  } catch {
                    itemLabel = 'Task';
                  }
                } else {
                  itemLabel = pageConfig.label;
                }

                crumbs.push({ label: itemLabel });
              } catch (error) {
                console.error(
                  'Error fetching conversation item for breadcrumb:',
                  error
                );
                // Use generic labels based on page type
                if (pathSegments[1] === 'leads') {
                  crumbs.push({ label: 'Lead' });
                } else if (pathSegments[1] === 'support-cases') {
                  crumbs.push({ label: 'Support Case' });
                } else if (pathSegments[1] === 'customer-service') {
                  crumbs.push({ label: 'Support Case' });
                } else if (pathSegments[1] === 'tasks') {
                  crumbs.push({ label: 'Task' });
                } else {
                  crumbs.push({ label: pageConfig.label });
                }
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
            label:
              pathSegments[0].charAt(0).toUpperCase() +
              pathSegments[0].slice(1).replace('-', ' '),
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

  // Subscribe to customer updates for realtime breadcrumb updates
  useEffect(() => {
    if (!customerId) {
      // Clean up existing channel if customer ID is cleared
      if (customerChannelRef.current) {
        removeCustomerChannel(customerChannelRef.current);
        customerChannelRef.current = null;
      }
      return;
    }

    // Create and subscribe to customer channel
    const channel = createCustomerChannel(customerId);
    customerChannelRef.current = channel;

    subscribeToCustomerUpdates(channel, (payload: CustomerUpdatePayload) => {
      // Update breadcrumb with new customer name
      setBreadcrumbs(prev => {
        const updated = [...prev];
        const lastCrumb = updated[updated.length - 1];

        // Only update if the last breadcrumb was a customer name (no href)
        if (lastCrumb && !lastCrumb.href) {
          const newName =
            `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
          updated[updated.length - 1] = { label: newName };
        }

        return updated;
      });
    });

    // Cleanup on unmount or when customer ID changes
    return () => {
      if (customerChannelRef.current) {
        removeCustomerChannel(customerChannelRef.current);
        customerChannelRef.current = null;
      }
    };
  }, [customerId]);

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
          {index > 0 && (
            <div className={styles.separator}>
              <BreadcrumbArrow />
            </div>
          )}
          {crumb.href && index < breadcrumbs.length - 1 ? (
            <Link href={crumb.href} className={styles.breadcrumbLink}>
              {crumb.label}
            </Link>
          ) : (
            <span
              className={`${styles.breadcrumbItem} ${index === breadcrumbs.length - 1 ? styles.current : ''}`}
            >
              {loading && index === breadcrumbs.length - 1
                ? 'Loading...'
                : crumb.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
