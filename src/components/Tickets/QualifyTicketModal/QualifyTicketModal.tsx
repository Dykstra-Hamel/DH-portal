import React, { useState, useEffect, useCallback } from 'react'
import { Ticket } from '@/types/ticket'
import { getDetailedTimeAgo } from '@/lib/time-utils'
import { User, Phone, Mail, MapPin, Clock, ArrowRight, Trash2 } from 'lucide-react'
import { authenticatedFetch } from '@/lib/api-client'
import styles from './QualifyTicketModal.module.scss'
import modalStyles from '@/components/Common/Modal/Modal.module.scss'
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

interface CompanyUser {
  id: string
  first_name: string
  last_name: string
  email: string
  display_name: string
}

interface QualifyTicketModalProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
  onQualify: (qualification: 'sales' | 'customer_service' | 'junk', assignedTo?: string) => Promise<void>
  isQualifying?: boolean
}

export default function QualifyTicketModal({
  ticket,
  isOpen,
  onClose,
  onQualify,
  isQualifying = false
}: QualifyTicketModalProps) {
  const [selectedQualification, setSelectedQualification] = useState<'sales' | 'customer_service' | 'junk' | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [step, setStep] = useState<'selection' | 'assignment'>('selection')
  const [isAnimating, setIsAnimating] = useState(false)

  const animateToStep = (newStep: 'selection' | 'assignment') => {
    setIsAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setIsAnimating(false)
    }, 150) // Half of the 300ms transition
  }

  const handleQualificationSelect = async (qualification: 'sales' | 'customer_service' | 'junk') => {
    setSelectedQualification(qualification)
    if (qualification === 'junk') {
      // Skip assignment step for junk tickets and submit directly
      try {
        await onQualify(qualification)
        onClose()
      } catch (error) {
        console.error('Qualification failed:', error)
        // Error handling is done in parent component
      }
    } else {
      animateToStep('assignment')
    }
  }

  const handleConfirm = async () => {
    if (!selectedQualification) return
    
    try {
      await onQualify(selectedQualification, selectedAssignee || undefined)
      onClose()
    } catch (error) {
      console.error('Qualification failed:', error)
      // Error handling is done in parent component
    }
  }


  const handleBack = () => {
    if (step === 'assignment') {
      animateToStep('selection')
      setSelectedQualification(null)
    } else {
      animateToStep('selection')
      setSelectedQualification(null)
    }
  }

  const reset = () => {
    setStep('selection')
    setSelectedQualification(null)
    setSelectedAssignee('')
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

  // Fetch company users when modal opens
  useEffect(() => {
    if (isOpen && ticket.company_id) {
      fetchCompanyUsers()
    }
  }, [isOpen, ticket.company_id, fetchCompanyUsers])

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  const formatAddress = (customer: any) => {
    if (!customer) return 'No address'
    
    const parts = []
    if (customer.address) parts.push(customer.address)
    if (customer.city) parts.push(customer.city)
    if (customer.state) parts.push(customer.state)
    if (customer.zip_code) parts.push(customer.zip_code)
    
    return parts.length > 0 ? parts.join(', ') : 'No address'
  }

  const getOriginDisplay = (type: string) => {
    const originMap: Record<string, string> = {
      'phone_call': 'Call',
      'web_form': 'Form',
      'email': 'Email',
      'chat': 'Chat',
      'sms': 'SMS'
    }
    return originMap[type] || type
  }

  if (step === 'selection') {
    return (
      <div className={styles.overlay}>
        <div className={`${styles.modal} ${isAnimating ? styles.stepTransition : ''}`}>
          <div className={styles.header}>
            <h2>Qualify Ticket</h2>
            <button className={styles.closeButton} onClick={handleClose}>×</button>
          </div>
          
          <div className={styles.body}>
            {/* Ticket Preview */}
            <div className={styles.ticketPreview}>
              <h3>Ticket Information</h3>
              
              <div className={styles.previewGrid}>
                <div className={styles.previewItem}>
                  <Clock size={16} />
                  <span>Created {getDetailedTimeAgo(ticket.created_at)}</span>
                </div>
                
                {ticket.customer && (
                  <>
                    <div className={styles.previewItem}>
                      <User size={16} />
                      <span>{ticket.customer.first_name} {ticket.customer.last_name}</span>
                    </div>
                    
                    {ticket.customer.phone && (
                      <div className={styles.previewItem}>
                        <Phone size={16} />
                        <span>{ticket.customer.phone}</span>
                      </div>
                    )}
                    
                    {ticket.customer.email && (
                      <div className={styles.previewItem}>
                        <Mail size={16} />
                        <span>{ticket.customer.email}</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className={styles.previewItem}>
                  <MapPin size={16} />
                  <span>{formatAddress(ticket.customer)}</span>
                </div>
              </div>

              {ticket.description && (
                <div className={styles.description}>
                  <h4>Description</h4>
                  <p>{ticket.description}</p>
                </div>
              )}
            </div>

            {/* Qualification Options */}
            <div className={styles.qualificationOptions}>
              <h3>How should this ticket be qualified?</h3>
              
              <div className={styles.optionGrid}>
                <button 
                  className={styles.qualificationButton}
                  onClick={() => handleQualificationSelect('sales')}
                >
                  <div className={styles.optionIcon}>💰</div>
                  <div className={styles.optionContent}>
                    <h4>Sales Lead</h4>
                    <p>Convert to a sales opportunity in the leads pipeline</p>
                  </div>
                  <ArrowRight size={20} />
                </button>
                
                <button 
                  className={styles.qualificationButton}
                  onClick={() => handleQualificationSelect('customer_service')}
                >
                  <div className={styles.optionIcon}>🛠️</div>
                  <div className={styles.optionContent}>
                    <h4>Customer Service</h4>
                    <p>Handle as a customer service or support ticket</p>
                  </div>
                  <ArrowRight size={20} />
                </button>
                
                <button 
                  className={styles.qualificationButton}
                  onClick={() => handleQualificationSelect('junk')}
                >
                  <div className={styles.optionIcon}><Trash2 size={20} /></div>
                  <div className={styles.optionContent}>
                    <h4>Mark as Junk</h4>
                    <p>Archive this ticket as spam or invalid</p>
                  </div>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button className={styles.secondaryButton} onClick={handleClose}>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Assignment step
  if (step === 'assignment') {
    return (
      <div className={styles.overlay}>
        <div className={`${modalStyles.modal} ${isAnimating ? modalStyles.stepTransition : ''}`}>
          {/* Modal Top */}
          <div className={modalStyles.modalTop}>
            <div className={modalStyles.topRow}>
              <h2 className={modalStyles.title}>
                {selectedQualification === 'sales' ? 'Assign Sales Lead' : 'Assign Support Ticket'}
              </h2>
              <button className={modalStyles.closeButton} onClick={handleClose}>×</button>
            </div>
            <div className={modalStyles.topControls}>
              <div className={modalStyles.reviewerSection}>
                <span className={modalStyles.reviewingText}>Assigning</span>
                <div className={modalStyles.reviewerInfo}>
                  <div className={modalStyles.avatarContainer}>
                    <div className={modalStyles.avatarInitials}>HS</div>
                  </div>
                  <span className={modalStyles.reviewerName}>Heather Smith</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Middle */}
          <div className={modalStyles.modalMiddle}>
            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              {/* Left Section - Customer Information */}
              <div style={{ flex: 1 }}>
                <div className={sectionStyles.section}>
                  <div className={sectionStyles.sectionHeader}>
                    <div className={sectionStyles.headerLeft}>
                      {selectedQualification === 'sales' ? <SalesLeadIcon /> : <CustomerSupportIcon />}
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
                          {ticket.customer ?
                            `${ticket.customer.first_name} ${ticket.customer.last_name}` :
                            'Unknown Customer'
                          }
                        </span>
                      </div>
                      <div className={sectionStyles.infoField}>
                        <span className={sectionStyles.label}>Primary Phone</span>
                        <span className={sectionStyles.value}>
                          {ticket.customer?.phone || 'Not provided'}
                        </span>
                      </div>
                    </div>
                    <div className={sectionStyles.infoRow}>
                      <div className={sectionStyles.infoField}>
                        <span className={sectionStyles.label}>Sentiment</span>
                        <span className={sectionStyles.value}>Neutral</span>
                      </div>
                      <div className={sectionStyles.infoField}>
                        <span className={sectionStyles.label}>Source</span>
                        <span className={sectionStyles.value}>Paid Advertisement</span>
                      </div>
                    </div>
                    <div className={sectionStyles.infoRow}>
                      <div className={sectionStyles.infoField}>
                        <span className={sectionStyles.label}>Primary Pest Issue</span>
                        <span className={sectionStyles.value}>Termites</span>
                      </div>
                      <div className={sectionStyles.infoField}>
                        <span className={sectionStyles.label}>Preferred Service Time</span>
                        <span className={sectionStyles.value}>Anytime</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Assignment */}
              <div style={{ flex: '0 0 400px' }}>
                <div className={sectionStyles.section}>
                  <div className={sectionStyles.sectionHeader}>
                    <div className={sectionStyles.headerLeft}>
                      <User size={20} />
                      <h3>
                        {selectedQualification === 'sales' ? 'Assign lead to:' : 'Assign to:'}
                      </h3>
                    </div>
                  </div>
                  <div className={sectionStyles.infoGrid}>
                    <div className={sectionStyles.infoRow}>
                      <div className={sectionStyles.infoField} style={{ gridColumn: '1 / -1' }}>
                        <select
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                          className={modalStyles.dropdown}
                          disabled={loadingUsers}
                        >
                          <option value="">Select assignee...</option>
                          {companyUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.display_name}
                            </option>
                          ))}
                        </select>
                        {loadingUsers && <span style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>Loading users...</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Bottom */}
          <div className={modalStyles.modalBottom}>
            <div className={modalStyles.buttonGroup}>
              <div className={modalStyles.leftButtons}>
                <button
                  className={modalStyles.secondaryButton}
                  onClick={handleBack}
                  disabled={isQualifying}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path d="M15.0192 18.4646C15.206 18.6514 15.311 18.9048 15.311 19.169C15.311 19.4331 15.206 19.6865 15.0192 19.8733C14.8324 20.0601 14.5791 20.165 14.3149 20.165C14.0508 20.165 13.7974 20.0601 13.6106 19.8733L6.98167 13.2444C6.88897 13.152 6.81542 13.0422 6.76523 12.9214C6.71504 12.8005 6.68921 12.6709 6.68921 12.54C6.68921 12.4092 6.71504 12.2796 6.76523 12.1587C6.81542 12.0379 6.88897 11.9281 6.98167 11.8357L13.6106 5.20678C13.7974 5.01998 14.0508 4.91504 14.3149 4.91504C14.5791 4.91504 14.8324 5.01998 15.0192 5.20678C15.206 5.39358 15.311 5.64693 15.311 5.9111C15.311 6.17528 15.206 6.42863 15.0192 6.61543L9.09547 12.5392L15.0192 18.4646Z" fill="currentColor"/>
                  </svg>
                  Back
                </button>
              </div>
              <div className={modalStyles.rightButtons}>
                <button
                  className={modalStyles.primaryButton}
                  onClick={handleConfirm}
                  disabled={isQualifying}
                >
                  {isQualifying ? (
                    'Processing...'
                  ) : (
                    <>
                      {selectedQualification === 'sales' && <SalesLeadIcon />}
                      {selectedQualification === 'customer_service' && <CustomerSupportIcon />}
                      {selectedQualification === 'sales' ? 'Approve Sales Lead' : 'Approve Support Ticket'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No other steps - return null if we somehow get here
  return null
}