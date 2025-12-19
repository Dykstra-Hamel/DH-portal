'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, Loader } from 'lucide-react';
import styles from './AddContactsToListModal.module.scss';

interface AddContactsToListModalProps {
  listId: string;
  listName: string;
  companyId: string;
  onClose: (shouldRefresh: boolean) => void;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

export default function AddContactsToListModal({
  listId,
  listName,
  companyId,
  onClose,
}: AddContactsToListModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [listId, companyId]);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customers and existing list members in parallel
      const [customersResponse, listResponse] = await Promise.all([
        fetch(`/api/customers?companyId=${companyId}`),
        fetch(`/api/contact-lists/${listId}`)
      ]);

      const customersResult = await customersResponse.json();
      const listResult = await listResponse.json();

      if (!customersResponse.ok) {
        throw new Error(customersResult.error || 'Failed to load customers');
      }

      if (customersResult.customers) {
        setCustomers(customersResult.customers);
      } else {
        throw new Error('Failed to load customers');
      }

      if (listResult.success && listResult.list.members) {
        const memberIds = new Set<string>(
          listResult.list.members.map((m: any) => m.customer.id as string)
        );
        setExistingMemberIds(memberIds);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer => {
      const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
      const email = customer.email?.toLowerCase() || '';
      return fullName.includes(query) || email.includes(query);
    });

    setFilteredCustomers(filtered);
  };

  const handleToggleCustomer = (customerId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.filter(c => !existingMemberIds.has(c.id)).length) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(
        filteredCustomers
          .filter(c => !existingMemberIds.has(c.id))
          .map(c => c.id)
      );
      setSelectedIds(newSelected);
    }
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one contact');
      return;
    }

    try {
      setAdding(true);
      setError(null);

      const response = await fetch(`/api/contact-lists/${listId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_ids: Array.from(selectedIds)
        })
      });

      const result = await response.json();

      if (result.success) {
        onClose(true);
      } else {
        throw new Error(result.error || 'Failed to add contacts');
      }
    } catch (err: any) {
      console.error('Error adding contacts:', err);
      setError(err.message || 'Failed to add contacts. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const availableCustomers = filteredCustomers.filter(c => !existingMemberIds.has(c.id));
  const allAvailableSelected = availableCustomers.length > 0 &&
    selectedIds.size === availableCustomers.length;

  return (
    <div className={styles.modalOverlay} onClick={() => onClose(false)}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Add Contacts to {listName}</h2>
            <p className={styles.subtitle}>
              {selectedIds.size > 0
                ? `${selectedIds.size} ${selectedIds.size === 1 ? 'contact' : 'contacts'} selected`
                : 'Select contacts to add to this list'}
            </p>
          </div>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.searchSection}>
            <div className={styles.searchBar}>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>
              <Loader size={32} className={styles.spinner} />
              <p>Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className={styles.emptyState}>
              <User size={48} />
              <p>No customers found</p>
              {searchQuery && <span>Try adjusting your search</span>}
            </div>
          ) : (
            <>
              <div className={styles.selectAllSection}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={allAvailableSelected}
                    onChange={handleSelectAll}
                    disabled={availableCustomers.length === 0}
                  />
                  <span>
                    Select all available ({availableCustomers.length})
                  </span>
                </label>
              </div>

              <div className={styles.customersList}>
                {filteredCustomers.map(customer => {
                  const isExisting = existingMemberIds.has(customer.id);
                  const isSelected = selectedIds.has(customer.id);

                  return (
                    <div
                      key={customer.id}
                      className={`${styles.customerItem} ${isExisting ? styles.existing : ''}`}
                    >
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isExisting || isSelected}
                          onChange={() => handleToggleCustomer(customer.id)}
                          disabled={isExisting}
                        />
                        <div className={styles.customerInfo}>
                          <div className={styles.customerName}>
                            <User size={16} />
                            {customer.first_name} {customer.last_name}
                          </div>
                          <div className={styles.customerDetails}>
                            <span>{customer.email}</span>
                            {customer.phone && <span>{customer.phone}</span>}
                          </div>
                        </div>
                      </label>
                      {isExisting && (
                        <span className={styles.alreadyAddedBadge}>Already in list</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={() => onClose(false)} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={adding || selectedIds.size === 0}
            className={styles.addButton}
          >
            {adding ? 'Adding...' : `Add ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''} Contact${selectedIds.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
