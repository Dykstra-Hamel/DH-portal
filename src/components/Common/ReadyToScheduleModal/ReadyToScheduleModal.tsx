'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { ChevronDown, Users, CircleCheck } from 'lucide-react';
import styles from './ReadyToScheduleModal.module.scss';

interface ReadyToScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    option: 'now' | 'later' | 'someone_else',
    assignedTo?: string
  ) => void;
  companyId: string;
}

// Default avatar component
const DefaultAvatar = ({ name }: { name: string }) => (
  <div className={styles.defaultAvatar}>{name.charAt(0).toUpperCase()}</div>
);

// Team avatar component
const TeamAvatar = () => (
  <div className={styles.teamAvatar}>
    <Users size={16} color="white" />
  </div>
);

export function ReadyToScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  companyId,
}: ReadyToScheduleModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    'now' | 'later' | 'someone_else'
  >('now');
  const [assignedTo, setAssignedTo] = useState<string>('scheduling_team');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { users: assignableUsers } = useAssignableUsers({
    companyId,
    departmentType: 'all', // We'll filter for scheduling in the component
    enabled: isOpen,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedOption('now');
      setAssignedTo('scheduling_team');
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter for scheduling team members
  const schedulingUsers = assignableUsers.filter(
    u =>
      u.departments?.includes('scheduling') ||
      u.roles?.includes('admin') ||
      u.roles?.includes('manager')
  );

  const currentUser = user
    ? {
        id: user.id,
        name:
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
          user.email?.split('@')[0] ||
          'Unknown',
        avatar: user.user_metadata?.avatar_url,
      }
    : null;

  const getSchedulingTeamCount = () => {
    return schedulingUsers.length;
  };

  const getSelectedAssigneeDisplay = () => {
    if (assignedTo === 'scheduling_team') {
      return {
        name: 'Scheduling Team',
        subtitle: `${getSchedulingTeamCount()} members`,
        avatar: null,
        isTeam: true,
      };
    }

    if (assignedTo === user?.id) {
      return {
        name: currentUser?.name || 'Unknown',
        subtitle: 'Myself',
        avatar: currentUser?.avatar,
        isTeam: false,
      };
    }

    const assignee = schedulingUsers.find(u => u.id === assignedTo);
    if (assignee) {
      return {
        name: assignee.display_name,
        subtitle: assignee.email,
        avatar: assignee.avatar_url,
        isTeam: false,
      };
    }

    return {
      name: 'Select a user',
      subtitle: '',
      avatar: null,
      isTeam: false,
    };
  };

  const selectedDisplay = getSelectedAssigneeDisplay();

  const handleSubmit = () => {
    if (selectedOption === 'someone_else' && !assignedTo) {
      return; // Don't submit if someone else is selected but no user is chosen
    }
    onSubmit(selectedOption, assignedTo || undefined);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getButtonText = () => {
    switch (selectedOption) {
      case 'now':
        return 'Proceed to Scheduling';
      case 'later':
        return 'Ready to Schedule';
      default:
        return 'Ready to Schedule';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Choose scheduling option</h2>

        <div className={styles.optionsContainer}>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="scheduleOption"
              value="now"
              checked={selectedOption === 'now'}
              onChange={() => setSelectedOption('now')}
              className={styles.radioInput}
            />
            <span className={styles.radioCustom}></span>
            <div className={styles.radioContent}>
              <span className={styles.radioLabel}>I want to schedule now</span>
              <span className={styles.radioDescription}>
                Complete stage and go to Scheduling.
              </span>
            </div>
          </label>

          <label className={styles.radioOption}>
            <input
              type="radio"
              name="scheduleOption"
              value="someone_else"
              checked={selectedOption === 'someone_else'}
              onChange={() => setSelectedOption('someone_else')}
              className={styles.radioInput}
            />
            <span className={styles.radioCustom}></span>
            <div className={styles.radioContent}>
              <span className={styles.radioLabel}>
                I want someone else to schedule this.
              </span>
              <span className={styles.radioDescription}>
                Complete stage and assign this lead for scheduling.
              </span>
            </div>
          </label>
        </div>

        {selectedOption === 'someone_else' && (
          <div className={styles.assignSection}>
            <label className={styles.assignLabel}>Assign to:</label>
            <div className={styles.dropdownContainer} ref={dropdownRef}>
              <button
                type="button"
                className={styles.assignmentButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className={styles.assignmentDisplay}>
                  {selectedDisplay.isTeam ? (
                    <TeamAvatar />
                  ) : selectedDisplay.avatar ? (
                    <Image
                      src={selectedDisplay.avatar}
                      alt={selectedDisplay.name}
                      width={32}
                      height={32}
                      className={styles.avatar}
                    />
                  ) : (
                    <DefaultAvatar name={selectedDisplay.name} />
                  )}
                  <div className={styles.assignmentInfo}>
                    <div className={styles.assignmentName}>
                      {selectedDisplay.name}
                    </div>
                    {selectedDisplay.subtitle && (
                      <div className={styles.assignmentSubtitle}>
                        {selectedDisplay.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`${styles.chevronIcon} ${isDropdownOpen ? styles.rotated : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {/* Current user option */}
                  {currentUser && (
                    <button
                      type="button"
                      className={`${styles.dropdownOption} ${assignedTo === user?.id ? styles.selected : ''}`}
                      onClick={() => {
                        setAssignedTo(user?.id || '');
                        setIsDropdownOpen(false);
                      }}
                    >
                      {currentUser.avatar ? (
                        <Image
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          width={32}
                          height={32}
                          className={styles.avatar}
                        />
                      ) : (
                        <DefaultAvatar name={currentUser.name} />
                      )}
                      <div className={styles.assignmentInfo}>
                        <div className={styles.assignmentName}>
                          {currentUser.name}
                        </div>
                        <div className={styles.assignmentSubtitle}>Myself</div>
                      </div>
                    </button>
                  )}

                  {/* Scheduling Team option */}
                  <button
                    type="button"
                    className={`${styles.dropdownOption} ${assignedTo === 'scheduling_team' ? styles.selected : ''}`}
                    onClick={() => {
                      setAssignedTo('scheduling_team');
                      setIsDropdownOpen(false);
                    }}
                  >
                    <TeamAvatar />
                    <div className={styles.assignmentInfo}>
                      <div className={styles.assignmentName}>
                        Scheduling Team
                      </div>
                      <div className={styles.assignmentSubtitle}>
                        {getSchedulingTeamCount()} members
                      </div>
                    </div>
                  </button>

                  {/* Individual scheduling users */}
                  {schedulingUsers
                    .filter(u => u.id !== user?.id)
                    .map(schedulingUser => (
                      <button
                        key={schedulingUser.id}
                        type="button"
                        className={`${styles.dropdownOption} ${assignedTo === schedulingUser.id ? styles.selected : ''}`}
                        onClick={() => {
                          setAssignedTo(schedulingUser.id);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {schedulingUser.avatar_url ? (
                          <Image
                            src={schedulingUser.avatar_url}
                            alt={schedulingUser.display_name}
                            width={32}
                            height={32}
                            className={styles.avatar}
                          />
                        ) : (
                          <DefaultAvatar name={schedulingUser.display_name} />
                        )}
                        <div className={styles.assignmentInfo}>
                          <div className={styles.assignmentName}>
                            {schedulingUser.display_name}
                          </div>
                          <div className={styles.assignmentSubtitle}>
                            {schedulingUser.email}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={selectedOption === 'someone_else' && !assignedTo}
          >
            <CircleCheck size={18} />
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
