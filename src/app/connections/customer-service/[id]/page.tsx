'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import { SupportCase } from '@/types/support-case';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { StepItem } from '@/components/Common/Step/Step';
import { LeadStepWrapper } from '@/components/Common/LeadStepWrapper/LeadStepWrapper';
import { SupportCaseStepContent } from '@/components/Common/SupportCaseStepContent/SupportCaseStepContent';
import { ReassignModal } from '@/components/Common/ReassignModal/ReassignModal';
import { Toast } from '@/components/Common/Toast';
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
  const [showReassignModal, setShowReassignModal] = useState(false);
  const router = useRouter();

  // Step configuration for support cases
  const supportCaseSteps: StepItem[] = [
    { id: 'unassigned', label: 'Unassigned', status: 'upcoming' },
    { id: 'in_progress', label: 'In Progress', status: 'upcoming' },
    { id: 'awaiting_response', label: 'Awaiting Response', status: 'upcoming' },
    { id: 'resolved', label: 'Resolved', status: 'upcoming' },
  ];

  // Update step statuses based on current support case status
  const getUpdatedSteps = (): StepItem[] => {
    if (!supportCase) return supportCaseSteps;

    const currentStatus = supportCase.status;

    // Map support case status to step IDs
    const statusToStep: { [key: string]: string } = {
      'unassigned': 'unassigned',
      'in_progress': 'in_progress',
      'awaiting_response': 'awaiting_response',
      'resolved': 'resolved'
    };

    const currentStepId = statusToStep[currentStatus];
    const stepOrder = ['unassigned', 'in_progress', 'awaiting_response', 'resolved'];
    const currentIndex = stepOrder.indexOf(currentStepId);

    return supportCaseSteps.map(step => {
      const stepIndex = stepOrder.indexOf(step.id);

      if (step.id === currentStepId) {
        return { ...step, status: 'current' };
      }

      if (stepIndex < currentIndex) {
        return { ...step, status: 'completed' };
      }

      return { ...step, status: 'upcoming' };
    });
  };

  const handleStepClick = async (stepId: string) => {
    if (!supportCase || !supportCaseId) return;

    // Map step IDs to support case statuses
    const stepToStatus: { [key: string]: string } = {
      'unassigned': 'unassigned',
      'in_progress': 'in_progress',
      'awaiting_response': 'awaiting_response',
      'resolved': 'resolved',
    };

    // Map step IDs to success messages
    const stepToMessage: { [key: string]: string } = {
      'unassigned': 'Support case moved to Unassigned stage successfully!',
      'in_progress': 'Support case moved to In Progress stage successfully!',
      'awaiting_response': 'Support case moved to Awaiting Response stage successfully!',
      'resolved': 'Support case marked as Resolved successfully!',
    };

    const newStatus = stepToStatus[stepId];
    const successMessage = stepToMessage[stepId];
    if (!newStatus) return;

    try {
      // Update the support case status via API
      if (isAdmin) {
        await adminAPI.updateSupportCase(supportCaseId, {
          status: newStatus
        });
      } else {
        await adminAPI.updateUserSupportCase(supportCaseId, {
          status: newStatus
        });
      }

      // Refresh the support case data to update the UI
      await fetchSupportCase();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error updating support case status:', error);
      handleShowToast('Failed to update support case status. Please try again.', 'error');
    }
  };

  // Handle status progression button
  const handleProgressStatus = async () => {
    if (!supportCase || !supportCaseId) return;

    let newStatus: string;
    let successMessage: string;

    switch (supportCase.status) {
      case 'unassigned':
        newStatus = 'in_progress';
        successMessage = 'Support case moved to In Progress stage successfully!';
        break;
      case 'in_progress':
        newStatus = 'awaiting_response';
        successMessage = 'Support case moved to Awaiting Response stage successfully!';
        break;
      case 'awaiting_response':
        newStatus = 'resolved';
        successMessage = 'Support case marked as Resolved successfully!';
        break;
      default:
        return; // No progression available
    }

    try {
      if (isAdmin) {
        await adminAPI.updateSupportCase(supportCaseId, {
          status: newStatus
        });
      } else {
        await adminAPI.updateUserSupportCase(supportCaseId, {
          status: newStatus
        });
      }
      await fetchSupportCase();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error updating support case status:', error);
      handleShowToast('Failed to update support case status. Please try again.', 'error');
    }
  };

  // Handle archive button
  const handleArchive = async () => {
    if (!supportCase || !supportCaseId) return;

    try {
      if (isAdmin) {
        await adminAPI.archiveSupportCase(supportCaseId);
      } else {
        await adminAPI.archiveUserSupportCase(supportCaseId);
      }
      await fetchSupportCase();
      handleShowToast('Support case archived successfully!', 'success');
    } catch (error) {
      console.error('Error archiving support case:', error);
      handleShowToast('Failed to archive support case. Please try again.', 'error');
    }
  };

  // Get dynamic button text based on current status
  const getPrimaryButtonText = () => {
    if (!supportCase) return 'Next Step';

    switch (supportCase.status) {
      case 'unassigned':
        return 'Start Case';
      case 'in_progress':
        return 'Awaiting Response';
      case 'awaiting_response':
        return 'Mark as Resolved';
      default:
        return 'Next Step';
    }
  };

  // Determine if primary button should be shown
  const shouldShowPrimaryButton = () => {
    if (!supportCase) return false;
    return ['unassigned', 'in_progress', 'awaiting_response'].includes(supportCase.status);
  };

  // Determine if secondary button should be shown
  const shouldShowSecondaryButton = () => {
    if (!supportCase) return false;
    return supportCase.status !== 'resolved' && !supportCase.archived;
  };

  // Handle reassign modal
  const handleReassign = () => {
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (assigneeId: string) => {
    if (!supportCaseId) return;

    try {
      const updateData: any = {};
      let successMessage = 'Support case reassigned successfully!';

      if (assigneeId === 'support_team') {
        updateData.assigned_to = null;
        // Keep current status when assigned to team
        successMessage = 'Support case assigned to support team successfully!';
      } else {
        updateData.assigned_to = assigneeId;
        // Auto-progress status only if currently unassigned
        if (supportCase?.status === 'unassigned') {
          updateData.status = 'in_progress';
          successMessage = 'Support case assigned and status updated to in progress!';
        } else {
          successMessage = 'Support case reassigned successfully!';
        }
      }

      if (isAdmin) {
        await adminAPI.updateSupportCase(supportCaseId, updateData);
      } else {
        await adminAPI.updateUserSupportCase(supportCaseId, updateData);
      }

      await fetchSupportCase();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error reassigning support case:', error);
      handleShowToast('Failed to reassign support case. Please try again.', 'error');
      throw error;
    }
  };

  // Handle move to previous step
  const handleMoveToPrevious = async () => {
    if (!supportCase || !supportCaseId) return;

    let previousStatus: string;
    let successMessage: string;

    switch (supportCase.status) {
      case 'resolved':
        previousStatus = 'awaiting_response';
        successMessage = 'Support case moved back to Awaiting Response stage successfully!';
        break;
      case 'awaiting_response':
        previousStatus = 'in_progress';
        successMessage = 'Support case moved back to In Progress stage successfully!';
        break;
      case 'in_progress':
        previousStatus = 'unassigned';
        successMessage = 'Support case moved back to Unassigned stage successfully!';
        break;
      default:
        return; // No previous step available
    }

    try {
      if (isAdmin) {
        await adminAPI.updateSupportCase(supportCaseId, {
          status: previousStatus
        });
      } else {
        await adminAPI.updateUserSupportCase(supportCaseId, {
          status: previousStatus
        });
      }
      await fetchSupportCase();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error moving to previous step:', error);
      handleShowToast('Failed to move to previous step. Please try again.', 'error');
    }
  };

  // Check if previous step is available
  const canMoveToPrevious = () => {
    if (!supportCase) return false;
    return ['resolved', 'awaiting_response', 'in_progress'].includes(supportCase.status);
  };

  // Create dropdown actions
  const getDropdownActions = () => {
    if (!supportCase) return [];

    const actions = [];

    // Primary action
    if (shouldShowPrimaryButton()) {
      actions.push({
        label: getPrimaryButtonText(),
        onClick: handleProgressStatus,
        disabled: false
      });
    }

    // Reassign action
    actions.push({
      label: 'Reassign Case',
      onClick: handleReassign,
      disabled: false
    });

    // Move to previous step
    if (canMoveToPrevious()) {
      const previousStepLabel =
        supportCase.status === 'resolved' ? 'Move to Awaiting Response' :
        supportCase.status === 'awaiting_response' ? 'Move to In Progress' :
        supportCase.status === 'in_progress' ? 'Move to Unassigned' : '';
      if (previousStepLabel) {
        actions.push({
          label: previousStepLabel,
          onClick: handleMoveToPrevious,
          disabled: false
        });
      }
    }

    return actions;
  };

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

  // Fetch support case when supportCaseId is available
  useEffect(() => {
    if (supportCaseId && !loading) {
      fetchSupportCase();
    }
  }, [supportCaseId, loading, fetchSupportCase]);

  const handleBack = () => {
    router.push('/connections/customer-service');
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
    return (
      <div className={styles.error}>
        <h2>Support case not found</h2>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Support Cases
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Support Case Step Wrapper Component */}
      <LeadStepWrapper
        customerName={
          supportCase.customer
            ? `${supportCase.customer.first_name} ${supportCase.customer.last_name}`
            : 'No Customer Assigned'
        }
        createdAt={supportCase.created_at}
        updatedAt={supportCase.updated_at}
        steps={getUpdatedSteps()}
        currentStep={
          supportCase.status === 'unassigned' ? 'unassigned' :
          supportCase.status === 'in_progress' ? 'in_progress' :
          supportCase.status === 'awaiting_response' ? 'awaiting_response' :
          supportCase.status === 'resolved' ? 'resolved' :
          'unassigned'
        }
        onStepClick={handleStepClick}
        dropdownActions={getDropdownActions()}
        showDropdown={true}
      />

      <div className={styles.content}>
        <SupportCaseStepContent
          supportCase={supportCase}
          isAdmin={isAdmin}
          onSupportCaseUpdate={fetchSupportCase}
          onShowToast={handleShowToast}
        />
      </div>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
        type={toastType}
      />

      <ReassignModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        onAssign={handleReassignSubmit}
        customerName={
          supportCase.customer
            ? `${supportCase.customer.first_name} ${supportCase.customer.last_name}`
            : 'No Customer Assigned'
        }
        customerEmail={supportCase.customer?.email}
        customerPhone={supportCase.customer?.phone}
        companyId={supportCase.company_id}
        currentAssigneeId={supportCase.assigned_to}
        type="support_case"
      />
    </div>
  );
}

export default function SupportCaseDetailPage({ params }: SupportCasePageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SupportCaseDetailPageContent params={params} />
    </Suspense>
  );
}