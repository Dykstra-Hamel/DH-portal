'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api-client'
import styles from './AdminManager.module.scss'

interface UserCompany {
  id: string
  user_id: string
  company_id: string
  role: string
  is_primary: boolean
  joined_at: string
  profiles?: {
    first_name: string
    last_name: string
    email: string
  }
  companies?: {
    name: string
  }
}

interface User {
  id: string
  email: string
  profiles?: {
    first_name: string
    last_name: string
  }
}

interface Company {
  id: string
  name: string
}

export default function UserCompanyManager() {
  const [relationships, setRelationships] = useState<UserCompany[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRelationship, setEditingRelationship] = useState<UserCompany | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    company_id: '',
    role: 'member',
    is_primary: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await adminAPI.getUserCompanies()
      setRelationships(data.relationships || [])
      setUsers(data.users || [])
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await adminAPI.createUserCompany(formData)

      setFormData({
        user_id: '',
        company_id: '',
        role: 'member',
        is_primary: false
      })
      setShowCreateForm(false)
      loadData()
    } catch (error) {
      console.error('Error creating relationship:', error)
    }
  }

  const handleUpdateRelationship = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRelationship) return

    try {
      await adminAPI.updateUserCompany(editingRelationship.id, {
        role: editingRelationship.role,
        is_primary: editingRelationship.is_primary
      })

      setEditingRelationship(null)
      loadData()
    } catch (error) {
      console.error('Error updating relationship:', error)
    }
  }

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to remove this user from the company?')) return

    try {
      await adminAPI.deleteUserCompany(relationshipId)

      loadData()
    } catch (error) {
      console.error('Error deleting relationship:', error)
    }
  }

  const getUserDisplayName = (user: User) => {
    if (user.profiles) {
      return `${user.profiles.first_name} ${user.profiles.last_name} (${user.email})`
    }
    return user.email
  }

  if (loading) {
    return <div>Loading relationships...</div>
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>User-Company Relationships</h2>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          Add User to Company
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add User to Company</h3>
            <form onSubmit={handleCreateRelationship}>
              <div className={styles.formGroup}>
                <label>User:</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  required
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Company:</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Role:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  />
                  Primary Company
                </label>
              </div>
              
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>Add</button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRelationship && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit Relationship</h3>
            <form onSubmit={handleUpdateRelationship}>
              <div className={styles.formGroup}>
                <label>User:</label>
                <input 
                  type="text" 
                  value={editingRelationship.profiles?.email || 'Unknown user'} 
                  disabled 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Company:</label>
                <input 
                  type="text" 
                  value={editingRelationship.companies?.name || 'Unknown company'} 
                  disabled 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Role:</label>
                <select
                  value={editingRelationship.role}
                  onChange={(e) => setEditingRelationship({ ...editingRelationship, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={editingRelationship.is_primary}
                    onChange={(e) => setEditingRelationship({ ...editingRelationship, is_primary: e.target.checked })}
                  />
                  Primary Company
                </label>
              </div>
              
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>Save</button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setEditingRelationship(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Company</th>
              <th>Role</th>
              <th>Primary</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {relationships.map((relationship) => (
              <tr key={relationship.id}>
                <td>
                  {relationship.profiles ? 
                    `${relationship.profiles.first_name} ${relationship.profiles.last_name}` : 
                    (relationship.profiles as any)?.email || 'Unknown user'
                  }
                </td>
                <td>{relationship.companies?.name || 'Unknown company'}</td>
                <td>
                  <span className={`${styles.roleTag} ${styles[relationship.role]}`}>
                    {relationship.role}
                  </span>
                </td>
                <td>{relationship.is_primary ? '✓' : '-'}</td>
                <td>{new Date(relationship.joined_at).toLocaleDateString()}</td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => setEditingRelationship(relationship)}
                    >
                      Edit
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteRelationship(relationship.id)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}