'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import { Lead } from '@/types/lead';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { StepItem } from '@/components/Common/Step/Step';
import { LeadStepWrapper } from '@/components/Common/LeadStepWrapper/LeadStepWrapper';
import { LeadStepContent } from '@/components/Common/LeadStepContent/LeadStepContent';
import { ReassignModal } from '@/components/Common/ReassignModal/ReassignModal';
import { Toast } from '@/components/Common/Toast';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

function LeadDetailPageContent({ params }: LeadPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadLoading, setLeadLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const router = useRouter();

  // Step configuration for leads
  const leadSteps: StepItem[] = [
    { id: 'qualify', label: 'Qualify', status: 'upcoming' },
    { id: 'contacting', label: 'Contact', status: 'upcoming' },
    { id: 'quoted', label: 'Quote', status: 'upcoming' },
    { id: 'ready_to_schedule', label: 'Ready To Schedule', status: 'disabled' },
  ];

  // Update step statuses based on current lead status
  const getUpdatedSteps = (): StepItem[] => {
    if (!lead) return leadSteps;

    const currentStatus = lead.lead_status;

    // Map lead status to step IDs
    const statusToStep: { [key: string]: string } = {
      'unassigned': 'qualify',
      'contacting': 'contacting',
      'quoted': 'quoted',
      'ready_to_schedule': 'ready_to_schedule'
    };

    const currentStepId = statusToStep[currentStatus];
    const stepOrder = ['qualify', 'contacting', 'quoted', 'ready_to_schedule'];
    const currentIndex = stepOrder.indexOf(currentStepId);

    return leadSteps.map(step => {
      const stepIndex = stepOrder.indexOf(step.id);

      if (step.id === 'ready_to_schedule') {
        // Ready to Schedule is completed when it's the current status
        if (currentStatus === 'ready_to_schedule') {
          return { ...step, status: 'completed' };
        }
        return { ...step, status: 'disabled' };
      }

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
    if (!lead || !leadId) return;

    // Don't allow clicking on Ready To Schedule step
    if (stepId === 'ready_to_schedule') return;

    // Map step IDs to lead statuses
    const stepToStatus: { [key: string]: string } = {
      'qualify': 'unassigned',
      'contacting': 'contacting',
      'quoted': 'quoted',
    };

    // Map step IDs to success messages
    const stepToMessage: { [key: string]: string } = {
      'qualify': 'Lead moved to Qualify stage successfully!',
      'contacting': 'Lead moved to Contact stage successfully!',
      'quoted': 'Lead moved to Quote stage successfully!',
    };

    const newStatus = stepToStatus[stepId];
    const successMessage = stepToMessage[stepId];
    if (!newStatus) return;

    try {
      // Update the lead status via API
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: newStatus
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: newStatus
        });
      }

      // If moving to quoted status, ensure quote exists
      if (newStatus === 'quoted') {
        try {
          const response = await fetch(`/api/leads/${leadId}/quote`, {
            method: 'GET',
          });
          const data = await response.json();

          // If no quote exists, the ensureQuoteExists will be called on the Quote step load
          if (!data.data) {
            console.log('Quote will be created when Quote step loads');
          }
        } catch (error) {
          console.error('Error checking quote:', error);
        }
      }

      // Refresh the lead data to update the UI
      await fetchLead();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error updating lead status:', error);
      handleShowToast('Failed to update lead status. Please try again.', 'error');
    }
  };

  // Handle status progression button
  const handleProgressStatus = async () => {
    if (!lead || !leadId) return;

    let newStatus: string;
    let successMessage: string;

    switch (lead.lead_status) {
      case 'unassigned':
        newStatus = 'contacting';
        successMessage = 'Lead moved to Contact stage successfully!';
        break;
      case 'contacting':
        newStatus = 'quoted';
        successMessage = 'Lead moved to Quote stage successfully!';
        break;
      case 'quoted':
        newStatus = 'ready_to_schedule';
        successMessage = 'Lead marked as Ready to Schedule successfully!';
        break;
      default:
        return; // No progression available
    }

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: newStatus
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: newStatus
        });
      }

      // If moving to quoted status, ensure quote exists
      if (newStatus === 'quoted') {
        try {
          const response = await fetch(`/api/leads/${leadId}/quote`, {
            method: 'GET',
          });
          const data = await response.json();

          // If no quote exists, the ensureQuoteExists will be called on the Quote step load
          if (!data.data) {
            console.log('Quote will be created when Quote step loads');
          }
        } catch (error) {
          console.error('Error checking quote:', error);
        }
      }

      await fetchLead();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error updating lead status:', error);
      handleShowToast('Failed to update lead status. Please try again.', 'error');
    }
  };

  // Handle mark as lost button
  const handleMarkAsLost = async () => {
    if (!lead || !leadId) return;

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: 'lost'
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: 'lost'
        });
      }
      await fetchLead();
      handleShowToast('Lead marked as lost successfully!', 'success');
    } catch (error) {
      console.error('Error marking lead as lost:', error);
      handleShowToast('Failed to mark lead as lost. Please try again.', 'error');
    }
  };

  // Get dynamic button text based on current status
  const getPrimaryButtonText = () => {
    if (!lead) return 'Next Step';

    switch (lead.lead_status) {
      case 'unassigned':
        return 'Move To Contact';
      case 'contacting':
        return 'Move To Quote';
      case 'quoted':
        return 'Ready To Schedule';
      default:
        return 'Next Step';
    }
  };

  // Determine if primary button should be shown
  const shouldShowPrimaryButton = () => {
    if (!lead) return false;
    return ['unassigned', 'contacting', 'quoted'].includes(lead.lead_status);
  };

  // Determine if secondary button should be shown
  const shouldShowSecondaryButton = () => {
    if (!lead) return false;
    return lead.lead_status !== 'lost';
  };

  // Handle reassign modal
  const handleReassign = () => {
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (assigneeId: string) => {
    if (!leadId) return;

    try {
      const updateData: any = {};
      let successMessage = 'Lead reassigned successfully!';

      if (assigneeId === 'sales_team') {
        updateData.assigned_to = null;
        // Keep current status when assigned to team
        successMessage = 'Lead assigned to sales team successfully!';
      } else {
        updateData.assigned_to = assigneeId;
        // Auto-progress status only if currently unassigned
        if (lead?.lead_status === 'unassigned') {
          updateData.lead_status = 'contacting';
          successMessage = 'Lead assigned and status updated to contacting!';
        } else {
          successMessage = 'Lead reassigned successfully!';
        }
      }

      if (isAdmin) {
        await adminAPI.updateLead(leadId, updateData);
      } else {
        await adminAPI.updateUserLead(leadId, updateData);
      }

      await fetchLead();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error reassigning lead:', error);
      handleShowToast('Failed to reassign lead. Please try again.', 'error');
      throw error;
    }
  };

  // Handle move to previous step
  const handleMoveToPrevious = async () => {
    if (!lead || !leadId) return;

    let previousStatus: string;
    let successMessage: string;

    switch (lead.lead_status) {
      case 'quoted':
        previousStatus = 'contacting';
        successMessage = 'Lead moved back to Contact stage successfully!';
        break;
      case 'contacting':
        previousStatus = 'unassigned';
        successMessage = 'Lead moved back to Qualify stage successfully!';
        break;
      default:
        return; // No previous step available
    }

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: previousStatus
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: previousStatus
        });
      }
      await fetchLead();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error moving to previous step:', error);
      handleShowToast('Failed to move to previous step. Please try again.', 'error');
    }
  };

  // Handle archive lead
  const handleArchiveLead = async () => {
    if (!leadId) return;

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: 'lost',
          archived: true
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: 'lost',
          archived: true
        });
      }
      await fetchLead();
      handleShowToast('Lead archived successfully!', 'success');
    } catch (error) {
      console.error('Error archiving lead:', error);
      handleShowToast('Failed to archive lead. Please try again.', 'error');
    }
  };

  // Check if previous step is available
  const canMoveToPrevious = () => {
    if (!lead) return false;
    return ['quoted', 'contacting'].includes(lead.lead_status);
  };

  // Create dropdown actions
  const getDropdownActions = () => {
    if (!lead) return [];

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
      label: 'Reassign Lead',
      onClick: handleReassign,
      disabled: false
    });

    // Move to previous step
    if (canMoveToPrevious()) {
      const previousStepLabel = lead.lead_status === 'quoted' ? 'Move to Contact' :
                               lead.lead_status === 'contacting' ? 'Move to Qualify' : '';
      if (previousStepLabel) {
        actions.push({
          label: previousStepLabel,
          onClick: handleMoveToPrevious,
          disabled: false
        });
      }
    }

    // Archive lead
    if (lead.lead_status !== 'lost' && !lead.archived) {
      actions.push({
        label: 'Archive Lead',
        onClick: handleArchiveLead,
        disabled: false
      });
    }

    return actions;
  };

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLeadId(resolvedParams.id);
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

  const fetchLead = useCallback(async (updatedLead?: Lead) => {
    // If we have an updated lead passed in (optimistic update), use it directly
    if (updatedLead) {
      setLead(updatedLead);
      return;
    }

    // Otherwise fetch from API
    if (!leadId) return;

    try {
      setLeadLoading(true);
      let leadData;
      if (isAdmin) {
        leadData = await adminAPI.getLead(leadId);
      } else {
        leadData = await adminAPI.getUserLead(leadId);
      }
      setLead(leadData);
    } catch (error) {
      console.error('Error fetching lead:', error);
      setLead(null);
    } finally {
      setLeadLoading(false);
    }
  }, [leadId, isAdmin]);

  // Fetch lead when leadId is available
  useEffect(() => {
    if (leadId && !loading) {
      fetchLead();
    }
  }, [leadId, loading, fetchLead]);


  const handleBack = () => {
    router.push('/connections/leads');
  };

  const handleShowToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

  if (loading || leadLoading) {
    return <div className={styles.loading}>Loading lead...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!lead) {
    return (
      <div className={styles.error}>
        <h2>Lead not found</h2>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Lead Step Wrapper Component */}
      <LeadStepWrapper
        customerName={
          lead.customer
            ? `${lead.customer.first_name} ${lead.customer.last_name}`
            : 'No Customer Assigned'
        }
        createdAt={lead.created_at}
        updatedAt={lead.updated_at}
        steps={getUpdatedSteps()}
        currentStep={
          lead.lead_status === 'unassigned' ? 'qualify' :
          lead.lead_status === 'contacting' ? 'contacting' :
          lead.lead_status === 'quoted' ? 'quoted' :
          lead.lead_status === 'ready_to_schedule' ? 'ready_to_schedule' :
          'qualify'
        }
        onStepClick={handleStepClick}
        disabledSteps={lead.lead_status === 'ready_to_schedule' ? [] : ['ready_to_schedule']}
        dropdownActions={getDropdownActions()}
        showDropdown={true}
      />


      <div className={styles.content}>
        <LeadStepContent
          lead={lead}
          isAdmin={isAdmin}
          onLeadUpdate={fetchLead}
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
          lead.customer
            ? `${lead.customer.first_name} ${lead.customer.last_name}`
            : 'No Customer Assigned'
        }
        customerEmail={lead.customer?.email}
        customerPhone={lead.customer?.phone}
        companyId={lead.company_id}
        currentAssigneeId={lead.assigned_to}
        type="lead"
      />
    </div>
  );
}

export default function LeadDetailPage({ params }: LeadPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadDetailPageContent params={params} />
    </Suspense>
  );
}
