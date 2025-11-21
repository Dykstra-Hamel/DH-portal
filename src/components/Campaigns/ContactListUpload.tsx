'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Users, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ContactListUpload.module.scss';

interface ContactListUploadProps {
  companyId: string;
  campaignId?: string; // Optional for new campaigns
  onListsChange: (lists: any[], totalContacts: number) => void;
}

export default function ContactListUpload({
  companyId,
  campaignId,
  onListsChange
}: ContactListUploadProps) {
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInvalidRows, setShowInvalidRows] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<{
    listName: string;
    file: File | null;
    parsedData: any | null;
  }>({
    listName: '',
    file: null,
    parsedData: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (campaignId) {
      fetchExistingLists();
    }
  }, [campaignId]);

  useEffect(() => {
    const totalContacts = contactLists.reduce((sum, list) => sum + (list.total_contacts || 0), 0);
    onListsChange(contactLists, totalContacts);
  }, [contactLists]);

  const fetchExistingLists = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/contact-lists`);
      const result = await response.json();

      if (result.success) {
        setContactLists(result.contactLists || []);
      }
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setCurrentUpload({
      ...currentUpload,
      file,
      listName: currentUpload.listName || file.name.replace('.csv', ''),
    });

    // Auto-parse the CSV
    await parseCSV(file);
  };

  const parseCSV = async (file: File) => {
    try {
      setParsing(true);
      setError(null);

      // Read file content
      const csvContent = await file.text();

      // Call existing parse API
      const response = await fetch('/api/leads/bulk/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          csvContent,
          skipDatabaseDuplicateCheck: true, // For campaigns, only check for within-CSV duplicates
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse CSV');
      }

      setCurrentUpload({
        ...currentUpload,
        file,
        parsedData: result,
      });

    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setParsing(false);
    }
  };

  const handleUploadList = async () => {
    if (!currentUpload.parsedData || !currentUpload.listName.trim()) {
      setError('Please provide a list name and upload a CSV file');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // If we have a campaignId, upload directly to the campaign
      // Otherwise, store it temporarily in state for when campaign is created
      if (campaignId) {
        const response = await fetch(`/api/campaigns/${campaignId}/contact-lists/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listName: currentUpload.listName,
            parsedData: currentUpload.parsedData.leads,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to upload contact list');
        }

        // Add to lists and refresh
        await fetchExistingLists();
      } else {
        // For new campaigns, store locally until campaign is created
        const newList = {
          id: `temp-${Date.now()}`,
          list_name: currentUpload.listName,
          total_contacts: currentUpload.parsedData.leads.length,
          parsedData: currentUpload.parsedData.leads,
          isTemporary: true,
        };
        setContactLists([...contactLists, newList]);
      }

      // Reset upload form
      setCurrentUpload({
        listName: '',
        file: null,
        parsedData: null,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Error uploading contact list:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload contact list');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveList = async (listId: string) => {
    if (confirm('Are you sure you want to remove this contact list?')) {
      try {
        const list = contactLists.find(l => l.id === listId);

        if (list?.isTemporary) {
          // Remove from local state
          setContactLists(contactLists.filter(l => l.id !== listId));
        } else if (campaignId) {
          // Delete from server
          const response = await fetch(`/api/campaigns/${campaignId}/contact-lists/${listId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setContactLists(contactLists.filter(l => l.id !== listId));
          }
        }
      } catch (error) {
        console.error('Error removing contact list:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setCurrentUpload({
        ...currentUpload,
        file,
        listName: currentUpload.listName || file.name.replace('.csv', ''),
      });
      await parseCSV(file);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const totalContacts = contactLists.reduce((sum, list) => sum + (list.total_contacts || 0), 0);

  return (
    <div className={styles.contactListUpload}>
      <div className={styles.header}>
        <div>
          <h3>Contact Lists</h3>
          <p className={styles.description}>
            Upload CSV files to add contacts to your campaign. The AI will automatically parse and match existing customers.
          </p>
        </div>
        {totalContacts > 0 && (
          <div className={styles.totalBadge}>
            <Users size={16} />
            <span>{totalContacts} total contacts</span>
          </div>
        )}
      </div>

      {/* Upload Form */}
      <div className={styles.uploadSection}>
        <div className={styles.formGroup}>
          <label>List Name</label>
          <input
            type="text"
            value={currentUpload.listName}
            onChange={e => setCurrentUpload({ ...currentUpload, listName: e.target.value })}
            placeholder="e.g., Spring 2024 Customers"
          />
        </div>

        <div
          className={styles.dropZone}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {parsing ? (
            <div className={styles.dropZoneContent}>
              <Loader className={styles.spinner} size={32} />
              <p>Parsing CSV with AI...</p>
            </div>
          ) : currentUpload.file ? (
            <div className={styles.dropZoneContent}>
              <CheckCircle size={32} className={styles.successIcon} />
              <p className={styles.fileName}>{currentUpload.file.name}</p>
              {currentUpload.parsedData && (
                <p className={styles.fileInfo}>
                  {currentUpload.parsedData.validRows} contacts found
                </p>
              )}
            </div>
          ) : (
            <div className={styles.dropZoneContent}>
              <Upload size={32} />
              <p>Click or drag CSV file here</p>
              <span className={styles.hint}>CSV files only</span>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {currentUpload.parsedData && (
          <>
            <div className={styles.parseResults}>
              <h4>Parse Results</h4>
              <div className={styles.resultsGrid}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Valid Rows:</span>
                  <span className={styles.resultValue}>{currentUpload.parsedData.validRows}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Invalid Rows:</span>
                  <span className={styles.resultValue}>{currentUpload.parsedData.invalidRows}</span>
                </div>
                {currentUpload.parsedData.duplicates?.length > 0 && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Duplicates:</span>
                    <span className={styles.resultValue}>
                      {currentUpload.parsedData.duplicates.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Invalid Rows Details */}
            {currentUpload.parsedData.invalidRowDetails?.length > 0 && (
              <div className={styles.detailsSection}>
                <button
                  className={styles.detailsToggle}
                  onClick={() => setShowInvalidRows(!showInvalidRows)}
                >
                  <span>Invalid Rows ({currentUpload.parsedData.invalidRowDetails.length})</span>
                  {showInvalidRows ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {showInvalidRows && (
                  <div className={styles.rowsList}>
                    {currentUpload.parsedData.invalidRowDetails.map((row: any, idx: number) => (
                      <div key={idx} className={styles.rowDetail}>
                        <div className={styles.rowNumber}>Row {row.rowIndex + 2}</div>
                        <div className={styles.rowReason}>{row.reason}</div>
                        <div className={styles.rowData}>
                          {Object.entries(row.data)
                            .filter(([_, value]) => value)
                            .map(([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Duplicates Details */}
            {currentUpload.parsedData.duplicates?.length > 0 && (
              <div className={styles.detailsSection}>
                <button
                  className={styles.detailsToggle}
                  onClick={() => setShowDuplicates(!showDuplicates)}
                >
                  <span>Duplicate Rows in CSV ({currentUpload.parsedData.duplicates.length})</span>
                  {showDuplicates ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {showDuplicates && (
                  <div className={styles.rowsList}>
                    {currentUpload.parsedData.duplicates.map((dup: any, idx: number) => (
                      <div key={idx} className={styles.rowDetail}>
                        <div className={styles.rowNumber}>Row {dup.rowIndex + 2}</div>
                        <div className={styles.rowReason}>{dup.reason}</div>
                        <div className={styles.rowData}>
                          {dup.email && (
                            <div>
                              <strong>Email:</strong> {dup.email}
                            </div>
                          )}
                          {dup.phone && (
                            <div>
                              <strong>Phone:</strong> {dup.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <button
          className={styles.uploadButton}
          onClick={handleUploadList}
          disabled={!currentUpload.parsedData || !currentUpload.listName.trim() || uploading}
        >
          {uploading ? 'Adding List...' : 'Add Contact List'}
        </button>
      </div>

      {/* Existing Lists */}
      {contactLists.length > 0 && (
        <div className={styles.listsSection}>
          <h4>Added Lists ({contactLists.length})</h4>
          <div className={styles.listCards}>
            {contactLists.map(list => (
              <div key={list.id} className={styles.listCard}>
                <div className={styles.listHeader}>
                  <h5>{list.list_name}</h5>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveList(list.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className={styles.listInfo}>
                  <Users size={14} />
                  <span>{list.total_contacts} contacts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {contactLists.length === 0 && !currentUpload.file && (
        <div className={styles.emptyState}>
          <Users size={48} />
          <p>No contact lists added yet</p>
          <span>Upload a CSV file to get started</span>
        </div>
      )}
    </div>
  );
}
