'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import Image from 'next/image';
import { Building2, ChevronDown, Tag, UserRound, Users } from 'lucide-react';
import { statusOptions as projectStatusOptions } from '@/types/project';
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

interface ProjectFilterControls {
  selectedCompanyId?: string | null;
  selectedAssignedTo?: string | null | undefined;
  selectedStatus?: string | null;
  selectedCategoryId?: string | null;
  companies: Array<{ id: string; name: string }>;
  assignableUsers: AssignableUser[];
  categories?: Array<{ id: string; name: string; count?: number }>;
  currentUser: { id: string; name: string; email: string; avatar?: string };
  onCompanyChange: (companyId: string | null) => void;
  onAssignedToChange: (userId: string | null) => void;
  onStatusChange?: (status: string | null) => void;
  onCategoryChange?: (categoryId: string | null) => void;
}

interface GlobalLowerHeaderProps {
  title: ReactNode;
  description: string;
  titleLeading?: ReactNode;
  titleLogo?: ReactNode;
  showAddButton?: boolean;
  addButtonText?: string;
  onAddClick?: () => void;
  addButtonIcon?: ReactNode;
  actionButtons?: ActionButton[];
  leadAssignmentControls?: LeadAssignmentControls;
  supportCaseAssignmentControls?: SupportCaseAssignmentControls;
  projectFilterControls?: ProjectFilterControls;
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
  projectFilterControls,
  customActions,
  titleLeading,
  titleLogo,
}: GlobalLowerHeaderProps) {
  const [isLeadTypeOpen, setIsLeadTypeOpen] = useState(false);
  const [isAssignedToOpen, setIsAssignedToOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isProjectCompanyOpen, setIsProjectCompanyOpen] = useState(false);
  const [isProjectCategoryOpen, setIsProjectCategoryOpen] = useState(false);
  const [isProjectAssignedToOpen, setIsProjectAssignedToOpen] = useState(false);
  const [isProjectStatusOpen, setIsProjectStatusOpen] = useState(false);
  const [hasShadow, setHasShadow] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  const leadTypeRef = useRef<HTMLDivElement>(null);
  const assignedToRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const supportAssignedToRef = useRef<HTMLDivElement>(null);
  const supportStatusRef = useRef<HTMLDivElement>(null);
  const projectCompanyRef = useRef<HTMLDivElement>(null);
  const projectCategoryRef = useRef<HTMLDivElement>(null);
  const projectAssignedToRef = useRef<HTMLDivElement>(null);
  const projectStatusRef = useRef<HTMLDivElement>(null);

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
        projectCompanyRef.current &&
        !projectCompanyRef.current.contains(event.target as Node)
      ) {
        setIsProjectCompanyOpen(false);
      }
      if (
        projectCategoryRef.current &&
        !projectCategoryRef.current.contains(event.target as Node)
      ) {
        setIsProjectCategoryOpen(false);
      }
      if (
        projectAssignedToRef.current &&
        !projectAssignedToRef.current.contains(event.target as Node)
      ) {
        setIsProjectAssignedToOpen(false);
      }
      if (
        projectStatusRef.current &&
        !projectStatusRef.current.contains(event.target as Node)
      ) {
        setIsProjectStatusOpen(false);
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

  // Project Filter helper functions
  const getProjectCompanyDisplay = () => {
    if (!projectFilterControls) return 'All Companies';
    const { selectedCompanyId, companies } = projectFilterControls;

    if (!selectedCompanyId) return 'All Companies';

    const company = companies.find(c => c.id === selectedCompanyId);
    return company?.name || 'All Companies';
  };

  const getProjectAssignedToDisplay = () => {
    if (!projectFilterControls)
      return { name: 'All Users', subtitle: '', avatar: null };

    const { selectedAssignedTo, assignableUsers, currentUser } = projectFilterControls;

    if (!selectedAssignedTo) {
      return { name: 'All Users', subtitle: '', avatar: null };
    }

    if (selectedAssignedTo === currentUser.id) {
      return {
        name: currentUser.name,
        subtitle: 'Myself',
        avatar: currentUser.avatar || null,
      };
    }

    const user = assignableUsers.find(u => u.id === selectedAssignedTo);
    if (user) {
      return {
        name: user.display_name,
        subtitle: user.email,
        avatar: user.avatar_url || null,
      };
    }

    return { name: 'All Users', subtitle: '', avatar: null };
  };

  const getProjectStatusDisplay = () => {
    if (!projectFilterControls) return 'All Statuses';
    const { selectedStatus } = projectFilterControls;

    if (!selectedStatus) return 'All Statuses';

    const match = projectStatusOptions.find(option => option.value === selectedStatus);
    return match?.label ?? selectedStatus;
  };

  const getProjectCategoryDisplay = () => {
    if (!projectFilterControls) return 'All Categories';
    const { selectedCategoryId, categories } = projectFilterControls;
    if (!selectedCategoryId) return 'All Categories';
    const match = categories?.find(category => category.id === selectedCategoryId);
    return match?.name || 'All Categories';
  };

  return (
    <div
      className={`${styles.globalLowerHeader} ${hasShadow ? styles.globalLowerHeaderScrolled : ''}`}
    >
      <div className={styles.headerContent}>
        <div className={`${styles.leftSection} ${titleLeading ? styles.leftSectionWithLeading : ''}`}>
          {titleLeading && <div className={styles.titleLeading}>{titleLeading}</div>}
          {titleLogo ? (
            <div className={styles.titleWithLogoWrapper}>
              <div className={styles.titleLogoCol}>{titleLogo}</div>
              <div className={styles.titleStack}>
                <h1 className={styles.title}>{title}</h1>
                <p
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            </div>
          ) : (
            <div className={styles.titleStack}>
              <h1 className={styles.title}>{title}</h1>
              <p
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
          )}
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
        {projectFilterControls && (
          <div className={styles.controlsSection}>
            {/* Company Filter Dropdown */}
            <div className={styles.controlGroup} ref={projectCompanyRef}>
              <label
                className={`${styles.controlLabel} ${styles.iconOnlyLabel}`}
                aria-label="What Company"
                title="What Company"
              >
                <Building2 size={18} aria-hidden="true" />
              </label>
              <button
                className={`${styles.controlDropdown} ${styles.companyControlDropdown}`}
                onClick={() => setIsProjectCompanyOpen(!isProjectCompanyOpen)}
              >
                <span className={`${styles.controlValue} ${styles.companyControlValue}`}>
                  {getProjectCompanyDisplay()}
                </span>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isProjectCompanyOpen ? styles.open : ''}`}
                />
              </button>
              {isProjectCompanyOpen && (
                <div className={`${styles.dropdownMenu} ${styles.companyDropdownMenu}`}>
                  <div className={styles.searchContainer}>
                    <input
                      type="text"
                      placeholder="Search companies..."
                      className={styles.searchInput}
                      value={companySearchQuery}
                      onChange={(e) => setCompanySearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <button
                    className={`${styles.dropdownOption} ${styles.companyDropdownOption} ${!projectFilterControls.selectedCompanyId ? styles.selected : ''}`}
                    onClick={() => {
                      projectFilterControls.onCompanyChange(null);
                      setIsProjectCompanyOpen(false);
                      setCompanySearchQuery('');
                    }}
                  >
                    All Companies
                  </button>
                  {projectFilterControls.companies
                    .filter((company) =>
                      company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
                    )
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((company) => (
                      <button
                        key={company.id}
                        className={`${styles.dropdownOption} ${styles.companyDropdownOption} ${projectFilterControls.selectedCompanyId === company.id ? styles.selected : ''}`}
                        onClick={() => {
                          projectFilterControls.onCompanyChange(company.id);
                          setIsProjectCompanyOpen(false);
                          setCompanySearchQuery('');
                        }}
                      >
                        {company.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Category Filter Dropdown */}
            {projectFilterControls.onCategoryChange && projectFilterControls.categories && projectFilterControls.categories.length > 0 && (
              <div className={styles.controlGroup} ref={projectCategoryRef}>
                <label
                  className={`${styles.controlLabel} ${styles.iconOnlyLabel}`}
                  aria-label="Category"
                  title="Category"
                >
                  <Tag size={18} aria-hidden="true" />
                </label>
                <button
                  className={`${styles.controlDropdown} ${styles.categoryControlDropdown}`}
                  onClick={() => setIsProjectCategoryOpen(!isProjectCategoryOpen)}
                >
                  <span className={`${styles.controlValue} ${styles.categoryControlValue}`}>
                    {getProjectCategoryDisplay()}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`${styles.chevron} ${isProjectCategoryOpen ? styles.open : ''}`}
                  />
                </button>
                {isProjectCategoryOpen && (
                  <div className={`${styles.dropdownMenu} ${styles.categoryDropdownMenu}`}>
                    <button
                      className={`${styles.dropdownOption} ${styles.categoryDropdownOption} ${!projectFilterControls.selectedCategoryId ? styles.selected : ''}`}
                      onClick={() => {
                        projectFilterControls.onCategoryChange?.(null);
                        setIsProjectCategoryOpen(false);
                      }}
                    >
                      All Categories
                    </button>
                    {projectFilterControls.categories.map((category) => (
                      <button
                        key={category.id}
                        className={`${styles.dropdownOption} ${styles.categoryDropdownOption} ${projectFilterControls.selectedCategoryId === category.id ? styles.selected : ''}`}
                        onClick={() => {
                          projectFilterControls.onCategoryChange?.(category.id);
                          setIsProjectCategoryOpen(false);
                        }}
                      >
                        {category.name}
                        {typeof category.count === 'number' ? ` (${category.count})` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assigned To Filter Dropdown */}
            <div className={styles.controlGroup} ref={projectAssignedToRef}>
              <label
                className={`${styles.controlLabel} ${styles.iconOnlyLabel}`}
                aria-label="Assigned To"
                title="Assigned To"
              >
                <UserRound size={18} aria-hidden="true" />
              </label>
              <button
                className={`${styles.controlDropdown} ${styles.usersControlDropdown}`}
                onClick={() => setIsProjectAssignedToOpen(!isProjectAssignedToOpen)}
              >
                <div className={styles.assignedToContent}>
                  {(() => {
                    const display = getProjectAssignedToDisplay();
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
                  <span className={`${styles.controlValue} ${styles.usersControlValue}`}>
                    {getProjectAssignedToDisplay().name}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`${styles.chevron} ${isProjectAssignedToOpen ? styles.open : ''}`}
                />
              </button>
              {isProjectAssignedToOpen && (
                <div className={`${styles.dropdownMenu} ${styles.usersDropdownMenu}`}>
                  {/* All Users option */}
                  <button
                    className={`${styles.dropdownOption} ${styles.usersDropdownOption} ${!projectFilterControls.selectedAssignedTo ? styles.selected : ''}`}
                    onClick={() => {
                      projectFilterControls.onAssignedToChange(null);
                      setIsProjectAssignedToOpen(false);
                    }}
                  >
                    <div className={styles.optionContent}>
                      <DefaultAvatar name="All Users" />
                      <div className={styles.optionInfo}>
                        <div className={styles.optionName}>All Users</div>
                      </div>
                    </div>
                  </button>

                  {/* Current User option */}
                  <button
                    className={`${styles.dropdownOption} ${styles.usersDropdownOption} ${projectFilterControls.selectedAssignedTo === projectFilterControls.currentUser.id ? styles.selected : ''}`}
                    onClick={() => {
                      projectFilterControls.onAssignedToChange(projectFilterControls.currentUser.id);
                      setIsProjectAssignedToOpen(false);
                    }}
                  >
                    <div className={styles.optionContent}>
                      {projectFilterControls.currentUser.avatar ? (
                        <Image
                          src={projectFilterControls.currentUser.avatar}
                          alt={projectFilterControls.currentUser.name}
                          width={32}
                          height={32}
                          className={styles.avatar}
                        />
                      ) : (
                        <DefaultAvatar name={projectFilterControls.currentUser.name} />
                      )}
                      <div className={styles.optionInfo}>
                        <div className={styles.optionName}>
                          {projectFilterControls.currentUser.name}
                        </div>
                        <div className={styles.optionSubtitle}>Myself</div>
                      </div>
                    </div>
                  </button>

                  {/* Other users */}
                  {projectFilterControls.assignableUsers
                    .filter(u => u.id !== projectFilterControls.currentUser.id)
                    .map(user => (
                      <button
                        key={user.id}
                        className={`${styles.dropdownOption} ${styles.usersDropdownOption} ${projectFilterControls.selectedAssignedTo === user.id ? styles.selected : ''}`}
                        onClick={() => {
                          projectFilterControls.onAssignedToChange(user.id);
                          setIsProjectAssignedToOpen(false);
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

            {/* Status Filter Dropdown */}
            {projectFilterControls.onStatusChange && (
              <div className={styles.controlGroup} ref={projectStatusRef}>
                <label className={styles.controlLabel}>Status:</label>
                <button
                  className={styles.controlDropdown}
                  onClick={() => setIsProjectStatusOpen(!isProjectStatusOpen)}
                >
                  <span className={styles.controlValue}>
                    {getProjectStatusDisplay()}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`${styles.chevron} ${isProjectStatusOpen ? styles.open : ''}`}
                  />
                </button>
                {isProjectStatusOpen && (
                  <div className={styles.dropdownMenu}>
                    <button
                      className={`${styles.dropdownOption} ${!projectFilterControls.selectedStatus ? styles.selected : ''}`}
                      onClick={() => {
                        projectFilterControls.onStatusChange!(null);
                        setIsProjectStatusOpen(false);
                      }}
                    >
                      All Statuses
                    </button>
                    {projectStatusOptions.map(({ value, label }) => (
                      <button
                        key={value}
                        className={`${styles.dropdownOption} ${projectFilterControls.selectedStatus === value ? styles.selected : ''}`}
                        onClick={() => {
                          projectFilterControls.onStatusChange!(value);
                          setIsProjectStatusOpen(false);
                        }}
                      >
                        {label}
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
            {actionButtons && actionButtons.length > 0 && (
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
            )}
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
