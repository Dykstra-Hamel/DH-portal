'use client';

import { useState, useEffect } from 'react';
import { X, Users, Trash2, Plus, FileDown, FileUp } from 'lucide-react';
import styles from './ContactListModal.module.scss';

interface ContactListModalProps {
  list: any | null; // null for creating new list
  companyId: string;
  onClose: (shouldRefresh: boolean) => void;
}

export default function ContactListModal({ list, companyId, onClose }: ContactListModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
  });
  const [members, setMembers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const isEditing = !!list;

  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name || '',
        description: list.description || '',
        notes: list.notes || '',
      });
      fetchListDetails();
    }
  }, [list]);

  const fetchListDetails = async () => {
    if (!list) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/contact-lists/${list.id}`);
      const result = await response.json();

      if (result.success) {
        setMembers(result.list.members || []);
        setCampaigns(result.list.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching list details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    try {
      setSaving(true);

      const url = isEditing
        ? `/api/contact-lists/${list.id}`
        : '/api/contact-lists';

      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing
        ? formData
        : { ...formData, company_id: companyId };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        onClose(true);
      } else {
        alert(result.error || 'Failed to save list');
      }
    } catch (error) {
      console.error('Error saving list:', error);
      alert('Failed to save list');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this contact from the list?')) return;

    try {
      const response = await fetch(`/api/contact-lists/${list.id}/members/${memberId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMembers(members.filter((m) => m.id !== memberId));
      } else {
        alert(result.error || 'Failed to remove contact');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove contact');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => onClose(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? 'Edit Contact List' : 'Create Contact List'}</h2>
          <button onClick={() => onClose(false)} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter list name"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this list"
                rows={3}
              />
            </div>
          </div>

          {isEditing && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>
                    <Users size={20} />
                    Contacts ({members.length})
                  </h3>
                  <div className={styles.sectionActions}>
                    <button className={styles.secondaryButton} disabled>
                      <FileUp size={16} />
                      Import CSV
                    </button>
                    <button className={styles.secondaryButton} disabled>
                      <FileDown size={16} />
                      Export
                    </button>
                    <button className={styles.secondaryButton} disabled>
                      <Plus size={16} />
                      Add Contact
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className={styles.loading}>Loading contacts...</div>
                ) : members.length === 0 ? (
                  <div className={styles.emptySection}>
                    <p>No contacts in this list yet</p>
                  </div>
                ) : (
                  <div className={styles.membersTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.id}>
                            <td>
                              {member.customer?.first_name} {member.customer?.last_name}
                            </td>
                            <td>{member.customer?.email}</td>
                            <td>{member.customer?.phone || '-'}</td>
                            <td>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className={styles.removeButton}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {campaigns.length > 0 && (
                <div className={styles.section}>
                  <h3>Campaign Usage ({campaigns.length})</h3>
                  <div className={styles.campaignsList}>
                    {campaigns.map((item: any, index: number) => (
                      <div key={index} className={styles.campaignItem}>
                        <strong>{item.campaign?.name}</strong>
                        <span className={styles.campaignStatus}>
                          {item.campaign?.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={() => onClose(false)} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create List'}
          </button>
        </div>
      </div>
    </div>
  );
}
