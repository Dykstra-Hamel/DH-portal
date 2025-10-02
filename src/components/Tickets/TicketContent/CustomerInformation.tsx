import React, { useState } from 'react'
import { User } from 'lucide-react'
import { Ticket } from '@/types/ticket'
import { authenticatedFetch } from '@/lib/api-client'
import styles from './CustomerInformation.module.scss'

interface CustomerInformationProps {
  ticket: Ticket
  isEditable?: boolean
  onUpdate?: (customerData: any) => void
  isAdmin?: boolean
}

export default function CustomerInformation({
  ticket,
  isEditable = false,
  onUpdate,
  isAdmin = false
}: CustomerInformationProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    first_name: ticket.customer?.first_name || '',
    last_name: ticket.customer?.last_name || '',
    email: ticket.customer?.email || '',
    phone: ticket.customer?.phone || '',
    address: ticket.customer?.address || '',
    city: ticket.customer?.city || '',
    state: ticket.customer?.state || '',
    zip_code: ticket.customer?.zip_code || ''
  })

  const formatAddress = () => {
    if (!ticket.customer) return 'No address'

    const parts = []
    if (ticket.customer.address) parts.push(ticket.customer.address)
    if (ticket.customer.city) parts.push(ticket.customer.city)
    if (ticket.customer.state) parts.push(ticket.customer.state)
    if (ticket.customer.zip_code) parts.push(ticket.customer.zip_code)

    return parts.length > 0 ? parts.join(', ') : 'No address'
  }

  const handleSave = async () => {
    if (!ticket.customer?.id) {
      console.error('No customer ID available')
      return
    }

    try {
      // Use admin API if user is admin, otherwise use regular API
      const apiPath = isAdmin
        ? `/api/admin/customers/${ticket.customer.id}`
        : `/api/customers/${ticket.customer.id}`

      // Update customer information
      await authenticatedFetch(apiPath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      // Call the onUpdate callback if provided
      onUpdate?.(editData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  const handleCancel = () => {
    setEditData({
      first_name: ticket.customer?.first_name || '',
      last_name: ticket.customer?.last_name || '',
      email: ticket.customer?.email || '',
      phone: ticket.customer?.phone || '',
      address: ticket.customer?.address || '',
      city: ticket.customer?.city || '',
      state: ticket.customer?.state || '',
      zip_code: ticket.customer?.zip_code || ''
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={`${styles.section} ${styles.editing}`}>
        <div className={`${styles.sectionHeader} ${isEditing ? styles.editing : ''}`}>
          <div className={styles.headerLeft}>
            <User size={20} />
            <h3>Customer Information</h3>
          </div>
        </div>

  return (
    <div className={styles.section}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>First Name</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={fields.first_name.value}
              onChange={e => handleFieldChange('first_name', e.target.value)}
              className={`${styles.autoSaveInput} ${fields.first_name.hasError ? styles.hasError : ''}`}
              placeholder="Enter first name"
            />
            <FieldStatusIndicator fieldName="first_name" />
          </div>
        </div>
        <div className={styles.formField}>
          <label>Last Name</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={fields.last_name.value}
              onChange={e => handleFieldChange('last_name', e.target.value)}
              className={`${styles.autoSaveInput} ${fields.last_name.hasError ? styles.hasError : ''}`}
              placeholder="Enter last name"
            />
            <FieldStatusIndicator fieldName="last_name" />
          </div>
        </div>
        <div className={styles.formField}>
          <label>Email</label>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={fields.email.value}
              onChange={e => handleFieldChange('email', e.target.value)}
              className={`${styles.autoSaveInput} ${fields.email.hasError ? styles.hasError : ''}`}
              placeholder="Enter email address"
            />
            <FieldStatusIndicator fieldName="email" />
          </div>
        </div>
        <div className={styles.formField}>
          <label>Phone</label>
          <div className={styles.inputWrapper}>
            <input
              type="tel"
              value={fields.phone.value}
              onChange={e => handleFieldChange('phone', e.target.value)}
              className={`${styles.autoSaveInput} ${fields.phone.hasError ? styles.hasError : ''}`}
              placeholder="Enter phone number"
            />
            <FieldStatusIndicator fieldName="phone" />
          </div>
        </div>
      </div>
    </div>
  );
}
