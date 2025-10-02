import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { ChevronDown, LifeBuoy, Users } from 'lucide-react'
import { Ticket } from '@/types/ticket'
import { CallRecord } from '@/types/call-record'
import { authenticatedFetch } from '@/lib/api-client'
import { useUser } from '@/hooks/useUser'
import { useAssignableUsers } from '@/hooks/useAssignableUsers'
import { isAuthorizedAdminSync } from '@/lib/auth-helpers'
import { getCustomerDisplayName, getPhoneDisplay } from '@/lib/display-utils'
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
  ModalActionButtons
} from '@/components/Common/Modal'
import {
  CustomerInformation,
  CallInsights,
  CallDetails
} from '@/components/Tickets/TicketContent'
import styles from './TicketReviewModal.module.scss'
import sectionStyles from '@/components/Tickets/TicketContent/SharedSection.module.scss'

// Custom Sales Lead icon
const SalesLeadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
    <path d="M9.75588 12.5369L11.2559 14.0369L14.2559 11.0369M5.89338 10.0019C5.78391 9.50883 5.80072 8.99607 5.94225 8.51119C6.08378 8.02632 6.34544 7.58502 6.70298 7.22823C7.06052 6.87144 7.50236 6.6107 7.98754 6.47018C8.47271 6.32967 8.98551 6.31394 9.47838 6.42444C9.74966 6.00016 10.1234 5.65101 10.5651 5.40915C11.0068 5.1673 11.5023 5.04053 12.0059 5.04053C12.5095 5.04053 13.005 5.1673 13.4467 5.40915C13.8884 5.65101 14.2621 6.00016 14.5334 6.42444C15.027 6.31346 15.5407 6.32912 16.0266 6.46997C16.5126 6.61083 16.955 6.87229 17.3128 7.23005C17.6705 7.58781 17.932 8.03024 18.0728 8.51619C18.2137 9.00214 18.2294 9.51581 18.1184 10.0094C18.5427 10.2807 18.8918 10.6544 19.1337 11.0962C19.3755 11.5379 19.5023 12.0333 19.5023 12.5369C19.5023 13.0405 19.3755 13.536 19.1337 13.9777C18.8918 14.4194 18.5427 14.7932 18.1184 15.0644C18.2289 15.5573 18.2131 16.0701 18.0726 16.5553C17.9321 17.0405 17.6714 17.4823 17.3146 17.8398C16.9578 18.1974 16.5165 18.459 16.0316 18.6006C15.5467 18.7421 15.034 18.7589 14.5409 18.6494C14.27 19.0753 13.8959 19.426 13.4535 19.6689C13.011 19.9119 12.5144 20.0392 12.0096 20.0392C11.5049 20.0392 11.0083 19.9119 10.5658 19.6689C10.1233 19.426 9.74931 19.0753 9.47838 18.6494C8.98551 18.7599 8.47271 18.7442 7.98754 18.6037C7.50236 18.4632 7.06052 18.2024 6.70298 17.8456C6.34544 17.4889 6.08378 17.0476 5.94225 16.5627C5.80072 16.0778 5.78391 15.565 5.89338 15.0719C5.46585 14.8014 5.11369 14.4271 4.86967 13.9838C4.62564 13.5406 4.49768 13.0429 4.49768 12.5369C4.49768 12.031 4.62564 11.5332 4.86967 11.09C5.11369 10.6468 5.46585 10.2725 5.89338 10.0019Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Custom Customer Support icon
const CustomerSupportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6.6975 6.69896L9.8775 9.87896M14.1225 9.87896L17.3025 6.69896M14.1225 14.124L17.3025 17.304M9.8775 14.124L6.6975 17.304M19.5 12.0015C19.5 16.1436 16.1421 19.5015 12 19.5015C7.85786 19.5015 4.5 16.1436 4.5 12.0015C4.5 7.85933 7.85786 4.50146 12 4.50146C16.1421 4.50146 19.5 7.85933 19.5 12.0015ZM15 12.0015C15 13.6583 13.6569 15.0015 12 15.0015C10.3431 15.0015 9 13.6583 9 12.0015C9 10.3446 10.3431 9.00146 12 9.00146C13.6569 9.00146 15 10.3446 15 12.0015Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)


