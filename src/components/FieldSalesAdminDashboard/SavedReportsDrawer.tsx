'use client';

import { useEffect, useState } from 'react';
import { X, Play, Trash2, Pencil, Check } from 'lucide-react';
import styles from './SavedReportsDrawer.module.scss';

export interface SavedReport {
  id: string;
  name: string;
  prompt: string;
  filters: Record<string, unknown>;
  lastResult: unknown;
  createdBy: string | null;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedReportsDrawerProps {
  open: boolean;
  onClose: () => void;
  reports: SavedReport[];
  loading: boolean;
  onLoad: (report: SavedReport) => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SavedReportsDrawer({
  open,
  onClose,
  reports,
  loading,
  onLoad,
  onRename,
  onDelete,
}: SavedReportsDrawerProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingRename, setSavingRename] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const startRename = (report: SavedReport) => {
    setRenamingId(report.id);
    setRenameValue(report.name);
  };

  const submitRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    setSavingRename(true);
    try {
      await onRename(id, trimmed);
      setRenamingId(null);
    } finally {
      setSavingRename(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Saved reports"
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Saved Reports</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close saved reports"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : reports.length === 0 ? (
            <div className={styles.empty}>
              No saved reports yet. Generate a report and save it to reuse later.
            </div>
          ) : (
            <ul className={styles.list}>
              {reports.map(report => {
                const isRenaming = renamingId === report.id;
                const isConfirming = confirmDeleteId === report.id;
                return (
                  <li key={report.id} className={styles.item}>
                    {isRenaming ? (
                      <div className={styles.renameRow}>
                        <input
                          type="text"
                          className={styles.renameInput}
                          value={renameValue}
                          autoFocus
                          disabled={savingRename}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') submitRename(report.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                        />
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => submitRename(report.id)}
                          disabled={savingRename}
                          aria-label="Save rename"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.itemHead}>
                        <button
                          type="button"
                          className={styles.itemTitle}
                          onClick={() => onLoad(report)}
                        >
                          {report.name}
                        </button>
                        <div className={styles.itemActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => onLoad(report)}
                            aria-label="Run report"
                            title="Run report"
                          >
                            <Play size={14} />
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => startRename(report)}
                            aria-label="Rename report"
                            title="Rename"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${isConfirming ? styles.iconBtnDanger : ''}`}
                            onClick={async () => {
                              if (isConfirming) {
                                await onDelete(report.id);
                                setConfirmDeleteId(null);
                              } else {
                                setConfirmDeleteId(report.id);
                                window.setTimeout(
                                  () => setConfirmDeleteId(null),
                                  4000
                                );
                              }
                            }}
                            aria-label={
                              isConfirming ? 'Confirm delete' : 'Delete report'
                            }
                            title={isConfirming ? 'Tap again to confirm' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    <p className={styles.itemPrompt}>{report.prompt}</p>
                    <div className={styles.itemMeta}>
                      <span>{report.createdByName}</span>
                      <span className={styles.metaDivider}>·</span>
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
