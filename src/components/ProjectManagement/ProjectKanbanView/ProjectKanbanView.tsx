import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { Project } from '@/types/project';
import { ProjectBadge } from '@/components/TaskManagement/shared/ProjectBadge';
import styles from './ProjectKanbanView.module.scss';

type ProjectStatus = 'in_progress' | 'blocked' | 'on_hold' | 'pending_approval' | 'out_to_client' | 'complete';
type DateCategory = 'due_today' | 'this_week' | 'this_month' | 'later';

interface ProjectKanbanViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
}

interface DateColumn {
  id: DateCategory;
  title: string;
  color: string;
  allowReorder: boolean;
}

const columns: DateColumn[] = [
  { id: 'due_today', title: 'Due Today', color: '#ef4444', allowReorder: true },
  { id: 'this_week', title: 'This Week', color: '#f97316', allowReorder: false },
  { id: 'this_month', title: 'This Month', color: '#3b82f6', allowReorder: false },
  { id: 'later', title: 'Later', color: '#8b5cf6', allowReorder: false },
];

// Date calculation utilities
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate Monday of current week (Monday = start of work week)
  const monday = new Date(today);
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday is 6 days after Monday
  monday.setDate(today.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  // Calculate Friday of current week
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return date >= monday && date <= friday && !isToday(date);
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

const isLater = (date: Date): boolean => {
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return date > endOfMonth;
};

const getDateCategory = (project: Project): DateCategory => {
  // Projects without due dates go to "Later"
  if (!project.due_date) return 'later';

  const dueDate = new Date(project.due_date);

  if (isToday(dueDate)) return 'due_today';
  if (isThisWeek(dueDate)) return 'this_week';
  if (isThisMonth(dueDate)) return 'this_month';
  if (isLater(dueDate)) return 'later';

  // Past due dates go to "Due Today"
  return 'due_today';
};

// Status badge helper functions
const statusOptions: Record<ProjectStatus, { label: string; color: string }> = {
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  blocked: { label: 'Blocked', color: '#ef4444' },
  on_hold: { label: 'On Hold', color: '#f97316' },
  pending_approval: { label: 'Pending Approval', color: '#eab308' },
  out_to_client: { label: 'Out To Client', color: '#8b5cf6' },
  complete: { label: 'Complete', color: '#10b981' },
};

const getStatusLabel = (status: ProjectStatus): string => {
  return statusOptions[status]?.label || status;
};

const getStatusColor = (status: ProjectStatus): string => {
  return statusOptions[status]?.color || '#6b7280';
};

export function ProjectKanbanView({ projects, onProjectClick, onUpdateProject }: ProjectKanbanViewProps) {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<DateCategory | null>(null);
  const [columnScrollStates, setColumnScrollStates] = useState<Record<DateCategory, boolean>>({
    'due_today': false,
    'this_week': false,
    'this_month': false,
    'later': false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<DateCategory, HTMLDivElement | null>>({
    'due_today': null,
    'this_week': null,
    'this_month': null,
    'later': null,
  });
  const scrollAnimationRef = useRef<number | null>(null);
  const scrollSpeedRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const getProjectsByDateCategory = (category: DateCategory): Project[] => {
    return projects.filter(project => getDateCategory(project) === category);
  };

  const isDraggable = (columnId: DateCategory): boolean => {
    return columnId === 'due_today';
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, project: Project, columnId: DateCategory) => {
    // Only allow dragging within "Due Today" column
    if (columnId !== 'due_today') {
      e.preventDefault();
      return;
    }

    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    isDraggingRef.current = true;
    scrollSpeedRef.current = 0;
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverColumn(null);
    isDraggingRef.current = false;
    scrollSpeedRef.current = 0;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.clientX === 0) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const scrollEdgeSize = 180; // Larger trigger zone (was 100)
    const maxScrollSpeed = 30; // Faster scroll (was 22)

    // Calculate distance from edges
    const distanceFromLeft = e.clientX - containerRect.left;
    const distanceFromRight = containerRect.right - e.clientX;

    // Determine scroll direction and speed with easing
    let scrollSpeed = 0;

    if (distanceFromLeft < scrollEdgeSize && distanceFromLeft > 0) {
      // Near left edge - scroll left with ease-out-cubic
      const ratio = distanceFromLeft / scrollEdgeSize;
      const easedRatio = 1 - Math.pow(ratio, 3);
      scrollSpeed = -maxScrollSpeed * easedRatio;
    } else if (distanceFromRight < scrollEdgeSize && distanceFromRight > 0) {
      // Near right edge - scroll right with ease-out-cubic
      const ratio = distanceFromRight / scrollEdgeSize;
      const easedRatio = 1 - Math.pow(ratio, 3);
      scrollSpeed = maxScrollSpeed * easedRatio;
    }

    // Update scroll speed ref (will be read by animation loop)
    scrollSpeedRef.current = scrollSpeed;
  };

  const checkColumnScroll = (columnId: DateCategory) => {
    const columnContent = columnRefs.current[columnId];
    if (!columnContent) return;

    const { scrollTop, scrollHeight, clientHeight } = columnContent;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

    setColumnScrollStates(prev => ({
      ...prev,
      [columnId]: !isAtBottom && scrollHeight > clientHeight,
    }));
  };

  useEffect(() => {
    // Check scroll state for all columns on mount and when projects change
    columns.forEach(column => {
      checkColumnScroll(column.id);
    });
  }, [projects]);

  useEffect(() => {
    // Continuous scroll animation loop
    const scrollLoop = () => {
      if (isDraggingRef.current && containerRef.current) {
        const speed = scrollSpeedRef.current;
        if (speed !== 0) {
          containerRef.current.scrollLeft += speed;
        }
      }
      scrollAnimationRef.current = requestAnimationFrame(scrollLoop);
    };

    // Start the loop
    scrollAnimationRef.current = requestAnimationFrame(scrollLoop);

    // Cleanup on unmount
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (category: DateCategory) => {
    setDragOverColumn(category);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetColumnId: DateCategory) => {
    e.preventDefault();

    // Only allow drops within "Due Today" column
    if (targetColumnId !== 'due_today') {
      setDraggedProject(null);
      setDragOverColumn(null);
      return;
    }

    if (draggedProject && getDateCategory(draggedProject) === 'due_today') {
      // Visual reorder only - no database update needed
      // The reorder is ephemeral (lost on page reload)
      // Future enhancement: could add display_order field to persist
    }

    setDraggedProject(null);
    setDragOverColumn(null);
    isDraggingRef.current = false;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      planning: '#6b7280',
      active: '#3b82f6',
      'on-hold': '#f59e0b',
      completed: '#10b981',
      archived: '#9ca3af',
    };
    return statusColors[status] || '#6b7280';
  };

  return (
    <div ref={containerRef} className={styles.kanbanContainer}>
      <div className={styles.kanbanBoard}>
        {columns.map((column) => {
          const columnProjects = getProjectsByDateCategory(column.id);
          const isDragOver = dragOverColumn === column.id;
          const canDrag = isDraggable(column.id);

          return (
            <div
              key={column.id}
              className={`${styles.kanbanColumn} ${isDragOver ? styles.dragOver : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={styles.columnHeader}>
                <div className={styles.columnTitle} style={{ color: column.color }}>
                  {column.title}
                </div>
                <div className={styles.columnCount}>{columnProjects.length}</div>
              </div>

              <div
                ref={(el) => { columnRefs.current[column.id] = el; }}
                className={styles.columnContent}
                onScroll={() => checkColumnScroll(column.id)}
              >
                {columnProjects.map((project) => {
                  return (
                    <div
                      key={project.id}
                      className={`${styles.draggableProject} ${canDrag ? styles.draggable : ''}`}
                      draggable={canDrag}
                      onDragStart={canDrag ? (e) => handleDragStart(e, project, column.id) : undefined}
                      onDragEnd={canDrag ? handleDragEnd : undefined}
                      onDrag={canDrag ? handleDrag : undefined}
                      onClick={() => onProjectClick(project)}
                    >
                      <div className={styles.projectCard}>
                        {/* Top Row: Date + Company */}
                        <div className={styles.cardTopRow}>
                          <span>{project.due_date ? formatDate(project.due_date) : 'No date'}</span>
                          <span>{project.company?.name || 'No company'}</span>
                        </div>

                        {/* Project Code */}
                        {project.shortcode && (
                          <div className={styles.projectCode}>{project.shortcode}</div>
                        )}

                        {/* Project Title */}
                        <h3 className={styles.projectName}>{project.name}</h3>

                        {/* Project Description */}
                        {project.description && (
                          <p className={styles.projectDescription}>{project.description}</p>
                        )}

                        {/* Card Footer */}
                        <div className={styles.cardFooter}>
                          <div className={styles.cardMetrics}>
                            {/* Comments Count */}
                            <div className={styles.metricItem}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                <path d="M7 0C3.13 0 0 2.91 0 6.5c0 1.75.7 3.36 1.87 4.57L1 14l3.36-1.12C5.16 13.6 6.06 14 7 14c3.87 0 7-2.91 7-6.5S10.87 0 7 0z"/>
                              </svg>
                              <span>{project.comments_count || 0}</span>
                            </div>

                            {/* Members Count */}
                            <div className={styles.metricItem}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                <path d="M7 7c1.93 0 3.5-1.57 3.5-3.5S8.93 0 7 0 3.5 1.57 3.5 3.5 5.07 7 7 7zm0 1.75c-2.33 0-7 1.17-7 3.5V14h14v-1.75c0-2.33-4.67-3.5-7-3.5z"/>
                              </svg>
                              <span>{project.members_count || 1}</span>
                            </div>
                          </div>

                          {/* Right Side: Progress + External Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Progress Indicator */}
                            {project.progress && (
                              <div className={styles.progressIndicator}>
                                {project.progress.completed}/{project.progress.total}
                              </div>
                            )}

                            {/* External Badge */}
                            {project.scope === 'external' && (
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
          );
        })}
      </div>
    </div>
  );
}
