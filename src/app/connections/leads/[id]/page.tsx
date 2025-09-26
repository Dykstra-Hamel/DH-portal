'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  User as UserIcon,
  Save,
  X,
  PhoneCall,
  Trash2,
} from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import {
  Lead,
  leadSourceOptions,
  leadTypeOptions,
  leadStatusOptions,
  leadPriorityOptions,
} from '@/types/lead';
import { CallHistory } from '@/components/Calls/CallHistory/CallHistory';
import { UserSelector } from '@/components/Common/UserSelector';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { formatDateForDisplay } from '@/lib/utils';
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
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [callHistoryRefresh, setCallHistoryRefresh] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Hook for fetching assignable users for sales leads
  const {
    users: assignableUsers,
    loading: loadingUsers,
    error: usersError,
  } = useAssignableUsers({
    companyId: lead?.company_id,
    departmentType: 'sales',
    enabled: isEditing, // Only fetch when editing
  });

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

  const fetchLead = useCallback(async () => {
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

  // Define handleEdit before the useEffect that uses it
  const handleEdit = useCallback(() => {
    if (lead) {
      setEditFormData({
        lead_source: lead.lead_source,
        lead_type: lead.lead_type,
        service_type: lead.service_type || '',
        lead_status: lead.lead_status,
        priority: lead.priority,
        estimated_value: lead.estimated_value || 0,
        comments: lead.comments || '',
        assigned_to: lead.assigned_to || '',
        last_contacted_at: lead.last_contacted_at || '',
        next_follow_up_at: lead.next_follow_up_at || '',
        utm_source: lead.utm_source || '',
        utm_medium: lead.utm_medium || '',
        utm_campaign: lead.utm_campaign || '',
        utm_term: lead.utm_term || '',
        utm_content: lead.utm_content || '',
      });
      setIsEditing(true);

      // Clear the edit URL parameter to prevent edit mode loop
      if (searchParams.get('edit') === 'true') {
        const url = new URL(window.location.href);
        url.searchParams.delete('edit');
        router.replace(url.pathname + url.search);
      }
    }
  }, [lead, searchParams, router]);

  // Auto-trigger edit mode when edit=true parameter is present
  useEffect(() => {
    const shouldAutoEdit = searchParams.get('edit') === 'true';
    if (shouldAutoEdit && lead && !isEditing && !leadLoading) {
      handleEdit();
    }
  }, [lead, isEditing, leadLoading, handleEdit, searchParams]);

  const handleBack = () => {
    router.push('/connections/leads');
  };

  const handleBackToCustomer = () => {
    if (lead?.customer_id) {
      router.push(`/customers/${lead.customer_id}`);
    }
  };

  const handlePhoneCall = async () => {
    if (!lead || !lead.customer) {
      alert('No customer information available for this lead.');
      return;
    }

    if (!lead.customer.phone) {
      alert('No phone number available for this customer.');
      return;
    }

    if (!lead.company_id) {
      alert('Company information is missing for this lead.');
      return;
    }

    try {
      setIsCallLoading(true);

      const isFollowUp = lead.lead_status !== 'unassigned';

      // Prepare call request data to send to our retell-call API
      const callRequest = {
        firstName: lead.customer.first_name || 'Customer',
        lastName: lead.customer.last_name || '',
        email: lead.customer.email || '',
        phone: lead.customer.phone,
        message: `Lead Status: ${lead.lead_status}\n\nComments: ${lead.comments || ''}\n\nCall Type: ${isFollowUp ? 'Follow-up' : 'Initial Contact'}`,
        streetAddress: lead.customer.address || '',
        city: lead.customer.city || '',
        state: lead.customer.state || '',
        zipCode: lead.customer.zip_code || '',
        companyId: lead.company_id,
      };

      // Use our retell-call API endpoint which handles company-specific configuration
      const response = await fetch('/api/retell-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Call API Error:', {
          status: response.status,
          error: errorData,
        });

        // Show specific error message from API
        let errorMessage = 'Failed to initiate phone call.';
        if (errorData.error) {
          errorMessage = errorData.error;
        }

        alert(errorMessage);
        return;
      }

      const result = await response.json();

      if (result.success) {
        // Show success message
        alert(
          `Phone call initiated successfully! Call ID: ${result.callId || 'N/A'}`
        );

        // Refresh call history to show the new call
        setCallHistoryRefresh(prev => prev + 1);
      } else {
        alert(result.error || 'Failed to initiate phone call.');
      }
    } catch (error) {
      console.error('Error creating phone call:', error);
      alert(
        'Failed to initiate phone call. Please check your internet connection and try again.'
      );
    } finally {
      setIsCallLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const handleSave = async () => {
    if (!leadId || !editFormData) return;

    try {
      setSaving(true);

      // Clean up the form data to handle empty strings and null values
      const cleanFormData = {
        ...editFormData,
        // Convert empty strings to null for timestamp fields
        last_contacted_at: editFormData.last_contacted_at || null,
        next_follow_up_at: editFormData.next_follow_up_at || null,
        // Convert empty strings to null for optional fields
        utm_source: editFormData.utm_source || null,
        utm_medium: editFormData.utm_medium || null,
        utm_campaign: editFormData.utm_campaign || null,
        utm_term: editFormData.utm_term || null,
        utm_content: editFormData.utm_content || null,
        assigned_to: editFormData.assigned_to || null,
        // Ensure estimated_value is a number
        estimated_value: parseFloat(editFormData.estimated_value) || 0,
      };

      // Log the save attempt for debugging
      console.log('Attempting to save lead:', {
        leadId,
        originalData: editFormData,
        cleanedData: cleanFormData,
        isAdmin,
        currentUser: user?.id,
      });

      let updatedLead;
      if (isAdmin) {
        updatedLead = await adminAPI.updateLead(leadId, cleanFormData);
      } else {
        updatedLead = await adminAPI.updateUserLead(leadId, cleanFormData);
      }

      console.log('Lead save successful:', updatedLead);
      setLead(updatedLead);
      setIsEditing(false);
      setEditFormData(null);
      // Trigger call history refresh in case customer phone number changed
      setCallHistoryRefresh(prev => prev + 1);
    } catch (error: any) {
      console.error('Error updating lead:', {
        error,
        leadId,
        formData: editFormData,
        errorMessage: error.message,
        errorResponse: error.response?.data,
      });

      // Display more specific error message
      let errorMessage = 'Failed to update lead. Please try again.';

      if (error.response?.data?.error) {
        errorMessage = `Failed to update lead: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Failed to update lead: ${error.message}`;
      }

      // Show error with additional details if available
      if (error.response?.data?.errorCode) {
        errorMessage += `\n\nError Code: ${error.response.data.errorCode}`;
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value,
      });
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lead');
      }

      // Redirect to leads page after successful deletion
      router.push('/connections/leads');
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      new: '#3b82f6',
      contacted: '#f59e0b',
      qualified: '#06b6d4',
      quoted: '#8b5cf6',
      won: '#10b981',
      lost: '#ef4444',
      unqualified: '#6b7280',
    };
    return statusColors[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: { [key: string]: string } = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626',
    };
    return priorityColors[priority] || '#6b7280';
  };

  const formatComments = (comments: string) => {
    if (!comments) return [];

    // Split comments by double newlines to separate different entries
    const entries = comments.split('\n\n').filter(entry => entry.trim());

    return entries.map((entry, index) => {
      const trimmedEntry = entry.trim();

      // Function to parse and format timestamps in comment text
      const formatTimestampsInText = (text: string) => {
        // Pattern to match ISO timestamps in comments (e.g., "2025-08-14T17:24:00.000Z")
        const isoTimestampPattern =
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z/g;

        return text.replace(isoTimestampPattern, match => {
          try {
            return formatDateForDisplay(match);
          } catch (error) {
            // If parsing fails, return the original timestamp
            console.error('Failed to parse timestamp:', match, error);
            return match;
          }
        });
      };

      // Check if this entry starts with a call record pattern
      if (
        trimmedEntry.startsWith('📞 Call on') ||
        trimmedEntry.startsWith('📞 Inbound call started at') ||
        trimmedEntry.startsWith('📞 Inbound call on') ||
        trimmedEntry.startsWith('📊 Call Analysis:')
      ) {
        return (
          <div key={index} className={styles.commentEntry}>
            <div className={styles.callEntry}>
              {formatTimestampsInText(trimmedEntry)}
            </div>
          </div>
        );
      }

      // Check if this is an old-style call entry (contains "Call call_" pattern)
      const oldCallPattern = /Call call_[a-zA-Z0-9]+ (completed|ended|failed)/;
      if (oldCallPattern.test(trimmedEntry)) {
        // Try to extract some basic info and format it better
        const statusMatch = trimmedEntry.match(/(completed|ended|failed)/);
        const status = statusMatch ? statusMatch[1] : 'unknown';
        return (
          <div key={index} className={styles.commentEntry}>
            <div className={styles.callEntry}>📞 Call - Status: {status}</div>
          </div>
        );
      }

      // Regular comment - split by newlines and preserve formatting, but still format any timestamps
      const lines = trimmedEntry.split('\n');
      return (
        <div key={index} className={styles.commentEntry}>
          <div className={styles.regularComment}>
            {lines.map((line, lineIndex) => (
              <div key={lineIndex}>{formatTimestampsInText(line)}</div>
            ))}
          </div>
        </div>
      );
    });
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
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Leads
        </button>
        <h1>{lead.service_type || 'Lead Details'}</h1>
        <div className={styles.headerButtons}>
          <button
            onClick={handlePhoneCall}
            disabled={isCallLoading || !lead.customer?.phone || isEditing}
            className={styles.callButton}
          >
            <PhoneCall size={16} />
            {isCallLoading
              ? 'Calling...'
              : lead.lead_status === 'unassigned'
                ? 'Call Customer'
                : 'Follow Up'}
          </button>
          {isEditing ? (
            <div className={styles.editActions}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={styles.saveButton}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className={styles.cancelButton}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button onClick={handleEdit} className={styles.editButton}>
                <Edit size={16} />
                Edit Lead
              </button>
              <button
                onClick={handleDeleteClick}
                className={styles.deleteButton}
                disabled={isEditing}
              >
                <Trash2 size={16} />
                Delete Lead
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.leftColumn}>
          {/* Customer Information Card */}
          <div className={styles.infoCard}>
            <h3>Customer Information</h3>
            <div className={styles.customerDetails}>
              {lead.customer ? (
                <>
                  <div className={styles.customerName}>
                    <UserIcon size={16} />
                    <button
                      onClick={handleBackToCustomer}
                      className={styles.customerLink}
                    >
                      {lead.customer.first_name} {lead.customer.last_name}
                    </button>
                  </div>
                  {lead.customer.email && (
                    <div className={styles.contactItem}>
                      <Mail size={16} />
                      <a href={`mailto:${lead.customer.email}`}>
                        {lead.customer.email}
                      </a>
                    </div>
                  )}
                  {lead.customer.phone && (
                    <div className={styles.contactItem}>
                      <Phone size={16} />
                      <a href={`tel:${lead.customer.phone}`}>
                        {lead.customer.phone}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noCustomer}>
                  <p>No customer associated with this lead</p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment & Timeline */}
          <div className={styles.infoCard}>
            <h3>Assignment & Timeline</h3>
            <div className={styles.assignmentDetails}>
              <div className={styles.detailItem}>
                <label>Assigned To</label>
                {lead.assigned_user ? (
                  <div className={styles.userInfo}>
                    <UserIcon size={16} />
                    <span>
                      {lead.assigned_user.first_name}{' '}
                      {lead.assigned_user.last_name}
                    </span>
                  </div>
                ) : (
                  <span className={styles.unassigned}>Unassigned</span>
                )}
              </div>
              {lead.last_contacted_at && (
                <div className={styles.detailItem}>
                  <label>Last Contacted</label>
                  <span>{formatDate(lead.last_contacted_at)}</span>
                </div>
              )}
              {lead.next_follow_up_at && (
                <div className={styles.detailItem}>
                  <label>Next Follow-up</label>
                  <span>{formatDate(lead.next_follow_up_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          {lead.comments && (
            <div className={styles.infoCard}>
              <h3>Comments</h3>
              <div className={styles.comments}>
                {formatComments(lead.comments)}
              </div>
            </div>
          )}

          {/* Call History */}
          <div className={styles.infoCard}>
            <CallHistory
              leadId={leadId!}
              refreshTrigger={callHistoryRefresh}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        <div className={styles.rightColumn}>
          {isEditing && editFormData ? (
            // Edit Form
            <div className={styles.infoCard}>
              <h3>Edit Lead Information</h3>
              <div className={styles.editForm}>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Service Type</label>
                    <input
                      type="text"
                      value={editFormData.service_type}
                      onChange={e =>
                        handleInputChange('service_type', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Estimated Value</label>
                    <input
                      type="number"
                      value={editFormData.estimated_value}
                      onChange={e =>
                        handleInputChange(
                          'estimated_value',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Lead Source</label>
                    <select
                      value={editFormData.lead_source}
                      onChange={e =>
                        handleInputChange('lead_source', e.target.value)
                      }
                      className={styles.select}
                    >
                      {leadSourceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Lead Type</label>
                    <select
                      value={editFormData.lead_type}
                      onChange={e =>
                        handleInputChange('lead_type', e.target.value)
                      }
                      className={styles.select}
                    >
                      {leadTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Status</label>
                    <select
                      value={editFormData.lead_status}
                      onChange={e =>
                        handleInputChange('lead_status', e.target.value)
                      }
                      className={styles.select}
                    >
                      {leadStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Priority</label>
                    <select
                      value={editFormData.priority}
                      onChange={e =>
                        handleInputChange('priority', e.target.value)
                      }
                      className={styles.select}
                    >
                      {leadPriorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Last Contacted</label>
                    <input
                      type="date"
                      value={
                        editFormData.last_contacted_at
                          ? editFormData.last_contacted_at.split('T')[0]
                          : ''
                      }
                      onChange={e =>
                        handleInputChange('last_contacted_at', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Next Follow-up</label>
                    <input
                      type="date"
                      value={
                        editFormData.next_follow_up_at
                          ? editFormData.next_follow_up_at.split('T')[0]
                          : ''
                      }
                      onChange={e =>
                        handleInputChange('next_follow_up_at', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label>Comments</label>
                  <textarea
                    value={editFormData.comments}
                    onChange={e =>
                      handleInputChange('comments', e.target.value)
                    }
                    className={styles.textarea}
                    rows={4}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>UTM Source</label>
                    <input
                      type="text"
                      value={editFormData.utm_source}
                      onChange={e =>
                        handleInputChange('utm_source', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>UTM Medium</label>
                    <input
                      type="text"
                      value={editFormData.utm_medium}
                      onChange={e =>
                        handleInputChange('utm_medium', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label>UTM Campaign</label>
                  <input
                    type="text"
                    value={editFormData.utm_campaign}
                    onChange={e =>
                      handleInputChange('utm_campaign', e.target.value)
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Assigned To</label>
                  <UserSelector
                    users={assignableUsers}
                    selectedUserId={editFormData.assigned_to}
                    onSelect={(userId) => handleInputChange('assigned_to', userId)}
                    placeholder="Select user to assign..."
                    loading={loadingUsers}
                    disabled={loadingUsers}
                    className={styles.userSelector}
                  />
                  {usersError && (
                    <div className={styles.errorMessage}>
                      Error loading users: {usersError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className={styles.infoCard}>
              <h3>Lead Information</h3>
              <div className={styles.leadDetails}>
                <div className={styles.detailItem}>
                  <label>Service Type</label>
                  <span>{lead.service_type || 'Not specified'}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Lead Source</label>
                  <span className={styles.sourceBadge}>{lead.lead_source}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Lead Type</label>
                  <span className={styles.typeBadge}>{lead.lead_type}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Status</label>
                  <span
                    className={styles.statusBadge}
                    style={{
                      backgroundColor: getStatusColor(lead.lead_status),
                    }}
                  >
                    {lead.lead_status.charAt(0).toUpperCase() +
                      lead.lead_status.slice(1)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Priority</label>
                  <span
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(lead.priority) }}
                  >
                    {lead.priority.charAt(0).toUpperCase() +
                      lead.priority.slice(1)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Estimated Value</label>
                  <span className={styles.valueAmount}>
                    {formatCurrency(lead.estimated_value || 0)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Created</label>
                  <span>{formatDate(lead.created_at)}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Last Updated</label>
                  <span>{formatDate(lead.updated_at)}</span>
                </div>
              </div>
            </div>
          )}

          {/* UTM Parameters */}
          {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
            <div className={styles.infoCard}>
              <h3>UTM Parameters</h3>
              <div className={styles.utmDetails}>
                {lead.utm_source && (
                  <div className={styles.detailItem}>
                    <label>UTM Source</label>
                    <span>{lead.utm_source}</span>
                  </div>
                )}
                {lead.utm_medium && (
                  <div className={styles.detailItem}>
                    <label>UTM Medium</label>
                    <span>{lead.utm_medium}</span>
                  </div>
                )}
                {lead.utm_campaign && (
                  <div className={styles.detailItem}>
                    <label>UTM Campaign</label>
                    <span>{lead.utm_campaign}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Delete Lead</h3>
              <button
                className={styles.closeButton}
                onClick={handleDeleteCancel}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to delete this lead? This action cannot be
                undone.
              </p>
              <div className={styles.leadInfo}>
                <strong>Service Type:</strong>{' '}
                {lead?.service_type || 'Not specified'}
                <br />
                <strong>Customer:</strong>{' '}
                {lead?.customer
                  ? `${lead.customer.first_name} ${lead.customer.last_name}`
                  : 'No customer linked'}
                <br />
                <strong>Status:</strong> {lead?.lead_status || 'Unknown'}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleDeleteCancel}
                className={styles.cancelButton}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={styles.confirmDeleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
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