export interface TicketReviewModalProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
  onQualify: (qualification: 'sales' | 'customer_service' | 'junk', assignedTo?: string) => Promise<void>
  isQualifying?: boolean
  onSuccess?: (message: string) => void
}

export default function TicketReviewModal({
  ticket,
  isOpen,
  onClose,
  onQualify,
  isQualifying = false,
  onSuccess
}: TicketReviewModalProps) {
  // Set initial qualification based on current ticket service_type
  const getInitialQualification = (): 'sales' | 'customer_service' => {
    if (ticket.service_type === 'Support' || ticket.service_type === 'Customer Service') {
      return 'customer_service'
    }
    return 'sales'
  }

  const [selectedQualification, setSelectedQualification] = useState<'sales' | 'customer_service'>(getInitialQualification())
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [callRecord, setCallRecord] = useState<CallRecord | undefined>()

  // Get assignable users based on selected qualification type
  const {
    users: assignableUsers,
    loading: loadingUsers,
    error: usersError,
  } = useAssignableUsers({
    companyId: ticket.company_id,
    departmentType: selectedQualification === 'sales' ? 'sales' : 'support',
    enabled: isOpen,
  })
  const [loadingCallRecord, setLoadingCallRecord] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] = useState(false)
  const [step, setStep] = useState<'review' | 'assignment'>('review')
  const [isAnimating, setIsAnimating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const assignmentDropdownRef = useRef<HTMLDivElement>(null)


  // Get current authenticated user
  const { getDisplayName, getAvatarUrl, getInitials, user, profile } = useUser()
  const isAdmin = profile ? isAuthorizedAdminSync(profile) : false

  // Initialize selectedAssignee with current user ID when user is available
  useEffect(() => {
    if (user?.id && !selectedAssignee) {
      setSelectedAssignee(user.id)
    }
  }, [user?.id, selectedAssignee])

  const currentUser = {
    name: getDisplayName(),
    avatar: getAvatarUrl(),
    initials: getInitials()
  }

  const animateToStep = (newStep: 'review' | 'assignment') => {
    setIsAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setIsAnimating(false)
    }, 150) // Half of the 300ms transition
  }




  const fetchCallRecord = useCallback(async () => {
    // Only fetch call records for phone calls
    if (ticket.type !== 'phone_call') {
      return
    }

    try {
      setLoadingCallRecord(true)
      const data = await authenticatedFetch(`/api/tickets/${ticket.id}/calls`)
      if (data.callRecord) {
        setCallRecord(data.callRecord)
      }
    } catch (error) {
      console.error('Error fetching call record:', error)
    } finally {
      setLoadingCallRecord(false)
    }
  }, [ticket.id, ticket.type])

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && ticket.company_id) {
      fetchCallRecord()
    }
  }, [isOpen, ticket.company_id, fetchCallRecord])

  // Reset selected assignee when qualification changes (since available users change)
  useEffect(() => {
    setSelectedAssignee('')
  }, [selectedQualification])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (assignmentDropdownRef.current && !assignmentDropdownRef.current.contains(event.target as Node)) {
        setIsAssignmentDropdownOpen(false)
      }
    }

    if (isDropdownOpen || isAssignmentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, isAssignmentDropdownOpen])

  const handleClose = () => {
    setStep('review')
    setSelectedQualification(getInitialQualification())
    setSelectedAssignee(user?.id || '')
    setIsAnimating(false)
    setIsDropdownOpen(false)
    setIsAssignmentDropdownOpen(false)
    onClose()
  }

  const handleJunk = async () => {
    try {
      await onQualify('junk')
      handleClose()
    } catch (error) {
      console.error('Error marking as junk:', error)
    }
  }

  const handleApprove = () => {
    animateToStep('assignment')
  }

  const handleFinalApprove = async () => {
    try {
      // For team assignments, pass undefined to leave unassigned but still qualify the ticket
      const assigneeId = isTeamAssignment(selectedAssignee) ? undefined : (selectedAssignee || undefined)
      await onQualify(selectedQualification, assigneeId)
      handleClose()
      // Show toast after modal closes via parent callback
      if (onSuccess) {
        setTimeout(() => {
          const message = isTeamAssignment(selectedAssignee)
            ? `The ticket was successfully assigned to ${getTeamDisplayName(selectedAssignee)}.`
            : 'The ticket was successfully assigned.'
          onSuccess(message)
        }, 300) // Wait for modal close animation to complete
      }
    } catch (error) {
      console.error('Error approving ticket:', error)
    }
  }

  const handleBack = () => {
    if (step === 'assignment') {
      animateToStep('review')
    } else {
      handleClose()
    }
  }

  const getQualificationLabel = () => {
    switch (selectedQualification) {
      case 'sales':
        return 'Sales Lead'
      case 'customer_service':
        return 'Support Ticket'
      default:
        return 'Sales Lead'
    }
  }

  const getQualificationIcon = () => {
    switch (selectedQualification) {
      case 'sales':
        return <SalesLeadIcon />
      case 'customer_service':
        return <CustomerSupportIcon />
      default:
        return null
    }
  }

  const dropdownOptions = [
    {
      value: 'sales',
      label: 'Sales Lead',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 18 19" fill="none">
          <path d="M9 4.04004V15.04M6.25 12.4569L7.05575 13.061C8.12917 13.8667 9.86992 13.8667 10.9442 13.061C12.0186 12.2552 12.0186 10.9499 10.9442 10.1441C10.408 9.74079 9.704 9.54004 9 9.54004C8.33542 9.54004 7.67083 9.33837 7.16392 8.93596C6.15008 8.13021 6.15008 6.82487 7.16392 6.01912C8.17775 5.21337 9.82225 5.21337 10.8361 6.01912L11.2165 6.32162M17.25 9.54004C17.25 10.6234 17.0366 11.6962 16.622 12.6972C16.2074 13.6981 15.5997 14.6076 14.8336 15.3737C14.0675 16.1398 13.1581 16.7474 12.1571 17.162C11.1562 17.5766 10.0834 17.79 9 17.79C7.91659 17.79 6.8438 17.5766 5.84286 17.162C4.84193 16.7474 3.93245 16.1398 3.16637 15.3737C2.40029 14.6076 1.7926 13.6981 1.37799 12.6972C0.963392 11.6962 0.75 10.6234 0.75 9.54004C0.75 7.352 1.61919 5.25358 3.16637 3.70641C4.71354 2.15923 6.81196 1.29004 9 1.29004C11.188 1.29004 13.2865 2.15923 14.8336 3.70641C16.3808 5.25358 17.25 7.352 17.25 9.54004Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      value: 'customer_service',
      label: 'Customer Support',
      icon: <LifeBuoy size={16} />
    }
  ]

  const selectedOption = dropdownOptions.find(option => option.value === selectedQualification)

  const handleDropdownToggle = () => {
    if (!isQualifying) {
      setIsDropdownOpen(!isDropdownOpen)
    }
  }

  const handleOptionSelect = async (value: string) => {
    const newQualification = value as 'sales' | 'customer_service'
    setSelectedQualification(newQualification)
    setIsDropdownOpen(false)

    // Update the ticket type based on the new qualification
    try {
      const newServiceType = newQualification === 'sales' ? 'Sales' : 'Support'

      await authenticatedFetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type: newServiceType
        }),
      })

      if (onSuccess) {
        onSuccess(`Ticket type updated to ${newServiceType}.`)
      }
    } catch (error) {
      console.error('Error updating ticket type:', error)
      if (onSuccess) {
        onSuccess('Failed to update ticket type. Please try again.')
      }
    }
  }

  const handleAssignmentDropdownToggle = () => {
    if (!isQualifying) {
      setIsAssignmentDropdownOpen(!isAssignmentDropdownOpen)
    }
  }

  const handleAssigneeSelect = (userId: string) => {
    setSelectedAssignee(userId)
    setIsAssignmentDropdownOpen(false)
  }

  // Helper functions for team assignment
  const getSalesTeamCount = () => {
    return assignableUsers.filter(user => user.departments.includes('sales')).length
  }

  const getSupportTeamCount = () => {
    return assignableUsers.filter(user => user.departments.includes('support')).length
  }

  const isTeamAssignment = (assigneeId: string) => {
    return assigneeId === 'sales_team' || assigneeId === 'support_team'
  }

  const getTeamDisplayName = (assigneeId: string) => {
    switch (assigneeId) {
      case 'sales_team':
        return 'Sales Team'
      case 'support_team':
        return 'Support Team'
      default:
        return ''
    }
  }

  const getTeamMemberCount = (assigneeId: string) => {
    switch (assigneeId) {
      case 'sales_team':
        return getSalesTeamCount()
      case 'support_team':
        return getSupportTeamCount()
      default:
        return 0
    }
  }

  const getSelectedAssigneeData = () => {
    // Handle team assignments
    if (isTeamAssignment(selectedAssignee)) {
      return {
        id: selectedAssignee,
        name: getTeamDisplayName(selectedAssignee),
        avatar: null,
        initials: '',
        display_name: getTeamDisplayName(selectedAssignee),
        isSelf: false,
        isTeam: true,
        memberCount: getTeamMemberCount(selectedAssignee)
      }
    }

    if (selectedAssignee === user?.id) {
      return {
        id: user.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        initials: currentUser.initials,
        display_name: currentUser.name,
        isSelf: true,
        isTeam: false
      }
    }

    const assignedUser = assignableUsers.find(u => u.id === selectedAssignee)
    if (assignedUser) {
      return {
        ...assignedUser,
        name: assignedUser.display_name,
        avatar: assignedUser.avatar_url,
        initials: assignedUser.display_name.split(' ').map(n => n[0]).join('').toUpperCase(),
        isSelf: false,
        isTeam: false
      }
    }

    return {
      id: user?.id || '',
      name: currentUser.name,
      avatar: currentUser.avatar,
      initials: currentUser.initials,
      display_name: currentUser.name,
      isSelf: true,
      isTeam: false
    }
  }

  // Team avatar component
  const TeamAvatar = () => (
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: '#005194',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Users size={18} color="white" />
    </div>
  )

  const renderDropdown = () => (
    <div ref={dropdownRef} className={styles.customDropdown}>
      <button
        className={`${styles.dropdownButton} ${isDropdownOpen ? styles.open : ''} ${isQualifying ? styles.disabled : ''}`}
        onClick={handleDropdownToggle}
        disabled={isQualifying}
      >
        <div className={styles.selectedOption}>
          {selectedOption?.icon}
          <span className={styles.optionText}>{selectedOption?.label}</span>
        </div>
        <ChevronDown size={16} className={styles.chevronIcon} />
      </button>

      {isDropdownOpen && (
        <div className={styles.dropdownMenu}>
          {dropdownOptions.map((option) => (
            <button
              key={option.value}
              className={`${styles.dropdownOption} ${selectedQualification === option.value ? styles.selected : ''}`}
              onClick={() => handleOptionSelect(option.value)}
            >
              {option.icon}
              <span className={styles.optionText}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderAssignmentDropdown = () => {
    const selectedAssigneeData = getSelectedAssigneeData()

    return (
      <div ref={assignmentDropdownRef} className={styles.customDropdown}>
        <button
          className={`${styles.dropdownButton} ${isAssignmentDropdownOpen ? styles.open : ''} ${isQualifying ? styles.disabled : ''}`}
          onClick={handleAssignmentDropdownToggle}
          disabled={isQualifying}
        >
          <div className={styles.selectedOption}>
            <div className={styles.avatarContainer}>
              {selectedAssigneeData.isTeam ? (
                <TeamAvatar />
              ) : selectedAssigneeData.avatar ? (
                <Image
                  src={selectedAssigneeData.avatar}
                  alt={selectedAssigneeData.name}
                  width={32}
                  height={32}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarInitials}>
                  {selectedAssigneeData.initials}
                </div>
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName} style={selectedAssigneeData.isTeam ? { fontSize: '14px', fontWeight: 700, color: '#171717' } : {}}>{selectedAssigneeData.name}</span>
              {selectedAssigneeData.isSelf && <span className={styles.myselfLabel}>Myself</span>}
              {selectedAssigneeData.isTeam && (
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#6A7282' }}>
                  {selectedAssigneeData.memberCount} members
                </span>
              )}
            </div>
          </div>
          <ChevronDown size={16} className={styles.chevronIcon} />
        </button>

        {isAssignmentDropdownOpen && (
          <div className={styles.dropdownMenu}>
            {/* Current user first */}
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
                  <div className={styles.avatarInitials}>
                    {currentUser.initials}
                  </div>
                )}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{currentUser.name}</span>
                <span className={styles.myselfLabel}>Myself</span>
              </div>
            </button>

            {/* Team assignments - moved to second position */}
            {selectedQualification === 'sales' && (
              <button
                className={`${styles.dropdownOption} ${selectedAssignee === 'sales_team' ? styles.selected : ''}`}
                onClick={() => handleAssigneeSelect('sales_team')}
              >
                <div className={styles.avatarContainer}>
                  <TeamAvatar />
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName} style={{ fontSize: '14px', fontWeight: 700, color: '#171717' }}>Sales Team</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#6A7282' }}>
                    {getSalesTeamCount()} members
                  </span>
                </div>
              </button>
            )}

            {selectedQualification === 'customer_service' && (
              <button
                className={`${styles.dropdownOption} ${selectedAssignee === 'support_team' ? styles.selected : ''}`}
                onClick={() => handleAssigneeSelect('support_team')}
              >
                <div className={styles.avatarContainer}>
                  <TeamAvatar />
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName} style={{ fontSize: '14px', fontWeight: 700, color: '#171717' }}>Support Team</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#6A7282' }}>
                    {getSupportTeamCount()} members
                  </span>
                </div>
              </button>
            )}

            {/* Other eligible users */}
            {assignableUsers
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
                      <div className={styles.avatarInitials}>
                        {companyUser.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName} style={{ fontSize: '14px', fontWeight: 700, color: '#171717' }}>{companyUser.display_name}</span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    )
  }

  if (step === 'assignment') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} className={`${styles.ticketModal} ${isAnimating ? styles.stepTransition : ''}`}>
          <ModalTop
            title={`Assign ${getQualificationLabel()}`}
            reviewer={currentUser}
            reviewingText="Assigning"
          />

        <ModalMiddle className={styles.modalContent}>
          <div style={{ display: 'flex', gap: '16px', width: '100%', alignItems: 'stretch' }}>
            {/* Left Section - Customer Information */}
            <div style={{ flex: 1, display: 'flex' }}>
              <div className={sectionStyles.section} style={{ flex: 1 }}>
                <div className={sectionStyles.sectionHeader}>
                  <div className={sectionStyles.headerLeft}>
                    {getQualificationIcon()}
                    <h3>
                      {selectedQualification === 'sales' ? 'New Qualified Sales Lead' : 'New Support Ticket'}
                    </h3>
                  </div>
                </div>
                <div className={sectionStyles.infoGrid}>
                  <div className={sectionStyles.infoRow}>
                    <div className={sectionStyles.infoField}>
                      <span className={sectionStyles.label}>Customer Name</span>
                      <span className={sectionStyles.value}>
                        {getCustomerDisplayName(ticket.customer)}
                      </span>
                    </div>
                    <div className={sectionStyles.infoField}>
                      <span className={sectionStyles.label}>Primary Phone</span>
                      <span className={sectionStyles.value}>
                        {getPhoneDisplay(ticket.customer?.phone)}
                      </span>
                    </div>
                  </div>
                  <div className={sectionStyles.infoRow}>
                    <div className={sectionStyles.infoField}>
                      <span className={sectionStyles.label}>Sentiment</span>
                      <span className={sectionStyles.value}>{callRecord?.sentiment || 'Neutral'}</span>
                    </div>
                    <div className={sectionStyles.infoField}>
                      <span className={sectionStyles.label}>Source</span>
                      <span className={sectionStyles.value}>
                        {ticket.source === 'google_cpc' ? 'Paid Advertisement' :
                         ticket.source === 'organic' ? 'Organic' :
                         ticket.source === 'referral' ? 'Referral' :
                         'Other'}
                      </span>
                    </div>
                  </div>
                  <div className={sectionStyles.infoRow}>
                    <div className={sectionStyles.infoField}>
                      <span className={sectionStyles.label}>Primary Pest Issue</span>
                      <span className={sectionStyles.value}>{callRecord?.pest_issue || ticket.pest_type || 'Not specified'}</span>
                    </div>
                    <div className={sectionStyles.infoField}>
                      <span className={sectionStyles.label}>Preferred Service Time</span>
                      <span className={sectionStyles.value}>{callRecord?.preferred_service_time || 'Anytime'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Assignment */}
            <div style={{ flex: 1, display: 'flex' }}>
              <div className={sectionStyles.section} style={{ flex: 1 }}>
                <div className={sectionStyles.sectionHeader}>
                  <div className={sectionStyles.headerLeft}>
                    <h3>
                      {selectedQualification === 'sales' ? 'Assign lead to:' : 'Assign to:'}
                    </h3>
                  </div>
                </div>
                <div className={sectionStyles.infoGrid}>
                  <div className={sectionStyles.infoRow}>
                    <div className={sectionStyles.infoField} style={{ gridColumn: '1 / -1' }}>
                      {renderAssignmentDropdown()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalMiddle>

        <ModalBottom>
          <ModalActionButtons
            onBack={handleBack}
            showBackButton={true}
            isFirstStep={false}
            onPrimaryAction={handleFinalApprove}
            primaryButtonText={`Continue ${getQualificationLabel()}`}
            primaryButtonIcon={getQualificationIcon()}
            primaryButtonDisabled={false}
            isLoading={isQualifying}
            loadingText="Processing..."
          />
        </ModalBottom>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={`${styles.ticketModal} ${isAnimating ? styles.stepTransition : ''}`}>
        <ModalTop
          title="Review Ticket"
          dropdown={renderDropdown()}
          reviewer={currentUser}
        />

      <ModalMiddle className={styles.modalContent}>
        <div className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <CustomerInformation
              ticket={ticket}
              isEditable={true}
              isAdmin={isAdmin}
              onUpdate={(_customerData) => {
                if (onSuccess) {
                  onSuccess('The ticket was successfully updated.')
                }
              }}
            />

            <CallInsights
              ticket={ticket}
              callRecord={callRecord}
              isEditable={true}
              onUpdate={(_insightsData) => {
                if (onSuccess) {
                  onSuccess('The ticket was successfully updated.')
                }
              }}
            />
          </div>

          <div className={styles.rightColumn}>
            <CallDetails
              ticket={ticket}
              callRecord={callRecord}
            />

            {loadingCallRecord && (
              <div className={styles.loadingMessage}>
                Loading call details...
              </div>
            )}
          </div>
        </div>
      </ModalMiddle>

      <ModalBottom>
        <ModalActionButtons
          onBack={handleClose}
          showBackButton={true}
          isFirstStep={true}
          onJunk={handleJunk}
          onAddTask={() => {
            // TODO: Implement add task functionality
          }}
          onPrimaryAction={handleApprove}
          primaryButtonText={`Approve ${getQualificationLabel()}`}
          primaryButtonIcon={getQualificationIcon()}
          primaryButtonDisabled={false}
          isLoading={isQualifying}
          loadingText="Processing..."
          addTaskDisabled={true}
          junkDisabled={isQualifying}
        />
      </ModalBottom>
    </Modal>
  )
}