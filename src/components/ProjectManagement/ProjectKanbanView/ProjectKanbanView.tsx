import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  DragEvent,
} from 'react';
import { Expand, X } from 'lucide-react';
import { Project, ProjectDepartment } from '@/types/project';
import { ProjectCard } from '@/components/Common/ProjectCard/ProjectCard';
import { ProjectCardGrid } from '../ProjectCardGrid/ProjectCardGrid';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';
import { parseDateString } from '@/lib/date-utils';
import styles from './ProjectKanbanView.module.scss';

const EXPANDED_COLUMN_COOKIE = 'kanban_expanded_column';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

interface ProjectKanbanViewProps {
  projects: Project[];
  departments: ProjectDepartment[];
  taskStatsByProject?: Record<string, { completed: number; total: number }>;
  userTaskStatsByProject?: Record<string, { completed: number; total: number }>;
  onProjectClick: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onToggleStar?: (projectId: string) => void;
}

interface Column {
  id: string;
  title: string;
  icon?: string | null;
}

export function ProjectKanbanView({
  projects,
  departments,
  taskStatsByProject,
  userTaskStatsByProject,
  onProjectClick,
  onUpdateProject,
  onToggleStar,
}: ProjectKanbanViewProps) {
  // Expanded column state — persisted via cookie
  const [expandedColumnId, setExpandedColumnId] = useState<string | null>(
    () => getCookie(EXPANDED_COLUMN_COOKIE)
  );
  const [isClosingExpanded, setIsClosingExpanded] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const CLOSE_ANIMATION_MS = 200;

  const handleExpandColumn = (columnId: string) => {
    // If already closing, cancel and switch columns immediately
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsClosingExpanded(false);
    setExpandedColumnId(columnId);
    setCookie(EXPANDED_COLUMN_COOKIE, columnId);
  };

  const handleCloseExpanded = () => {
    setIsClosingExpanded(true);
    closeTimeoutRef.current = setTimeout(() => {
      setExpandedColumnId(null);
      setIsClosingExpanded(false);
      deleteCookie(EXPANDED_COLUMN_COOKIE);
      closeTimeoutRef.current = null;
    }, CLOSE_ANIMATION_MS);
  };

  // Simple drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(
    null
  );
  const [dropToColumn, setDropToColumn] = useState<string | null>(null);

  // Confirmation modals
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    project: Project;
    newStatus: string;
  } | null>(null);
  const [pendingDepartmentChange, setPendingDepartmentChange] = useState<{
    project: Project;
    departmentId: string;
    departmentName: string;
  } | null>(null);

  // Auto-scroll state
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Click-and-drag scroll state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Build columns from departments
  const columns: Column[] = useMemo(() => [
    ...departments.map(dept => ({
      id: dept.id,
      title: dept.name,
      icon: dept.icon,
    })),
  ], [departments]);

  // Scroll state
  const [columnScrollStates, setColumnScrollStates] = useState<
    Record<string, boolean>
  >({});

  const containerRef = useRef<HTMLDivElement>(null);
  const viewContentRef = useRef<HTMLDivElement | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const expandedViewRef = useRef<HTMLDivElement | null>(null);

  // Clean up close timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Close expanded view when clicking outside it, but only within the viewContent section
  useEffect(() => {
    if (!expandedColumnId) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Click inside the expanded view — let it pass through
      if (expandedViewRef.current?.contains(target)) return;
      // Only close if the click is within the viewContent section
      const viewContent = expandedViewRef.current?.closest(
        '[class*="viewContent"]'
      ) as HTMLElement | null;
      if (!viewContent?.contains(target)) return;
      handleCloseExpanded();
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedColumnId]);

  const getProjectsByDepartment = (columnId: string): Project[] => {
    // Projects assigned to this department
    const departmentProjects = projects.filter(p => p.current_department_id === columnId);

    // Sort starred projects first, then by closest due date
    return [...departmentProjects].sort((a, b) => {
      // Starred projects float to the top
      if (a.is_starred !== b.is_starred) return a.is_starred ? -1 : 1;

      // Projects without due dates go to the bottom
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;

      // Sort by due date (earliest first)
      const dateA = parseDateString(a.due_date)?.getTime() ?? Infinity;
      const dateB = parseDateString(b.due_date)?.getTime() ?? Infinity;
      return dateA - dateB;
    });
  };

  const checkColumnScroll = (columnId: string) => {
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
  }, [projects, columns]);

  // Find and store reference to parent .viewContent container
  useEffect(() => {
    if (containerRef.current) {
      // Find parent with class containing "viewContent"
      const viewContentElement = containerRef.current.closest('[class*="viewContent"]') as HTMLDivElement;
      viewContentRef.current = viewContentElement;
    }
  }, []);

  // Auto-scroll when dragging near edges
  const handleDragOverContainer = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const scrollZoneWidth = 100; // pixels from edge to trigger scroll
      const scrollSpeed = 15; // pixels per interval

      const mouseX = e.clientX - containerRect.left;

      // Clear any existing interval
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }

      // Check if near left edge
      if (mouseX < scrollZoneWidth && container.scrollLeft > 0) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (container.scrollLeft > 0) {
            container.scrollLeft -= scrollSpeed;
          } else if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
          }
        }, 50);
      }
      // Check if near right edge
      else if (
        mouseX > containerRect.width - scrollZoneWidth &&
        container.scrollLeft + container.clientWidth < container.scrollWidth
      ) {
        autoScrollIntervalRef.current = setInterval(() => {
          if (
            container.scrollLeft + container.clientWidth <
            container.scrollWidth
          ) {
            container.scrollLeft += scrollSpeed;
          } else if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
          }
        }, 50);
      }
    },
    [isDragging]
  );

  // Clean up auto-scroll interval
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, []);

  // Click-and-drag scroll handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start drag if clicking on the container itself, not on cards
    const target = e.target as HTMLElement;
    if (
      target.closest(`.${styles.projectCard}`) ||
      target.closest(`.${styles.draggableProject}`)
    ) {
      return;
    }

    const viewContent = viewContentRef.current;
    if (!viewContent) return;

    setIsMouseDown(true);
    setStartX(e.clientX); // Use clientX for more accurate positioning
    setScrollLeft(viewContent.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown) return;
    e.preventDefault();

    const viewContent = viewContentRef.current;
    if (!viewContent) return;

    const x = e.clientX;
    const distance = startX - x; // Calculate how far we've moved
    viewContent.scrollLeft = scrollLeft + distance;
  };

  // Drag handlers
  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    projectId: string,
    columnId: string
  ) => {
    setDraggedId(projectId);
    setDraggedFromColumn(columnId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    // Clear auto-scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Show confirmation before changing department
    if (draggedId && dropToColumn && draggedFromColumn !== dropToColumn) {
      const draggedProject = projects.find(p => p.id === draggedId);
      const targetColumn = columns.find(c => c.id === dropToColumn);
      if (draggedProject && targetColumn) {
        setPendingDepartmentChange({
          project: draggedProject,
          departmentId: dropToColumn,
          departmentName: targetColumn.title,
        });
      }
    }

    // Reset drag state (but not pending change — that awaits confirmation)
    setDraggedId(null);
    setDraggedFromColumn(null);
    setDropToColumn(null);
    setIsDragging(false);
  };

  const handleColumnDragOver = (
    e: DragEvent<HTMLDivElement>,
    columnId: string
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropToColumn(columnId);
  };

  const handleColumnDrop = (e: DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    setDropToColumn(columnId);
    // The actual department change happens in handleDragEnd
  };

  const expandedColumn = expandedColumnId
    ? columns.find(c => c.id === expandedColumnId) ?? null
    : null;
  const expandedProjects = expandedColumnId
    ? getProjectsByDepartment(expandedColumnId)
    : [];

  return (
    <div className={styles.kanbanWrapper}>
      <ConfirmationModal
        isOpen={!!pendingStatusChange}
        title="Mark Project Complete?"
        message="Are you sure you want to mark this project as complete?"
        confirmText="Mark Complete"
        onConfirm={() => {
          if (pendingStatusChange) {
            onUpdateProject({
              ...pendingStatusChange.project,
              status: 'complete',
            });
          }
          setPendingStatusChange(null);
        }}
        onCancel={() => setPendingStatusChange(null)}
      />

      <ConfirmationModal
        isOpen={!!pendingDepartmentChange}
        title="Move to Different Department?"
        message={pendingDepartmentChange ? `Move "${pendingDepartmentChange.project.name}" to the "${pendingDepartmentChange.departmentName}" department?` : ''}
        confirmText="Move Project"
        onConfirm={() => {
          if (pendingDepartmentChange) {
            onUpdateProject({
              ...pendingDepartmentChange.project,
              current_department_id: pendingDepartmentChange.departmentId,
            });
          }
          setPendingDepartmentChange(null);
        }}
        onCancel={() => setPendingDepartmentChange(null)}
      />
      {expandedColumn && (
        <div
          ref={expandedViewRef}
          className={`${styles.expandedView} ${isClosingExpanded ? styles.expandedViewClosing : ''}`}
        >
          <div className={styles.expandedHeader}>
            <div className={styles.expandedTitleRow}>
              {expandedColumn.icon && (
                <span className={styles.columnIcon}>{expandedColumn.icon}</span>
              )}
              <span className={styles.columnTitle}>{expandedColumn.title}</span>
              <span className={styles.columnCount}>
                ({expandedProjects.length})
              </span>
            </div>
            <button
              type="button"
              className={styles.closeExpandButton}
              onClick={handleCloseExpanded}
              aria-label="Close expanded view"
            >
              <X size={18} />
            </button>
          </div>
          <ProjectCardGrid
            projects={expandedProjects}
            taskStatsByProject={taskStatsByProject}
            userTaskStatsByProject={userTaskStatsByProject}
            onProjectClick={onProjectClick}
            onToggleStar={onToggleStar}
            onUpdateProject={onUpdateProject}
          />
        </div>
      )}

      {!expandedColumn && (
      <div
        ref={containerRef}
        className={`${styles.kanbanContainer} ${styles.departmentView}`}
        onDragOver={handleDragOverContainer}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className={`${styles.kanbanBoard} ${styles.departmentView}`}>
          {columns.map(column => {
            const columnProjects = getProjectsByDepartment(column.id);
            const hasUnreadMentions = columnProjects.some(project => project.has_unread_mentions);
            const isColumnDropTarget =
              isDragging &&
              dropToColumn === column.id &&
              draggedFromColumn !== column.id;

            return (
              <div
                key={column.id}
                className={`${styles.kanbanColumnWrapper} ${styles.departmentView}`}
              >
                <div className={styles.columnHeader}>
                  <div
                    className={styles.columnHeaderRow}
                    onClick={() => handleExpandColumn(column.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleExpandColumn(column.id);
                      }
                    }}
                  >
                    <span className={styles.columnTitle}>
                      {column.icon && <span className={styles.columnIcon}>{column.icon}</span>}
                      {column.title}
                    </span>
                    <span className={styles.columnCount}>
                      ({columnProjects.length})
                    </span>
                    <span className={styles.expandIcon}>
                      <Expand size={13} />
                    </span>
                  </div>
                  <span
                    className={`${styles.columnNewComments} ${!hasUnreadMentions ? styles.columnNewCommentsPlaceholder : ''}`}
                    aria-hidden={!hasUnreadMentions}
                  >
                    Unread Comments
                  </span>
                </div>

                <div
                  className={`${styles.kanbanColumn} ${styles.departmentColumn} ${isColumnDropTarget ? styles.columnDropTarget : ''}`}
                  onDragOver={e => handleColumnDragOver(e, column.id)}
                  onDrop={e => handleColumnDrop(e, column.id)}
                >
                  <div
                    ref={el => {
                      columnRefs.current[column.id] = el;
                    }}
                    className={styles.columnContent}
                    onScroll={() => checkColumnScroll(column.id)}
                  >
                    {columnProjects.map(project => {
                      const isDraggedProject = draggedId === project.id;

                      return (
                        <div
                          key={project.id}
                          className={`
                          ${styles.draggableProject}
                          ${styles.draggable}
                          ${isDraggedProject ? styles.dragging : ''}
                        `}
                          draggable={true}
                          onDragStart={e => handleDragStart(e, project.id, column.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <ProjectCard
                            project={project}
                            taskStats={taskStatsByProject?.[project.id]}
                            userTaskStats={userTaskStatsByProject?.[project.id]}
                            onToggleStar={onToggleStar}
                            onProjectClick={onProjectClick}
                            onStatusChange={(proj, newStatus) => {
                              if (newStatus === 'complete') {
                                setPendingStatusChange({ project: proj, newStatus });
                              } else {
                                onUpdateProject({
                                  ...proj,
                                  status: newStatus as Project['status'],
                                });
                              }
                            }}
                          />
                        </div>
                      );
                    })}

                    {columnProjects.length === 0 && (
                      <div className={styles.emptyColumn}>
                        No projects in this department
                      </div>
                    )}
                  </div>

                  {columnScrollStates[column.id] && (
                    <div className={styles.scrollGradient} />
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}
