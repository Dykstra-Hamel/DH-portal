import { createClient } from './supabase/client'

// Helper for making authenticated API calls to admin endpoints
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const supabase = createClient()
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
    console.error('API Error:', { 
      url, 
      status: response.status, 
      statusText: response.statusText, 
      error: errorData,
      headers: Object.fromEntries(response.headers.entries())
    });
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

  async getCurrentUserCompanies() {
    return authenticatedFetch('/api/admin/user-companies/current')
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

  // Projects
  async getProjects(filters: { companyId?: string; status?: string; priority?: string } = {}) {
    const queryParams = new URLSearchParams()
    if (filters.companyId) queryParams.append('companyId', filters.companyId)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.priority) queryParams.append('priority', filters.priority)
    
    const url = `/api/admin/projects${queryParams.toString() ? `?${queryParams}` : ''}`
    return authenticatedFetch(url)
  },

  async createProject(projectData: any) {
    return authenticatedFetch('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    })
  },

  async updateProject(projectId: string, projectData: any) {
    return authenticatedFetch(`/api/admin/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    })
  },

  async deleteProject(projectId: string) {
    return authenticatedFetch(`/api/admin/projects/${projectId}`, {
      method: 'DELETE',
    })
  },

  // Customers
  async getCustomers(filters: { companyId?: string; status?: string; search?: string; sortBy?: string; sortOrder?: string } = {}) {
    const queryParams = new URLSearchParams()
    if (filters.companyId) queryParams.append('companyId', filters.companyId)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)
    
    const url = `/api/admin/customers${queryParams.toString() ? `?${queryParams}` : ''}`
    return authenticatedFetch(url)
  },

  async getCustomer(customerId: string) {
    return authenticatedFetch(`/api/admin/customers/${customerId}`)
  },

  async createCustomer(customerData: any) {
    return authenticatedFetch('/api/admin/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    })
  },

  async updateCustomer(customerId: string, customerData: any) {
    return authenticatedFetch(`/api/admin/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    })
  },

  async deleteCustomer(customerId: string) {
    return authenticatedFetch(`/api/admin/customers/${customerId}`, {
      method: 'DELETE',
    })
  },

  async getCustomerLeads(customerId: string, filters: { status?: string; sortBy?: string; sortOrder?: string } = {}) {
    const queryParams = new URLSearchParams()
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)
    
    const url = `/api/admin/customers/${customerId}/leads${queryParams.toString() ? `?${queryParams}` : ''}`
    return authenticatedFetch(url)
  },

  async createCustomerLead(customerId: string, leadData: any) {
    return authenticatedFetch(`/api/admin/customers/${customerId}/leads`, {
      method: 'POST',
      body: JSON.stringify(leadData),
    })
  },

  // Leads
  async getLeads(filters: { companyId?: string; status?: string; priority?: string } = {}) {
    const queryParams = new URLSearchParams()
    if (filters.companyId) queryParams.append('companyId', filters.companyId)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.priority) queryParams.append('priority', filters.priority)
    
    const url = `/api/admin/leads${queryParams.toString() ? `?${queryParams}` : ''}`
    return authenticatedFetch(url)
  },

  async getLead(leadId: string) {
    return authenticatedFetch(`/api/admin/leads/${leadId}`)
  },

  async createLead(leadData: any) {
    return authenticatedFetch('/api/admin/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    })
  },

  async updateLead(leadId: string, leadData: any) {
    return authenticatedFetch(`/api/admin/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    })
  },

  async deleteLead(leadId: string) {
    return authenticatedFetch(`/api/admin/leads/${leadId}`, {
      method: 'DELETE',
    })
  },

  // Non-admin project endpoints
  async getUserProjects(companyId: string) {
    return authenticatedFetch(`/api/projects?companyId=${companyId}`)
  },

  // Non-admin leads endpoints
  async getUserLeads(companyId: string) {
    return authenticatedFetch(`/api/leads?companyId=${companyId}`)
  },
}