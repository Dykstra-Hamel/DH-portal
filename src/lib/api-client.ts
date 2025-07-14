import { supabase } from './supabase'

// Helper for making authenticated API calls to admin endpoints
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Admin API helpers
export const adminAPI = {
  // Users
  async getUsers() {
    return authenticatedFetch('/api/admin/users')
  },

  async createUser(userData: { email: string; first_name: string; last_name: string }) {
    return authenticatedFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  async inviteUser(userData: { email: string; first_name: string; last_name: string; company_id: string; role: string }) {
    return authenticatedFetch('/api/admin/users/invite', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  async updateUser(userId: string, userData: { email: string; first_name: string; last_name: string }) {
    return authenticatedFetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },

  async deleteUser(userId: string) {
    return authenticatedFetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    })
  },

  // Companies
  async getCompanies() {
    return authenticatedFetch('/api/admin/companies')
  },

  async createCompany(companyData: any) {
    return authenticatedFetch('/api/admin/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    })
  },

  async updateCompany(companyId: string, companyData: any) {
    return authenticatedFetch(`/api/admin/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    })
  },

  async deleteCompany(companyId: string) {
    return authenticatedFetch(`/api/admin/companies/${companyId}`, {
      method: 'DELETE',
    })
  },

  // User-Company Relationships
  async getUserCompanies() {
    return authenticatedFetch('/api/admin/user-companies')
  },

  async createUserCompany(relationshipData: any) {
    return authenticatedFetch('/api/admin/user-companies', {
      method: 'POST',
      body: JSON.stringify(relationshipData),
    })
  },

  async updateUserCompany(relationshipId: string, relationshipData: any) {
    return authenticatedFetch(`/api/admin/user-companies/${relationshipId}`, {
      method: 'PUT',
      body: JSON.stringify(relationshipData),
    })
  },

  async deleteUserCompany(relationshipId: string) {
    return authenticatedFetch(`/api/admin/user-companies/${relationshipId}`, {
      method: 'DELETE',
    })
  },
}