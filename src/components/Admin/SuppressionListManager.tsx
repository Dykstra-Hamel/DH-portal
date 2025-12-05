'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './SuppressionListManager.module.scss';

interface SuppressionEntry {
  id: string;
  email_address?: string;
  phone_number?: string;
  communication_type: string;
  suppression_reason: string;
  suppression_type: string;
  suppressed_at: string;
  notes?: string;
}

interface SuppressionStats {
  total: number;
  byType: {
    email: number;
    phone: number;
    sms: number;
    all: number;
  };
  byReason: {
    hardBounces: number;
    softBounces: number;
    complaints: number;
    unsubscribes: number;
    manual: number;
  };
}

export default function SuppressionListManager() {
  const { selectedCompany } = useCompany();
  const [suppressionList, setSuppressionList] = useState<SuppressionEntry[]>([]);
  const [stats, setStats] = useState<SuppressionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '',
    phoneNumber: '',
    communicationType: 'all',
    notes: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (selectedCompany?.id) {
      loadSuppressionList();
    }
  }, [selectedCompany?.id, currentPage]);

  const loadSuppressionList = async () => {
    if (!selectedCompany?.id) return;

    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const response = await fetch(
        `/api/admin/suppression-list?companyId=${selectedCompany.id}&limit=${itemsPerPage}&offset=${offset}&stats=true`
      );

      if (!response.ok) {
        throw new Error('Failed to load suppression list');
      }

      const data = await response.json();

      setSuppressionList(data.data || []);
      setTotalCount(data.count || 0);

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading suppression list:', err);
      setError('Failed to load suppression list');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this contact from the suppression list? They will be able to receive communications again.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/suppression-list/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from suppression list');
      }

      // Reload the list
      await loadSuppressionList();
    } catch (err) {
      console.error('Error removing from suppression list:', err);
      alert('Failed to remove from suppression list');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addForm.email && !addForm.phoneNumber) {
      alert('Please provide either an email or phone number');
      return;
    }

    setAddLoading(true);

    try {
      const response = await fetch('/api/admin/suppression-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany?.id,
          email: addForm.email || null,
          phoneNumber: addForm.phoneNumber || null,
          communicationType: addForm.communicationType,
          notes: addForm.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to suppression list');
      }

      // Reset form and close modal
      setAddForm({
        email: '',
        phoneNumber: '',
        communicationType: 'all',
        notes: '',
      });
      setShowAddModal(false);

      // Reload the list
      await loadSuppressionList();
    } catch (err) {
      console.error('Error adding to suppression list:', err);
      alert('Failed to add to suppression list');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredList = suppressionList.filter((entry) => {
    // Filter by type
    if (filterType !== 'all' && entry.communication_type !== filterType) {
      return false;
    }

    // Filter by reason
    if (filterReason !== 'all' && entry.suppression_type !== filterReason) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const email = entry.email_address?.toLowerCase() || '';
      const phone = entry.phone_number?.toLowerCase() || '';
      return email.includes(query) || phone.includes(query);
    }

    return true;
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (!selectedCompany) {
    return (
      <div className={styles.container}>
        <p>Please select a company to view suppression list</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Suppression List</h1>
        <button
          className={styles.addButton}
          onClick={() => setShowAddModal(true)}
        >
          + Add to Suppression List
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Suppressed</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Email</div>
            <div className={styles.statValue}>{stats.byType.email}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Phone</div>
            <div className={styles.statValue}>{stats.byType.phone}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>SMS</div>
            <div className={styles.statValue}>{stats.byType.sms}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Unsubscribes</div>
            <div className={styles.statValue}>{stats.byReason.unsubscribes}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Bounces</div>
            <div className={styles.statValue}>
              {stats.byReason.hardBounces + stats.byReason.softBounces}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by email or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="sms">SMS</option>
        </select>

        <select
          value={filterReason}
          onChange={(e) => setFilterReason(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Reasons</option>
          <option value="unsubscribe">Unsubscribe</option>
          <option value="hard_bounce">Hard Bounce</option>
          <option value="soft_bounce">Soft Bounce</option>
          <option value="complaint">Complaint</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      No suppressed contacts found
                    </td>
                  </tr>
                ) : (
                  filteredList.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        {entry.email_address && <div>{entry.email_address}</div>}
                        {entry.phone_number && (
                          <div className={styles.phoneNumber}>{entry.phone_number}</div>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge${entry.communication_type}`]}`}>
                          {entry.communication_type}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge${entry.suppression_type}`]}`}>
                          {entry.suppression_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{new Date(entry.suppressed_at).toLocaleDateString()}</td>
                      <td className={styles.notes}>{entry.notes || '-'}</td>
                      <td>
                        <button
                          onClick={() => handleRemove(entry.id)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add to Suppression List</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={addForm.phoneNumber}
                  onChange={(e) =>
                    setAddForm({ ...addForm, phoneNumber: e.target.value })
                  }
                  placeholder="+1234567890"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Communication Type</label>
                <select
                  value={addForm.communicationType}
                  onChange={(e) =>
                    setAddForm({ ...addForm, communicationType: e.target.value })
                  }
                >
                  <option value="all">All Communications</option>
                  <option value="email">Email Only</option>
                  <option value="phone">Phone Only</option>
                  <option value="sms">SMS Only</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Notes (Optional)</label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder="Reason for manual suppression..."
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className={styles.submitButton}
                >
                  {addLoading ? 'Adding...' : 'Add to List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
