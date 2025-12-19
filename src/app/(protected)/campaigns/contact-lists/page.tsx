'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Plus, Search, Trash2, Copy, Edit2, Users, Calendar, FileUp, Archive, RotateCcw } from 'lucide-react';
import styles from './page.module.scss';
import ContactListModal from '@/components/ContactLists/ContactListModal';
import ContactListUploadModal from '@/components/ContactLists/ContactListUploadModal';

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  total_contacts: number;
  created_at: string;
  archived_at: string | null;
  archived_by: string | null;
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchLists();
    }
  }, [selectedCompany?.id, activeTab]);

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
      const includeArchived = activeTab === 'archived' ? 'true' : 'false';
      const response = await fetch(
        `/api/contact-lists?company_id=${selectedCompany!.id}&include_archived=${includeArchived}`
      );
      const result = await response.json();

      if (result.success) {
        // Filter based on active tab
        const filteredByTab = (result.lists || []).filter((list: ContactList) => {
          if (activeTab === 'archived') {
            return list.archived_at !== null;
          } else {
            return list.archived_at === null;
          }
        });
        setLists(filteredByTab);
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

  const handleArchive = async (list: ContactList) => {
    if (!confirm(`Archive "${list.name}"? It will no longer be available for new campaigns but historical data will be preserved.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/contact-lists/${list.id}`, {
        method: 'DELETE', // This now archives instead of deletes
      });

      const result = await response.json();

      if (result.success) {
        fetchLists();
      } else {
        alert(result.error || 'Failed to archive list');
      }
    } catch (error) {
      console.error('Error archiving list:', error);
      alert('Failed to archive list');
    }
  };

  const handleUnarchive = async (list: ContactList) => {
    if (!confirm(`Restore "${list.name}"? It will be available for use in campaigns again.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/contact-lists/${list.id}/unarchive`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        fetchLists();
      } else {
        alert(result.error || 'Failed to restore list');
      }
    } catch (error) {
      console.error('Error restoring list:', error);
      alert('Failed to restore list');
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
        <div className={styles.headerButtons}>
          <button onClick={() => setShowUploadModal(true)} className={styles.uploadButton}>
            <FileUp size={20} />
            Upload CSV
          </button>
          <button onClick={handleCreate} className={styles.createButton}>
            <Plus size={20} />
            Create List
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Lists
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'archived' ? styles.active : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived
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
                      {activeTab === 'active' ? (
                        <button
                          onClick={() => handleArchive(list)}
                          className={styles.actionButton}
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnarchive(list)}
                          className={styles.actionButton}
                          title="Restore"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
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

      {showUploadModal && (
        <ContactListUploadModal
          companyId={selectedCompany!.id}
          onClose={(shouldRefresh) => {
            setShowUploadModal(false);
            if (shouldRefresh) fetchLists();
          }}
        />
      )}
    </div>
  );
}
