import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { Project } from '@/types/project';
import styles from './ProjectKanbanView.module.scss';

type DateCategory = 'due_today' | 'this_week' | 'this_month' | 'coming_up';

interface ProjectKanbanViewProps {
  projects: Project[];
  taskStatsByProject?: Record<string, { completed: number; total: number }>;
  onProjectClick: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onAddTask?: (projectId?: string) => void;
}

interface DateColumn {
  id: DateCategory;
  title: string;
}

const columns: DateColumn[] = [
  { id: 'due_today', title: 'Due Today' },
  { id: 'this_week', title: 'Due This Week' },
  { id: 'this_month', title: 'Due This Month' },
  { id: 'coming_up', title: 'Coming Up' },
];

// SVG Icons
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M7.33317 3.33329V7.33329L9.99984 8.66663M13.9998 7.33329C13.9998 11.0152 11.0151 14 7.33317 14C3.65127 14 0.666504 11.0152 0.666504 7.33329C0.666504 3.65139 3.65127 0.666626 7.33317 0.666626C11.0151 0.666626 13.9998 3.65139 13.9998 7.33329Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M9.99658 4.33329C9.99658 4.51739 10.1458 4.66663 10.3299 4.66663C10.514 4.66663 10.6632 4.51739 10.6632 4.33329C10.6632 4.1492 10.514 3.99996 10.3299 3.99996C10.1458 3.99996 9.99658 4.1492 9.99658 4.33329Z" fill="currentColor"/>
    <path d="M13.6059 7.72396C13.856 7.47397 13.9965 7.13489 13.9966 6.78129L13.9966 1.99996C13.9966 1.64634 13.8561 1.3072 13.6061 1.05715C13.356 0.807102 13.0169 0.666626 12.6632 0.666626L7.88192 0.666626C7.52832 0.666701 7.18924 0.807227 6.93925 1.05729L1.13658 6.85996C0.835485 7.16297 0.666492 7.57279 0.666492 7.99996C0.666492 8.42713 0.835485 8.83695 1.13658 9.13996L5.52325 13.5266C5.82626 13.8277 6.23608 13.9967 6.66325 13.9967C7.09042 13.9967 7.50024 13.8277 7.80325 13.5266L13.6059 7.72396Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.99658 4.33329C9.99658 4.51739 10.1458 4.66663 10.3299 4.66663C10.514 4.66663 10.6632 4.51739 10.6632 4.33329C10.6632 4.1492 10.514 3.99996 10.3299 3.99996C10.1458 3.99996 9.99658 4.1492 9.99658 4.33329Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CommentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14" fill="none">
    <path d="M7.33317 5.99996H7.33984M9.99984 5.99996H10.0065M4.6665 5.99996H4.67317M13.9998 9.99996C13.9998 10.3536 13.8594 10.6927 13.6093 10.9428C13.3593 11.1928 13.0201 11.3333 12.6665 11.3333H3.88517C3.53158 11.3334 3.19249 11.4739 2.9425 11.724L1.4745 13.192C1.40831 13.2581 1.32397 13.3032 1.23216 13.3215C1.14035 13.3397 1.04519 13.3304 0.958709 13.2945C0.872226 13.2587 0.798306 13.1981 0.746294 13.1202C0.694283 13.0424 0.666516 12.9509 0.666504 12.8573V1.99996C0.666504 1.64634 0.80698 1.3072 1.05703 1.05715C1.30708 0.807102 1.64622 0.666626 1.99984 0.666626H12.6665C13.0201 0.666626 13.3593 0.807102 13.6093 1.05715C13.8594 1.3072 13.9998 1.64634 13.9998 1.99996V9.99996Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MembersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M11.3332 12.6666C11.3332 11.6058 10.9117 10.5883 10.1616 9.8382C9.41145 9.08805 8.39404 8.66663 7.33317 8.66663M7.33317 8.66663C6.2723 8.66663 5.25489 9.08805 4.50474 9.8382C3.7546 10.5883 3.33317 11.6058 3.33317 12.6666M7.33317 8.66663C8.80593 8.66663 9.99984 7.47272 9.99984 5.99996C9.99984 4.5272 8.80593 3.33329 7.33317 3.33329C5.86041 3.33329 4.6665 4.5272 4.6665 5.99996C4.6665 7.47272 5.86041 8.66663 7.33317 8.66663ZM13.9998 7.33329C13.9998 11.0152 11.0151 14 7.33317 14C3.65127 14 0.666504 11.0152 0.666504 7.33329C0.666504 3.65139 3.65127 0.666626 7.33317 0.666626C11.0151 0.666626 13.9998 3.65139 13.9998 7.33329Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Date utilities
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isPastDue = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
  monday.setDate(today.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return date >= monday && date <= sunday && !isToday(date);
};

