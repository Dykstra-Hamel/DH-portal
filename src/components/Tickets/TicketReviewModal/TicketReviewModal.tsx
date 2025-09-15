import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, LifeBuoy } from 'lucide-react'
import { Ticket } from '@/types/ticket'
import { CallRecord } from '@/types/call-record'
import { authenticatedFetch } from '@/lib/api-client'
import { useUser } from '@/hooks/useUser'
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

interface CompanyUser {
  id: string
  first_name: string
  last_name: string
  email: string
  display_name: string
}

export interface TicketReviewModalProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
  onQualify: (qualification: 'sales' | 'customer_service' | 'junk', assignedTo?: string) => Promise<void>
  isQualifying?: boolean
}

export default function TicketReviewModal({
  ticket,
  isOpen,
  onClose,
  onQualify,
  isQualifying = false
}: TicketReviewModalProps) {
  const [selectedQualification, setSelectedQualification] = useState<'sales' | 'customer_service'>('sales')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [callRecord, setCallRecord] = useState<CallRecord | undefined>()
  const [loadingCallRecord, setLoadingCallRecord] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get current authenticated user
  const { getDisplayName, getAvatarUrl, getInitials, user } = useUser()

  const currentUser = {
    name: getDisplayName(),
    avatar: getAvatarUrl(),
    initials: getInitials()
  }


  const fetchCompanyUsers = useCallback(async () => {
    try {
      setLoadingUsers(true)
      const data = await authenticatedFetch(`/api/companies/${ticket.company_id}/users`)
      setCompanyUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching company users:', error)
      setCompanyUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }, [ticket.company_id])

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
      fetchCompanyUsers()
      fetchCallRecord()
    }
  }, [isOpen, ticket.company_id, fetchCompanyUsers, fetchCallRecord])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleClose = () => {
    setSelectedQualification('sales')
    setSelectedAssignee('')
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

  const handleApprove = async () => {
    try {
      await onQualify(selectedQualification, selectedAssignee || undefined)
      handleClose()
    } catch (error) {
      console.error('Error approving ticket:', error)
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

  const handleOptionSelect = (value: string) => {
    setSelectedQualification(value as 'sales' | 'customer_service')
    setIsDropdownOpen(false)
  }

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={styles.ticketModal}>
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
              onUpdate={(_customerData) => {
                // Handle customer data updates if needed
              }}
            />

            <CallInsights
              ticket={ticket}
              callRecord={callRecord}
              isEditable={true}
              onUpdate={(_insightsData) => {
                // Handle insights data updates if needed
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