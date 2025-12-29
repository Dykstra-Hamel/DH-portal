'use client';

import { useState, useEffect } from 'react';
import { X, Users, Trash2, Plus, FileDown, FileUp } from 'lucide-react';
import styles from './ContactListModal.module.scss';
import AddContactsToListModal from './AddContactsToListModal';
import ImportCSVToListModal from './ImportCSVToListModal';

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
  const [showAddContactsModal, setShowAddContactsModal] = useState(false);
  const [showImportCSVModal, setShowImportCSVModal] = useState(false);

  // CSV upload state for new lists
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsvData, setParsedCsvData] = useState<any | null>(null);
  const [parsingCsv, setParsingCsv] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

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

  const handleCsvFileSelection = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setCsvError('Please upload a CSV file');
      return;
    }

    setCsvFile(selectedFile);
    setCsvError(null);
    setParsedCsvData(null);

    // Auto-parse the CSV
    try {
      setParsingCsv(true);
      setCsvError(null);

      const csvContent = await selectedFile.text();

      // Call parse API
      const response = await fetch('/api/leads/bulk/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          csvContent,
          skipDatabaseDuplicateCheck: true,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse CSV');
      }

      setParsedCsvData(result);
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setParsedCsvData(null);
    } finally {
      setParsingCsv(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    // Require CSV upload for new lists
    if (!isEditing && (!parsedCsvData || !parsedCsvData.leads || parsedCsvData.leads.length === 0)) {
      alert('Please upload a CSV file with contacts');
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
        // If creating a new list with CSV data, import contacts
        if (!isEditing && parsedCsvData && parsedCsvData.leads && parsedCsvData.leads.length > 0) {
          const newListId = result.list.id;

          // Import contacts to the newly created list
          const importResponse = await fetch(`/api/contact-lists/${newListId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              members: parsedCsvData.leads,
            }),
          });

          const importResult = await importResponse.json();

          if (!importResult.success) {
            alert('List created, but failed to import contacts. You can import them later.');
          }
        }

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

  const handleExport = () => {
    if (members.length === 0) {
      alert('No contacts to export');
      return;
    }

    // Convert members to CSV format
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP'];
    const rows = members.map(member => [
      member.customer?.first_name || '',
      member.customer?.last_name || '',
      member.customer?.email || '',
      member.customer?.phone || '',
      member.customer?.street_address || '',
      member.customer?.city || '',
      member.customer?.state || '',
      member.customer?.zip || ''
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${list.name.replace(/[^a-z0-9]/gi, '_')}_contacts.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                rows={2}
              />
            </div>
          </div>

          {/* CSV Upload for new lists */}
          {!isEditing && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>
                  <FileUp size={16} />
                  Upload Contacts *
                </h3>
              </div>

              <div className={styles.csvUploadArea}>
                <input
                  id="csv-file-input-create"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvFileSelection(file);
                  }}
                  style={{ display: 'none' }}
                />

                <div
                  className={styles.csvDropZone}
                  onClick={() => document.getElementById('csv-file-input-create')?.click()}
                >
                  {parsingCsv ? (
                    <div className={styles.csvParsing}>
                      <div className={styles.spinner} />
                      <p>Parsing CSV...</p>
                    </div>
                  ) : parsedCsvData ? (
                    <div className={styles.csvSuccess}>
                      <p className={styles.csvFileName}>{csvFile?.name}</p>
                      <span className={styles.csvInfo}>
                        {parsedCsvData.validRows || 0} valid contact{parsedCsvData.validRows !== 1 ? 's' : ''} ready to import
                      </span>
                      <button
                        type="button"
                        className={styles.csvRemoveButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCsvFile(null);
                          setParsedCsvData(null);
                          setCsvError(null);
                        }}
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className={styles.csvPrompt}>
                      <FileUp size={28} />
                      <p>Click to upload CSV file</p>
                      <span className={styles.csvHint}>Upload a CSV file to add contacts to this list</span>
                    </div>
                  )}
                </div>

                {csvError && (
                  <div className={styles.csvError}>
                    {csvError}
                  </div>
                )}
              </div>
            </div>
          )}

          {isEditing && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>
                    <Users size={20} />
                    Contacts ({members.length})
                  </h3>
                  <div className={styles.sectionActions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setShowImportCSVModal(true)}
                    >
                      <FileUp size={16} />
                      Import CSV
                    </button>
                    <button className={styles.secondaryButton} onClick={handleExport}>
                      <FileDown size={16} />
                      Export
                    </button>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setShowAddContactsModal(true)}
                    >
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
            {saving
              ? 'Saving...'
              : isEditing
                ? 'Save Changes'
                : parsedCsvData && parsedCsvData.validRows > 0
                  ? `Create List with ${parsedCsvData.validRows} Contact${parsedCsvData.validRows !== 1 ? 's' : ''}`
                  : 'Create List'
            }
          </button>
        </div>
      </div>

      {/* Add Contacts Modal */}
      {showAddContactsModal && (
        <AddContactsToListModal
          listId={list.id}
          listName={list.name}
          companyId={companyId}
          onClose={(shouldRefresh) => {
            setShowAddContactsModal(false);
            if (shouldRefresh) fetchListDetails();
          }}
        />
      )}

      {/* Import CSV Modal */}
      {showImportCSVModal && (
        <ImportCSVToListModal
          listId={list.id}
          listName={list.name}
          companyId={companyId}
          onClose={(shouldRefresh) => {
            setShowImportCSVModal(false);
            if (shouldRefresh) fetchListDetails();
          }}
        />
      )}
    </div>
  );
}
