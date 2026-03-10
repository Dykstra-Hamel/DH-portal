import React, { useState, useRef, useEffect } from 'react';
import { Project, statusOptions } from '@/types/project';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import { CompanyIcon } from '@/components/Common/CompanyIcon/CompanyIcon';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { formatProjectShortcode } from '@/lib/formatProjectShortcode';
import { parseDateString } from '@/lib/date-utils';
import styles from '@/components/ProjectManagement/ProjectKanbanView/ProjectKanbanView.module.scss';

interface ProjectCardProps {
  project: Project;
  onProjectClick?: (project: Project) => void;
  onToggleStar?: (projectId: string) => void;
  onStatusChange?: (project: Project, newStatus: string) => void;
  taskStats?: { completed: number; total: number };
  userTaskStats?: { completed: number; total: number };
  showMentionHighlight?: boolean;
}

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path
      d="M7.33317 3.33329V7.33329L9.99984 8.66663M13.9998 7.33329C13.9998 11.0152 11.0151 14 7.33317 14C3.65127 14 0.666504 11.0152 0.666504 7.33329C0.666504 3.65139 3.65127 0.666626 7.33317 0.666626C11.0151 0.666626 13.9998 3.65139 13.9998 7.33329Z"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CommentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="14"
    viewBox="0 0 15 14"
    fill="none"
  >
    <path
      d="M7.33317 5.99996H7.33984M9.99984 5.99996H10.0065M4.6665 5.99996H4.67317M13.9998 9.99996C13.9998 10.3536 13.8594 10.6927 13.6093 10.9428C13.3593 11.1928 13.0201 11.3333 12.6665 11.3333H3.88517C3.53158 11.3334 3.19249 11.4739 2.9425 11.724L1.4745 13.192C1.40831 13.2581 1.32397 13.3032 1.23216 13.3215C1.14035 13.3397 1.04519 13.3304 0.958709 13.2945C0.872226 13.2587 0.798306 13.1981 0.746294 13.1202C0.694283 13.0424 0.666516 12.9509 0.666504 12.8573V1.99996C0.666504 1.64634 0.80698 1.3072 1.05703 1.05715C1.30708 0.807102 1.64622 0.666626 1.99984 0.666626H12.6665C13.0201 0.666626 13.3593 0.807102 13.6093 1.05715C13.8594 1.3072 13.9998 1.64634 13.9998 1.99996V9.99996Z"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TaskCompletionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
    <path d="M14.9605 6.70467V13.1944C14.9605 13.607 14.7942 14.0027 14.4981 14.2944C14.202 14.5861 13.8003 14.75 13.3816 14.75H2.32895C1.91018 14.75 1.50857 14.5861 1.21246 14.2944C0.916353 14.0027 0.75 13.607 0.75 13.1944V2.30556C0.75 1.893 0.916353 1.49733 1.21246 1.20561C1.50857 0.913888 1.91018 0.75 2.32895 0.75H12.0742M5.48684 6.97222L7.85526 9.30556L15.75 1.52778" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StatusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
    <path d="M0.75 0.75V13.1944C0.75 13.607 0.925595 14.0027 1.23816 14.2944C1.55072 14.5861 1.97464 14.75 2.41667 14.75H15.75M4.91667 8.52778H10.75C11.2102 8.52778 11.5833 8.876 11.5833 9.30556V10.8611C11.5833 11.2907 11.2102 11.6389 10.75 11.6389H4.91667C4.45643 11.6389 4.08333 11.2907 4.08333 10.8611V9.30556C4.08333 8.876 4.45643 8.52778 4.91667 8.52778ZM4.91667 2.30556H13.25C13.7102 2.30556 14.0833 2.65378 14.0833 3.08333V4.63889C14.0833 5.06844 13.7102 5.41667 13.25 5.41667H4.91667C4.45643 5.41667 4.08333 5.06844 4.08333 4.63889V3.08333C4.08333 2.65378 4.45643 2.30556 4.91667 2.30556Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const formatDateShort = (dateString: string): string => {
  const parsed = parseDateString(dateString);
  if (!parsed) return '';
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const year = String(parsed.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
};

