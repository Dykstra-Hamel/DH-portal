'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import Image from 'next/image';
import { ChevronDown, Users } from 'lucide-react';
import styles from './GlobalLowerHeader.module.scss';

interface ActionButton {
  text: string;
  onClick: () => void;
}

interface AssignableUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  departments: string[];
}

interface AssignedUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
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
}

interface SupportCaseAssignmentControls {
  caseStatus: string;
  assignedTo?: string;
  assignedUser?: AssignedUser | null;
  assignableUsers: AssignableUser[];
  currentUser: { id: string; name: string; email: string; avatar?: string };
  onAssigneeChange: (id: string) => void;
  onStatusChange: (status: string) => void;
}

interface GlobalLowerHeaderProps {
  title: string;
  description: string;
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
    <Users size={20} color="var(--action-600)" />
  </div>
);

const DefaultAvatar = ({ name }: { name: string }) => (
  <div className={styles.defaultAvatar}>{name.charAt(0).toUpperCase()}</div>
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
}: GlobalLowerHeaderProps) {
  const [isLeadTypeOpen, setIsLeadTypeOpen] = useState(false);
  const [isAssignedToOpen, setIsAssignedToOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const leadTypeRef = useRef<HTMLDivElement>(null);
  const assignedToRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const supportAssignedToRef = useRef<HTMLDivElement>(null);
  const supportStatusRef = useRef<HTMLDivElement>(null);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        };
      }
      return { name: 'Select Scheduler', subtitle: '', avatar: null };
    }

    // Show salesperson for earlier statuses
    if (assignedTo === 'sales_team') {
      return { name: 'Sales Team', subtitle: '', avatar: 'team' };
    }
    if (assignedTo === 'support_team') {
      return { name: 'Support Team', subtitle: '', avatar: 'team' };
    }
    if (assignedUser) {
      return {
        name:
          `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() ||
          'Unknown',
        subtitle: assignedUser.email || '',
        avatar: assignedUser.avatar_url || null,
      };
    }
    return { name: 'Select', subtitle: '', avatar: null };
  };

  const isSchedulingStatus = () => {
    if (!leadAssignmentControls) return false;
    const { leadStatus } = leadAssignmentControls;
    return leadStatus === 'scheduling' || leadStatus === 'won';
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
      return { name: 'Support Team', subtitle: '', avatar: 'team' };
    }
    if (assignedUser) {
      return {
        name:
          `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() ||
          'Unknown',
        subtitle: assignedUser.email || '',
        avatar: assignedUser.avatar_url || null,
      };
    }
    return { name: 'Select', subtitle: '', avatar: null };
  };

  const getSupportTeamCount = () => {
    if (!supportCaseAssignmentControls) return 0;
    const { assignableUsers } = supportCaseAssignmentControls;
    return assignableUsers.filter(u => u.departments.includes('support'))
      .length;
  };

  return (
    <div className={styles.globalLowerHeader}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <h1 className={styles.title}>{title}</h1>
          <p
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {leadAssignmentControls && (
          <div className={styles.controlsSection}>
            {/* Lead Type Dropdown */}
            <div className={styles.controlGroup} ref={leadTypeRef}>
              <label className={styles.controlLabel}>Lead Type:</label>
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
                  <button
                    className={`${styles.dropdownOption} ${leadAssignmentControls.leadType === 'sales' ? styles.selected : ''}`}
                    onClick={() => {
                      const handler =
                        leadAssignmentControls.onLeadTypeChangeWithModal ||
                        leadAssignmentControls.onLeadTypeChange;
                      handler('sales');
                      setIsLeadTypeOpen(false);
                    }}
                  >
                    Sales Lead
                  </button>
                  <button
                    className={`${styles.dropdownOption} ${leadAssignmentControls.leadType === 'support' ? styles.selected : ''}`}
                    onClick={() => {
                      const handler =
                        leadAssignmentControls.onLeadTypeChangeWithModal ||
                        leadAssignmentControls.onLeadTypeChange;
                      handler('support');
                      setIsLeadTypeOpen(false);
                    }}
                  >
                    Support Case
                  </button>
                  <button
                    className={`${styles.dropdownOption} ${leadAssignmentControls.leadType === 'junk' ? styles.selected : ''}`}
                    onClick={() => {
                      const handler =
                        leadAssignmentControls.onLeadTypeChangeWithModal ||
                        leadAssignmentControls.onLeadTypeChange;
                      handler('junk');
                      setIsLeadTypeOpen(false);
                    }}
                  >
                    Junk
                  </button>
                </div>
              )}
            </div>

            {/* Assigned To / Scheduler Dropdown */}
            <div className={styles.controlGroup} ref={assignedToRef}>
              <label className={styles.controlLabel}>Assigned To:</label>
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
                    if (display.avatar) {
                      return (
                        <Image
                          src={display.avatar}
                          alt={display.name}
                          width={24}
                          height={24}
                          className={styles.avatar}
                        />
                      );
                    }
                    return <DefaultAvatar name={display.name} />;
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
                          {leadAssignmentControls.currentUser.avatar ? (
                            <Image
                              src={leadAssignmentControls.currentUser.avatar}
                              alt={leadAssignmentControls.currentUser.name}
                              width={32}
                              height={32}
                              className={styles.avatar}
                            />
                          ) : (
                            <DefaultAvatar
                              name={leadAssignmentControls.currentUser.name}
                            />
                          )}
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
                              {user.avatar_url ? (
                                <Image
                                  src={user.avatar_url}
                                  alt={user.display_name}
                                  width={32}
                                  height={32}
                                  className={styles.avatar}
                                />
                              ) : (
                                <DefaultAvatar name={user.display_name} />
                              )}
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
                          {leadAssignmentControls.currentUser.avatar ? (
                            <Image
                              src={leadAssignmentControls.currentUser.avatar}
                              alt={leadAssignmentControls.currentUser.name}
                              width={32}
                              height={32}
                              className={styles.avatar}
                            />
                          ) : (
                            <DefaultAvatar
                              name={leadAssignmentControls.currentUser.name}
                            />
                          )}
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
                                {user.avatar_url ? (
                                  <Image
                                    src={user.avatar_url}
                                    alt={user.display_name}
                                    width={32}
                                    height={32}
                                    className={styles.avatar}
                                  />
                                ) : (
                                  <DefaultAvatar name={user.display_name} />
                                )}
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

            {/* Status Dropdown */}
            <div className={styles.controlGroup} ref={statusRef}>
              <label className={styles.controlLabel}>Status:</label>
              <button
                className={styles.controlDropdown}
                onClick={() => setIsStatusOpen(!isStatusOpen)}
              >
                <span className={styles.controlValue}>
                  {getStatusDisplay()}
                </span>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isStatusOpen ? styles.open : ''}`}
                />
              </button>
              {isStatusOpen && (
                <div className={styles.dropdownMenu}>
                  {[
                    { value: 'new', label: 'New' },
                    { value: 'in_process', label: 'In Process' },
                    { value: 'quoted', label: 'Quoted' },
                    { value: 'scheduling', label: 'Ready to Schedule' },
                    { value: 'won', label: 'Won' },
                    { value: 'lost', label: 'Lost' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      className={`${styles.dropdownOption} ${leadAssignmentControls.leadStatus === value ? styles.selected : ''}`}
                      onClick={() => {
                        leadAssignmentControls.onStatusChange(value);
                        setIsStatusOpen(false);
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
                    if (display.avatar) {
                      return (
                        <Image
                          src={display.avatar}
                          alt={display.name}
                          width={24}
                          height={24}
                          className={styles.avatar}
                        />
                      );
                    }
                    return <DefaultAvatar name={display.name} />;
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
                      {supportCaseAssignmentControls.currentUser.avatar ? (
                        <Image
                          src={supportCaseAssignmentControls.currentUser.avatar}
                          alt={supportCaseAssignmentControls.currentUser.name}
                          width={32}
                          height={32}
                          className={styles.avatar}
                        />
                      ) : (
                        <DefaultAvatar
                          name={supportCaseAssignmentControls.currentUser.name}
                        />
                      )}
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
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.display_name}
                              width={32}
                              height={32}
                              className={styles.avatar}
                            />
                          ) : (
                            <DefaultAvatar name={user.display_name} />
                          )}
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
          </div>
        )}
        {((actionButtons && actionButtons?.length > 0) ||
          showAddButton ||
          customActions) && (
          <div className={styles.rightSection}>
            {customActions ? (
              customActions
            ) : actionButtons && actionButtons.length > 0 ? (
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
              ))
            ) : showAddButton ? (
              <button
                className={styles.addLeadButton}
                onClick={onAddClick}
                type="button"
              >
                {addButtonIcon || <PlusIcon />}
                <span>{addButtonText}</span>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