const isThisMonth = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear() &&
    !isToday(date) &&
    !isThisWeek(date)
  );
};

const getDateCategory = (project: Project): DateCategory => {
  if (!project.due_date) return 'coming_up';
  const dueDate = new Date(project.due_date);
  if (isToday(dueDate) || isPastDue(dueDate)) return 'due_today';
  if (isThisWeek(dueDate)) return 'this_week';
  if (isThisMonth(dueDate)) return 'this_month';
  return 'coming_up';
};

const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
};

const calculateProgress = (
  project: Project,
  taskStats?: { completed: number; total: number }
): { completed: number; total: number; percentage: number } => {
  const completed = taskStats?.completed ?? project.progress?.completed ?? 0;
  const total = taskStats?.total ?? project.progress?.total ?? 0;
  const derivedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const percentage = taskStats || project.progress
    ? derivedPercentage
    : project.progress_percentage ?? derivedPercentage;
  return { completed, total, percentage };
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function ProjectKanbanView({
  projects,
  taskStatsByProject,
  onProjectClick,
  onAddTask,
}: ProjectKanbanViewProps) {
  // Simple drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Custom order for Due Today column
  const [dueTodayOrder, setDueTodayOrder] = useState<string[]>([]);

  // Scroll state
  const [columnScrollStates, setColumnScrollStates] = useState<Record<DateCategory, boolean>>({
    'due_today': false,
    'this_week': false,
    'this_month': false,
    'coming_up': false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<DateCategory, HTMLDivElement | null>>({
    'due_today': null,
    'this_week': null,
    'this_month': null,
    'coming_up': null,
  });

  // Initialize order when projects change
  useEffect(() => {
    const dueTodayProjects = projects.filter(p => getDateCategory(p) === 'due_today');
    const dueTodayIds = dueTodayProjects.map(p => p.id);

    setDueTodayOrder(prevOrder => {
      const validPrevOrder = prevOrder.filter(id => dueTodayIds.includes(id));
      const newIds = dueTodayIds.filter(id => !prevOrder.includes(id));
      return [...validPrevOrder, ...newIds];
    });
  }, [projects]);

  const getProjectsByDateCategory = (category: DateCategory): Project[] => {
    const categoryProjects = projects.filter(p => getDateCategory(p) === category);

    if (category === 'due_today' && dueTodayOrder.length > 0) {
      return [...categoryProjects].sort((a, b) => {
        const aIdx = dueTodayOrder.indexOf(a.id);
        const bIdx = dueTodayOrder.indexOf(b.id);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    }

    return categoryProjects;
  };

  const checkColumnScroll = (columnId: DateCategory) => {
    const columnContent = columnRefs.current[columnId];
    if (!columnContent) return;
    const { scrollTop, scrollHeight, clientHeight } = columnContent;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setColumnScrollStates(prev => ({
      ...prev,
      [columnId]: !isAtBottom && scrollHeight > clientHeight,
    }));
  };

  useEffect(() => {
    columns.forEach(column => checkColumnScroll(column.id));
  }, [projects]);

  // Drag handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, projectId: string) => {
    setDraggedId(projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    // Perform the reorder if we have a valid drop target
    if (draggedId && dropTargetId && dropPosition) {
      setDueTodayOrder(prevOrder => {
        const newOrder = [...prevOrder];
        const draggedIndex = newOrder.indexOf(draggedId);
        const targetIndex = newOrder.indexOf(dropTargetId);

        if (draggedIndex === -1 || targetIndex === -1) return prevOrder;
        if (draggedIndex === targetIndex) return prevOrder;

        // Remove dragged item
        newOrder.splice(draggedIndex, 1);

        // Find new target index (it may have shifted after removal)
        const newTargetIndex = newOrder.indexOf(dropTargetId);

        // Insert at the correct position
        const insertIndex = dropPosition === 'before' ? newTargetIndex : newTargetIndex + 1;
        newOrder.splice(insertIndex, 0, draggedId);

        return newOrder;
      });
    }

    // Reset all drag state
    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, projectId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedId || draggedId === projectId) {
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';

    setDropTargetId(projectId);
    setDropPosition(position);
  };

  const handleDragLeave = () => {
    // Don't clear immediately - let dragOver on another card set new target
  };

  const handleColumnDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleColumnDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // The actual reorder happens in handleDragEnd
  };

  return (
    <div ref={containerRef} className={styles.kanbanContainer}>
      <div className={styles.kanbanBoard}>
        {columns.map((column) => {
          const columnProjects = getProjectsByDateCategory(column.id);
          const isDueTodayColumn = column.id === 'due_today';

          return (
            <div key={column.id} className={styles.kanbanColumnWrapper}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>{column.title}</span>
                <span className={styles.columnCount}>({columnProjects.length})</span>
              </div>

              <div
                className={`${styles.kanbanColumn} ${isDueTodayColumn ? styles.dueTodayColumn : ''}`}
                onDragOver={handleColumnDragOver}
                onDrop={handleColumnDrop}
              >
                <div
                  ref={(el) => { columnRefs.current[column.id] = el; }}
                  className={styles.columnContent}
                  onScroll={() => checkColumnScroll(column.id)}
                >
                  {columnProjects.map((project) => {
                    const progress = calculateProgress(project, taskStatsByProject?.[project.id]);
                    const isDragging = draggedId === project.id;
                    const isDropTarget = dropTargetId === project.id;
                    const showDropBefore = isDropTarget && dropPosition === 'before';
                    const showDropAfter = isDropTarget && dropPosition === 'after';

                    return (
                      <div
                        key={project.id}
                        className={`
                          ${styles.draggableProject}
                          ${isDueTodayColumn ? styles.draggable : ''}
                          ${isDragging ? styles.dragging : ''}
                          ${showDropBefore ? styles.dropBefore : ''}
                          ${showDropAfter ? styles.dropAfter : ''}
                        `}
                        draggable={isDueTodayColumn}
                        onDragStart={isDueTodayColumn ? (e) => handleDragStart(e, project.id) : undefined}
                        onDragEnd={isDueTodayColumn ? handleDragEnd : undefined}
                        onDragOver={isDueTodayColumn ? (e) => handleDragOver(e, project.id) : undefined}
                        onDragLeave={isDueTodayColumn ? handleDragLeave : undefined}
                        onClick={() => onProjectClick(project)}
                      >
                        <div className={styles.projectCard}>
                          <div className={styles.cardTopRow}>
                            <div className={styles.dateSection}>
                              <ClockIcon />
                              <span>{project.due_date ? formatDateShort(project.due_date) : 'No date'}</span>
                            </div>
                            <div className={styles.companySection}>
                              <TagIcon />
                              <span>{project.company?.name || 'No company'}</span>
                            </div>
                          </div>

                          {project.shortcode && (
                            <div className={styles.projectMeta}>
                              <span className={styles.projectCode}>{project.shortcode}</span>
                            </div>
                          )}

                          <h3 className={styles.projectName}>{project.name}</h3>

                          {project.description && (() => {
                            const descriptionText = stripHtml(project.description);
                            if (!descriptionText) return null;
                            return (
                              <p className={styles.projectDescription}>{descriptionText}</p>
                            );
                          })()}

                          <div className={styles.cardMetrics}>
                            <div className={styles.metricItem}>
                              <CommentIcon />
                              <span>{project.comments_count ?? 0} Comments</span>
                            </div>
                            <div className={styles.metricItem}>
                              <MembersIcon />
                              <span>{project.members_count ?? 0} Members</span>
                            </div>
                          </div>

                          <div className={styles.progressSection}>
                            <div className={styles.progressHeader}>
                              <span className={styles.progressLabel}>Progress</span>
                              <span className={styles.progressFraction}>
                                {progress.completed}/{progress.total}
                              </span>
                            </div>
                            <div className={styles.progressBarRow}>
                              <div className={styles.progressBarContainer}>
                                <div
                                  className={styles.progressBarFill}
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                              {(project.scope === 'external' || project.scope === 'both') && (
                                <span className={styles.externalBadge}>External</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnProjects.length === 0 && (
                    <div className={styles.emptyColumn}>
                      No projects in this column
                    </div>
                  )}
                </div>

                {columnScrollStates[column.id] && (
                  <div className={styles.scrollGradient} />
                )}
              </div>

              <button
                className={styles.addTaskButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask?.();
                }}
              >
                <PlusIcon />
                <span>Add Task</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