const isPastDue = (dateString?: string | null): boolean => {
  const date = parseDateString(dateString);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

const calculateProgress = (
  project: Project,
  taskStats?: { completed: number; total: number }
): { completed: number; total: number; percentage: number } => {
  const completed = taskStats?.completed ?? project.progress?.completed ?? 0;
  const total = taskStats?.total ?? project.progress?.total ?? 0;
  const derivedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const percentage =
    taskStats || project.progress
      ? derivedPercentage
      : (project.progress_percentage ?? derivedPercentage);
  return { completed, total, percentage };
};

const formatAssigneeName = (
  profile: { first_name: string; last_name: string } | null | undefined
): string => {
  if (!profile || !profile.first_name || !profile.last_name) return 'Unassigned';
  const firstInitial = profile.first_name.charAt(0).toUpperCase();
  const lastInitial = profile.last_name.charAt(0).toUpperCase();
  return `${profile.first_name} ${lastInitial}.`;
};

export function ProjectCard({
  project,
  onProjectClick,
  onToggleStar,
  onStatusChange,
  taskStats,
  userTaskStats = { completed: 0, total: 0 },
  showMentionHighlight = true,
}: ProjectCardProps) {
  const progress = calculateProgress(project, taskStats);
  const userProgress = userTaskStats;
  const dropdownStatusOptions = (() => {
    const hasPrintCategory =
      project.categories?.some(category =>
        category.category?.name === 'Print' || (category as any).name === 'Print'
      ) || false;
    const isBillable = project.is_billable || false;

    return statusOptions.filter(option => {
      if (option.value === 'new') return false;
      if (option.requiresCategory === 'Print' && !hasPrintCategory) {
        return false;
      }
      if (option.requiresBillable && !isBillable) {
        return false;
      }
      return true;
    });
  })();

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const statusInfoRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isClickInsideDropdown = statusDropdownRef.current?.contains(event.target as Node);
      const isClickOnStatusInfo = statusInfoRef.current?.contains(event.target as Node);

      if (!isClickInsideDropdown && !isClickOnStatusInfo) {
        setShowStatusDropdown(false);
      }
    };

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusDropdown]);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onStatusChange && statusInfoRef.current) {
      // Calculate position for fixed dropdown
      const rect = statusInfoRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
      setShowStatusDropdown(!showStatusDropdown);
    }
  };

  const handleStatusSelect = (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(project, newStatus);
      setShowStatusDropdown(false);
    }
  };

  return (
    <div
      className={`${styles.projectCard} ${project.has_unread_mentions ? styles.hasMentionBorder : ''}`}
      onClick={() => onProjectClick?.(project)}
    >
      {/* New Comment Badge */}
      {showMentionHighlight && project.has_unread_mentions && (
        <div className={styles.newCommentBadge}>New Comment!</div>
      )}

      {/* Header Section: Star/Shortcode/Name + Company Logo */}
      <div className={styles.cardHeaderWrapper}>
        <div className={styles.cardHeaderLeft}>
          {/* Row 1: Star + Shortcode */}
          <div className={styles.cardHeaderRow}>
            {onToggleStar && (
              <StarButton
                isStarred={project.is_starred || false}
                onToggle={() => onToggleStar(project.id)}
                size="card"
              />
            )}
            {project.shortcode && (
              <span className={styles.projectShortcode}>
                {formatProjectShortcode(project.shortcode)}
              </span>
            )}
          </div>

          {/* Row 2: Project Name */}
          <h3 className={styles.projectName}>{project.name}</h3>
        </div>

        {/* Company Logo */}
        <div className={styles.cardHeaderRight}>
          <CompanyIcon
            companyName={project.company?.name || 'No company'}
            iconUrl={
              Array.isArray(project.company?.branding)
                ? project.company.branding[0]?.icon_logo_url
                : project.company?.branding?.icon_logo_url
            }
            size="medium"
            showTooltip={true}
          />
        </div>
      </div>

      {/* Row 4: Comments, Task Completion, Avatar, Due Date */}
      <div className={styles.cardInfoRow}>
        <div
          className={`${styles.infoItem} ${showMentionHighlight && project.has_unread_mentions ? styles.hasMention : ''}`}
        >
          <CommentIcon />
          <span>{project.comments_count ?? 0}</span>
        </div>
        <div className={styles.infoItem}>
          <TaskCompletionIcon />
          <span>{userProgress.completed}/{userProgress.total}</span>
        </div>
        {project.assigned_to_profile ? (
          <div className={styles.assigneeInfo}>
            <MiniAvatar
              firstName={project.assigned_to_profile.first_name}
              lastName={project.assigned_to_profile.last_name}
              email={project.assigned_to_profile.email}
              avatarUrl={project.assigned_to_profile.avatar_url}
              size="small"
              showTooltip={false}
            />
            <span className={styles.assigneeName}>
              {formatAssigneeName(project.assigned_to_profile)}
            </span>
          </div>
        ) : (
          <div className={styles.assigneeInfo}>
            <div className={styles.unassignedAvatar} title="Unassigned">
              ?
            </div>
            <span className={styles.assigneeName}>Unassigned</span>
          </div>
        )}
        <div
          className={`${styles.dueDate} ${
            project.due_date && isPastDue(project.due_date)
              ? styles.overdueDate
              : ''
          }`}
        >
          <ClockIcon />
          <span>{project.due_date ? formatDateShort(project.due_date) : 'No date'}</span>
        </div>
      </div>

      {/* Row 5: Members Count + Separator + Client Visible Badge */}
      <div className={styles.cardMembersRow}>
        <div className={styles.membersCount}>
          <span>{project.members_count ?? 0} Members</span>
        </div>
        <div className={styles.separator} />
        {project.scope === 'both' && (
          <div className={styles.clientVisibleBadge}>
            Client Visible
          </div>
        )}
      </div>

      {/* Row 6: Status + Total Tasks + Fraction */}
      <div className={styles.cardStatusRow}>
        {(() => {
          const status = statusOptions.find(
            s => s.value === project.status
          );
          return status ? (
            <div
              ref={statusInfoRef}
              className={`${styles.statusInfo} ${onStatusChange ? styles.statusInfoClickable : ''}`}
              style={{ color: status.color }}
              onClick={handleStatusClick}
            >
              <StatusIcon />
              <span className={styles.statusText}>{status.label}</span>

              {/* Status Dropdown */}
              {showStatusDropdown && onStatusChange && (
                <div
                  ref={statusDropdownRef}
                  className={styles.statusDropdown}
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {dropdownStatusOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`${styles.statusOption} ${option.value === project.status ? styles.active : ''}`}
                      onClick={(e) => handleStatusSelect(e, option.value)}
                    >
                      <div
                        className={styles.statusColorDot}
                        style={{ backgroundColor: option.color }}
                      />
                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null;
        })()}
        <div className={styles.totalTasksInfo}>
          <span className={styles.totalTasksLabel}>Total Tasks:</span>
          <span className={styles.tasksFraction}>
            {progress.completed}/{progress.total}
          </span>
        </div>
      </div>

      {/* Row 7: Progress Bar */}
      <div className={styles.cardProgressRow}>
        <div className={styles.progressBarWithPercentage}>
          <div
            className={styles.progressBar}
            style={{
              backgroundColor: (() => {
                const status = statusOptions.find(
                  s => s.value === project.status
                );
                return status?.color || '#05b62e';
              })(),
              width: `${progress.percentage}%`,
            }}
          >
            <span className={styles.percentageText}>{progress.percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
