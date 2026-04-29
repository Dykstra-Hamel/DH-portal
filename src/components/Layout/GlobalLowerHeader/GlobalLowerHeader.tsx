'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import styles from './GlobalLowerHeader.module.scss';

interface ActionButton {
  text: string;
  onClick: () => void;
}

interface AssignableUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name: string;
  avatar_url?: string | null;
  uploaded_avatar_url?: string | null;
  departments: string[];
}

interface AssignedUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  uploaded_avatar_url?: string | null;
}

interface BranchOption {
  id: string;
  name: string;
  is_primary: boolean;
}

interface LeadAssignmentControls {
  leadType: string;
  leadStatus: string;
  assignedTo?: string;
  assignedScheduler?: string;
  assignedUser?: AssignedUser | null;
  schedulerUser?: AssignedUser | null;
  assignableUsers: AssignableUser[];
  currentUser: { id: string; name: string; email: string; avatar?: string };
  onLeadTypeChange: (type: string) => void;
  onLeadTypeChangeWithModal?: (type: string) => void;
  onAssigneeChange: (id: string) => void;
  onSchedulerChange: (id: string) => void;
  onStatusChange: (status: string) => void;
  currentBranchId?: string | null;
  availableBranches?: BranchOption[];
  onBranchChange?: (branchId: string | null) => void;
}

interface SupportCaseAssignmentControls {
  caseStatus: string;
  assignedTo?: string;
  assignedUser?: AssignedUser | null;
  assignableUsers: AssignableUser[];
  currentUser: { id: string; name: string; email: string; avatar?: string };
  onAssigneeChange: (id: string) => void;
  onStatusChange: (status: string) => void;
  currentBranchId?: string | null;
  availableBranches?: BranchOption[];
  onBranchChange?: (branchId: string | null) => void;
}

interface GlobalLowerHeaderProps {
  title: ReactNode;
  description: ReactNode;
  titleLeading?: ReactNode;
  titleLogo?: ReactNode;
  showAddButton?: boolean;
  addButtonText?: string;
  onAddClick?: () => void;
  addButtonIcon?: ReactNode;
  actionButtons?: ActionButton[];
  leadAssignmentControls?: LeadAssignmentControls;
  supportCaseAssignmentControls?: SupportCaseAssignmentControls;
  customActions?: ReactNode;
}

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="19"
    viewBox="0 0 18 19"
    fill="none"
  >
    <path
      d="M8.14529 3.88458V15.516M13.961 9.70031H2.32956"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TeamAvatar = () => (
  <div className={styles.teamAvatar}>
    <Users size={20} color="var(--blue-600)" />
  </div>
);


