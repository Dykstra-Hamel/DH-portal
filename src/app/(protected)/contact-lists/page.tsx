'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Plus, Search, Trash2, Copy, Edit2, Users, Calendar } from 'lucide-react';
import styles from './page.module.scss';
import ContactListModal from '@/components/ContactLists/ContactListModal';

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  total_contacts: number;
  created_at: string;
  campaign_count: number;
  last_used_at: string | null;
  last_used_campaign: any;
}

export default function ContactListsPage() {
  const { selectedCompany } = useCompany();
  const [lists, setLists] = useState<ContactList[]>([]);
  const [filteredLists, setFilteredLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchLists();
    }
  }, [selectedCompany?.id]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = lists.filter(
        (list) =>
          list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          list.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLists(filtered);
    } else {
      setFilteredLists(lists);
    }
  }, [searchQuery, lists]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contact-lists?company_id=${selectedCompany!.id}`);
      const result = await response.json();

      if (result.success) {
        setLists(result.lists || []);
      }
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedList(null);
    setShowModal(true);
  };

  const handleEdit = (list: ContactList) => {
    setSelectedList(list);
    setShowModal(true);
  };

  const handleDuplicate = async (list: ContactList) => {
    if (!confirm(`Duplicate "${list.name}"?`)) return;

    try {
      const response = await fetch(`/api/contact-lists/${list.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        fetchLists();
      } else {
        alert(result.error || 'Failed to duplicate list');
      }
    } catch (error) {
      console.error('Error duplicating list:', error);
      alert('Failed to duplicate list');
    }
  };

  const handleDelete = async (list: ContactList) => {
    if (!confirm(`Delete "${list.name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/contact-lists/${list.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchLists();
      } else {
        alert(result.error || 'Failed to delete list');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
    }
  };

  const handleModalClose = (shouldRefresh: boolean) => {
    setShowModal(false);
    setSelectedList(null);
    if (shouldRefresh) {
      fetchLists();
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading contact lists...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1>Contact Lists</h1>
          <p>Manage reusable contact lists for your campaigns</p>
        </div>
        <button onClick={handleCreate} className={styles.createButton}>
          <Plus size={20} />
          Create List
        </button>
      </div>

      <div className={styles.searchBar}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Search lists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredLists.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} />
          <h3>No contact lists found</h3>
          <p>
            {searchQuery
              ? 'No lists match your search'
              : 'Create your first contact list to get started'}
          </p>
          {!searchQuery && (
            <button onClick={handleCreate} className={styles.createButton}>
              <Plus size={20} />
              Create List
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.listsTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Contacts</th>
                <th>Used In Campaigns</th>
                <th>Last Used</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLists.map((list) => (
                <tr key={list.id} onClick={() => handleEdit(list)} className={styles.clickableRow}>
                  <td>
                    <div className={styles.nameCell}>
                      <strong>{list.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={styles.description}>
                      {list.description || '-'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.contactCount}>
                      <Users size={14} />
                      {list.total_contacts}
                    </div>
                  </td>
                  <td>{list.campaign_count}</td>
                  <td>
                    {list.last_used_at ? (
                      <div className={styles.lastUsed}>
                        <Calendar size={14} />
                        {new Date(list.last_used_at).toLocaleDateString()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{new Date(list.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(list)}
                        className={styles.actionButton}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(list)}
                        className={styles.actionButton}
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(list)}
                        className={styles.actionButton}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ContactListModal
          list={selectedList}
          companyId={selectedCompany!.id}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
