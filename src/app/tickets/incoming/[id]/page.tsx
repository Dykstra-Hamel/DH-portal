'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Ticket,
  ticketSourceOptions,
  ticketTypeOptions,
  ticketStatusOptions,
  ticketPriorityOptions,
} from '@/types/ticket';
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Trash2,
} from 'lucide-react';
import { CallHistory } from '@/components/Calls/CallHistory/CallHistory';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [callHistoryRefresh, setCallHistoryRefresh] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setTicketId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (!ticketId) return;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tickets/${ticketId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch ticket');
        }

        const ticketData = await response.json();
        setTicket(ticketData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdminStatus();
  }, []);

  const getStatusColor = (status: string) => {
    const statusColorMap: { [key: string]: string } = {
      new: '#3b82f6',
      contacted: '#f59e0b',
      qualified: '#06b6d4',
      quoted: '#8b5cf6',
      in_progress: '#f59e0b',
      resolved: '#10b981',
      closed: '#6b7280',
      won: '#10b981',
      lost: '#ef4444',
      unqualified: '#6b7280',
    };
    return statusColorMap[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColorMap: { [key: string]: string } = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626',
    };
    return priorityColorMap[priority] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTicketDisplayTitle = (ticket: Ticket) => {
    if (ticket.customer) {
      return `${ticket.customer.first_name} ${ticket.customer.last_name}&apos;s Ticket`;
    }
    if (ticket.description) {
      const preview = ticket.description.slice(0, 50);
      return ticket.description.length > 50 ? `${preview}...` : preview;
    }
    return `${ticket.type} - ${new Date(ticket.created_at || '').toLocaleDateString()}`;
  };

  const isConverted = ticket?.converted_to_lead_id;

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ticketId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete ticket');
      }

      // Redirect to tickets page after successful deletion
      router.push('/tickets/incoming');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading ticket details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: '#ef4444' }}>Error: {error}</div>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Ticket not found</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
            }}
          >
            {getTicketDisplayTitle(ticket)}
          </h1>

          {isAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              <Trash2 size={16} />
              Delete Ticket
            </button>
          )}
        </div>

        {isConverted && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              border: '1px solid #22c55e',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>✓ This ticket has been converted to a lead</span>
            <a
              href={`/leads/${ticket.converted_to_lead_id}`}
              style={{
                color: '#166534',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              View Lead →
            </a>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: getStatusColor(ticket.status),
            }}
          >
            {ticketStatusOptions.find(s => s.value === ticket.status)?.label}
          </span>

          <span
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: getPriorityColor(ticket.priority),
            }}
          >
            {
              ticketPriorityOptions.find(p => p.value === ticket.priority)
                ?.label
            }
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}
      >
        {/* Left Column - Main Details */}
        <div>
          {/* Description */}
          {ticket.description && (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                Description
              </h3>
              <p style={{ margin: 0, lineHeight: '1.5', color: '#374151' }}>
                {ticket.description}
              </p>
            </div>
          )}

          {/* Customer Information */}
          {ticket.customer && (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                Customer Information
              </h3>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <User size={16} style={{ color: '#6b7280' }} />
                <span style={{ fontWeight: '500' }}>
                  {ticket.customer.first_name} {ticket.customer.last_name}
                </span>
              </div>

              {ticket.customer.email && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <Mail size={16} style={{ color: '#6b7280' }} />
                  <a
                    href={`mailto:${ticket.customer.email}`}
                    style={{ color: '#3b82f6' }}
                  >
                    {ticket.customer.email}
                  </a>
                </div>
              )}

              {ticket.customer.phone && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <Phone size={16} style={{ color: '#6b7280' }} />
                  <a
                    href={`tel:${ticket.customer.phone}`}
                    style={{ color: '#3b82f6' }}
                  >
                    {ticket.customer.phone}
                  </a>
                </div>
              )}

              {ticket.customer.address && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginTop: '12px',
                  }}
                >
                  <MapPin
                    size={16}
                    style={{ color: '#6b7280', marginTop: '2px' }}
                  />
                  <div>
                    <div>{ticket.customer.address}</div>
                    {(ticket.customer.city ||
                      ticket.customer.state ||
                      ticket.customer.zip_code) && (
                      <div style={{ color: '#6b7280' }}>
                        {ticket.customer.city && `${ticket.customer.city}, `}
                        {ticket.customer.state} {ticket.customer.zip_code}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call History - Only show for phone call tickets */}
          {ticket.type === 'phone_call' && ticketId && (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            >
              <CallHistory
                ticketId={ticketId}
                refreshTrigger={callHistoryRefresh}
                isAdmin={true}
              />
            </div>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div>
          {/* Ticket Details */}
          <div
            style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              Ticket Details
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '2px',
                }}
              >
                Source
              </div>
              <div style={{ fontWeight: '500' }}>
                {
                  ticketSourceOptions.find(s => s.value === ticket.source)
                    ?.label
                }
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '2px',
                }}
              >
                Type
              </div>
              <div style={{ fontWeight: '500' }}>
                {ticketTypeOptions.find(t => t.value === ticket.type)?.label}
              </div>
            </div>

            {ticket.service_type && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '2px',
                  }}
                >
                  Service Type
                </div>
                <div style={{ fontWeight: '500' }}>{ticket.service_type}</div>
              </div>
            )}

            {ticket.pest_type && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '2px',
                  }}
                >
                  Pest Type
                </div>
                <div style={{ fontWeight: '500' }}>{ticket.pest_type}</div>
              </div>
            )}

            {ticket.estimated_value && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '2px',
                  }}
                >
                  Estimated Value
                </div>
                <div style={{ fontWeight: '500' }}>
                  ${ticket.estimated_value}
                </div>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div
            style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              Timeline
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '2px',
                }}
              >
                Created
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Calendar size={14} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '14px' }}>
                  {formatDate(ticket.created_at)}
                </span>
              </div>
            </div>

            {ticket.last_contacted_at && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '2px',
                  }}
                >
                  Last Contacted
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Calendar size={14} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '14px' }}>
                    {formatDate(ticket.last_contacted_at)}
                  </span>
                </div>
              </div>
            )}

            {ticket.resolved_at && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '2px',
                  }}
                >
                  Resolved
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Calendar size={14} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '14px' }}>
                    {formatDate(ticket.resolved_at)}
                  </span>
                </div>
              </div>
            )}

            {ticket.next_follow_up_at && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '2px',
                  }}
                >
                  Next Follow-up
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Calendar size={14} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '14px' }}>
                    {formatDate(ticket.next_follow_up_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleDeleteCancel}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                }}
              >
                Delete Ticket
              </h3>
              <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.5' }}>
                Are you sure you want to delete this ticket? This action cannot
                be undone.
              </p>
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <strong>Ticket:</strong> {getTicketDisplayTitle(ticket)}
                <br />
                <strong>Status:</strong> {ticket?.status || 'Unknown'}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
