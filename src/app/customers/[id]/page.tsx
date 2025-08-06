'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  User as UserIcon,
  Save,
  X,
} from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import { Customer, CustomerFormData } from '@/types/customer';
import { Lead } from '@/types/lead';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: CustomerPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [activeLeadsTab, setActiveLeadsTab] = useState<'active' | 'completed'>(
    'active'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<CustomerFormData | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setCustomerId(resolvedParams.id);
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

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;

    try {
      setCustomerLoading(true);
      let customerData;
      if (isAdmin) {
        customerData = await adminAPI.getCustomer(customerId);
      } else {
        customerData = await adminAPI.getUserCustomer(customerId);
      }
      setCustomer(customerData);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setCustomer(null);
    } finally {
      setCustomerLoading(false);
    }
  }, [customerId, isAdmin]);

  // Fetch customer when customerId is available
  useEffect(() => {
    if (customerId && !loading) {
      fetchCustomer();
    }
  }, [customerId, loading, isAdmin, fetchCustomer]);

  const handleBack = () => {
    router.push('/customers');
  };

  const handleEdit = () => {
    if (customer) {
      setEditFormData({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        customer_status: customer.customer_status,
        notes: customer.notes || '',
        company_id: customer.company_id,
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const handleSave = async () => {
    if (!customerId || !editFormData) return;

    try {
      setSaving(true);
      let updatedCustomer;
      if (isAdmin) {
        updatedCustomer = await adminAPI.updateCustomer(
          customerId,
          editFormData
        );
      } else {
        updatedCustomer = await adminAPI.updateUserCustomer(
          customerId,
          editFormData
        );
      }
      setCustomer(updatedCustomer);
      setIsEditing(false);
      setEditFormData(null);
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value,
      });
    }
  };

  const handleLeadClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
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

  if (loading || customerLoading) {
    return <div className={styles.loading}>Loading customer...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!customer) {
    return (
      <div className={styles.error}>
        <h2>Customer not found</h2>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Customers
        </button>
      </div>
    );
  }

  // Separate active and completed leads
  const activeLeads =
    customer.leads?.filter(lead =>
      ['new', 'contacted', 'qualified', 'quoted'].includes(lead.lead_status)
    ) || [];
  const completedLeads =
    customer.leads?.filter(lead =>
      ['won', 'lost', 'unqualified'].includes(lead.lead_status)
    ) || [];
  const displayLeads =
    activeLeadsTab === 'active' ? activeLeads : completedLeads;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Customers
        </button>
        <h1>
          {customer.first_name} {customer.last_name}
        </h1>
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
            <button onClick={handleCancelEdit} className={styles.cancelButton}>
              <X size={16} />
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={handleEdit} className={styles.editButton}>
            <Edit size={16} />
            Edit Customer
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.customerInfo}>
          {isEditing && editFormData ? (
            // Edit Form
            <>
              <div className={styles.infoCard}>
                <h3>Contact Information</h3>
                <div className={styles.editForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label>First Name</label>
                      <input
                        type="text"
                        value={editFormData.first_name}
                        onChange={e =>
                          handleInputChange('first_name', e.target.value)
                        }
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={editFormData.last_name}
                        onChange={e =>
                          handleInputChange('last_name', e.target.value)
                        }
                        className={styles.input}
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={e =>
                          handleInputChange('email', e.target.value)
                        }
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={e =>
                          handleInputChange('phone', e.target.value)
                        }
                        className={styles.input}
                      />
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label>Address</label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={e =>
                        handleInputChange('address', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label>City</label>
                      <input
                        type="text"
                        value={editFormData.city}
                        onChange={e =>
                          handleInputChange('city', e.target.value)
                        }
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>State</label>
                      <input
                        type="text"
                        value={editFormData.state}
                        onChange={e =>
                          handleInputChange('state', e.target.value)
                        }
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Zip Code</label>
                      <input
                        type="text"
                        value={editFormData.zip_code}
                        onChange={e =>
                          handleInputChange('zip_code', e.target.value)
                        }
                        className={styles.input}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Customer Details</h3>
                <div className={styles.editForm}>
                  <div className={styles.formField}>
                    <label>Status</label>
                    <select
                      value={editFormData.customer_status}
                      onChange={e =>
                        handleInputChange('customer_status', e.target.value)
                      }
                      className={styles.select}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Notes</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={e => handleInputChange('notes', e.target.value)}
                      className={styles.textarea}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Display Mode
            <>
              <div className={styles.infoCard}>
                <h3>Contact Information</h3>
                <div className={styles.contactDetails}>
                  {customer.email && (
                    <div className={styles.contactItem}>
                      <Mail size={16} />
                      <a href={`mailto:${customer.email}`}>{customer.email}</a>
                    </div>
                  )}
                  {customer.phone && (
                    <div className={styles.contactItem}>
                      <Phone size={16} />
                      <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                    </div>
                  )}
                  {(customer.address || customer.city || customer.state) && (
                    <div className={styles.contactItem}>
                      <MapPin size={16} />
                      <div>
                        {customer.address && <div>{customer.address}</div>}
                        {(customer.city || customer.state) && (
                          <div>
                            {[customer.city, customer.state, customer.zip_code]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {customer.company && (
                    <div className={styles.contactItem}>
                      <Building size={16} />
                      <span>{customer.company.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Customer Details</h3>
                <div className={styles.customerDetails}>
                  <div className={styles.detailItem}>
                    <label>Status</label>
                    <span
                      className={`${styles.statusBadge} ${styles[customer.customer_status]}`}
                    >
                      {customer.customer_status.charAt(0).toUpperCase() +
                        customer.customer_status.slice(1)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Customer Since</label>
                    <span>{formatDate(customer.created_at)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Total Leads</label>
                    <span>{customer.leads?.length || 0}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Total Value</label>
                    <span className={styles.totalValue}>
                      {formatCurrency(customer.total_value || 0)}
                    </span>
                  </div>
                </div>
                {customer.notes && (
                  <div className={styles.notes}>
                    <label>Notes</label>
                    <p>{customer.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.leadsSection}>
          <div className={styles.leadsHeader}>
            <h3>Leads History</h3>
            <div className={styles.leadsTabs}>
              <button
                className={`${styles.tab} ${activeLeadsTab === 'active' ? styles.active : ''}`}
                onClick={() => setActiveLeadsTab('active')}
              >
                Active Leads ({activeLeads.length})
              </button>
              <button
                className={`${styles.tab} ${activeLeadsTab === 'completed' ? styles.active : ''}`}
                onClick={() => setActiveLeadsTab('completed')}
              >
                Completed Leads ({completedLeads.length})
              </button>
            </div>
          </div>

          {displayLeads.length === 0 ? (
            <div className={styles.noLeads}>
              <p>No {activeLeadsTab} leads found.</p>
            </div>
          ) : (
            <div className={styles.leadsTable}>
              {displayLeads.map(lead => (
                <div
                  key={lead.id}
                  className={`${styles.leadCard} ${activeLeadsTab === 'active' ? styles.clickable : ''}`}
                  onClick={() =>
                    activeLeadsTab === 'active'
                      ? handleLeadClick(lead.id)
                      : undefined
                  }
                >
                  <div className={styles.leadHeader}>
                    <div className={styles.leadTitle}>
                      <h4>{lead.service_type}</h4>
                      <span className={styles.leadSource}>
                        {lead.lead_source}
                      </span>
                    </div>
                    <div className={styles.leadBadges}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: getStatusColor(lead.lead_status),
                        }}
                      >
                        {lead.lead_status}
                      </span>
                      <span
                        className={styles.priorityBadge}
                        style={{
                          backgroundColor: getPriorityColor(lead.priority),
                        }}
                      >
                        {lead.priority}
                      </span>
                    </div>
                  </div>
                  <div className={styles.leadDetails}>
                    <div className={styles.leadMeta}>
                      <div className={styles.metaItem}>
                        <Calendar size={14} />
                        <span>Created: {formatDate(lead.created_at)}</span>
                      </div>
                      <div className={styles.metaItem}>
                        {lead.estimated_value ? (
                          <span>{formatCurrency(lead.estimated_value)}</span>
                        ) : (
                          <span>No value set</span>
                        )}
                      </div>
                      {lead.assigned_user && (
                        <div className={styles.metaItem}>
                          <UserIcon size={14} />
                          <span>
                            Assigned to: {lead.assigned_user.first_name}{' '}
                            {lead.assigned_user.last_name}
                          </span>
                        </div>
                      )}
                    </div>
                    {lead.comments && (
                      <div className={styles.leadComments}>
                        <p>{lead.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
