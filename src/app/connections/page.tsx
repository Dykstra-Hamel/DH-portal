'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useCompany } from '@/contexts/CompanyContext';
import { useCurrentUserPageAccess } from '@/hooks/useUserDepartments';
import { useRealtimeCounts } from '@/hooks/useRealtimeCounts';
import {
  Ticket,
  Target,
  Calendar,
  Headphones,
  CheckSquare,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Video,
  HelpCircle,
} from 'lucide-react';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

interface DashboardCardProps {
  title: string;
  description: string;
  count: number;
  href: string;
  icon: React.ReactNode;
  bgImage?: string;
  showBadge?: boolean;
  badgeCount?: number;
}

interface AssignmentCardProps {
  title: string;
  description: string;
  count: number;
  href: string;
  showNewItems?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  onAddMetric?: () => void;
}

function DashboardCard({
  title,
  description,
  count,
  href,
  icon,
  bgImage,
  showBadge,
  badgeCount,
}: DashboardCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <div className={styles.dashboardCard} onClick={handleClick}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>{icon}</div>
        {showBadge && badgeCount && badgeCount > 0 && (
          <span className={styles.badge}>{badgeCount}</span>
        )}
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <span className={styles.cardCount}>{count}</span>
        <p className={styles.cardDescription}>{description}</p>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardLabel}>All Assigned:</span>
        <div className={styles.assignedIcons}>
          {/* Mock user avatars */}
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#ef4444' }}
          ></div>
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#f59e0b' }}
          ></div>
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#10b981' }}
          ></div>
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#3b82f6' }}
          ></div>
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#8b5cf6' }}
          ></div>
        </div>
      </div>
      {bgImage && (
        <div className={styles.cardBgImage}>
          <Image src={bgImage} alt="" fill style={{ objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  title,
  description,
  count,
  href,
  showNewItems,
}: AssignmentCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <div className={styles.assignmentCard} onClick={handleClick}>
      <div className={styles.assignmentHeader}>
        <h3 className={styles.assignmentTitle}>{title}</h3>
        {showNewItems && <span className={styles.newBadge}>{count}</span>}
      </div>
      <p className={styles.assignmentDescription}>{description}</p>
      <div className={styles.assignmentFooter}>
        <span className={styles.assignmentLabel}>All Assigned:</span>
        <div className={styles.assignedIcons}>
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#ef4444' }}
          ></div>
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#f59e0b' }}
          ></div>
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#10b981' }}
          ></div>
          <div
            className={styles.avatar}
            style={{ backgroundColor: '#3b82f6' }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  onAddMetric,
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <h4 className={styles.metricTitle}>{title}</h4>
      </div>
      <div className={styles.metricValue}>{value}</div>
      {change !== undefined && changeLabel && (
        <div className={styles.metricChange}>
          <div
            className={`${styles.changeIndicator} ${isPositive ? styles.positive : isNegative ? styles.negative : ''}`}
          >
            {isPositive ? (
              <TrendingUp className={styles.trendIcon} />
            ) : isNegative ? (
              <TrendingDown className={styles.trendIcon} />
            ) : null}
            <span>{Math.abs(change)}%</span>
          </div>
          <span className={styles.changeLabel}>{changeLabel}</span>
        </div>
      )}
      {onAddMetric && (
        <button className={styles.addMetricButton} onClick={onAddMetric}>
          + Add Metric
        </button>
      )}
    </div>
  );
}

function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What is the airspeed velocity of an unladen swallow?',
      answer:
        'Revenue based from closing rations for all leads received and leads sold from all combination sources.',
    },
    {
      question: 'When am I going to get fired based on my performance?',
      answer:
        'Performance metrics are evaluated based on multiple factors including lead conversion rates, customer satisfaction, and task completion.',
    },
    {
      question: 'When am I a ticket truly closed out?',
      answer:
        'A ticket is considered closed when all resolution steps have been completed and the customer has confirmed satisfaction.',
    },
    {
      question: 'Farm to table, customer to ticket, shiplap to...',
      answer:
        'Our process follows industry best practices for customer service and lead management workflows.',
    },
  ];

  return (
    <div className={styles.faqSection}>
      <h3 className={styles.faqTitle}>FAQ</h3>
      {faqs.map((faq, index) => (
        <div key={index} className={styles.faqItem}>
          <button
            className={styles.faqQuestion}
            onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
          >
            <span>{faq.question}</span>
            <ChevronRight
              className={`${styles.faqChevron} ${openFAQ === index ? styles.open : ''}`}
            />
          </button>
          {openFAQ === index && (
            <div className={styles.faqAnswer}>{faq.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ConnectionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { selectedCompany, isAdmin } = useCompany();
  const { counts, newItemIndicators } = useRealtimeCounts();

  // Access control hooks
  const { hasAccess: hasSalesAccess } = useCurrentUserPageAccess('sales');
  const { hasAccess: hasSchedulingAccess } =
    useCurrentUserPageAccess('scheduling');
  const { hasAccess: hasSupportAccess } = useCurrentUserPageAccess('support');

  // Global admins see everything, otherwise check department access
  const shouldShowSales = isAdmin || hasSalesAccess;
  const shouldShowScheduling = isAdmin || hasSchedulingAccess;
  const shouldShowSupport = isAdmin || hasSupportAccess;

  useEffect(() => {
    const supabase = createClient();

    const getSessionAndData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    };

    getSessionAndData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingText}>
          Loading connections dashboard...
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!selectedCompany) {
    return (
      <div className={styles.noCompany}>
        <p>No company found. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className={styles.connectionsPage}>
      {/* Header Section */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Qualify, assign and nurture open tickets.
        </h1>
      </div>

      {/* Main Dashboard Cards */}
      <div className={styles.dashboardGrid}>
        <DashboardCard
          title="Tickets"
          description="View and assign all new tickets created from all available calls and tickets."
          count={counts.tickets || 0}
          href="/connections/tickets"
          icon={<Ticket />}
          showBadge={newItemIndicators.tickets}
          badgeCount={counts.tickets}
        />

        {shouldShowSales && (
          <DashboardCard
            title="Sales Leads"
            description="View and assign all new tickets created from all available calls and on"
            count={counts.leads || 0}
            href="/connections/leads"
            icon={<Target />}
            showBadge={counts.unassigned_leads > 0}
            badgeCount={counts.unassigned_leads}
          />
        )}

        {shouldShowScheduling && (
          <DashboardCard
            title="Scheduling"
            description="View and assign all new tickets created from all available calls and on"
            count={counts.scheduling || 0}
            href="/connections/scheduling"
            icon={<Calendar />}
            showBadge={newItemIndicators.scheduling}
            badgeCount={counts.scheduling}
          />
        )}

        {shouldShowSupport && (
          <DashboardCard
            title="Support Cases"
            description="View and assign all new tickets created from all available calls and on"
            count={counts.cases || 0}
            href="/connections/customer-service"
            icon={<Headphones />}
            showBadge={counts.unassigned_cases > 0}
            badgeCount={counts.unassigned_cases}
          />
        )}
      </div>

      {/* Secondary Grid */}
      <div className={styles.secondaryGrid}>
        {/* Direct Assignments */}
        <div className={styles.assignmentsSection}>
          <h2 className={styles.sectionTitle}>
            Direct assignments just for you.
          </h2>
          <div className={styles.assignmentGrid}>
            <AssignmentCard
              title="My Tasks"
              description="All of your tasks & reminders on following up on any ticket your assigned to."
              count={counts.my_tasks || 0}
              href="/connections/my-tasks"
              showNewItems={newItemIndicators.my_tasks}
            />

            {shouldShowSales && (
              <AssignmentCard
                title="My Sales Leads"
                description="All of your tasks & reminders on following up on any ticket your assigned to."
                count={counts.my_leads || 0}
                href="/connections/my-sales-leads"
                showNewItems={newItemIndicators.my_leads}
              />
            )}

            {shouldShowScheduling && (
              <AssignmentCard
                title="My Scheduling"
                description="All of your tasks & reminders on following up on any ticket your assigned to."
                count={0}
                href="/connections/scheduling"
                showNewItems={false}
              />
            )}

            {shouldShowSupport && (
              <AssignmentCard
                title="My Support Cases"
                description="All of your tasks & reminders on following up on any ticket your assigned to."
                count={counts.my_cases || 0}
                href="/connections/my-support-cases"
                showNewItems={newItemIndicators.my_cases}
              />
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div className={styles.metricsSection}>
          <h2 className={styles.sectionTitle}>Quick performance stats</h2>
          <div className={styles.metricsGrid}>
            <MetricCard
              title="Lost Leads"
              value="38"
              change={25.2}
              changeLabel="25.2% last week"
            />
            <MetricCard
              title="Avg. Assign Time"
              value="13min"
              change={-25.2}
              changeLabel="25.2% last week"
            />
            <MetricCard
              title="Live Calls Taken"
              value="2"
              change={25.2}
              changeLabel="25.2% last week"
            />
            <MetricCard
              title="Conversion Rate"
              value="12%"
              change={25.2}
              changeLabel="25.2% last week"
            />
            <MetricCard
              title=""
              value=""
              onAddMetric={() => console.log('Add metric clicked')}
            />
            <MetricCard
              title=""
              value=""
              onAddMetric={() => console.log('Add metric clicked')}
            />
          </div>
        </div>
      </div>

      {/* Bottom Resources Section */}
      <div className={styles.resourcesSection}>
        <h2 className={styles.sectionTitle}>Additional resources</h2>
        <div className={styles.resourcesGrid}>
          {/* Video Section */}
          <div className={styles.videoCard}>
            <div className={styles.videoThumbnail}>
              <Video className={styles.videoIcon} />
            </div>
            <p className={styles.videoDescription}>
              This is a short description of what you will see in this video.
            </p>
          </div>

          {/* FAQ Section */}
          <div className={styles.faqCard}>
            <FAQSection />
          </div>
        </div>
      </div>
    </div>
  );
}
