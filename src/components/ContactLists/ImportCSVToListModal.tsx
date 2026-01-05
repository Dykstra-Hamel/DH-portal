'use client';

import { useState } from 'react';
import { X, Upload, Loader, CheckCircle, AlertCircle, FileUp } from 'lucide-react';
import styles from './ImportCSVToListModal.module.scss';

interface ImportCSVToListModalProps {
  listId: string;
  listName: string;
  companyId: string;
  onClose: (shouldRefresh: boolean) => void;
}

export default function ImportCSVToListModal({
  listId,
  listName,
  companyId,
  onClose,
}: ImportCSVToListModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
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

    // Auto-parse the CSV
    await parseCSV(selectedFile);
  };

  const parseCSV = async (csvFile: File) => {
    try {
      setParsing(true);
      setError(null);

      // Use FormData to avoid JSON escaping issues with large CSVs
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('companyId', companyId);
      formData.append('skipDatabaseDuplicateCheck', 'true'); // Check duplicates against list later

      // Call parse API
      const response = await fetch('/api/leads/bulk/parse', {
        method: 'POST',
        body: formData,
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

  const handleImport = async () => {
    if (!parsedData || !parsedData.leads || parsedData.leads.length === 0) {
      setError('No valid contacts to import');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      // Import contacts to the list
      const response = await fetch(`/api/contact-lists/${listId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: parsedData.leads, // Send the parsed lead data
        }),
      });

      const result = await response.json();

      if (result.success) {
        onClose(true);
      } else {
        throw new Error(result.error || 'Failed to import contacts');
      }
    } catch (err: any) {
      console.error('Error importing contacts:', err);
      setError(err.message || 'Failed to import contacts. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => onClose(false)}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Import CSV to {listName}</h2>
            <p className={styles.subtitle}>
              Upload a CSV file to add contacts to this list
            </p>
          </div>
          <button className={styles.closeButton} onClick={() => onClose(false)}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* File Upload Section */}
          <div
            className={`${styles.dropZone} ${dragActive ? styles.active : ''} ${parsedData ? styles.hasFile : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
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
              <h4>Import Summary</h4>
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

              {/* Invalid Rows Details */}
              {parsedData.invalidContacts && parsedData.invalidContacts.length > 0 && (
                <div className={styles.detailsSection}>
                  <button className={styles.detailsToggle}>
                    Invalid Rows ({parsedData.invalidContacts.length})
                  </button>
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
            onClick={handleImport}
            disabled={importing || !parsedData || parsedData.validRows === 0}
            className={styles.importButton}
          >
            {importing
              ? 'Importing...'
              : `Import ${parsedData?.validRows || 0} Contact${parsedData?.validRows !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
