import React, { useState, useEffect, useCallback } from 'react'
import { Ticket } from '@/types/ticket'
import { getDetailedTimeAgo } from '@/lib/time-utils'
import { User, Phone, Mail, MapPin, Clock, ArrowRight, Trash2 } from 'lucide-react'
import { authenticatedFetch } from '@/lib/api-client'
import styles from './QualifyTicketModal.module.scss'

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
  const [step, setStep] = useState<'selection' | 'confirmation'>('selection')

  const handleQualificationSelect = (qualification: 'sales' | 'customer_service' | 'junk') => {
    setSelectedQualification(qualification)
    if (qualification === 'junk') {
      // Skip assignment step for junk tickets
      setStep('confirmation')
    } else {
      setStep('confirmation')
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
    setStep('selection')
    setSelectedQualification(null)
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
        <div className={styles.modal}>
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
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation step
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Confirm Qualification</h2>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>
        
        <div className={styles.body}>
          <div className={styles.confirmationContent}>
            <div className={styles.confirmationIcon}>
              {selectedQualification === 'sales' ? '💰' : 
               selectedQualification === 'customer_service' ? '🛠️' : 
               <Trash2 size={32} />}
            </div>
            
            <h3>
              {selectedQualification === 'sales' ? 'Convert to Sales Lead' : 
               selectedQualification === 'customer_service' ? 'Assign to Customer Service' :
               'Mark as Junk'}
            </h3>
            
            <div className={styles.confirmationDetails}>
              <p><strong>Customer:</strong> {ticket.customer?.first_name} {ticket.customer?.last_name}</p>
              <p><strong>Origin:</strong> {getOriginDisplay(ticket.type)}</p>
              <p><strong>Source:</strong> {ticket.source}</p>
            </div>

            {selectedQualification !== 'junk' && (
              <div className={styles.assignmentSection}>
                <h4>Assignment</h4>
                <div className={styles.assignmentField}>
                  <label htmlFor="assignee">Assign to:</label>
                  <select 
                    id="assignee"
                    value={selectedAssignee} 
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className={styles.assignmentSelect}
                    disabled={loadingUsers}
                  >
                    <option value="">Unassigned</option>
                    {companyUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.display_name}
                      </option>
                    ))}
                  </select>
                  {loadingUsers && <span className={styles.loadingText}>Loading users...</span>}
                </div>
              </div>
            )}

            {selectedQualification === 'sales' ? (
              <div className={styles.actionDescription}>
                <p>This ticket will be converted to a lead and moved to the sales pipeline. 
                A customer record will be created if needed.</p>
              </div>
            ) : selectedQualification === 'customer_service' ? (
              <div className={styles.actionDescription}>
                <p>This ticket will be marked as Customer Service and can be assigned 
                to support staff.</p>
              </div>
            ) : (
              <div className={styles.actionDescription}>
                <p>This ticket will be archived and marked as junk. This action cannot be undone.</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.secondaryButton} 
            onClick={handleBack}
            disabled={isQualifying}
          >
            Back
          </button>
          <button 
            className={styles.primaryButton} 
            onClick={handleConfirm}
            disabled={isQualifying}
          >
            {isQualifying ? 'Processing...' : 'Confirm Qualification'}
          </button>
        </div>
      </div>
    </div>
  )
}