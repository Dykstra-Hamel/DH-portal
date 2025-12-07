import { createClient } from './supabase/client';

// Helper for making authenticated API calls to admin endpoints
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch (parseError) {
      errorData = {
        error: 'Request failed - invalid JSON response',
        responseText: await response
          .text()
          .catch(() => 'Unable to read response'),
      };
    }

    const errorDetails = {
      url,
      method: options?.method || 'GET',
      requestBody: options?.body,
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      headers: Object.fromEntries(response.headers.entries()),
    };

    console.error('API Error:', errorDetails);
    throw new Error(
      errorData?.error ||
        errorData?.message ||
        `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

// Admin API helpers
export const adminAPI = {
  // Users
  async getUsers() {
    return authenticatedFetch('/api/admin/users');
  },

  async createUser(userData: {
    email: string;
    first_name: string;
    last_name: string;
  }) {
    return authenticatedFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async inviteUser(userData: {
    email: string;
    first_name: string;
    last_name: string;
    company_id: string;
    role: string;
    departments?: string[];
  }) {
    return authenticatedFetch('/api/admin/users/invite', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(
    userId: string,
    userData: { email: string; first_name: string; last_name: string }
  ) {
    return authenticatedFetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(userId: string) {
    return authenticatedFetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Companies
  async getCompanies() {
    return authenticatedFetch('/api/admin/companies');
  },

  async createCompany(companyData: any) {
    return authenticatedFetch('/api/admin/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  },

  async updateCompany(companyId: string, companyData: any) {
    return authenticatedFetch(`/api/admin/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  },

  async deleteCompany(companyId: string) {
    return authenticatedFetch(`/api/admin/companies/${companyId}`, {
      method: 'DELETE',
    });
  },

  // User-Company Relationships
  async getUserCompanies() {
    return authenticatedFetch('/api/admin/user-companies');
  },

  async getCurrentUserCompanies() {
    return authenticatedFetch('/api/admin/user-companies/current');
  },

  async createUserCompany(relationshipData: any) {
    return authenticatedFetch('/api/admin/user-companies', {
      method: 'POST',
      body: JSON.stringify(relationshipData),
    });
  },

  async updateUserCompany(relationshipId: string, relationshipData: any) {
    return authenticatedFetch(`/api/admin/user-companies/${relationshipId}`, {
      method: 'PUT',
      body: JSON.stringify(relationshipData),
    });
  },

  async deleteUserCompany(relationshipId: string) {
    return authenticatedFetch(`/api/admin/user-companies/${relationshipId}`, {
      method: 'DELETE',
    });
  },

  // Projects
  async getProjects(
    filters: { companyId?: string; status?: string; priority?: string } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.companyId) queryParams.append('companyId', filters.companyId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);

    const url = `/api/admin/projects${queryParams.toString() ? `?${queryParams}` : ''}`;
    return authenticatedFetch(url);
  },

  async createProject(projectData: any) {
    return authenticatedFetch('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  async updateProject(projectId: string, projectData: any) {
    return authenticatedFetch(`/api/admin/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  async deleteProject(projectId: string) {
    return authenticatedFetch(`/api/admin/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  // Customers
  async getCustomers(
    filters: {
      companyId?: string;
      status?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      dateFrom?: string;
      dateTo?: string;
      startsWith?: string | null;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.companyId) queryParams.append('companyId', filters.companyId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.startsWith)
      queryParams.append('startsWith', filters.startsWith);

    const url = `/api/admin/customers${queryParams.toString() ? `?${queryParams}` : ''}`;
    return authenticatedFetch(url);
  },

  async getCustomer(customerId: string) {
    return authenticatedFetch(`/api/admin/customers/${customerId}`);
  },

  async createCustomer(customerData: any) {
    return authenticatedFetch('/api/admin/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  async updateCustomer(customerId: string, customerData: any) {
    return authenticatedFetch(`/api/admin/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },

  async deleteCustomer(customerId: string) {
    return authenticatedFetch(`/api/admin/customers/${customerId}`, {
      method: 'DELETE',
    });
  },

  async getCustomerLeads(
    customerId: string,
    filters: { status?: string; sortBy?: string; sortOrder?: string } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const url = `/api/admin/customers/${customerId}/leads${queryParams.toString() ? `?${queryParams}` : ''}`;
    return authenticatedFetch(url);
  },

  async createCustomerLead(customerId: string, leadData: any) {
    return authenticatedFetch(`/api/admin/customers/${customerId}/leads`, {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },

  // Leads
  async getLeads(
    filters: {
      companyId?: string;
      status?: string;
      priority?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.companyId) queryParams.append('companyId', filters.companyId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

    const url = `/api/admin/leads${queryParams.toString() ? `?${queryParams}` : ''}`;
    return authenticatedFetch(url);
  },

  async getArchivedLeads(
    filters: {
      companyId?: string;
      status?: string;
      priority?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.companyId) queryParams.append('companyId', filters.companyId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    queryParams.append('includeArchived', 'true');

    const url = `/api/admin/leads?${queryParams.toString()}`;
    return authenticatedFetch(url);
  },

  async getLead(leadId: string) {
    return authenticatedFetch(`/api/admin/leads/${leadId}`);
  },

  async getTicket(ticketId: string) {
    return authenticatedFetch(`/api/tickets/${ticketId}`);
  },

  async createLead(leadData: any) {
    return authenticatedFetch('/api/admin/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  },

  async updateLead(leadId: string, leadData: any) {
    return authenticatedFetch(`/api/admin/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  },

  async deleteLead(leadId: string) {
    return authenticatedFetch(`/api/admin/leads/${leadId}`, {
      method: 'DELETE',
    });
  },

  async getLeadCalls(leadId: string) {
    return authenticatedFetch(`/api/admin/leads/${leadId}/calls`);
  },

  // All Calls (admin)
  async getAllCalls(
    filters: {
      companyId?: string;
      page?: number;
      limit?: number;
      archived?: boolean;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.companyId) queryParams.append('companyId', filters.companyId);

    const url = `/api/admin/calls${queryParams.toString() ? `?${queryParams}` : ''}`;
    return authenticatedFetch(url);
  },

  // Calls for regular users
  async getUserCalls(
    filters: {
      companyId?: string;
      page?: number;
      limit?: number;
      archived?: boolean;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.companyId) queryParams.append('company_id', filters.companyId);

    const url = `/api/calls${queryParams.toString() ? `?${queryParams}` : ''}`;
    return authenticatedFetch(url);
  },

  // Form Submissions (admin and regular users)
  async getAllFormSubmissions(
    filters: { companyId?: string; page?: number; limit?: number } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.companyId) queryParams.append('companyId', filters.companyId);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const url = `/api/admin/form-submissions${queryParams.toString() ? `?${queryParams}` : ''}`;
    return authenticatedFetch(url);
  },

  async getUserFormSubmissions(
    filters: { companyId?: string; page?: number; limit?: number } = {}
  ) {
    const queryParams = new URLSearchParams();
    if (filters.companyId) queryParams.append('companyId', filters.companyId);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const url = `/api/admin/form-submissions${queryParams.toString() ? `?${queryParams}` : ''}`;
    return authenticatedFetch(url);
  },

  // Non-admin project endpoints
  async getUserProjects(companyId: string) {
    return authenticatedFetch(`/api/projects?companyId=${companyId}`);
  },

  // Non-admin leads endpoints
  async getUserLeads(
    companyId: string,
    filters: { dateFrom?: string; dateTo?: string } = {}
  ) {
    const queryParams = new URLSearchParams();
    queryParams.append('companyId', companyId);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

    const response = await authenticatedFetch(
      `/api/leads?${queryParams.toString()}`
    );

    return response;
  },

  async getUserArchivedLeads(
    companyId: string,
    filters: { dateFrom?: string; dateTo?: string } = {}
  ) {
    const queryParams = new URLSearchParams();
    queryParams.append('companyId', companyId);
    queryParams.append('includeArchived', 'true');
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

    return authenticatedFetch(`/api/leads?${queryParams.toString()}`);
  },

  // Non-admin customers endpoints
  async getUserCustomers(filters: {
    companyId: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
    startsWith?: string | null;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('companyId', filters.companyId);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.startsWith)
      queryParams.append('startsWith', filters.startsWith);

    const url = `/api/customers?${queryParams.toString()}`;
    return authenticatedFetch(url);
  },

  // Non-admin individual lead endpoints
  async getUserLead(leadId: string) {
    return authenticatedFetch(`/api/leads/${leadId}`);
  },

  async updateUserLead(leadId: string, leadData: any) {
    return authenticatedFetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  },

  async getUserLeadCalls(leadId: string) {
    return authenticatedFetch(`/api/leads/${leadId}/calls`);
  },

  // Tickets
  tickets: {
    async list(
      filters: {
        companyId?: string;
        status?: string;
        priority?: string;
        includeArchived?: boolean;
        dateFrom?: string;
        dateTo?: string;
      } = {}
    ) {
      const queryParams = new URLSearchParams();
      if (filters.companyId) queryParams.append('companyId', filters.companyId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.includeArchived)
        queryParams.append('includeArchived', 'true');
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const url = `/api/tickets${queryParams.toString() ? `?${queryParams}` : ''}`;
      return authenticatedFetch(url);
    },

    async get(ticketId: string) {
      return authenticatedFetch(`/api/tickets/${ticketId}`);
    },

    async create(ticketData: any) {
      return authenticatedFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });
    },

    async update(ticketId: string, ticketData: any) {
      return authenticatedFetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify(ticketData),
      });
    },

    async archive(ticketId: string) {
      return authenticatedFetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      });
    },

    async getCalls(ticketId: string) {
      return authenticatedFetch(`/api/tickets/${ticketId}/calls`);
    },
  },

  // Support Cases
  supportCases: {
    async list(
      filters: {
        companyId?: string;
        status?: string;
        issueType?: string;
        priority?: string;
        assignedTo?: string;
        includeArchived?: boolean;
        dateFrom?: string;
        dateTo?: string;
      } = {}
    ) {
      const queryParams = new URLSearchParams();
      if (filters.companyId) queryParams.append('companyId', filters.companyId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.issueType) queryParams.append('issueType', filters.issueType);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.assignedTo)
        queryParams.append('assignedTo', filters.assignedTo);
      if (filters.includeArchived)
        queryParams.append('includeArchived', 'true');
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const url = `/api/support-cases${queryParams.toString() ? `?${queryParams}` : ''}`;
      return authenticatedFetch(url);
    },

    async get(supportCaseId: string) {
      return authenticatedFetch(`/api/support-cases/${supportCaseId}`);
    },

    async create(supportCaseData: any) {
      return authenticatedFetch('/api/support-cases', {
        method: 'POST',
        body: JSON.stringify(supportCaseData),
      });
    },

    async update(supportCaseId: string, supportCaseData: any) {
      return authenticatedFetch(`/api/support-cases/${supportCaseId}`, {
        method: 'PUT',
        body: JSON.stringify(supportCaseData),
      });
    },

    async updateStatus(supportCaseId: string, status: string, notes?: string) {
      return authenticatedFetch(
        `/api/support-cases/${supportCaseId}/update-status`,
        {
          method: 'POST',
          body: JSON.stringify({ status, notes }),
        }
      );
    },

    async archive(supportCaseId: string) {
      return authenticatedFetch(`/api/support-cases/${supportCaseId}`, {
        method: 'DELETE',
      });
    },

    async addSatisfactionRating(
      supportCaseId: string,
      rating: number,
      feedback?: string
    ) {
      return authenticatedFetch(
        `/api/support-cases/${supportCaseId}/satisfaction`,
        {
          method: 'POST',
          body: JSON.stringify({ rating, feedback }),
        }
      );
    },
  },

  // Non-admin individual customer endpoints
  async getUserCustomer(customerId: string) {
    return authenticatedFetch(`/api/customers/${customerId}`);
  },

  async updateUserCustomer(customerId: string, customerData: any) {
    return authenticatedFetch(`/api/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },

  // Pest Options
  async getPestOptions(companyId: string) {
    return authenticatedFetch(`/api/pest-options/${companyId}`);
  },

  // Service Plans
  async getServicePlansByPest(companyId: string, pestId: string) {
    return authenticatedFetch(
      `/api/service-plans/${companyId}/by-pest/${pestId}`
    );
  },

  // Branding
  async getBranding(companyId: string) {
    return authenticatedFetch(`/api/admin/brands?company_id=${companyId}`);
  },

  async createBranding(brandData: any) {
    return authenticatedFetch('/api/admin/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    });
  },

  async updateBranding(brandData: any) {
    return authenticatedFetch('/api/admin/brands', {
      method: 'PUT',
      body: JSON.stringify(brandData),
    });
  },

  async deleteBranding(brandId: string) {
    return authenticatedFetch(`/api/admin/brands?id=${brandId}`, {
      method: 'DELETE',
    });
  },

  // Support Cases (Admin)
  async getSupportCase(supportCaseId: string) {
    return authenticatedFetch(`/api/support-cases/${supportCaseId}`);
  },

  async updateSupportCase(supportCaseId: string, supportCaseData: any) {
    return authenticatedFetch(`/api/support-cases/${supportCaseId}`, {
      method: 'PUT',
      body: JSON.stringify(supportCaseData),
    });
  },

  async archiveSupportCase(supportCaseId: string) {
    return authenticatedFetch(`/api/support-cases/${supportCaseId}`, {
      method: 'DELETE',
    });
  },

  // User Support Cases (Non-admin methods)
  async getUserSupportCase(supportCaseId: string) {
    return authenticatedFetch(`/api/support-cases/${supportCaseId}`);
  },

  async updateUserSupportCase(supportCaseId: string, supportCaseData: any) {
    return authenticatedFetch(`/api/support-cases/${supportCaseId}`, {
      method: 'PUT',
      body: JSON.stringify(supportCaseData),
    });
  },

  async archiveUserSupportCase(supportCaseId: string) {
    return authenticatedFetch(`/api/support-cases/${supportCaseId}`, {
      method: 'DELETE',
    });
  },
};
