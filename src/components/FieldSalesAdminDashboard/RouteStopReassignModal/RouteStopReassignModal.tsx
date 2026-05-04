'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, X } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api-client';
import type { RouteStop } from '@/components/FieldMap/RouteStopCard/RouteStopCard';
import type { TeamMemberLite } from '../TeamMemberRouteModal/TeamMemberRouteModal';
import styles from './RouteStopReassignModal.module.scss';

const FIELD_DEPTS = ['technician', 'inspector'] as const;

interface RouteStopReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop: RouteStop;
  sourceUser: { userId: string; fullName: string; departments: string[] };
  peers: TeamMemberLite[];
  date: string;
  onAssigned: () => void;
}

const DefaultAvatar = ({ name }: { name: string }) => (
  <div className={styles.defaultAvatar}>{name.charAt(0).toUpperCase() || '?'}</div>
);

function fieldDeptOverlap(a: string[], b: string[]): boolean {
  const aSet = new Set(a.map(d => d.toLowerCase()));
  const bSet = new Set(b.map(d => d.toLowerCase()));
  return FIELD_DEPTS.some(d => aSet.has(d) && bSet.has(d));
}

function sourceFieldDept(departments: string[]): string {
  const set = new Set(departments.map(d => d.toLowerCase()));
  if (set.has('inspector')) return 'inspector';
  if (set.has('technician')) return 'technician';
  return '';
}

export function RouteStopReassignModal({
  isOpen,
  onClose,
  stop,
  sourceUser,
  peers,
  date,
  onAssigned,
}: RouteStopReassignModalProps) {
  const [selectedPeerId, setSelectedPeerId] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligiblePeers = useMemo(() => {
    return peers.filter(
      p =>
        p.userId !== sourceUser.userId &&
        fieldDeptOverlap(p.departments, sourceUser.departments)
    );
  }, [peers, sourceUser]);

  const sourceDeptLabel = sourceFieldDept(sourceUser.departments);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPeerId('');
      setDropdownOpen(false);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedPeer = eligiblePeers.find(p => p.userId === selectedPeerId);

  const handleAssign = async () => {
    if (!selectedPeerId || !stop.routeStopId) return;
    setSubmitting(true);
    setError(null);
    try {
      await authenticatedFetch(
        `/api/routing/route-stops/${stop.routeStopId}/reassign`,
        {
          method: 'PATCH',
          body: JSON.stringify({ targetUserId: selectedPeerId, date }),
        }
      );
      onAssigned();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reassign stop');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-label="Reassign route stop"
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Reassign Route Stop</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.customerInfo}>
            <h3 className={styles.sectionTitle}>Stop</h3>
            <div className={styles.customerDetails}>
              <div className={styles.customerName}>
                {stop.clientName || 'Unknown Client'}
              </div>
              {stop.address && (
                <div className={styles.customerContact}>{stop.address}</div>
              )}
              <div className={styles.customerContact}>
                Currently assigned to {sourceUser.fullName}
              </div>
            </div>
          </div>

          <div className={styles.assignSection}>
            <div className={styles.sectionLabel}>
              Reassign to{' '}
              {sourceDeptLabel ? `another ${sourceDeptLabel}` : 'a peer'}:
            </div>

            {eligiblePeers.length === 0 ? (
              <div className={styles.emptyPeers}>
                No other{' '}
                {sourceDeptLabel
                  ? `${sourceDeptLabel}s`
                  : 'peers in the same department'}{' '}
                available on your team.
              </div>
            ) : (
              <div className={styles.dropdown}>
                <button
                  type="button"
                  className={styles.dropdownButton}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className={styles.dropdownContent}>
                    <div className={styles.avatarContainer}>
                      {selectedPeer ? (
                        selectedPeer.avatarUrl ||
                        selectedPeer.uploadedAvatarUrl ? (
                          <Image
                            src={
                              selectedPeer.uploadedAvatarUrl ||
                              selectedPeer.avatarUrl ||
                              ''
                            }
                            alt={selectedPeer.fullName}
                            width={32}
                            height={32}
                            className={styles.avatar}
                          />
                        ) : (
                          <DefaultAvatar name={selectedPeer.fullName} />
                        )
                      ) : (
                        <DefaultAvatar name="?" />
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.optionName}>
                        {selectedPeer ? selectedPeer.fullName : 'Select a peer'}
                      </div>
                      <div className={styles.optionMeta}>
                        {selectedPeer
                          ? selectedPeer.email ?? ''
                          : `${eligiblePeers.length} eligible`}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`${styles.chevronIcon} ${
                      dropdownOpen ? styles.rotated : ''
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {eligiblePeers.map(peer => (
                      <button
                        type="button"
                        key={peer.userId}
                        className={`${styles.dropdownOption} ${
                          selectedPeerId === peer.userId ? styles.selected : ''
                        }`}
                        onClick={() => {
                          setSelectedPeerId(peer.userId);
                          setDropdownOpen(false);
                        }}
                      >
                        <div className={styles.avatarContainer}>
                          {peer.avatarUrl || peer.uploadedAvatarUrl ? (
                            <Image
                              src={
                                peer.uploadedAvatarUrl || peer.avatarUrl || ''
                              }
                              alt={peer.fullName}
                              width={32}
                              height={32}
                              className={styles.avatar}
                            />
                          ) : (
                            <DefaultAvatar name={peer.fullName} />
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <div className={styles.optionName}>
                            {peer.fullName}
                          </div>
                          <div className={styles.optionMeta}>
                            {peer.email ?? ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.assignButton}
            onClick={handleAssign}
            disabled={!selectedPeerId || submitting}
          >
            {submitting ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
