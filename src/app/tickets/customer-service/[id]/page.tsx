'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminAPI } from '@/lib/api-client';
import { SupportCase } from '@/types/support-case';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { SupportCaseStepContent } from '@/components/Common/SupportCaseStepContent/SupportCaseStepContent';
import { SupportCaseDetailsSidebar } from '@/components/Common/SupportCaseStepContent/components/SupportCaseDetailsSidebar/SupportCaseDetailsSidebar';
import { Toast } from '@/components/Common/Toast';
import { ActiveSectionProvider } from '@/contexts/ActiveSectionContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { formatHeaderDate } from '@/lib/date-utils';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface SupportCasePageProps {
  params: Promise<{ id: string }>;
}

function SupportCaseDetailPageContent({ params }: SupportCasePageProps) {
  const [user, setUser] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [supportCase, setSupportCase] = useState<SupportCase | null>(null);
  const [supportCaseLoading, setSupportCaseLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [supportCaseId, setSupportCaseId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const router = useRouter();
  const { setPageHeader } = usePageActions();

  // Assignment state
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Sidebar state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Hooks
  const { user: currentUser, profile: currentProfile } = useUser();
  const { users: assignableUsers } = useAssignableUsers({
    companyId: supportCase?.company_id,
    departmentType: 'support',
    enabled: true,
  });

  // Create stable currentUser object to prevent infinite loops
  const stableCurrentUser = useMemo(() => {
    if (!currentUser || !currentProfile) return null;
    return {
      id: currentUser.id,
      name: `${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim() || currentProfile.email || 'Unknown',
      email: currentProfile.email || currentUser.email || '',
      avatar: currentProfile.avatar_url || undefined,
    };
  }, [currentUser, currentProfile]);

  // Create stable assignableUsers array
  const stableAssignableUsers = useMemo(() => {
    return assignableUsers.map(user => ({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      departments: user.departments,
    }));
  }, [assignableUsers]);

  // Sync selectedAssignee with supportCase.assigned_to
  useEffect(() => {
    if (supportCase?.assigned_to) {
      setSelectedAssignee(supportCase.assigned_to);
    } else if (supportCase?.status !== 'unassigned') {
      // If assigned_to is null but status is not unassigned, it's assigned to support_team
      setSelectedAssignee('support_team');
    } else {
      setSelectedAssignee('');
    }
  }, [supportCase?.assigned_to, supportCase?.status]);

  // Fetch support case data
  const fetchSupportCase = useCallback(async () => {
    if (!supportCaseId) return;

    try {
      setSupportCaseLoading(true);
      let supportCaseData;
      if (isAdmin) {
        supportCaseData = await adminAPI.getSupportCase(supportCaseId);
      } else {
        supportCaseData = await adminAPI.getUserSupportCase(supportCaseId);
      }
      setSupportCase(supportCaseData);
    } catch (error) {
      console.error('Error fetching support case:', error);
      setSupportCase(null);
    } finally {
      setSupportCaseLoading(false);
    }
  }, [supportCaseId, isAdmin]);

  // Handle assignee change from GlobalLowerHeader
  const handleAssigneeChange = useCallback(
    async (assigneeId: string) => {
      if (!supportCaseId || !supportCase) return;

      try {
        const updateData: any = {};
        let successMessage = 'Support case assigned successfully!';

        // Handle team assignment (support_team becomes null in database)
        if (assigneeId === 'support_team') {
          updateData.assigned_to = null;
          successMessage = 'Support case assigned to support team successfully!';
        } else {
          updateData.assigned_to = assigneeId;
        }

        // Auto-progress status if currently unassigned
        if (supportCase.status === 'unassigned') {
          updateData.status = 'in_progress';
          successMessage = assigneeId === 'support_team'
            ? 'Support case assigned to support team and moved to In Progress!'
            : 'Support case assigned and moved to In Progress!';
        }

        if (isAdmin) {
          await adminAPI.updateSupportCase(supportCaseId, updateData);
        } else {
          await adminAPI.updateUserSupportCase(supportCaseId, updateData);
        }

        await fetchSupportCase();
        handleShowToast(successMessage, 'success');
      } catch (error) {
        console.error('Error assigning support case:', error);
        handleShowToast('Failed to assign support case. Please try again.', 'error');
      }
    },
    [supportCaseId, supportCase, isAdmin, fetchSupportCase]
  );

  // Handle status change from GlobalLowerHeader
  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!supportCaseId || !supportCase) return;

      const statusMessages: Record<string, string> = {
        unassigned: 'Support case moved to Unassigned!',
        in_progress: 'Support case moved to In Progress!',
        awaiting_response: 'Support case moved to Awaiting Response!',
        resolved: 'Support case marked as Resolved!',
      };

      try {
        if (isAdmin) {
          await adminAPI.updateSupportCase(supportCaseId, { status });
        } else {
          await adminAPI.updateUserSupportCase(supportCaseId, { status });
        }

        await fetchSupportCase();
        handleShowToast(statusMessages[status] || 'Status updated successfully!', 'success');
      } catch (error) {
        console.error('Error updating support case status:', error);
        handleShowToast('Failed to update status. Please try again.', 'error');
      }
    },
    [supportCaseId, supportCase, isAdmin, fetchSupportCase]
  );

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setSupportCaseId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

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
        setIsAdmin(isAuthorizedAdminSync(profileData));
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

  // Fetch support case when supportCaseId is available
  useEffect(() => {
    if (supportCaseId && !loading) {
      fetchSupportCase();
    }
  }, [supportCaseId, loading, fetchSupportCase]);

  // Update page header when support case data changes
  useEffect(() => {
    if (supportCase && stableCurrentUser) {
      const customerName = supportCase.customer
        ? `${supportCase.customer.first_name || ''} ${supportCase.customer.last_name || ''}`.trim() || 'Support Case'
        : 'Support Case';

      // Format timestamps with HTML formatting
      const createdDate = formatHeaderDate(supportCase.created_at, true);
      const updatedDate = formatHeaderDate(supportCase.updated_at, true);
      const description = `Created: <span>${createdDate}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Last update: <span>${updatedDate}</span>`;

      setPageHeader({
        title: customerName,
        description: description,
        supportCaseAssignmentControls: {
          caseStatus: supportCase.status,
          assignedTo: selectedAssignee,
          assignedUser: supportCase.assigned_user,
          assignableUsers: stableAssignableUsers,
          currentUser: stableCurrentUser,
          onAssigneeChange: handleAssigneeChange,
          onStatusChange: handleStatusChange,
        },
      });
    }

    // Cleanup: clear the header when component unmounts
    return () => {
      setPageHeader(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    supportCase,
    stableCurrentUser,
    selectedAssignee,
    stableAssignableUsers,
    // setPageHeader is intentionally omitted - it's a stable context setter
    handleAssigneeChange,
    handleStatusChange,
  ]);

  const handleBack = () => {
    router.push('/tickets/customer-service');
  };

  const handleShowToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

  if (loading || supportCaseLoading) {
    return <div className={styles.loading}>Loading support case...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!supportCase) {
    return <div className={styles.error}>Support case not found</div>;
  }

  return (
    <ActiveSectionProvider>
      <div className="container">
        <div className={styles.pageLayout}>
          <div className={styles.mainContent}>
            <SupportCaseStepContent
              supportCase={supportCase}
              isAdmin={isAdmin}
              onSupportCaseUpdate={fetchSupportCase}
              onShowToast={handleShowToast}
            />
          </div>
          <SupportCaseDetailsSidebar
            supportCase={supportCase}
            onShowToast={handleShowToast}
            isSidebarExpanded={isSidebarExpanded}
            setIsSidebarExpanded={setIsSidebarExpanded}
          />
        </div>

        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={handleToastClose}
          type={toastType}
        />
      </div>
    </ActiveSectionProvider>
  );
}

export default function SupportCaseDetailPage({ params }: SupportCasePageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SupportCaseDetailPageContent params={params} />
    </Suspense>
  );
}