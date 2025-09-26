import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Lead } from '@/types/lead';
import { SupportCaseFormData } from '@/types/support-case';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { adminAPI } from '@/lib/api-client';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import { AddressAutocomplete, AddressComponents } from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { StreetViewImage } from '@/components/Common/StreetViewImage/StreetViewImage';
import { ServiceAddressData, createServiceAddressForLead } from '@/lib/service-addresses';
import {
  Ticket,
  ReceiptText,
  SquareUserRound,
  MapPinned,
  SquareActivity,
  NotebookPen,
  ChevronDown,
  Users,
  Trash2,
} from 'lucide-react';
import styles from './LeadStepContent.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

interface LeadStepContentProps {
  lead: Lead;
  isAdmin: boolean;
  onLeadUpdate?: () => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function LeadStepContent({ lead, isAdmin, onLeadUpdate, onShowToast }: LeadStepContentProps) {

  const [ticketType, setTicketType] = useState('sales');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCallSummary, setShowCallSummary] = useState(false);

  // Service Location form state
  const [serviceLocationData, setServiceLocationData] = useState<ServiceAddressData>({
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: undefined,
    longitude: undefined,
    address_type: 'residential'
  });
  const [originalServiceAddress, setOriginalServiceAddress] = useState<ServiceAddressData | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [homeSize, setHomeSize] = useState('');
  const [yardSize, setYardSize] = useState('');

  const { user } = useUser();
  const { users: assignableUsers } = useAssignableUsers({
    companyId: lead.company_id,
    departmentType: ticketType === 'support' ? 'support' : 'sales',
    enabled: ticketType !== 'junk'
  });

  // Set default assignee to current user when component loads
  useEffect(() => {
    if (user?.id && !selectedAssignee) {
      setSelectedAssignee(user.id);
    }
  }, [user?.id, selectedAssignee]);

  // Pre-fill service location with primary service address when component loads
  useEffect(() => {
    if (lead.primary_service_address && !serviceLocationData.street_address) {
      const addressData: ServiceAddressData = {
        street_address: lead.primary_service_address.street_address || '',
        city: lead.primary_service_address.city || '',
        state: lead.primary_service_address.state || '',
        zip_code: lead.primary_service_address.zip_code || '',
        apartment_unit: lead.primary_service_address.apartment_unit,
        address_line_2: lead.primary_service_address.address_line_2,
        latitude: lead.primary_service_address.latitude,
        longitude: lead.primary_service_address.longitude,
        address_type: lead.primary_service_address.address_type || 'residential',
        property_notes: lead.primary_service_address.property_notes
      };

      // Store original service address for change detection
      setOriginalServiceAddress(addressData);

      setServiceLocationData(prev => ({
        ...prev,
        ...addressData
      }));
    } else if (lead.customer && !lead.primary_service_address && !serviceLocationData.street_address) {
      // Fallback to customer address if no primary service address exists
      const customerAddressData: ServiceAddressData = {
        street_address: lead.customer?.address || '',
        city: lead.customer?.city || '',
        state: lead.customer?.state || '',
        zip_code: lead.customer?.zip_code || '',
        latitude: lead.customer?.latitude,
        longitude: lead.customer?.longitude,
        address_type: 'residential'
      };

      // Store original customer address for change detection
      setOriginalServiceAddress(customerAddressData);

      setServiceLocationData(prev => ({
        ...prev,
        ...customerAddressData
      }));
    }
  }, [lead.primary_service_address, lead.customer, serviceLocationData.street_address]);

  // Check if we have a complete address (all required fields)
  const hasCompleteAddress = useMemo(() => {
    return !!(
      serviceLocationData.street_address &&
      serviceLocationData.city &&
      serviceLocationData.state &&
      serviceLocationData.zip_code
    );
  }, [serviceLocationData]);

