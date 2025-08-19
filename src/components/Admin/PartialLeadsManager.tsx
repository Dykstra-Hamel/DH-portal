'use client';

import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '@/lib/api-client';
import styles from './AdminManager.module.scss';

interface PartialLead {
  id: string;
  company_id: string;
  session_id: string;
  form_data: any;
  step_completed: string;
  service_area_data: any;
  attribution_data: any;
  created_at: string;
  updated_at: string;
  expires_at: string;
  converted_to_lead_id: string | null;
  companies: { id: string; name: string; website: string };
  leads?: any[];
  status: 'active' | 'expired' | 'converted';
  completionPercentage: number;
  daysActive: number;
  progressiveState: any;
  engagementMetrics: any;
  leadSource: string;
  serviceAreaStatus: 'served' | 'outside_area' | 'unknown';
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PartialLeadsManager() {
  const [partialLeads, setPartialLeads] = useState<PartialLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<PartialLead | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    companyId: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [companies, setCompanies] = useState<any[]>([]);

  const fetchPartialLeads = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.companyId && { companyId: filters.companyId })
      });

      const data = await authenticatedFetch(`/api/admin/partial-leads?${queryParams}`);

      if (data.success) {
        setPartialLeads(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch partial leads:', data.error);
      }
    } catch (error) {
      console.error('Error fetching partial leads:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await authenticatedFetch('/api/admin/companies');
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  }, []);

  useEffect(() => {
    fetchPartialLeads();
    fetchCompanies();
  }, [fetchPartialLeads, fetchCompanies]);


  const fetchLeadDetails = async (leadId: string) => {
    try {
      const data = await authenticatedFetch(`/api/admin/partial-leads/${leadId}`);
      
      if (data.success) {
        setSelectedLead(data.data);
        setShowDetails(true);
      } else {
        console.error('Failed to fetch lead details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this partial lead?')) {
      return;
    }

    try {
      const data = await authenticatedFetch(`/api/admin/partial-leads?id=${leadId}`, {
        method: 'DELETE'
      });
      
      if (data.success) {
        await fetchPartialLeads(); // Refresh the list
      } else {
        alert('Failed to delete partial lead: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting partial lead:', error);
      alert('Error deleting partial lead');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClass = status === 'converted' ? 'success' : 
                       status === 'expired' ? 'danger' : 'warning';
    return (
      <span className={`${styles.badge} ${styles[statusClass]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCompletionBadge = (percentage: number) => {
    const badgeClass = percentage >= 75 ? 'success' : 
                       percentage >= 50 ? 'warning' : 'danger';
    return (
      <span className={`${styles.badge} ${styles[badgeClass]}`}>
        {percentage}%
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  const formatEngagementTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className={styles.adminSection}>
      <div className={styles.sectionHeader}>
        <h2>Partial Leads Management</h2>
        <p>Monitor and manage incomplete widget form submissions</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Company:</label>
          <select 
            value={filters.companyId} 
            onChange={(e) => setFilters({...filters, companyId: e.target.value, page: 1})}
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={fetchPartialLeads}
          className={styles.refreshButton}
        >
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Partial Leads</h3>
          <div className={styles.statValue}>{pagination.total}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Conversion Rate</h3>
          <div className={styles.statValue}>
            {partialLeads.length > 0 
              ? Math.round((partialLeads.filter(l => l.status === 'converted').length / partialLeads.length) * 100) 
              : 0}%
          </div>
        </div>
        <div className={styles.statCard}>
          <h3>Avg Completion</h3>
          <div className={styles.statValue}>
            {partialLeads.length > 0 
              ? Math.round(partialLeads.reduce((sum, l) => sum + l.completionPercentage, 0) / partialLeads.length)
              : 0}%
          </div>
        </div>
      </div>

      {/* Partial Leads Table */}
      {loading ? (
        <div className={styles.loading}>Loading partial leads...</div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Completion</th>
                  <th>Lead Source</th>
                  <th>Service Area</th>
                  <th>Engagement</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partialLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div>
                        <strong>{lead.companies.name}</strong>
                        <br />
                        <small>{lead.form_data.address || 'No address'}</small>
                      </div>
                    </td>
                    <td>{getStatusBadge(lead.status)}</td>
                    <td>{getCompletionBadge(lead.completionPercentage)}</td>
                    <td>{lead.leadSource}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        lead.serviceAreaStatus === 'served' ? styles.success : 
                        lead.serviceAreaStatus === 'unknown' ? styles.warning : styles.danger
                      }`}>
                        {lead.serviceAreaStatus === 'served' ? 'Served' : 
                         lead.serviceAreaStatus === 'unknown' ? 'Unknown' : 'Outside Area'}
                      </span>
                    </td>
                    <td>
                      {lead.engagementMetrics ? (
                        <div>
                          <small>Time: {formatEngagementTime(lead.engagementMetrics.totalTimeSpent)}</small>
                          <br />
                          <small>Progress: {lead.engagementMetrics.completionPercentage}%</small>
                        </div>
                      ) : (
                        <span className={styles.noData}>No data</span>
                      )}
                    </td>
                    <td>
                      <small>{formatDate(lead.created_at)}</small>
                      <br />
                      <small>{lead.daysActive} days ago</small>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => fetchLeadDetails(lead.id)}
                          className={styles.viewButton}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => deleteLead(lead.id)}
                          className={styles.deleteButton}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button 
              onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
              disabled={pagination.page <= 1}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages} 
              ({pagination.total} total)
            </span>
            <button 
              onClick={() => setFilters({...filters, page: Math.min(pagination.totalPages, filters.page + 1)})}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Lead Details Modal */}
      {showDetails && selectedLead && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Partial Lead Details</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailSection}>
                  <h4>Basic Information</h4>
                  <p><strong>Company:</strong> {selectedLead.companies.name}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedLead.status)}</p>
                  <p><strong>Completion:</strong> {getCompletionBadge(selectedLead.completionPercentage)}</p>
                  <p><strong>Lead Source:</strong> {selectedLead.leadSource}</p>
                  <p><strong>Created:</strong> {formatDate(selectedLead.created_at)}</p>
                  <p><strong>Expires:</strong> {formatDate(selectedLead.expires_at)}</p>
                </div>

                <div className={styles.detailSection}>
                  <h4>Form Data</h4>
                  {selectedLead.form_data.pestType && (
                    <p><strong>Pest Issue:</strong> {selectedLead.form_data.pestType
                      .split(' ')
                      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ')}</p>
                  )}
                  {selectedLead.form_data.address && (
                    <p><strong>Address:</strong> {selectedLead.form_data.address}</p>
                  )}
                  {selectedLead.form_data.homeSize && (
                    <p><strong>Home Size:</strong> {selectedLead.form_data.homeSize} sq ft</p>
                  )}
                  {selectedLead.form_data.contactInfo?.name && (
                    <p><strong>Name:</strong> {selectedLead.form_data.contactInfo.name}</p>
                  )}
                  {selectedLead.form_data.contactInfo?.email && (
                    <p><strong>Email:</strong> {selectedLead.form_data.contactInfo.email}</p>
                  )}
                  {selectedLead.form_data.contactInfo?.phone && (
                    <p><strong>Phone:</strong> {selectedLead.form_data.contactInfo.phone}</p>
                  )}
                </div>

                {selectedLead.engagementMetrics && (
                  <div className={styles.detailSection}>
                    <h4>Engagement Metrics</h4>
                    <p><strong>Total Time:</strong> {formatEngagementTime(selectedLead.engagementMetrics.totalTimeSpent)}</p>
                    <p><strong>Session Duration:</strong> {formatEngagementTime(selectedLead.engagementMetrics.currentSessionDuration)}</p>
                    <p><strong>Returning User:</strong> {selectedLead.engagementMetrics.returningUser ? 'Yes' : 'No'}</p>
                    {selectedLead.engagementMetrics.abandonmentPoints.length > 0 && (
                      <div>
                        <strong>Abandonment Points:</strong>
                        <ul>
                          {selectedLead.engagementMetrics.abandonmentPoints.map((point: any, index: number) => (
                            <li key={index}>
                              {point.step} - {point.reason} ({point.completionPercentage}% complete)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.detailSection}>
                  <h4>Attribution Data</h4>
                  {selectedLead.attribution_data.utm_source && (
                    <p><strong>UTM Source:</strong> {selectedLead.attribution_data.utm_source}</p>
                  )}
                  {selectedLead.attribution_data.utm_medium && (
                    <p><strong>UTM Medium:</strong> {selectedLead.attribution_data.utm_medium}</p>
                  )}
                  {selectedLead.attribution_data.utm_campaign && (
                    <p><strong>UTM Campaign:</strong> {selectedLead.attribution_data.utm_campaign}</p>
                  )}
                  {selectedLead.attribution_data.gclid && (
                    <p><strong>GCLID:</strong> {selectedLead.attribution_data.gclid}</p>
                  )}
                  {selectedLead.attribution_data.referrer_url && (
                    <p><strong>Referrer:</strong> {selectedLead.attribution_data.referrer_url}</p>
                  )}
                  <p><strong>Traffic Source:</strong> {selectedLead.attribution_data.traffic_source}</p>
                  <p><strong>Consent Status:</strong> {selectedLead.attribution_data.consent_status || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}