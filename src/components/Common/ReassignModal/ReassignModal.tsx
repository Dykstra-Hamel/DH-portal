import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { ChevronDown, X, Users } from 'lucide-react';
import styles from './ReassignModal.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

// Default avatar component - matching LeadStepContent exactly
const DefaultAvatar = ({ name }: { name: string }) => (
  <div className={styles.defaultAvatar}>{name.charAt(0).toUpperCase()}</div>
);

// Team avatar component - matching LeadStepContent exactly
const TeamAvatar = () => (
  <div className={styles.teamAvatar}>
    <Users size={16} color="white" />
  </div>
);

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assigneeId: string) => Promise<void>;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  companyId: string;
  currentAssigneeId?: string | null;
  type: 'lead' | 'support_case';
}

export function ReassignModal({
  isOpen,
  onClose,
  onAssign,
  customerName,
  customerEmail,
  customerPhone,
  companyId,
  currentAssigneeId,
  type
}: ReassignModalProps) {
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const { user } = useUser();
  const { users: assignableUsers } = useAssignableUsers({
    companyId,
    departmentType: type === 'support_case' ? 'support' : 'sales',
    enabled: true,
  });

  // Set current assignee or default to current user
  useEffect(() => {
    if (currentAssigneeId) {
      setSelectedAssignee(currentAssigneeId);
    } else {
      // If no specific assignee, default to team assignment
      // This matches the behavior when something is "unassigned" but available to the team
      const teamType = type === 'support_case' ? 'support_team' : 'sales_team';
      setSelectedAssignee(teamType);
    }
  }, [currentAssigneeId, type]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsAssignmentDropdownOpen(false);
      setIsAssigning(false);
    } else {
      // When modal opens, ensure proper initial state
      if (currentAssigneeId) {
        setSelectedAssignee(currentAssigneeId);
      } else {
        // If no specific assignee, default to team assignment
        const teamType = type === 'support_case' ? 'support_team' : 'sales_team';
        setSelectedAssignee(teamType);
      }
    }
  }, [isOpen, currentAssigneeId, type]);

  const handleAssigneeSelect = (assigneeId: string) => {
    setSelectedAssignee(assigneeId);
    setIsAssignmentDropdownOpen(false);
  };

  const handleAssign = async () => {
    if (!selectedAssignee) return;

    setIsAssigning(true);
    try {
      await onAssign(selectedAssignee);
      onClose();
    } catch (error) {
      console.error('Error reassigning:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Find current user - matching LeadStepContent exactly
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

  const getTeamCount = () => {
    const department = type === 'support_case' ? 'support' : 'sales';
    return assignableUsers.filter(companyUser => companyUser.departments.includes(department)).length;
  };

  const getSelectedAssigneeDisplay = () => {
    const teamType = type === 'support_case' ? 'support_team' : 'sales_team';

    if (selectedAssignee === teamType) {
      return {
        name: type === 'support_case' ? 'Support Team' : 'Sales Team',
        subtitle: `${getTeamCount()} members`,
        avatar: null,
        isTeam: true,
      };
    }

    if (selectedAssignee === user?.id) {
      return {
        name: currentUser?.name || 'Unknown',
        subtitle: 'Myself',
        avatar: currentUser?.avatar,
        isTeam: false,
      };
    }

    const assignee = assignableUsers.find(u => u.id === selectedAssignee);
    if (assignee) {
      return {
        name: assignee.display_name,
        subtitle: assignee.email,
        avatar: assignee.avatar_url,
        isTeam: false,
      };
    }

    return {
      name: 'Select assignee',
      subtitle: '',
      avatar: null,
      isTeam: false,
    };
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Reassign {type === 'support_case' ? 'Support Case' : 'Lead'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Customer Information */}
          <div className={styles.customerInfo}>
            <h3 className={styles.sectionTitle}>Customer Information</h3>
            <div className={styles.customerDetails}>
              <div className={styles.customerName}>{customerName}</div>
              {customerEmail && (
                <div className={styles.customerContact}>{customerEmail}</div>
              )}
              {customerPhone && (
                <div className={styles.customerContact}>{customerPhone}</div>
              )}
            </div>
          </div>

          {/* Assignment Section */}
          <div className={styles.assignSection}>
            <div className={styles.sectionLabel}>
              Assign to:
            </div>
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownButton}
                onClick={() => setIsAssignmentDropdownOpen(!isAssignmentDropdownOpen)}
              >
                <div className={styles.dropdownContent}>
                  <div className={styles.avatarContainer}>
                    {(() => {
                      const display = getSelectedAssigneeDisplay();
                      if (display.isTeam) {
                        return <TeamAvatar />;
                      }
                      if (display.avatar) {
                        return (
                          <Image
                            src={display.avatar}
                            alt={display.name}
                            width={32}
                            height={32}
                            className={styles.avatar}
                          />
                        );
                      }
                      return <DefaultAvatar name={display.name} />;
                    })()}
                  </div>
                  <div className={styles.userInfo}>
                    <div
                      className={cardStyles.defaultText}
                      style={{ color: 'var(--action-500)' }}
                    >
                      {getSelectedAssigneeDisplay().name}
                    </div>
                    <div className={cardStyles.lightText}>
                      {getSelectedAssigneeDisplay().subtitle}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={24}
                  className={`${styles.chevronIcon} ${isAssignmentDropdownOpen ? styles.rotated : ''}`}
                />
              </button>

              {isAssignmentDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {/* Current user first */}
                  {currentUser && (
                    <button
                      className={`${styles.dropdownOption} ${selectedAssignee === user?.id ? styles.selected : ''}`}
                      onClick={() => handleAssigneeSelect(user?.id || '')}
                    >
                      <div className={styles.avatarContainer}>
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
                      </div>
                      <div className={styles.userInfo}>
                        <div className={cardStyles.defaultText}>
                          {currentUser.name}
                        </div>
                        <div className={cardStyles.lightText}>Myself</div>
                      </div>
                    </button>
                  )}

                  {/* Team option - matching LeadStepContent exactly */}
                  {type === 'lead' && (
                    <button
                      className={`${styles.dropdownOption} ${selectedAssignee === 'sales_team' ? styles.selected : ''}`}
                      onClick={() => handleAssigneeSelect('sales_team')}
                    >
                      <div className={styles.avatarContainer}>
                        <TeamAvatar />
                      </div>
                      <div className={styles.userInfo}>
                        <div className={cardStyles.defaultText}>
                          Sales Team
                        </div>
                        <div className={cardStyles.lightText}>
                          {getTeamCount()} members
                        </div>
                      </div>
                    </button>
                  )}
                  {type === 'support_case' && (
                    <button
                      className={`${styles.dropdownOption} ${selectedAssignee === 'support_team' ? styles.selected : ''}`}
                      onClick={() => handleAssigneeSelect('support_team')}
                    >
                      <div className={styles.avatarContainer}>
                        <TeamAvatar />
                      </div>
                      <div className={styles.userInfo}>
                        <div className={cardStyles.defaultText}>
                          Support Team
                        </div>
                        <div className={cardStyles.lightText}>
                          {getTeamCount()} members
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Team members - filtered by department matching LeadStepContent exactly */}
                  {(type === 'lead' || type === 'support_case') &&
                    assignableUsers
                      .filter(companyUser => companyUser.id !== user?.id)
                      .map(companyUser => (
                        <button
                          key={companyUser.id}
                          className={`${styles.dropdownOption} ${selectedAssignee === companyUser.id ? styles.selected : ''}`}
                          onClick={() => handleAssigneeSelect(companyUser.id)}
                        >
                          <div className={styles.avatarContainer}>
                            {companyUser.avatar_url ? (
                              <Image
                                src={companyUser.avatar_url}
                                alt={companyUser.display_name}
                                width={32}
                                height={32}
                                className={styles.avatar}
                              />
                            ) : (
                              <DefaultAvatar
                                name={companyUser.display_name}
                              />
                            )}
                          </div>
                          <div className={styles.userInfo}>
                            <div className={cardStyles.defaultText}>
                              {companyUser.display_name}
                            </div>
                            <div className={cardStyles.lightText}>
                              {companyUser.email}
                            </div>
                          </div>
                        </button>
                      ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isAssigning}
          >
            Cancel
          </button>
          <button
            className={styles.assignButton}
            onClick={handleAssign}
            disabled={!selectedAssignee || isAssigning}
          >
            {isAssigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}