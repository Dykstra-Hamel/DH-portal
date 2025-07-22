'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api-client'
import styles from './AdminManager.module.scss'

interface Company {
  id: string
  name: string
  description: string | null
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string
  industry: string | null
  size: string | null
  created_at: string
}

export default function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    industry: '',
    size: ''
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const companiesData = await adminAPI.getCompanies()
      setCompanies(companiesData)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await adminAPI.createCompany(formData)

      setFormData({
        name: '',
        description: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'United States',
        industry: '',
        size: ''
      })
      setShowCreateForm(false)
      loadCompanies()
    } catch (error) {
      console.error('Error creating company:', error)
    }
  }

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCompany) return

    try {
      await adminAPI.updateCompany(editingCompany.id, {
        name: editingCompany.name,
        description: editingCompany.description,
        website: editingCompany.website,
        email: editingCompany.email,
        phone: editingCompany.phone,
        address: editingCompany.address,
        city: editingCompany.city,
        state: editingCompany.state,
        zip_code: editingCompany.zip_code,
        country: editingCompany.country,
        industry: editingCompany.industry,
        size: editingCompany.size
      })

      setEditingCompany(null)
      loadCompanies()
    } catch (error) {
      console.error('Error updating company:', error)
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This will also remove all user associations.')) return

    try {
      await adminAPI.deleteCompany(companyId)

      loadCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  if (loading) {
    return <div>Loading companies...</div>
  }

  const renderForm = (company: Company | null, onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit}>
      <div className={styles.formGroup}>
        <label>Name *:</label>
        <input
          type="text"
          value={company ? company.name : formData.name}
          onChange={(e) => {
            if (company) {
              setEditingCompany({ ...company, name: e.target.value })
            } else {
              setFormData({ ...formData, name: e.target.value })
            }
          }}
          required
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Description:</label>
        <textarea
          value={company ? company.description || '' : formData.description}
          onChange={(e) => {
            if (company) {
              setEditingCompany({ ...company, description: e.target.value })
            } else {
              setFormData({ ...formData, description: e.target.value })
            }
          }}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Website:</label>
        <input
          type="url"
          value={company ? company.website || '' : formData.website}
          onChange={(e) => {
            if (company) {
              setEditingCompany({ ...company, website: e.target.value })
            } else {
              setFormData({ ...formData, website: e.target.value })
            }
          }}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Email:</label>
        <input
          type="email"
          value={company ? company.email || '' : formData.email}
          onChange={(e) => {
            if (company) {
              setEditingCompany({ ...company, email: e.target.value })
            } else {
              setFormData({ ...formData, email: e.target.value })
            }
          }}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Phone:</label>
        <input
          type="tel"
          value={company ? company.phone || '' : formData.phone}
          onChange={(e) => {
            if (company) {
              setEditingCompany({ ...company, phone: e.target.value })
            } else {
              setFormData({ ...formData, phone: e.target.value })
            }
          }}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Industry:</label>
        <input
          type="text"
          value={company ? company.industry || '' : formData.industry}
          onChange={(e) => {
            if (company) {
              setEditingCompany({ ...company, industry: e.target.value })
            } else {
              setFormData({ ...formData, industry: e.target.value })
            }
          }}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Size:</label>
        <select
          value={company ? company.size || '' : formData.size}
          onChange={(e) => {
            if (company) {
              setEditingCompany({ ...company, size: e.target.value })
            } else {
              setFormData({ ...formData, size: e.target.value })
            }
          }}
        >
          <option value="">Select size</option>
          <option value="1-10">1-10 employees</option>
          <option value="11-50">11-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201-500">201-500 employees</option>
          <option value="501-1000">501-1000 employees</option>
          <option value="1000+">1000+ employees</option>
        </select>
      </div>
      
      <div className={styles.formActions}>
        <button type="submit" className={styles.saveButton}>
          {company ? 'Save' : 'Create'}
        </button>
        <button 
          type="button" 
          className={styles.cancelButton}
          onClick={() => {
            if (company) {
              setEditingCompany(null)
            } else {
              setShowCreateForm(false)
            }
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Companies Management</h2>
        <button 
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          Create Company
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Create New Company</h3>
            {renderForm(null, handleCreateCompany)}
          </div>
        </div>
      )}

      {editingCompany && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit Company</h3>
            {renderForm(editingCompany, handleUpdateCompany)}
          </div>
        </div>
      )}

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Industry</th>
              <th>Size</th>
              <th>Email</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.industry || '-'}</td>
                <td>{company.size || '-'}</td>
                <td>{company.email || '-'}</td>
                <td>{new Date(company.created_at).toLocaleDateString()}</td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => setEditingCompany(company)}
                    >
                      Edit
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteCompany(company.id)}
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