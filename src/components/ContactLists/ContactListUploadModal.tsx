'use client';

import { useState } from 'react';
import { X, Upload, Loader, CheckCircle, AlertCircle, FileUp } from 'lucide-react';
import styles from './ContactListUploadModal.module.scss';

interface ContactListUploadModalProps {
  companyId: string;
  onClose: (shouldRefresh: boolean) => void;
}

export default function ContactListUploadModal({
  companyId,
  onClose,
}: ContactListUploadModalProps) {
  const [listName, setListName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setParsedData(null);

    // Auto-fill list name from file name if empty
    if (!listName) {
      setListName(selectedFile.name.replace('.csv', ''));
    }

    // Auto-parse the CSV
    await parseCSV(selectedFile);
  };

  const parseCSV = async (csvFile: File) => {
    try {
      setParsing(true);
      setError(null);

      // Read file content
      const csvContent = await csvFile.text();

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

      setParsedData(result);
    } catch (err) {
      console.error('Error parsing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!listName.trim()) {
      setError('Please enter a list name');
      return;
    }

    if (!parsedData || !parsedData.leads || parsedData.leads.length === 0) {
      setError('No valid contacts to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create new list with members
      const response = await fetch('/api/contact-lists/create-with-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          name: listName,
          description: `Uploaded ${parsedData.leads.length} contacts`,
          members: parsedData.leads,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onClose(true);
      } else {
        throw new Error(result.error || 'Failed to create contact list');
      }
    } catch (err: any) {
      console.error('Error creating list:', err);
      setError(err.message || 'Failed to create contact list. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => onClose(false)}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Create Contact List from CSV</h2>
            <p className={styles.subtitle}>
              Upload a CSV file to create a new contact list
            </p>
          </div>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* List Name Input */}
          <div className={styles.formGroup}>
            <label>List Name *</label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Enter list name"
            />
          </div>

          {/* File Upload Section */}
          <div
            className={`${styles.dropZone} ${dragActive ? styles.active : ''} ${parsedData ? styles.hasFile : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-upload-input')?.click()}
          >
            <input
              id="csv-upload-input"
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />

            <div className={styles.dropZoneContent}>
              {parsing ? (
                <>
                  <Loader size={40} className={styles.spinner} />
                  <p>Parsing CSV...</p>
                </>
              ) : parsedData ? (
                <>
                  <CheckCircle size={40} className={styles.successIcon} />
                  <p className={styles.fileName}>{file?.name}</p>
                  <span className={styles.fileInfo}>
                    {parsedData.validRows || 0} valid contacts found
                  </span>
                </>
              ) : (
                <>
                  <FileUp size={40} />
                  <p>Drag and drop CSV file here</p>
                  <span className={styles.hint}>or click to browse</span>
                </>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Parse Results */}
          {parsedData && (
            <div className={styles.parseResults}>
              <h4>Upload Summary</h4>
              <div className={styles.resultsGrid}>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Valid Contacts</span>
                  <span className={styles.resultValue}>{parsedData.validRows || 0}</span>
                </div>
                <div className={styles.resultItem}>
                  <span className={styles.resultLabel}>Invalid Rows</span>
                  <span className={styles.resultValue}>{parsedData.invalidRows || 0}</span>
                </div>
                {parsedData.duplicatesRemoved > 0 && (
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Duplicates Removed</span>
                    <span className={styles.resultValue}>{parsedData.duplicatesRemoved}</span>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              {parsedData.leads && parsedData.leads.length > 0 && (
                <div className={styles.preview}>
                  <h4>Preview (first 5 contacts)</h4>
                  <div className={styles.previewTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.leads.slice(0, 5).map((contact: any, index: number) => (
                          <tr key={index}>
                            <td>{contact.first_name} {contact.last_name}</td>
                            <td>{contact.email}</td>
                            <td>{contact.phone_number || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.leads.length > 5 && (
                      <p className={styles.tableFooter}>
                        ...and {parsedData.leads.length - 5} more contacts
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={() => onClose(false)} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !parsedData || parsedData.validRows === 0 || !listName.trim()}
            className={styles.uploadButton}
          >
            {uploading
              ? 'Creating...'
              : `Create List (${parsedData?.validRows || 0} contacts)`}
          </button>
        </div>
      </div>
    </div>
  );
}
