'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api-client'
import styles from './AdminManager.module.scss'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
}

interface AuthUser {
  id: string
  email: string
  created_at: string
  email_confirmed_at: string | null
}

interface UserWithProfile extends AuthUser {
  profiles?: Profile
}

export default function UsersManager() {
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setError(null)
      const usersData = await adminAPI.getUsers()
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    
    try {
      setSubmitting(true)
      setError(null)
      await adminAPI.createUser(formData)
      setFormData({ email: '', first_name: '', last_name: '' })
      setShowCreateForm(false)
      loadUsers()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || submitting) return

    try {
      setSubmitting(true)
      setError(null)
      await adminAPI.updateUser(editingUser.id, {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email
      })
      setEditingUser(null)
      loadUsers()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setError(null)
      await adminAPI.deleteUser(userId)
      loadUsers()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Users Management</h2>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
          disabled={submitting}
        >
          Create User
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)} className={styles.dismissError}>×</button>
        </div>
      )}

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>First Name:</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name:</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create'}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit User Profile</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>First Name:</label>
                <input
                  type="text"
                  value={editingUser.first_name}
                  onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name:</label>
                <input
                  type="text"
                  value={editingUser.last_name}
                  onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setEditingUser(null)}
                  disabled={submitting}
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
              <th>Email</th>
              <th>Name</th>
              <th>Created</th>
              <th>Confirmed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  {user.profiles ? 
                    `${user.profiles.first_name} ${user.profiles.last_name}` : 
                    'No profile'
                  }
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>{user.email_confirmed_at ? 'Yes' : 'No'}</td>
                <td>
                  <div className={styles.actions}>
                    {user.profiles && (
                      <button 
                        className={styles.editButton}
                        onClick={() => setEditingUser(user.profiles!)}
                      >
                        Edit
                      </button>
                    )}
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
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