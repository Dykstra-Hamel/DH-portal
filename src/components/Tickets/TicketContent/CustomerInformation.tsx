import React, { useState } from 'react'
import { User } from 'lucide-react'
import { Ticket } from '@/types/ticket'
import styles from './CustomerInformation.module.scss'

interface CustomerInformationProps {
  ticket: Ticket
  isEditable?: boolean
  onUpdate?: (customerData: any) => void
}

export default function CustomerInformation({
  ticket,
  isEditable = false,
  onUpdate
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

  const handleSave = () => {
    onUpdate?.(editData)
    setIsEditing(false)
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
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.headerLeft}>
            <User size={20} />
            <h3>Customer Information</h3>
          </div>
        </div>

        <div className={styles.editForm}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>First Name</label>
              <input
                type="text"
                value={editData.first_name}
                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formField}>
              <label>Last Name</label>
              <input
                type="text"
                value={editData.last_name}
                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Email</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formField}>
              <label>Phone</label>
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label>Address</label>
            <input
              type="text"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>City</label>
              <input
                type="text"
                value={editData.city}
                onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formField}>
              <label>State</label>
              <input
                type="text"
                value={editData.state}
                onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formField}>
              <label>Zip Code</label>
              <input
                type="text"
                value={editData.zip_code}
                onChange={(e) => setEditData({ ...editData, zip_code: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSave} className={styles.saveButton}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <User size={20} />
          <h3>Customer Information</h3>
        </div>
        {isEditable && (
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
            aria-label="Edit customer information"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
              <path d="M9.67876 5.05777H5.16472C4.82267 5.05777 4.49462 5.19365 4.25275 5.43552C4.01088 5.67739 3.875 6.00544 3.875 6.3475V15.3756C3.875 15.7176 4.01088 16.0457 4.25275 16.2875C4.49462 16.5294 4.82267 16.6653 5.16472 16.6653H14.1928C14.5348 16.6653 14.8629 16.5294 15.1048 16.2875C15.3466 16.0457 15.4825 15.7176 15.4825 15.3756V10.8615M13.7897 4.81595C14.0463 4.55941 14.3942 4.41528 14.757 4.41528C15.1198 4.41528 15.4678 4.55941 15.7243 4.81595C15.9809 5.07249 16.125 5.42044 16.125 5.78324C16.125 6.14605 15.9809 6.49399 15.7243 6.75053L9.9122 12.5633C9.75907 12.7163 9.56991 12.8283 9.36213 12.889L7.50944 13.4307C7.45395 13.4468 7.39513 13.4478 7.33914 13.4335C7.28315 13.4191 7.23204 13.39 7.19117 13.3491C7.1503 13.3082 7.12116 13.2571 7.10682 13.2011C7.09247 13.1452 7.09344 13.0863 7.10963 13.0308L7.65131 11.1782C7.71227 10.9705 7.82448 10.7816 7.97761 10.6287L13.7897 4.81595Z" stroke="#252C37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit
          </button>
        )}
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoRow}>
          <div className={styles.infoField}>
            <span className={styles.label}>Customer Name</span>
            <span className={styles.value}>
              {ticket.customer ?
                `${ticket.customer.first_name} ${ticket.customer.last_name}` :
                'Unknown Customer'
              }
            </span>
          </div>
          <div className={styles.infoField}>
            <span className={styles.label}>Primary Phone</span>
            <span className={styles.value}>
              {ticket.customer?.phone || 'Not provided'}
            </span>
          </div>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.infoField}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>
              {ticket.customer?.email || 'Not provided'}
            </span>
          </div>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.infoField}>
            <span className={styles.label}>Service Address</span>
            <span className={styles.value}>
              {formatAddress()}
            </span>
          </div>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.infoField}>
            <span className={styles.label}>Home Size</span>
            <span className={styles.value}>N/A</span>
          </div>
          <div className={styles.infoField}>
            <span className={styles.label}>Yard Size</span>
            <span className={styles.value}>N/A</span>
          </div>
        </div>
      </div>
    </div>
  )
}