export function GlobalLowerHeader({
  title,
  description,
  showAddButton = false,
  addButtonText = 'Add Lead',
  onAddClick,
  addButtonIcon,
  actionButtons,
  leadAssignmentControls,
  supportCaseAssignmentControls,
  customActions,
  titleLeading,
  titleLogo,
}: GlobalLowerHeaderProps) {
  const [isLeadTypeOpen, setIsLeadTypeOpen] = useState(false);
  const [isAssignedToOpen, setIsAssignedToOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [hasShadow, setHasShadow] = useState(false);

  const leadTypeRef = useRef<HTMLDivElement>(null);
  const assignedToRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const supportAssignedToRef = useRef<HTMLDivElement>(null);
  const supportStatusRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        leadTypeRef.current &&
        !leadTypeRef.current.contains(event.target as Node)
      ) {
        setIsLeadTypeOpen(false);
      }
      if (
        assignedToRef.current &&
        !assignedToRef.current.contains(event.target as Node)
      ) {
        setIsAssignedToOpen(false);
      }
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
      }
      if (
        supportAssignedToRef.current &&
        !supportAssignedToRef.current.contains(event.target as Node)
      ) {
        setIsAssignedToOpen(false);
      }
      if (
        supportStatusRef.current &&
        !supportStatusRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
      }
      if (
        branchRef.current &&
        !branchRef.current.contains(event.target as Node)
      ) {
        setIsBranchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const mainContent =
      document.querySelector<HTMLElement>('[data-scroll-container="main"]') ||
      document.querySelector<HTMLElement>('main');
    const docScrollElement = document.scrollingElement as HTMLElement | null;

    const getScrollTop = () => {
      const mainScrollTop = mainContent?.scrollTop ?? 0;
      const windowScrollTop =
        window.scrollY || docScrollElement?.scrollTop || 0;
      return Math.max(mainScrollTop, windowScrollTop);
    };

    const handleScroll = () => {
      const nextHasShadow = getScrollTop() > 50;
      setHasShadow(prev => (prev === nextHasShadow ? prev : nextHasShadow));
    };

    handleScroll();
    const targets = new Set<HTMLElement | Window>([window]);
    if (mainContent) {
      targets.add(mainContent);
    }
    targets.forEach(target =>
      target.addEventListener('scroll', handleScroll, { passive: true })
    );
    return () => {
      targets.forEach(target =>
        target.removeEventListener('scroll', handleScroll)
      );
    };
  }, []);

  const getLeadTypeDisplay = () => {
    if (!leadAssignmentControls) return '';
    const { leadType } = leadAssignmentControls;
    if (leadType === 'sales') return 'Sales Lead';
    if (leadType === 'support') return 'Support Case';
    if (leadType === 'junk') return 'Junk';
    return 'Sales Lead';
  };

  const getStatusDisplay = () => {
    if (!leadAssignmentControls) return '';
    const { leadStatus } = leadAssignmentControls;
    const statusMap: Record<string, string> = {
      new: 'New',
      in_process: 'In Process',
      quoted: 'Quoted',
      scheduling: 'Ready to Schedule',
      won: 'Won',
      lost: 'Lost',
    };
    return statusMap[leadStatus] || 'New';
  };

  const getAssignedToDisplay = () => {
    if (!leadAssignmentControls)
      return { name: 'Select', subtitle: '', avatar: null };

    const {
      leadStatus,
      assignedTo,
      assignedScheduler,
      assignedUser,
      schedulerUser,
      leadType,
    } = leadAssignmentControls;

    // Show scheduler for scheduling status and later
    if (leadStatus === 'scheduling' || leadStatus === 'won') {
      if (schedulerUser) {
        return {
          name:
            `${schedulerUser.first_name || ''} ${schedulerUser.last_name || ''}`.trim() ||
            'Unknown',
          subtitle: schedulerUser.email || '',
          avatar: schedulerUser.avatar_url || null,
          userId: schedulerUser.id,
          email: schedulerUser.email || '',
          firstName: schedulerUser.first_name,
          lastName: schedulerUser.last_name,
        };
      }
      return { name: 'Select Scheduler', subtitle: '', avatar: null, userId: undefined, email: '', firstName: undefined, lastName: undefined };
    }

    // Show salesperson for earlier statuses
    if (assignedTo === 'sales_team') {
      return { name: 'Sales Team', subtitle: '', avatar: 'team', userId: undefined, email: '', firstName: undefined, lastName: undefined };
    }
    if (assignedTo === 'support_team') {
      return { name: 'Support Team', subtitle: '', avatar: 'team', userId: undefined, email: '', firstName: undefined, lastName: undefined };
    }
    if (assignedUser) {
      return {
        name:
          `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() ||
          'Unknown',
        subtitle: assignedUser.email || '',
        avatar: assignedUser.uploaded_avatar_url || assignedUser.avatar_url || null,
        userId: assignedUser.id,
        email: assignedUser.email || '',
        firstName: assignedUser.first_name,
        lastName: assignedUser.last_name,
      };
    }
    return { name: 'Select', subtitle: '', avatar: null, userId: undefined, email: '', firstName: undefined, lastName: undefined };
  };

  const isSchedulingStatus = () => {
    if (!leadAssignmentControls) return false;
    const { leadStatus } = leadAssignmentControls;
    return leadStatus === 'scheduling' || leadStatus === 'won';
  };

  const isLeadUnassigned = () => {
    if (!leadAssignmentControls) return true;
    if (isSchedulingStatus()) {
      return (
        !leadAssignmentControls.schedulerUser &&
        !leadAssignmentControls.assignedScheduler
      );
    }
    const { assignedTo, assignedUser } = leadAssignmentControls;
    if (assignedTo === 'sales_team' || assignedTo === 'support_team') {
      return false;
    }
    return !assignedUser && !assignedTo;
  };

  const getTeamCount = () => {
    if (!leadAssignmentControls) return 0;
    const { assignableUsers, leadType } = leadAssignmentControls;
    return assignableUsers.filter(u =>
      leadType === 'sales'
        ? u.departments.includes('sales')
        : u.departments.includes('support')
    ).length;
  };

  // Support Case helper functions
  const getSupportCaseStatusDisplay = () => {
    if (!supportCaseAssignmentControls) return '';
    const { caseStatus } = supportCaseAssignmentControls;
    const statusMap: Record<string, string> = {
      unassigned: 'Unassigned',
      in_progress: 'In Progress',
      awaiting_response: 'Awaiting Response',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return statusMap[caseStatus] || 'Unassigned';
  };

  const getSupportCaseAssignedToDisplay = () => {
    if (!supportCaseAssignmentControls)
      return { name: 'Select', subtitle: '', avatar: null };

    const { assignedTo, assignedUser } = supportCaseAssignmentControls;

    if (assignedTo === 'support_team') {
      return { name: 'Support Team', subtitle: '', avatar: 'team', userId: undefined, email: '', firstName: undefined, lastName: undefined };
    }
    if (assignedUser) {
      return {
        name:
          `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() ||
          'Unknown',
        subtitle: assignedUser.email || '',
        avatar: assignedUser.uploaded_avatar_url || assignedUser.avatar_url || null,
        userId: assignedUser.id,
        email: assignedUser.email || '',
        firstName: assignedUser.first_name,
        lastName: assignedUser.last_name,
      };
    }
    return { name: 'Select', subtitle: '', avatar: null, userId: undefined, email: '', firstName: undefined, lastName: undefined };
  };

  const getSupportTeamCount = () => {
    if (!supportCaseAssignmentControls) return 0;
    const { assignableUsers } = supportCaseAssignmentControls;
    return assignableUsers.filter(u => u.departments.includes('support'))
      .length;
  };

  return (
    <div
      className={`${styles.globalLowerHeader} ${hasShadow ? styles.globalLowerHeaderScrolled : ''}`}
    >
      <div className={styles.headerContent}>
        <div
          className={`${styles.leftSection} ${titleLeading ? styles.leftSectionWithLeading : ''}`}
        >
          {titleLeading && (
            <div className={styles.titleLeading}>{titleLeading}</div>
          )}
          {titleLogo ? (
            <div className={styles.titleWithLogoWrapper}>
              <div className={styles.titleLogoCol}>{titleLogo}</div>
              <div className={styles.titleStack}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.description}>{description}</p>
              </div>
            </div>
          ) : (
            <div className={styles.titleStack}>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </div>
          )}
        </div>

        {leadAssignmentControls && (
          <div className={styles.controlsSection}>
            {/* Assigned To / Scheduler Dropdown */}
            <div className={styles.controlGroup} ref={assignedToRef}>
              {isLeadUnassigned() ? (
                <>
                  <span className={styles.currentlyAssignedLabel}>
                    Currently Assigned To:
                  </span>
                  <span className={styles.unassignedText}>Unassigned</span>
                  <button
                    type="button"
                    className={styles.assignButton}
                    onClick={() => setIsAssignedToOpen(!isAssignedToOpen)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M9.66536 13V11.6667C9.66536 10.9594 9.38441 10.2811 8.88432 9.78105C8.38422 9.28095 7.70594 9 6.9987 9H2.9987C2.29145 9 1.61318 9.28095 1.11308 9.78105C0.612983 10.2811 0.332031 10.9594 0.332031 11.6667V13"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.9987 6.33333C6.47146 6.33333 7.66536 5.13943 7.66536 3.66667C7.66536 2.19391 6.47146 1 4.9987 1C3.52594 1 2.33203 2.19391 2.33203 3.66667C2.33203 5.13943 3.52594 6.33333 4.9987 6.33333Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M11.668 4.3335V8.3335"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.668 6.3335H9.66797"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Assign
                  </button>
                </>
              ) : (
                <>
                  <span className={styles.currentlyAssignedLabel}>
                    Currently Assigned To:
                  </span>
                  <button
                    className={styles.controlDropdown}
                    onClick={() => setIsAssignedToOpen(!isAssignedToOpen)}
                  >
                    <div className={styles.assignedToContent}>
                      {(() => {
                        const display = getAssignedToDisplay();
                        if (display.avatar === 'team') {
                          return <TeamAvatar />;
                        }
                        return (
                          <MiniAvatar
                            firstName={display.firstName}
                            lastName={display.lastName}
                            email={display.email || ''}
                            userId={display.userId}
                            avatarUrl={display.avatar as string | null}
                            size="small"
                            className={styles.assignedAvatar}
                            showTooltip={false}
                          />
                        );
                      })()}
                      <span className={styles.controlValue}>
                        {getAssignedToDisplay().name}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`${styles.chevron} ${isAssignedToOpen ? styles.open : ''}`}
                    />
                  </button>
                </>
              )}
              {isAssignedToOpen && (
                <div className={styles.dropdownMenu}>
                  {isSchedulingStatus() ? (
                    // Scheduler options
                    <>
                      <button
                        className={`${styles.dropdownOption} ${leadAssignmentControls.assignedScheduler === leadAssignmentControls.currentUser.id ? styles.selected : ''}`}
                        onClick={() => {
                          leadAssignmentControls.onSchedulerChange(
                            leadAssignmentControls.currentUser.id
                          );
                          setIsAssignedToOpen(false);
                        }}
                      >
                        <div className={styles.optionContent}>
                          <MiniAvatar
                            firstName={leadAssignmentControls.currentUser.name.split(' ')[0]}
                            lastName={leadAssignmentControls.currentUser.name.split(' ').slice(1).join(' ')}
                            email={leadAssignmentControls.currentUser.email}
                            userId={leadAssignmentControls.currentUser.id}
                            avatarUrl={leadAssignmentControls.currentUser.avatar}
                            size="small"
                            showTooltip={false}
                          />
                          <div className={styles.optionInfo}>
                            <div className={styles.optionName}>
                              {leadAssignmentControls.currentUser.name}
                            </div>
                            <div className={styles.optionSubtitle}>Myself</div>
                          </div>
                        </div>
                      </button>
                      {leadAssignmentControls.assignableUsers
                        .filter(
                          u => u.id !== leadAssignmentControls.currentUser.id
                        )
                        .map(user => (
                          <button
                            key={user.id}
                            className={`${styles.dropdownOption} ${leadAssignmentControls.assignedScheduler === user.id ? styles.selected : ''}`}
                            onClick={() => {
                              leadAssignmentControls.onSchedulerChange(user.id);
                              setIsAssignedToOpen(false);
                            }}
                          >
                            <div className={styles.optionContent}>
                              <MiniAvatar
                                firstName={user.first_name || user.display_name}
                                lastName={user.last_name}
                                email={user.email}
                                userId={user.id}
                                avatarUrl={user.avatar_url}
                                uploadedAvatarUrl={user.uploaded_avatar_url}
                                size="small"
                                showTooltip={false}
                              />
                              <div className={styles.optionInfo}>
                                <div className={styles.optionName}>
                                  {user.display_name}
                                </div>
                                <div className={styles.optionSubtitle}>
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                    </>
                  ) : (
                    // Salesperson options
                    <>
                      <button
                        className={`${styles.dropdownOption} ${leadAssignmentControls.assignedTo === leadAssignmentControls.currentUser.id ? styles.selected : ''}`}
                        onClick={() => {
                          leadAssignmentControls.onAssigneeChange(
                            leadAssignmentControls.currentUser.id
                          );
                          setIsAssignedToOpen(false);
                        }}
                      >
                        <div className={styles.optionContent}>
                          <MiniAvatar
                            firstName={leadAssignmentControls.currentUser.name.split(' ')[0]}
                            lastName={leadAssignmentControls.currentUser.name.split(' ').slice(1).join(' ')}
                            email={leadAssignmentControls.currentUser.email}
                            userId={leadAssignmentControls.currentUser.id}
                            avatarUrl={leadAssignmentControls.currentUser.avatar}
                            size="small"
                            showTooltip={false}
                          />
                          <div className={styles.optionInfo}>
                            <div className={styles.optionName}>
                              {leadAssignmentControls.currentUser.name}
                            </div>
                            <div className={styles.optionSubtitle}>Myself</div>
                          </div>
                        </div>
                      </button>

                      {/* Team option */}
                      {leadAssignmentControls.leadType === 'sales' && (
                        <button
                          className={`${styles.dropdownOption} ${leadAssignmentControls.assignedTo === 'sales_team' ? styles.selected : ''}`}
                          onClick={() => {
                            leadAssignmentControls.onAssigneeChange(
                              'sales_team'
                            );
                            setIsAssignedToOpen(false);
                          }}
                        >
                          <div className={styles.optionContent}>
                            <TeamAvatar />
                            <div className={styles.optionInfo}>
                              <div className={styles.optionName}>
                                Sales Team
                              </div>
                              <div className={styles.optionSubtitle}>
                                {getTeamCount()} members
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {leadAssignmentControls.leadType === 'support' && (
                        <button
                          className={`${styles.dropdownOption} ${leadAssignmentControls.assignedTo === 'support_team' ? styles.selected : ''}`}
                          onClick={() => {
                            leadAssignmentControls.onAssigneeChange(
                              'support_team'
                            );
                            setIsAssignedToOpen(false);
                          }}
                        >
                          <div className={styles.optionContent}>
                            <TeamAvatar />
                            <div className={styles.optionInfo}>
                              <div className={styles.optionName}>
                                Support Team
                              </div>
                              <div className={styles.optionSubtitle}>
                                {getTeamCount()} members
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Team members */}
                      {(leadAssignmentControls.leadType === 'sales' ||
                        leadAssignmentControls.leadType === 'support') &&
                        leadAssignmentControls.assignableUsers
                          .filter(
                            u => u.id !== leadAssignmentControls.currentUser.id
                          )
                          .map(user => (
                            <button
                              key={user.id}
                              className={`${styles.dropdownOption} ${leadAssignmentControls.assignedTo === user.id ? styles.selected : ''}`}
                              onClick={() => {
                                leadAssignmentControls.onAssigneeChange(
                                  user.id
                                );
                                setIsAssignedToOpen(false);
                              }}
                            >
                              <div className={styles.optionContent}>
                                <MiniAvatar
                                  firstName={user.first_name || user.display_name}
                                  lastName={user.last_name}
                                  email={user.email}
                                  userId={user.id}
                                  avatarUrl={user.avatar_url}
                                uploadedAvatarUrl={user.uploaded_avatar_url}
                                  size="small"
                                  showTooltip={false}
                                />
                                <div className={styles.optionInfo}>
                                  <div className={styles.optionName}>
                                    {user.display_name}
                                  </div>
                                  <div className={styles.optionSubtitle}>
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Branch Dropdown (only rendered when company has branches) */}
            {leadAssignmentControls.availableBranches && leadAssignmentControls.availableBranches.length > 0 && (
              <div className={styles.controlGroup} ref={branchRef}>
                <label className={styles.controlLabel}>Branch:</label>
                <button
                  className={styles.controlDropdown}
                  onClick={() => setIsBranchOpen(!isBranchOpen)}
                >
                  <span className={styles.controlValue}>
                    {leadAssignmentControls.availableBranches.find(
                      b => b.id === leadAssignmentControls.currentBranchId
                    )?.name ?? 'No Branch'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`${styles.chevron} ${isBranchOpen ? styles.open : ''}`}
                  />
                </button>
                {isBranchOpen && (
                  <div className={styles.dropdownMenu}>
                    <button
                      className={`${styles.dropdownOption} ${!leadAssignmentControls.currentBranchId ? styles.selected : ''}`}
                      onClick={() => {
                        leadAssignmentControls.onBranchChange?.(null);
                        setIsBranchOpen(false);
                      }}
                    >
                      No Branch
                    </button>
                    {leadAssignmentControls.availableBranches.map(branch => (
                      <button
                        key={branch.id}
                        className={`${styles.dropdownOption} ${leadAssignmentControls.currentBranchId === branch.id ? styles.selected : ''}`}
                        onClick={() => {
                          leadAssignmentControls.onBranchChange?.(branch.id);
                          setIsBranchOpen(false);
                        }}
                      >
                        {branch.name}{branch.is_primary ? ' (Primary)' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lead Type Dropdown */}
            <div className={styles.controlGroup} ref={leadTypeRef}>
              <button
                className={styles.controlDropdown}
                onClick={() => setIsLeadTypeOpen(!isLeadTypeOpen)}
              >
                <span className={styles.controlValue}>
                  {getLeadTypeDisplay()}
                </span>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isLeadTypeOpen ? styles.open : ''}`}
                />
              </button>
              {isLeadTypeOpen && (
                <div className={styles.dropdownMenu}>
                  {[
                    { value: 'sales', label: 'Sales Lead' },
                    { value: 'support', label: 'Support Case' },
                    { value: 'junk', label: 'Junk' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      className={`${styles.dropdownOption} ${leadAssignmentControls.leadType === value ? styles.selected : ''}`}
                      onClick={() => {
                        if (
                          (value === 'junk' || value === 'support') &&
                          value !== leadAssignmentControls.leadType &&
                          leadAssignmentControls.onLeadTypeChangeWithModal
                        ) {
                          leadAssignmentControls.onLeadTypeChangeWithModal(value);
                        } else {
                          leadAssignmentControls.onLeadTypeChange(value);
                        }
                        setIsLeadTypeOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {supportCaseAssignmentControls && (
          <div className={styles.controlsSection}>
            {/* Assigned To Dropdown */}
            <div className={styles.controlGroup} ref={supportAssignedToRef}>
              <label className={styles.controlLabel}>Assigned To:</label>
              <button
                className={styles.controlDropdown}
                onClick={() => setIsAssignedToOpen(!isAssignedToOpen)}
              >
                <div className={styles.assignedToContent}>
                  {(() => {
                    const display = getSupportCaseAssignedToDisplay();
                    if (display.avatar === 'team') {
                      return <TeamAvatar />;
                    }
                    return (
                      <MiniAvatar
                        firstName={display.firstName}
                        lastName={display.lastName}
                        email={display.email || ''}
                        userId={display.userId}
                        avatarUrl={display.avatar as string | null}
                        size="small"
                        showTooltip={false}
                      />
                    );
                  })()}
                  <span className={styles.controlValue}>
                    {getSupportCaseAssignedToDisplay().name}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isAssignedToOpen ? styles.open : ''}`}
                />
              </button>
              {isAssignedToOpen && (
                <div className={styles.dropdownMenu}>
                  <button
                    className={`${styles.dropdownOption} ${supportCaseAssignmentControls.assignedTo === supportCaseAssignmentControls.currentUser.id ? styles.selected : ''}`}
                    onClick={() => {
                      supportCaseAssignmentControls.onAssigneeChange(
                        supportCaseAssignmentControls.currentUser.id
                      );
                      setIsAssignedToOpen(false);
                    }}
                  >
                    <div className={styles.optionContent}>
                      <MiniAvatar
                        firstName={supportCaseAssignmentControls.currentUser.name.split(' ')[0]}
                        lastName={supportCaseAssignmentControls.currentUser.name.split(' ').slice(1).join(' ')}
                        email={supportCaseAssignmentControls.currentUser.email}
                        userId={supportCaseAssignmentControls.currentUser.id}
                        avatarUrl={supportCaseAssignmentControls.currentUser.avatar}
                        size="small"
                        showTooltip={false}
                      />
                      <div className={styles.optionInfo}>
                        <div className={styles.optionName}>
                          {supportCaseAssignmentControls.currentUser.name}
                        </div>
                        <div className={styles.optionSubtitle}>Myself</div>
                      </div>
                    </div>
                  </button>

                  {/* Support Team option */}
                  <button
                    className={`${styles.dropdownOption} ${supportCaseAssignmentControls.assignedTo === 'support_team' ? styles.selected : ''}`}
                    onClick={() => {
                      supportCaseAssignmentControls.onAssigneeChange(
                        'support_team'
                      );
                      setIsAssignedToOpen(false);
                    }}
                  >
                    <div className={styles.optionContent}>
                      <TeamAvatar />
                      <div className={styles.optionInfo}>
                        <div className={styles.optionName}>Support Team</div>
                        <div className={styles.optionSubtitle}>
                          {getSupportTeamCount()} members
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Team members */}
                  {supportCaseAssignmentControls.assignableUsers
                    .filter(
                      u => u.id !== supportCaseAssignmentControls.currentUser.id
                    )
                    .map(user => (
                      <button
                        key={user.id}
                        className={`${styles.dropdownOption} ${supportCaseAssignmentControls.assignedTo === user.id ? styles.selected : ''}`}
                        onClick={() => {
                          supportCaseAssignmentControls.onAssigneeChange(
                            user.id
                          );
                          setIsAssignedToOpen(false);
                        }}
                      >
                        <div className={styles.optionContent}>
                          <MiniAvatar
                            firstName={user.first_name || user.display_name}
                            lastName={user.last_name}
                            email={user.email}
                            userId={user.id}
                            avatarUrl={user.avatar_url}
                                uploadedAvatarUrl={user.uploaded_avatar_url}
                            size="small"
                            showTooltip={false}
                          />
                          <div className={styles.optionInfo}>
                            <div className={styles.optionName}>
                              {user.display_name}
                            </div>
                            <div className={styles.optionSubtitle}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className={styles.controlGroup} ref={supportStatusRef}>
              <label className={styles.controlLabel}>Status:</label>
              <button
                className={styles.controlDropdown}
                onClick={() => setIsStatusOpen(!isStatusOpen)}
              >
                <span className={styles.controlValue}>
                  {getSupportCaseStatusDisplay()}
                </span>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isStatusOpen ? styles.open : ''}`}
                />
              </button>
              {isStatusOpen && (
                <div className={styles.dropdownMenu}>
                  {[
                    { value: 'unassigned', label: 'Unassigned' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'awaiting_response', label: 'Awaiting Response' },
                    { value: 'resolved', label: 'Resolved' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      className={`${styles.dropdownOption} ${supportCaseAssignmentControls.caseStatus === value ? styles.selected : ''}`}
                      onClick={() => {
                        supportCaseAssignmentControls.onStatusChange(value);
                        setIsStatusOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Branch Dropdown */}
            {supportCaseAssignmentControls.availableBranches && supportCaseAssignmentControls.availableBranches.length > 0 && (
              <div className={styles.controlGroup} ref={branchRef}>
                <label className={styles.controlLabel}>Branch:</label>
                <button
                  className={styles.controlDropdown}
                  onClick={() => setIsBranchOpen(!isBranchOpen)}
                >
                  <span className={styles.controlValue}>
                    {supportCaseAssignmentControls.availableBranches.find(
                      b => b.id === supportCaseAssignmentControls.currentBranchId
                    )?.name ?? 'No Branch'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`${styles.chevron} ${isBranchOpen ? styles.open : ''}`}
                  />
                </button>
                {isBranchOpen && (
                  <div className={styles.dropdownMenu}>
                    <button
                      className={`${styles.dropdownOption} ${!supportCaseAssignmentControls.currentBranchId ? styles.selected : ''}`}
                      onClick={() => {
                        supportCaseAssignmentControls.onBranchChange?.(null);
                        setIsBranchOpen(false);
                      }}
                    >
                      No Branch
                    </button>
                    {supportCaseAssignmentControls.availableBranches.map(branch => (
                      <button
                        key={branch.id}
                        className={`${styles.dropdownOption} ${supportCaseAssignmentControls.currentBranchId === branch.id ? styles.selected : ''}`}
                        onClick={() => {
                          supportCaseAssignmentControls.onBranchChange?.(branch.id);
                          setIsBranchOpen(false);
                        }}
                      >
                        {branch.name}{branch.is_primary ? ' (Primary)' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {((actionButtons && actionButtons?.length > 0) ||
          showAddButton ||
          customActions) && (
          <div className={styles.rightSection}>
            {customActions && customActions}
            {actionButtons &&
              actionButtons.length > 0 &&
              actionButtons.map((button, index) => (
                <button
                  key={index}
                  className={styles.addLeadButton}
                  onClick={button.onClick}
                  type="button"
                >
                  <PlusIcon />
                  <span>{button.text}</span>
                </button>
              ))}
            {showAddButton && (
              <button
                className={styles.addLeadButton}
                onClick={onAddClick}
                type="button"
              >
                {addButtonIcon || <PlusIcon />}
                <span>{addButtonText}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
