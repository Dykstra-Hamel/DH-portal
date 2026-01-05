'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import SearchableDropdown from '@/components/Common/SearchableDropdown/SearchableDropdown';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import Image from 'next/image';
import { Users, ChevronDown } from 'lucide-react';
import styles from './AddSupportCaseModal.module.scss';

interface AddSupportCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess?: () => void;
}

export function AddSupportCaseModal({ isOpen, onClose, companyId, onSuccess }: AddSupportCaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer selection state
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Assignment state
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] = useState(false);
  const assignmentDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current user and assignable users
  const { user } = useUser();
  const {
    users: assignableUsers,
    loading: loadingUsers
  } = useAssignableUsers({
    companyId,
    departmentType: 'support',
    enabled: isOpen,
  });

  // Support case form state
  const [formData, setFormData] = useState({
    // Customer fields (for new customer)
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    // Support case fields
    issueType: 'general_inquiry' as const,
    summary: '',
    description: '',
    priority: 'medium' as const,
  });

  // Customer search function
  const searchCustomers = async (query: string) => {
    if (!companyId) return;

    if (!query.trim()) {
      setCustomers([]);
      return;
    }

    setLoadingCustomers(true);
    try {
      const response = await fetch(
        `/api/customers/search?q=${encodeURIComponent(query)}&companyId=${companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        const customerList = (data.customers || []).map((customer: any) => ({
          id: customer.id,
          displayName: `${customer.first_name} ${customer.last_name} - ${customer.email || customer.phone}`,
          ...customer,
        }));
        setCustomers(customerList);
      } else {
        console.error('Failed to search customers');
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Customer select handler
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
  };

  // Default to current user when modal opens
  useEffect(() => {
    if (isOpen && user?.id && !selectedAssignee) {
      setSelectedAssignee(user.id);
    }
  }, [isOpen, user?.id, selectedAssignee]);

  // Close assignment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assignmentDropdownRef.current &&
        !assignmentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssignmentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    // Reset all state
    setIsLoading(false);
    setError(null);
    setShowNewCustomer(false);
    setSelectedCustomer(null);
    setCustomers([]);
    setSelectedAssignee('');
    setIsAssignmentDropdownOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      streetAddress: '',
      city: '',
      state: '',
      zip: '',
      issueType: 'general_inquiry',
      summary: '',
      description: '',
      priority: 'medium',
    });
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let customerId: string | undefined;

      // Check if we're using an existing customer or creating a new one
      if (!showNewCustomer && selectedCustomer) {
        // Use existing customer
        customerId = selectedCustomer.id;
      } else if (showNewCustomer) {
        // Create new customer first
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email || null,
            phone: formData.phoneNumber || null,
            address: formData.streetAddress || null,
            city: formData.city || null,
            state: formData.state || null,
            zip_code: formData.zip || null,
          }),
        });

        if (!customerResponse.ok) {
          const errorData = await customerResponse.json();
          throw new Error(errorData.error || 'Failed to create customer');
        }

        const { customer } = await customerResponse.json();
        customerId = customer.id;
      } else {
        throw new Error('Please select an existing customer or create a new one');
      }

      // Create the support case
      const response = await fetch('/api/support-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          customer_id: customerId,
          issue_type: formData.issueType,
          summary: formData.summary,
          description: formData.description || null,
          priority: formData.priority,
          assigned_to: isTeamAssignment() ? undefined : (selectedAssignee || undefined),
          status: selectedAssignee ? 'in_progress' : 'unassigned',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create support case');
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if assignment is to a team
  const isTeamAssignment = () => selectedAssignee === 'support_team';

  // Get display data for selected assignee
  const getSelectedAssigneeData = () => {
    if (!selectedAssignee) {
      return { name: 'Select', avatar: null, subtitle: '' };
    }

    if (selectedAssignee === 'support_team') {
      const memberCount = assignableUsers.filter(u =>
        u.departments.includes('support')
      ).length;
      return {
        name: 'Support Team',
        avatar: 'team',
        subtitle: `${memberCount} members`
      };
    }

    if (selectedAssignee === user?.id) {
      return {
        name: user.user_metadata?.first_name && user.user_metadata?.last_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user.email || 'Current User',
        avatar: user.user_metadata?.avatar_url || null,
        subtitle: 'Myself',
      };
    }

    const assignedUser = assignableUsers.find(u => u.id === selectedAssignee);
    if (assignedUser) {
      return {
        name: assignedUser.display_name,
        avatar: assignedUser.avatar_url,
        subtitle: assignedUser.email,
      };
    }

    return { name: 'Select', avatar: null, subtitle: '' };
  };

  // Get support team member count
  const getSupportTeamCount = () => {
    return assignableUsers.filter(u => u.departments.includes('support')).length;
  };

  // Avatar components
  const TeamAvatar = () => (
    <div className={styles.teamAvatar}>
      <Users size={20} />
    </div>
  );

  const DefaultAvatar = ({ name }: { name: string }) => (
    <div className={styles.defaultAvatar}>
      {name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={styles.addSupportCaseModal}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <ModalTop title="Create Support Case" onClose={handleClose} />

        <ModalMiddle className={styles.modalContent}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div className={styles.customerSection}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="customerType"
                  checked={!showNewCustomer}
                  onChange={() => {
                    setShowNewCustomer(false);
                    setSelectedCustomer(null);
                  }}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom}></span>
                Select Existing Customer
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="customerType"
                  checked={showNewCustomer}
                  onChange={() => {
                    setShowNewCustomer(true);
                    setSelectedCustomer(null);
                  }}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom}></span>
                Create New Customer
              </label>
            </div>

            {/* Existing Customer Search */}
            {!showNewCustomer && (
              <SearchableDropdown
                items={customers}
                onSearch={searchCustomers}
                onSelect={handleCustomerSelect}
                placeholder="Search customers by name, email, or phone..."
                displayKey="displayName"
                loading={loadingCustomers}
                selectedItem={selectedCustomer}
                noResultsText="No customers found"
                minSearchLength={2}
              />
            )}

            {/* New Customer Fields */}
            {showNewCustomer && (
              <div className={styles.newCustomerFields}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>State</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>ZIP</label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assignment Dropdown */}
          <div className={styles.assignmentSection}>
            <label className={styles.sectionLabel}>Assign To</label>
            <div className={styles.customDropdown} ref={assignmentDropdownRef}>
              <button
                type="button"
                className={styles.dropdownButton}
                onClick={() => setIsAssignmentDropdownOpen(!isAssignmentDropdownOpen)}
                disabled={loadingUsers}
              >
                <div className={styles.selectedOption}>
                  {(() => {
                    const display = getSelectedAssigneeData();
                    if (display.avatar === 'team') {
                      return <TeamAvatar />;
                    }
                    if (display.avatar) {
                      return (
                        <Image
                          src={display.avatar}
                          alt={display.name}
                          width={32}
                          height={32}
                          className={styles.avatar}
                        />
                      );
                    }
                    return <DefaultAvatar name={display.name} />;
                  })()}
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{getSelectedAssigneeData().name}</div>
                    {getSelectedAssigneeData().subtitle && (
                      <div className={styles.userSubtitle}>
                        {getSelectedAssigneeData().subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isAssignmentDropdownOpen ? styles.open : ''}`}
                />
              </button>

              {isAssignmentDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {/* Current User First */}
                  {user && (
                    <button
                      type="button"
                      className={`${styles.dropdownOption} ${
                        selectedAssignee === user.id ? styles.selected : ''
                      }`}
                      onClick={() => {
                        setSelectedAssignee(user.id);
                        setIsAssignmentDropdownOpen(false);
                      }}
                    >
                      <div className={styles.optionContent}>
                        {user.user_metadata?.avatar_url ? (
                          <Image
                            src={user.user_metadata.avatar_url}
                            alt="Current user"
                            width={32}
                            height={32}
                            className={styles.avatar}
                          />
                        ) : (
                          <DefaultAvatar
                            name={user.email || 'User'}
                          />
                        )}
                        <div className={styles.optionInfo}>
                          <div className={styles.optionName}>
                            {user.user_metadata?.first_name && user.user_metadata?.last_name
                              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                              : user.email}
                          </div>
                          <div className={styles.myselfLabel}>Myself</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Support Team Option */}
                  <button
                    type="button"
                    className={`${styles.dropdownOption} ${
                      selectedAssignee === 'support_team' ? styles.selected : ''
                    }`}
                    onClick={() => {
                      setSelectedAssignee('support_team');
                      setIsAssignmentDropdownOpen(false);
                    }}
                  >
                    <div className={styles.optionContent}>
                      <TeamAvatar />
                      <div className={styles.optionInfo}>
                        <div className={styles.optionName}>Support Team</div>
                        <div className={styles.optionSubtitle}>
                          {getSupportTeamCount()} members
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Other Team Members */}
                  {assignableUsers
                    .filter(u => u.id !== user?.id && u.departments.includes('support'))
                    .map(assignee => (
                      <button
                        key={assignee.id}
                        type="button"
                        className={`${styles.dropdownOption} ${
                          selectedAssignee === assignee.id ? styles.selected : ''
                        }`}
                        onClick={() => {
                          setSelectedAssignee(assignee.id);
                          setIsAssignmentDropdownOpen(false);
                        }}
                      >
                        <div className={styles.optionContent}>
                          {assignee.avatar_url ? (
                            <Image
                              src={assignee.avatar_url}
                              alt={assignee.display_name}
                              width={32}
                              height={32}
                              className={styles.avatar}
                            />
                          ) : (
                            <DefaultAvatar name={assignee.display_name} />
                          )}
                          <div className={styles.optionInfo}>
                            <div className={styles.optionName}>{assignee.display_name}</div>
                            <div className={styles.optionSubtitle}>{assignee.email}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Support Case Fields */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Issue Type *</label>
              <select
                required
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value as any })}
              >
                <option value="billing">Billing</option>
                <option value="scheduling">Scheduling</option>
                <option value="complaint">Complaint</option>
                <option value="service_quality">Service Quality</option>
                <option value="treatment_request">Treatment Request</option>
                <option value="re_service">Re-Service</option>
                <option value="general_inquiry">General Inquiry</option>
                <option value="warranty_claim">Warranty Claim</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Summary *</label>
            <input
              type="text"
              required
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief summary of the issue"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the issue"
            />
          </div>
        </ModalMiddle>

        <ModalBottom>
          <button
            type="button"
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Support Case'}
          </button>
        </ModalBottom>
      </form>
    </Modal>
  );
}
