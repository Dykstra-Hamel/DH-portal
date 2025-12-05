'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  Users,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  List,
} from 'lucide-react';
import styles from './ContactListUpload.module.scss';

interface ContactListUploadProps {
  companyId: string;
  campaignId?: string; // Optional for new campaigns
  initialLists?: any[]; // Previously selected lists (for restoring state when navigating back)
  onListsChange: (lists: any[], totalContacts: number) => void;
}

export default function ContactListUpload({
  companyId,
  campaignId,
  initialLists,
  onListsChange,
}: ContactListUploadProps) {
  const [selectedLists, setSelectedLists] = useState<any[]>([]); // Lists selected for this campaign
  const [availableLists, setAvailableLists] = useState<any[]>([]); // Company-wide reusable lists
  const [loadingAvailableLists, setLoadingAvailableLists] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInvalidRows, setShowInvalidRows] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'select'>('select'); // Default to select tab
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
    if (companyId) {
      fetchAvailableLists();
    }
    if (campaignId) {
      fetchSelectedLists();
    }
  }, [companyId, campaignId]);

  // Restore selected lists from initialLists prop (when navigating back)
  useEffect(() => {
    if (initialLists && initialLists.length > 0 && selectedLists.length === 0) {
      setSelectedLists(initialLists);
    }
  }, [initialLists]);

  useEffect(() => {
    const totalContacts = selectedLists.reduce(
      (sum, list) => sum + (list.total_contacts || 0),
      0
    );
    onListsChange(selectedLists, totalContacts);
  }, [selectedLists]);

  const fetchAvailableLists = async () => {
    try {
      setLoadingAvailableLists(true);
      const response = await fetch(
        `/api/contact-lists?company_id=${companyId}`
      );
      const result = await response.json();

      if (result.success) {
        setAvailableLists(result.lists || []);
      }
    } catch (error) {
      console.error('Error fetching available contact lists:', error);
    } finally {
      setLoadingAvailableLists(false);
    }
  };

  const fetchSelectedLists = async () => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/contact-lists`
      );
      const result = await response.json();

      if (result.success) {
        setSelectedLists(result.contactLists || []);
      }
    } catch (error) {
      console.error('Error fetching selected contact lists:', error);
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

      // Create as a reusable contact list via new API
      const response = await fetch('/api/contact-lists/create-with-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          name: currentUpload.listName,
          description: `Uploaded ${currentUpload.parsedData.leads.length} contacts`,
          members: currentUpload.parsedData.leads,
          campaign_id: campaignId, // Optional - if set, also assign to campaign
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create contact list');
      }

      // Add to selected lists
      setSelectedLists([...selectedLists, result.list]);

      // Refresh available lists
      await fetchAvailableLists();

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
      setError(
        err instanceof Error ? err.message : 'Failed to upload contact list'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSelectExistingList = async (listId: string) => {
    const list = availableLists.find(l => l.id === listId);
    if (!list) return;

    // Check if already selected
    if (selectedLists.some(l => l.id === listId)) {
      setError('This list is already selected');
      return;
    }

    try {
      // If we have a campaignId, assign it via API
      if (campaignId) {
        const response = await fetch(
          `/api/campaigns/${campaignId}/contact-lists/assign`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_list_id: listId }),
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to assign contact list');
        }

        // Refresh selected lists from server
        await fetchSelectedLists();
      } else {
        // For new campaigns, just add to local state with a flag
        setSelectedLists([...selectedLists, { ...list, isExisting: true }]);
      }
    } catch (err) {
      console.error('Error selecting contact list:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to select contact list'
      );
    }
  };

  const handleRemoveList = async (listId: string) => {
    if (
      confirm(
        'Are you sure you want to remove this contact list from the campaign?'
      )
    ) {
      try {
        const list = selectedLists.find(l => l.id === listId);

        if (campaignId && !list?.isExisting && !list?.isTemporary) {
          // Remove assignment from server
          const response = await fetch(
            `/api/campaigns/${campaignId}/contact-lists/unassign`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contact_list_id: listId }),
            }
          );

          if (response.ok) {
            setSelectedLists(selectedLists.filter(l => l.id !== listId));
          }
        } else {
          // Remove from local state
          setSelectedLists(selectedLists.filter(l => l.id !== listId));
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

  const totalContacts = selectedLists.reduce(
    (sum, list) => sum + (list.total_contacts || 0),
    0
  );

  // Filter out already selected lists from available
  const unselectedLists = availableLists.filter(
    avail => !selectedLists.some(sel => sel.id === avail.id)
  );

  return (
    <div className={styles.contactListUpload}>
      <div className={styles.header}>
        <div>
          <h3>Contact Lists</h3>
          <p className={styles.description}>
            Select from existing contact lists or upload a CSV file to create a
            new list.
          </p>
        </div>
        {totalContacts > 0 && (
          <div className={styles.totalBadge}>
            <Users size={16} />
            <span>{totalContacts} total contacts</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'select' ? styles.active : ''}`}
          onClick={() => setActiveTab('select')}
        >
          <List size={16} />
          Select Existing Lists
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={16} />
          Upload New List
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Select Existing Lists Tab */}
      {activeTab === 'select' && (
        <div className={styles.selectSection}>
          {loadingAvailableLists ? (
            <div className={styles.loading}>
              <Loader className={styles.spinner} size={24} />
              <p>Loading contact lists...</p>
            </div>
          ) : unselectedLists.length > 0 ? (
            <div className={styles.availableListsGrid}>
              {unselectedLists.map(list => (
                <div key={list.id} className={styles.availableListCard}>
                  <div className={styles.listCardHeader}>
                    <h5>{list.name}</h5>
                    <button
                      className={styles.selectButton}
                      onClick={() => handleSelectExistingList(list.id)}
                    >
                      Select
                    </button>
                  </div>
                  {list.description && (
                    <p className={styles.listDescription}>{list.description}</p>
                  )}
                  <div className={styles.listStats}>
                    <div className={styles.statItem}>
                      <Users size={14} />
                      <span>{list.total_contacts} contacts</span>
                    </div>
                    {list.campaign_count > 0 && (
                      <div className={styles.statItem}>
                        <span className={styles.badge}>
                          Used in {list.campaign_count} campaign
                          {list.campaign_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <List size={48} />
              <p>No available contact lists</p>
              <span>
                Upload a new CSV to create your first reusable contact list
              </span>
            </div>
          )}
        </div>
      )}

      {/* Upload New List Tab */}
      {activeTab === 'upload' && (
        <div className={styles.uploadSection}>
          <div className={styles.formGroup}>
            <label>List Name</label>
            <input
              type="text"
              value={currentUpload.listName}
              onChange={e =>
                setCurrentUpload({ ...currentUpload, listName: e.target.value })
              }
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

          {currentUpload.parsedData && (
            <>
              <div className={styles.parseResults}>
                <h4>Parse Results</h4>
                <div className={styles.resultsGrid}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Valid Rows:</span>
                    <span className={styles.resultValue}>
                      {currentUpload.parsedData.validRows}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Invalid Rows:</span>
                    <span className={styles.resultValue}>
                      {currentUpload.parsedData.invalidRows}
                    </span>
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
                    <span>
                      Invalid Rows (
                      {currentUpload.parsedData.invalidRowDetails.length})
                    </span>
                    {showInvalidRows ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                  {showInvalidRows && (
                    <div className={styles.rowsList}>
                      {currentUpload.parsedData.invalidRowDetails.map(
                        (row: any, idx: number) => (
                          <div key={idx} className={styles.rowDetail}>
                            <div className={styles.rowNumber}>
                              Row {row.rowIndex + 2}
                            </div>
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
                        )
                      )}
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
                    <span>
                      Duplicate Rows in CSV (
                      {currentUpload.parsedData.duplicates.length})
                    </span>
                    {showDuplicates ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                  {showDuplicates && (
                    <div className={styles.rowsList}>
                      {currentUpload.parsedData.duplicates.map(
                        (dup: any, idx: number) => (
                          <div key={idx} className={styles.rowDetail}>
                            <div className={styles.rowNumber}>
                              Row {dup.rowIndex + 2}
                            </div>
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
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button
            className={styles.uploadButton}
            onClick={handleUploadList}
            disabled={
              !currentUpload.parsedData ||
              !currentUpload.listName.trim() ||
              uploading
            }
          >
            {uploading ? 'Creating List...' : 'Create Contact List'}
          </button>
        </div>
      )}

      {/* Selected Lists */}
      {selectedLists.length > 0 && (
        <div className={styles.listsSection}>
          <h4>Selected Lists ({selectedLists.length})</h4>
          <div className={styles.listCards}>
            {selectedLists.map(list => (
              <div key={list.id} className={styles.listCard}>
                <div className={styles.listHeader}>
                  <h5>{list.list_name || list.name}</h5>
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

      {selectedLists.length === 0 && !currentUpload.file && (
        <div className={styles.emptyState}>
          <Users size={48} />
          <p>No contact lists selected yet</p>
          <span>
            Select an existing list or upload a new CSV file to get started
          </span>
        </div>
      )}
    </div>
  );
}