  // Check if we have a complete, unchanged address from original
  const hasCompleteUnchangedAddress = useMemo(() => {
    if (!hasCompleteAddress || !originalServiceAddress) return false;

    // Check if current address matches original (no changes made)
    return (
      serviceLocationData.street_address === originalServiceAddress.street_address &&
      serviceLocationData.city === originalServiceAddress.city &&
      serviceLocationData.state === originalServiceAddress.state &&
      serviceLocationData.zip_code === originalServiceAddress.zip_code &&
      serviceLocationData.apartment_unit === originalServiceAddress.apartment_unit &&
      serviceLocationData.address_line_2 === originalServiceAddress.address_line_2
    );
  }, [serviceLocationData, originalServiceAddress, hasCompleteAddress]);

  // Build formatted address string from current service location data
  // Build the best possible address string with available fields
  const currentFormattedAddress = useMemo(() => {
    const parts = [];

    // Add street address if available
    if (serviceLocationData.street_address?.trim()) {
      parts.push(serviceLocationData.street_address.trim());
    }

    // Add city if available
    if (serviceLocationData.city?.trim()) {
      parts.push(serviceLocationData.city.trim());
    }

    // Add state and zip together if available
    const state = serviceLocationData.state?.trim();
    const zip = serviceLocationData.zip_code?.trim();
    if (state && zip) {
      parts.push(`${state} ${zip}`);
    } else if (state) {
      parts.push(state);
    } else if (zip) {
      parts.push(zip);
    }

    // Return formatted address if we have at least a street address or city
    return parts.length >= 1 && (serviceLocationData.street_address?.trim() || serviceLocationData.city?.trim())
      ? parts.join(', ')
      : '';
  }, [serviceLocationData]);

  // Detect address changes by comparing current serviceLocationData with originalServiceAddress
  // Only show save/cancel buttons if there's an original address AND it has been changed
  const hasAddressChanges = useMemo(() => {
    if (!originalServiceAddress) return false;

    // Don't show buttons if the original address was empty (new address entry)
    const hadExistingAddress = !!(
      originalServiceAddress.street_address ||
      originalServiceAddress.city ||
      originalServiceAddress.state ||
      originalServiceAddress.zip_code
    );

    if (!hadExistingAddress) return false;

    return (
      serviceLocationData.street_address !== originalServiceAddress.street_address ||
      serviceLocationData.city !== originalServiceAddress.city ||
      serviceLocationData.state !== originalServiceAddress.state ||
      serviceLocationData.zip_code !== originalServiceAddress.zip_code ||
      serviceLocationData.apartment_unit !== originalServiceAddress.apartment_unit ||
      serviceLocationData.address_line_2 !== originalServiceAddress.address_line_2
    );
  }, [serviceLocationData, originalServiceAddress]);

  const currentUser = user ? {
    id: user.id,
    name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Unknown',
    avatar: user.user_metadata?.avatar_url
  } : null;

  const handleAssigneeSelect = (assigneeId: string) => {
    setSelectedAssignee(assigneeId);
    setIsAssignmentDropdownOpen(false);
  };

  const showSuccessToast = (message: string) => {
    if (onShowToast) {
      onShowToast(message, 'success');
    }
  };

  const showErrorToast = (message: string) => {
    if (onShowToast) {
      onShowToast(message, 'error');
    }
  };

