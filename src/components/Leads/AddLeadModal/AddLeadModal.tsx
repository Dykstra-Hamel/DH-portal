'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import SearchableDropdown from '@/components/Common/SearchableDropdown/SearchableDropdown';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import Image from 'next/image';
import { Users, ChevronDown } from 'lucide-react';
import styles from './AddLeadModal.module.scss';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess?: () => void;
}

type TabType = 'single' | 'bulk';
type BulkStep = 'upload' | 'preview' | 'schedule' | 'processing' | 'complete';

export function AddLeadModal({ isOpen, onClose, companyId, onSuccess }: AddLeadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('single');
  const [bulkStep, setBulkStep] = useState<BulkStep>('upload');
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
    departmentType: 'sales',
    enabled: isOpen,
  });

  // Single lead form state
  const [singleLeadData, setSingleLeadData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    pestType: '',
    comments: '',
    priority: 'medium',
  });

  // Bulk upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setActiveTab('single');
    setBulkStep('upload');
    setIsLoading(false);
    setError(null);
    setShowNewCustomer(false);
    setSelectedCustomer(null);
    setCustomers([]);
    setSelectedAssignee('');
    setIsAssignmentDropdownOpen(false);
    setSingleLeadData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      streetAddress: '',
      city: '',
      state: '',
      zip: '',
      pestType: '',
      comments: '',
      priority: 'medium',
    });
    setCsvFile(null);
    setParsedData(null);
    setScheduledTime('');
    setUploadResult(null);
    onClose();
  };

  const handleSingleLeadSubmit = async (e: FormEvent) => {
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
            first_name: singleLeadData.firstName,
            last_name: singleLeadData.lastName,
            email: singleLeadData.email || null,
            phone: singleLeadData.phoneNumber || null,
            address: singleLeadData.streetAddress || null,
            city: singleLeadData.city || null,
            state: singleLeadData.state || null,
            zip_code: singleLeadData.zip || null,
          }),
        });

        if (!customerResponse.ok) {
          throw new Error('Failed to create customer');
        }

        const newCustomer = await customerResponse.json();
        customerId = newCustomer.id;
      } else {
        throw new Error('Please select an existing customer or create a new one');
      }

      // Create the lead with customer_id
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          customerId,
          pestType: singleLeadData.pestType,
          comments: singleLeadData.comments,
          priority: singleLeadData.priority,
          assignedTo: isTeamAssignment() ? undefined : (selectedAssignee || undefined),
          status: selectedAssignee ? 'assigned' : 'unassigned',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create lead');
      }

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setCsvFile(file);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setCsvFile(file);
      setError(null);
    }
  };

  const handleParseCSV = async () => {
    if (!csvFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use FormData to avoid JSON escaping issues with large CSVs
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('companyId', companyId);

      const response = await fetch('/api/leads/bulk/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Parse error response:', error);
        throw new Error(error.error || 'Failed to parse CSV');
      }

      const result = await response.json();
      console.log('Parse result:', result);
      setParsedData(result);
      setBulkStep('preview');
    } catch (err: any) {
      console.error('Parse error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleBulkUpload = async (scheduleType: 'now' | 'scheduled') => {
    if (!parsedData) return;

    setIsLoading(true);
    setError(null);

    try {
      const scheduledFor = scheduleType === 'now'
        ? new Date().toISOString()
        : new Date(scheduledTime).toISOString();

      const response = await fetch('/api/leads/bulk/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          fileName: csvFile?.name || 'bulk_upload.csv',
          scheduledFor,
          parsedData: parsedData.leads,
          totalRows: parsedData.validRows,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule upload');
      }

      const result = await response.json();
      setUploadResult(result);
      setBulkStep('complete');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if assignment is to a team
  const isTeamAssignment = () => selectedAssignee === 'sales_team';

  // Get display data for selected assignee
  const getSelectedAssigneeData = () => {
    if (!selectedAssignee) {
      return { name: 'Select', avatar: null, subtitle: '' };
    }

    if (selectedAssignee === 'sales_team') {
      const memberCount = assignableUsers.filter(u =>
        u.departments.includes('sales')
      ).length;
      return {
        name: 'Sales Team',
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

  // Get sales team member count
  const getSalesTeamCount = () => {
    return assignableUsers.filter(u => u.departments.includes('sales')).length;
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
    <Modal isOpen={isOpen} onClose={handleClose} className={styles.addLeadModal}>
      <ModalTop title="Add Lead" onClose={handleClose} />

      <ModalMiddle className={styles.modalContent}>
        {/* Tab Navigation */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'single' ? styles.active : ''}`}
            onClick={() => setActiveTab('single')}
          >
            Single Lead
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'bulk' ? styles.active : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk Upload
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* Single Lead Form */}
        {activeTab === 'single' && (
          <form onSubmit={handleSingleLeadSubmit} className={styles.singleLeadForm}>
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
                        value={singleLeadData.firstName}
                        onChange={(e) => setSingleLeadData({ ...singleLeadData, firstName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Name *</label>
                      <input
                        type="text"
                        required
                        value={singleLeadData.lastName}
                        onChange={(e) => setSingleLeadData({ ...singleLeadData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={singleLeadData.email}
                        onChange={(e) => setSingleLeadData({ ...singleLeadData, email: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={singleLeadData.phoneNumber}
                        onChange={(e) => setSingleLeadData({ ...singleLeadData, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={singleLeadData.streetAddress}
                      onChange={(e) => setSingleLeadData({ ...singleLeadData, streetAddress: e.target.value })}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>City</label>
                      <input
                        type="text"
                        value={singleLeadData.city}
                        onChange={(e) => setSingleLeadData({ ...singleLeadData, city: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>State</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={singleLeadData.state}
                        onChange={(e) => setSingleLeadData({ ...singleLeadData, state: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>ZIP</label>
                      <input
                        type="text"
                        value={singleLeadData.zip}
                        onChange={(e) => setSingleLeadData({ ...singleLeadData, zip: e.target.value })}
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

                    {/* Sales Team Option */}
                    <button
                      type="button"
                      className={`${styles.dropdownOption} ${
                        selectedAssignee === 'sales_team' ? styles.selected : ''
                      }`}
                      onClick={() => {
                        setSelectedAssignee('sales_team');
                        setIsAssignmentDropdownOpen(false);
                      }}
                    >
                      <div className={styles.optionContent}>
                        <TeamAvatar />
                        <div className={styles.optionInfo}>
                          <div className={styles.optionName}>Sales Team</div>
                          <div className={styles.optionSubtitle}>
                            {getSalesTeamCount()} members
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Other Team Members */}
                    {assignableUsers
                      .filter(u => u.id !== user?.id && u.departments.includes('sales'))
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

            {/* Lead-Specific Fields */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Pest Type</label>
                <select
                  value={singleLeadData.pestType}
                  onChange={(e) => setSingleLeadData({ ...singleLeadData, pestType: e.target.value })}
                >
                  <option value="">Select Pest Type</option>
                  <option value="General Pest Control">General Pest Control</option>
                  <option value="Ant Control">Ant Control</option>
                  <option value="Bed Bug Control">Bed Bug Control</option>
                  <option value="Cockroach Control">Cockroach Control</option>
                  <option value="Flea Control">Flea Control</option>
                  <option value="Mosquito Control">Mosquito Control</option>
                  <option value="Rodent Control">Rodent Control</option>
                  <option value="Spider Control">Spider Control</option>
                  <option value="Termite Control">Termite Control</option>
                  <option value="Wasp/Bee Control">Wasp/Bee Control</option>
                  <option value="Wildlife Control">Wildlife Control</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Priority</label>
                <select
                  value={singleLeadData.priority}
                  onChange={(e) => setSingleLeadData({ ...singleLeadData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Comments</label>
              <textarea
                rows={3}
                value={singleLeadData.comments}
                onChange={(e) => setSingleLeadData({ ...singleLeadData, comments: e.target.value })}
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={handleClose} className={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </form>
        )}

        {/* Bulk Upload */}
        {activeTab === 'bulk' && (
          <>
            {/* Upload Step */}
            {bulkStep === 'upload' && (
              <div className={styles.bulkUpload}>
                <div
                  className={styles.dropzone}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {csvFile ? (
                    <div className={styles.fileSelected}>
                      <p>Selected: {csvFile.name}</p>
                      <p className={styles.fileSize}>{(csvFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <>
                      <p>Drop CSV file here or click to browse</p>
                      <p className={styles.hint}>Supported format: .csv</p>
                    </>
                  )}
                </div>

                {csvFile && (
                  <div className={styles.formActions}>
                    <button type="button" onClick={() => setCsvFile(null)} className={styles.cancelButton}>
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleParseCSV}
                      disabled={isLoading}
                      className={styles.submitButton}
                    >
                      {isLoading ? (
                        <span className={styles.aiLoader}>Parsing with AI...</span>
                      ) : (
                        'Parse CSV'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Preview Step */}
            {bulkStep === 'preview' && parsedData && (
              <div className={styles.preview}>
                <h3>Preview ({parsedData.validRows} leads)</h3>

                {parsedData.duplicates.length > 0 && (
                  <div className={styles.warning}>
                    <p>
                      Warning: {parsedData.duplicates.length} duplicate{parsedData.duplicates.length > 1 ? 's' : ''}{' '}
                      detected and will be skipped
                    </p>
                  </div>
                )}

                <div className={styles.previewTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Pest Type</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.leads.slice(0, 10).map((lead: any, index: number) => (
                        <tr key={index}>
                          <td>{lead.first_name} {lead.last_name}</td>
                          <td>{lead.email || '-'}</td>
                          <td>{lead.phone_number || '-'}</td>
                          <td>{lead.pest_type || '-'}</td>
                          <td>
                            <span className={`${styles.badge} ${styles[lead.priority || 'medium']}`}>
                              {lead.priority || 'medium'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.validRows > 10 && (
                    <p className={styles.tableFooter}>
                      ...and {parsedData.validRows - 10} more leads
                    </p>
                  )}
                </div>

                <div className={styles.formActions}>
                  <button type="button" onClick={() => setBulkStep('upload')} className={styles.cancelButton}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStep('schedule')}
                    className={styles.submitButton}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Schedule Step */}
            {bulkStep === 'schedule' && (
              <div className={styles.schedule}>
                <h3>When should we add these leads?</h3>

                <div className={styles.scheduleOptions}>
                  <button
                    type="button"
                    onClick={() => handleScheduleBulkUpload('now')}
                    disabled={isLoading}
                    className={styles.scheduleButton}
                  >
                    Add Now
                  </button>

                  <div className={styles.scheduleOption}>
                    <p>Or schedule for a specific time:</p>
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className={styles.datetimeInput}
                    />
                    <button
                      type="button"
                      onClick={() => handleScheduleBulkUpload('scheduled')}
                      disabled={!scheduledTime || isLoading}
                      className={styles.submitButton}
                    >
                      {isLoading ? 'Scheduling...' : 'Schedule Upload'}
                    </button>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="button" onClick={() => setBulkStep('preview')} className={styles.cancelButton}>
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Complete Step */}
            {bulkStep === 'complete' && uploadResult && (
              <div className={styles.complete}>
                <div className={styles.successIcon}>✓</div>
                <h3>Bulk Upload Scheduled!</h3>
                <p>
                  Your upload of {parsedData.validRows} leads has been{' '}
                  {new Date(uploadResult.upload.scheduledFor) <= new Date() ? 'queued' : 'scheduled'} for processing.
                </p>
                {new Date(uploadResult.upload.scheduledFor) > new Date() && (
                  <p>
                    Scheduled for: {new Date(uploadResult.upload.scheduledFor).toLocaleString()}
                  </p>
                )}
                <div className={styles.formActions}>
                  <button type="button" onClick={handleClose} className={styles.submitButton}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </ModalMiddle>
    </Modal>
  );
}