  // State name to abbreviation mapping
  const stateNameToAbbreviation: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };

  // Service Location handlers
  const handleAddressSelect = (addressComponents: AddressComponents) => {

    // Build street address from components instead of using full formatted address
    let streetAddress = '';
    if (addressComponents.street_number && addressComponents.route) {
      streetAddress = `${addressComponents.street_number} ${addressComponents.route}`;
    } else if (addressComponents.route) {
      streetAddress = addressComponents.route;
    } else {
      // Fallback to formatted address if components not available
      streetAddress = addressComponents.formatted_address || '';
    }

    // Convert state name to abbreviation
    let stateAbbreviation = addressComponents.administrative_area_level_1 || '';
    if (stateNameToAbbreviation[stateAbbreviation]) {
      stateAbbreviation = stateNameToAbbreviation[stateAbbreviation];
    }

    const newLocationData = {
      ...serviceLocationData,
      street_address: streetAddress,
      city: addressComponents.locality || '',
      state: stateAbbreviation,
      zip_code: addressComponents.postal_code || '',
      latitude: addressComponents.latitude,
      longitude: addressComponents.longitude,
      hasStreetView: addressComponents.hasStreetView
    };


    setServiceLocationData(newLocationData);
  };

  const handleServiceLocationChange = (field: keyof ServiceAddressData, value: string) => {
    setServiceLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAddress = async () => {
    if (!lead.customer || !hasAddressChanges) return;

    setIsSavingAddress(true);
    try {
      // Create or find service address and link to both customer and lead
      const isPrimary = !lead.primary_service_address; // Set as primary if no existing primary address

      const result = await createServiceAddressForLead(
        lead.company_id,
        lead.customer.id,
        lead.id,
        serviceLocationData,
        isPrimary
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save service address');
      }

      // Update the original service address to reflect the saved state
      setOriginalServiceAddress({
        ...serviceLocationData
      });

      if (result.isExisting) {
        showSuccessToast('Service address linked successfully');
      } else {
        showSuccessToast('Service address created and linked successfully');
      }

      // Refresh the lead data to reflect the updated service address info
      if (onLeadUpdate) {
        await onLeadUpdate();
      }
    } catch (error) {
      console.error('Error saving service address:', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to save service address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelAddressChanges = () => {
    if (!originalServiceAddress) return;

    // Revert service location back to original service address
    setServiceLocationData({
      ...originalServiceAddress
    });
  };

  const handleAssignTicket = async () => {
    if (!selectedAssignee) {
      showErrorToast('Please select an assignee');
      return;
    }

    setIsAssigning(true);

    try {
      if (ticketType === 'sales') {
        // Sales Lead logic
        if (selectedAssignee === 'sales_team') {
          // Assigned to Sales Team - keep as unassigned lead
          await adminAPI.updateLead(lead.id, {
            assigned_to: null,
            lead_status: 'unassigned'
          });
          showSuccessToast('Lead assigned to sales team');
        } else {
          // Assigned to specific person - update to contacting status
          await adminAPI.updateLead(lead.id, {
            assigned_to: selectedAssignee,
            lead_status: 'contacting'
          });
          showSuccessToast('Sales lead assigned and status updated to contacting');
        }
      } else if (ticketType === 'support') {
        // Support Case logic - create support case first, then archive lead only if successful
        const supportCaseData = {
          customer_id: lead.customer_id,
          company_id: lead.company_id, // Explicitly include company_id
          issue_type: 'general_inquiry',
          summary: `Converted from sales lead${lead.customer ? ` - ${lead.customer.first_name} ${lead.customer.last_name}` : ''}`,
          description: lead.comments || 'Converted from sales lead',
          status: 'unassigned',
          priority: 'medium',
          assigned_to: selectedAssignee === 'support_team' ? undefined : selectedAssignee
        };

        try {
          // Create support case first
          await adminAPI.supportCases.create(supportCaseData);

          // Only archive the lead if support case creation was successful
          await adminAPI.updateLead(lead.id, {
            archived: true
          });

          showSuccessToast('Support case created and lead archived');
        } catch (supportCaseError) {
          console.error('Failed to create support case:', supportCaseError);
          throw new Error(`Failed to create support case: ${supportCaseError instanceof Error ? supportCaseError.message : 'Unknown error'}`);
        }
      } else if (ticketType === 'junk') {
        // Archive the lead as junk
        await adminAPI.updateLead(lead.id, {
          archived: true
        });
        showSuccessToast('Lead marked as junk and archived');
      }

      // Refresh lead data if callback provided
      if (onLeadUpdate) {
        onLeadUpdate();
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to assign ticket');
    } finally {
      setIsAssigning(false);
    }
  };

  const getTeamCount = () => {
    const department = ticketType === 'support' ? 'support' : 'sales';
    return assignableUsers.filter(user => user.departments.includes(department)).length;
  };

  const getSelectedAssigneeDisplay = () => {
    if (selectedAssignee === 'sales_team') {
      return {
        name: 'Sales Team',
        subtitle: `${getTeamCount()} members`,
        avatar: null,
        isTeam: true
      };
    }

    if (selectedAssignee === 'support_team') {
      return {
        name: 'Support Team',
        subtitle: `${getTeamCount()} members`,
        avatar: null,
        isTeam: true
      };
    }

    if (selectedAssignee === user?.id) {
      return {
        name: currentUser?.name || 'Unknown',
        subtitle: 'Myself',
        avatar: currentUser?.avatar,
        isTeam: false
      };
    }

    const assignee = assignableUsers.find(u => u.id === selectedAssignee);
    if (assignee) {
      return {
        name: assignee.display_name,
        subtitle: assignee.email,
        avatar: assignee.avatar_url,
        isTeam: false
      };
    }

    return {
      name: 'Select assignee',
      subtitle: '',
      avatar: null,
      isTeam: false
    };
  };

  const getButtonText = () => {
    if (ticketType === 'sales') {
      return 'Assign Sales Lead';
    } else if (ticketType === 'support') {
      return 'Assign Support Case';
    } else if (ticketType === 'junk') {
      return 'Junk It';
    }
    return 'Assign Ticket';
  };

  const formatCallTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };


  const getCallMethod = () => {
    // This would depend on your call record structure
    // For now, assume inbound if we have a call record
    return 'Inbound Call';
  };

  const getLeadSourceDisplay = (source: string) => {
    const sourceMap: { [key: string]: string } = {
      'google_cpc': 'Paid Advertisement',
      'facebook_ads': 'Social Media Ads',
      'organic': 'Organic Search',
      'referral': 'Referral',
      'other': 'Other'
    };
    return sourceMap[source] || source;
  };

  const getAIQualification = (leadStatus: string) => {
    return leadStatus === 'qualified' || leadStatus === 'contacting' ? 'Sales Lead' : 'Unqualified';
  };

  const capitalizeFirst = (str?: string) => {
    if (!str) return 'Not specified';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const TeamAvatar = () => (
    <div className={styles.teamAvatar}>
      <Users size={16} color="white" />
    </div>
  );

  const DefaultAvatar = ({ name }: { name: string }) => (
    <div className={styles.defaultAvatar}>
      {name.charAt(0).toUpperCase()}
    </div>
  );

  const renderQualifyContent = () => (
    <>
      <div className={styles.contentLeft}>
        <InfoCard
          title="Assign Ticket"
          icon={<Ticket size={20} />}
          startExpanded={true}
        >
          <div className={styles.cardContent}>
            {/* Customer Information */}
            <div className={styles.customerSection}>
              <div className={cardStyles.defaultText}>
                {lead.customer ? `${lead.customer.first_name} ${lead.customer.last_name}` : 'No Customer Name'}
              </div>
              <div className={cardStyles.lightText}>
                {lead.customer?.phone || 'No phone number'}
              </div>
              <div className={cardStyles.lightText}>
                {lead.customer?.address || 'No address available'}
              </div>
            </div>

            {/* Ticket Type Section */}
            <div className={styles.section}>
              <div className={`${cardStyles.defaultText} ${styles.sectionLabel}`}>Ticket Type:</div>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="ticketType"
                    value="sales"
                    checked={ticketType === 'sales'}
                    onChange={(e) => setTicketType(e.target.value)}
                  />
                  <span className={styles.radioCustom}></span>
                  <span className={cardStyles.defaultText}>Sales Lead</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="ticketType"
                    value="support"
                    checked={ticketType === 'support'}
                    onChange={(e) => setTicketType(e.target.value)}
                  />
                  <span className={styles.radioCustom}></span>
                  <span className={cardStyles.defaultText}>Support Case</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="ticketType"
                    value="junk"
                    checked={ticketType === 'junk'}
                    onChange={(e) => setTicketType(e.target.value)}
                  />
                  <span className={styles.radioCustom}></span>
                  <span className={cardStyles.defaultText}>Junk</span>
                </label>
              </div>
            </div>

            {/* Assign To Section - only show if not junk */}
            {ticketType !== 'junk' && (
              <div className={styles.section}>
                <div className={`${cardStyles.defaultText} ${styles.sectionLabel}`}>Assign to:</div>
                <div className={styles.dropdown}>
                <button
                  className={styles.dropdownButton}
                  onClick={() => setIsAssignmentDropdownOpen(!isAssignmentDropdownOpen)}
                >
                  <div className={styles.dropdownContent}>
                    <div className={styles.avatarContainer}>
                      {(() => {
                        const display = getSelectedAssigneeDisplay();
                        if (display.isTeam) {
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
                    </div>
                    <div className={styles.userInfo}>
                      <div className={cardStyles.defaultText} style={{color: 'var(--action-500)'}}>
                        {getSelectedAssigneeDisplay().name}
                      </div>
                      <div className={cardStyles.lightText}>
                        {getSelectedAssigneeDisplay().subtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronDown size={24} className={`${styles.chevronIcon} ${isAssignmentDropdownOpen ? styles.rotated : ''}`} />
                </button>
                {isAssignmentDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {/* Current user first */}
                    {currentUser && (
                      <button
                        className={`${styles.dropdownOption} ${selectedAssignee === user?.id ? styles.selected : ''}`}
                        onClick={() => handleAssigneeSelect(user?.id || '')}
                      >
                        <div className={styles.avatarContainer}>
                          {currentUser.avatar ? (
                            <Image
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              width={32}
                              height={32}
                              className={styles.avatar}
                            />
                          ) : (
                            <DefaultAvatar name={currentUser.name} />
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <div className={cardStyles.defaultText}>{currentUser.name}</div>
                          <div className={cardStyles.lightText}>Myself</div>
                        </div>
                      </button>
                    )}

                    {/* Team option - Sales Team when ticket type is sales, Support Team when support */}
                    {ticketType === 'sales' && (
                      <button
                        className={`${styles.dropdownOption} ${selectedAssignee === 'sales_team' ? styles.selected : ''}`}
                        onClick={() => handleAssigneeSelect('sales_team')}
                      >
                        <div className={styles.avatarContainer}>
                          <TeamAvatar />
                        </div>
                        <div className={styles.userInfo}>
                          <div className={cardStyles.defaultText}>Sales Team</div>
                          <div className={cardStyles.lightText}>{getTeamCount()} members</div>
                        </div>
                      </button>
                    )}

                    {ticketType === 'support' && (
                      <button
                        className={`${styles.dropdownOption} ${selectedAssignee === 'support_team' ? styles.selected : ''}`}
                        onClick={() => handleAssigneeSelect('support_team')}
                      >
                        <div className={styles.avatarContainer}>
                          <TeamAvatar />
                        </div>
                        <div className={styles.userInfo}>
                          <div className={cardStyles.defaultText}>Support Team</div>
                          <div className={cardStyles.lightText}>{getTeamCount()} members</div>
                        </div>
                      </button>
                    )}

                    {/* Team members - filtered by department */}
                    {(ticketType === 'sales' || ticketType === 'support') && assignableUsers
                      .filter(companyUser => companyUser.id !== user?.id)
                      .map((companyUser) => (
                        <button
                          key={companyUser.id}
                          className={`${styles.dropdownOption} ${selectedAssignee === companyUser.id ? styles.selected : ''}`}
                          onClick={() => handleAssigneeSelect(companyUser.id)}
                        >
                          <div className={styles.avatarContainer}>
                            {companyUser.avatar_url ? (
                              <Image
                                src={companyUser.avatar_url}
                                alt={companyUser.display_name}
                                width={32}
                                height={32}
                                className={styles.avatar}
                              />
                            ) : (
                              <DefaultAvatar name={companyUser.display_name} />
                            )}
                          </div>
                          <div className={styles.userInfo}>
                            <div className={cardStyles.defaultText}>{companyUser.display_name}</div>
                            <div className={cardStyles.lightText}>{companyUser.email}</div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Action Button */}
            <div className={styles.actionSection}>
              <button
                className={styles.assignButton}
                onClick={handleAssignTicket}
                disabled={isAssigning || !selectedAssignee}
              >
                {isAssigning ? (
                  'Processing...'
                ) : (
                  <>
                    {ticketType === 'junk' && (
                      <Trash2 size={13.5} width={13.5} height={15} color="white" />
                    )}
                    {getButtonText()}
                  </>
                )}
              </button>
            </div>
          </div>
        </InfoCard>

        <InfoCard
          title="Call Information"
          icon={<ReceiptText size={20} />}
          startExpanded={true}
        >
          <div className={styles.cardContent}>
            {lead.call_record ? (
              <>
                {/* Call Insights Section */}
                <div>
                  <div className={styles.callInsightsSection}>
                    <h4 className={cardStyles.defaultText}>Call Insights:</h4>
                  </div>
                  <div className={styles.callInsightsGrid}>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Method</span>
                      <span className={cardStyles.dataText}>{getCallMethod()}</span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Source</span>
                      <span className={cardStyles.dataText}>{getLeadSourceDisplay(lead.lead_source)}</span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>AI Qualification</span>
                      <span className={cardStyles.dataText}>{getAIQualification(lead.lead_status)}</span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Caller Sentiment</span>
                      <span className={cardStyles.dataText}>{capitalizeFirst(lead.call_record.sentiment)}</span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Primary Pest Issue</span>
                      <span className={cardStyles.dataText}>{capitalizeFirst(lead.call_record.pest_issue)}</span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Preferred Service Time</span>
                      <span className={cardStyles.dataText}>{capitalizeFirst(lead.call_record.preferred_service_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Call Details Section */}
                <div className={styles.callDetailsSection}>
                  <div className={styles.callDetailsHeader}>
                    <h4 className={cardStyles.defaultText}>Call Details:</h4>
                  </div>
                  <div className={styles.callInsightsGrid}>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Call Started</span>
                      <span className={cardStyles.dataText}>{formatCallTimestamp(lead.call_record.start_timestamp)}</span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Call Ended</span>
                      <span className={cardStyles.dataText}>{formatCallTimestamp(lead.call_record.end_timestamp)}</span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Disconnect Reason</span>
                      <span className={cardStyles.dataText}>{capitalizeFirst(lead.call_record.disconnect_reason)}</span>
                    </div>
                  </div>
                </div>

                {/* Call Recording Section */}
                {lead.call_record.recording_url && (
                  <div className={styles.recordingSection}>
                    <h4 className={cardStyles.dataLabel} style={{ marginBottom: '12px' }}>Call Recording</h4>
                    <AudioPlayer
                      src={lead.call_record.recording_url}
                      title={`Call Recording - ${lead.customer?.first_name} ${lead.customer?.last_name}`.trim()}
                    />
                  </div>
                )}

                {/* Call Transcript/Summary Section */}
                {(lead.call_record.transcript || lead.call_record.call_analysis?.call_summary) && (
                  <div className={styles.transcriptSection}>
                    <div className={styles.transcriptHeader}>
                      <h4 className={cardStyles.dataLabel}>
                        {showCallSummary ? 'Call Summary' : 'Call Transcript'}
                      </h4>
                      {lead.call_record.call_analysis?.call_summary && (
                        <div className={`${styles.toggleContainer} ${showCallSummary ? styles.active : ''}`}>
                          <button
                            className={`${styles.transcriptToggle} ${showCallSummary ? styles.active : ''}`}
                            onClick={() => setShowCallSummary(!showCallSummary)}
                            aria-label={showCallSummary ? 'Switch to transcript' : 'Switch to summary'}
                          >
                            <div className={styles.toggleCircle}></div>
                          </button>
                          <span className={styles.toggleLabel}>Call Summary</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.transcriptContent}>
                      <span className={cardStyles.transcriptText}>
                        {showCallSummary
                          ? lead.call_record.call_analysis?.call_summary
                          : lead.call_record.transcript
                        }
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noCallData}>
                <p>No call data available for this lead.</p>
              </div>
            )}
          </div>
        </InfoCard>
      </div>

      <div className={styles.contentRight}>
        <InfoCard
          title="Contact Information"
          icon={<SquareUserRound size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            <p>Customer contact details will be displayed here.</p>
          </div>
        </InfoCard>

        <InfoCard
          title="Service Location"
          icon={<MapPinned size={20} />}
          startExpanded={true}
        >
          <div className={styles.cardContent}>
            <div className={styles.serviceLocationGrid}>
              {/* Row 1: City, State, Zip (3 columns) */}
              <div className={`${styles.gridRow} ${styles.threeColumns}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>City</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.city}
                    onChange={(e) => handleServiceLocationChange('city', e.target.value)}
                    placeholder="Anytown"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>State</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.state}
                    onChange={(e) => handleServiceLocationChange('state', e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Zip</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.zip_code}
                    onChange={(e) => handleServiceLocationChange('zip_code', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Row 2: Address (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Address</label>
                  <AddressAutocomplete
                    value={serviceLocationData.street_address}
                    onChange={(value) => handleServiceLocationChange('street_address', value)}
                    onAddressSelect={handleAddressSelect}
                    placeholder="324 Winston Churchill Drive, Suite #34"
                    hideDropdown={hasCompleteUnchangedAddress}
                  />
                </div>
              </div>

              {/* Row 3: Size of Home, Yard Size (2 columns) */}
              <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Size of Home</label>
                  <div className={styles.fieldWithSuffix}>
                    <select
                      className={`${styles.selectInput} ${styles.withSuffix}`}
                      value={homeSize}
                      onChange={(e) => setHomeSize(e.target.value)}
                    >
                      <option value="">Enter home size</option>
                      <option value="less_than_1000">Less than 1,000</option>
                      <option value="1000_1500">1,000 - 1,500</option>
                      <option value="1500_2000">1,500 - 2,000</option>
                      <option value="2000_2500">2,000 - 2,500</option>
                      <option value="2500_3000">2,500 - 3,000</option>
                      <option value="3000_3500">3,000 - 3,500</option>
                      <option value="3500_4000">3,500 - 4,000</option>
                      <option value="more_than_4000">More than 4,000</option>
                    </select>
                    <span className={styles.fieldSuffix}>sq ft</span>
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Yard Size</label>
                  <div className={styles.fieldWithSuffix}>
                    <select
                      className={`${styles.selectInput} ${styles.withSuffix}`}
                      value={yardSize}
                      onChange={(e) => setYardSize(e.target.value)}
                    >
                      <option value="">Enter yard size</option>
                      <option value="none">No Yard</option>
                      <option value="small">Small (Less than 0.25 acre)</option>
                      <option value="medium">Medium (0.25 - 0.5 acre)</option>
                      <option value="large">Large (0.5 - 1 acre)</option>
                      <option value="very_large">Very Large (More than 1 acre)</option>
                    </select>
                    <span className={styles.fieldSuffix}>sq yd</span>
                  </div>
                </div>
              </div>

              {/* Row 4: Street View Image (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.streetViewContainer}>
                  <StreetViewImage
                    address={currentFormattedAddress}
                    latitude={serviceLocationData.latitude}
                    longitude={serviceLocationData.longitude}
                    width={600}
                    height={240}
                    className={styles.streetViewImage}
                    showPlaceholder={!currentFormattedAddress && !serviceLocationData.latitude}
                    fallbackToSatellite={true}
                    hasStreetView={serviceLocationData.hasStreetView}
                  />
                </div>
              </div>
            </div>
          </div>
        </InfoCard>

        {/* Save/Cancel Address Changes */}
        {hasAddressChanges && (
          <div className={styles.addressActions}>
            <div className={styles.addressActionsContent}>
              <span className={styles.changesMessage}>Service address changes detected</span>
              <div className={styles.actionButtons}>
                <button
                  className={`${styles.button} ${styles.cancelButton}`}
                  onClick={handleCancelAddressChanges}
                  disabled={isSavingAddress}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.button} ${styles.saveButton}`}
                  onClick={handleSaveAddress}
                  disabled={!hasAddressChanges || isSavingAddress}
                >
                  {isSavingAddress ? 'Saving...' : 'Save Service Address'}
                </button>
              </div>
            </div>
          </div>
        )}

        <InfoCard
          title="Activity"
          icon={<SquareActivity size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            <p>Lead activity and interaction history will be displayed here.</p>
          </div>
        </InfoCard>

        <InfoCard
          title="Notes"
          icon={<NotebookPen size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            <p>Lead notes and comments will be displayed here.</p>
          </div>
        </InfoCard>
      </div>
    </>
  );

  const renderContactingContent = () => (
    <>
      <div className={styles.contentLeft}>
        <InfoCard title="Contacting - Left Card 1" startExpanded={true}>
          <div className={styles.cardContent}>
            <p>Contacting step content - placeholder</p>
          </div>
        </InfoCard>
      </div>
      <div className={styles.contentRight}>
        <InfoCard title="Contacting - Right Card 1" startExpanded={false}>
          <div className={styles.cardContent}>
            <p>Contacting step content - placeholder</p>
          </div>
        </InfoCard>
      </div>
    </>
  );

  const renderQuotedContent = () => (
    <>
      <div className={styles.contentLeft}>
        <InfoCard title="Quoted - Left Card 1" startExpanded={true}>
          <div className={styles.cardContent}>
            <p>Quoted step content - placeholder</p>
          </div>
        </InfoCard>
      </div>
      <div className={styles.contentRight}>
        <InfoCard title="Quoted - Right Card 1" startExpanded={false}>
          <div className={styles.cardContent}>
            <p>Quoted step content - placeholder</p>
          </div>
        </InfoCard>
      </div>
    </>
  );

  const renderReadyToScheduleContent = () => (
    <>
      <div className={styles.contentLeft}>
        <InfoCard title="Ready to Schedule - Left Card 1" startExpanded={true}>
          <div className={styles.cardContent}>
            <p>Ready to schedule step content - placeholder</p>
          </div>
        </InfoCard>
      </div>
      <div className={styles.contentRight}>
        <InfoCard title="Ready to Schedule - Right Card 1" startExpanded={false}>
          <div className={styles.cardContent}>
            <p>Ready to schedule step content - placeholder</p>
          </div>
        </InfoCard>
      </div>
    </>
  );

  // Render content based on lead status
  const renderContent = () => {
    switch (lead.lead_status) {
      case 'unassigned':
        return renderQualifyContent();
      case 'contacting':
        return renderContactingContent();
      case 'quoted':
        return renderQuotedContent();
      case 'ready_to_schedule':
        return renderReadyToScheduleContent();
      default:
        return renderQualifyContent(); // Default to qualify content
    }
  };

  return renderContent();
}