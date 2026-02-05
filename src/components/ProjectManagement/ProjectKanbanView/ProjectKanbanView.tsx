import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  DragEvent,
} from 'react';
import { Project, ProjectDepartment } from '@/types/project';
import { ProjectCard } from '@/components/Common/ProjectCard/ProjectCard';
import { parseDateString } from '@/lib/date-utils';
import styles from './ProjectKanbanView.module.scss';

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
  // Simple drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(
    null
  );
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(
    null
  );
  const [dropToColumn, setDropToColumn] = useState<string | null>(null);

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

  const getProjectsByDepartment = (columnId: string): Project[] => {
    // Projects assigned to this department
    const departmentProjects = projects.filter(p => p.current_department_id === columnId);

    // Sort by closest due date at top
    return [...departmentProjects].sort((a, b) => {
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

    // Handle department change when dragging between columns
    if (
      draggedId &&
      dropToColumn &&
      draggedFromColumn !== dropToColumn
    ) {
      const draggedProject = projects.find(p => p.id === draggedId);
      if (draggedProject && onUpdateProject) {
        onUpdateProject({
          ...draggedProject,
          current_department_id: dropToColumn,
        });
      }
    }

    // Reset all drag state
    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
    setDraggedFromColumn(null);
    setDropToColumn(null);
    setIsDragging(false);
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

  const handleColumnDragOver = (
    e: DragEvent<HTMLDivElement>,
    columnId: string
  ) => {
    e.preventDefault();
    setDropToColumn(columnId);
  };

  const handleColumnDrop = (e: DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    setDropToColumn(columnId);
    // The actual department change happens in handleDragEnd
  };

  return (
    <div className={styles.kanbanWrapper}>
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

            return (
              <div
                key={column.id}
                className={`${styles.kanbanColumnWrapper} ${styles.departmentView}`}
              >
                <div className={styles.columnHeader}>
                  <span className={styles.columnTitle}>
                    {column.icon && <span className={styles.columnIcon}>{column.icon}</span>}
                    {column.title}
                  </span>
                  <span className={styles.columnCount}>
                    ({columnProjects.length})
                  </span>
                </div>

                <div
                  className={`${styles.kanbanColumn} ${styles.departmentColumn}`}
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
                    {columnProjects.length === 0 &&
                      isDragging &&
                      dropToColumn === column.id && (
                        <div className={styles.emptyDropIndicator} />
                      )}
                    {columnProjects.map(project => {
                      const isDragging = draggedId === project.id;
                      const isDropTarget = dropTargetId === project.id;
                      const showDropBefore =
                        isDropTarget && dropPosition === 'before';
                      const showDropAfter =
                        isDropTarget && dropPosition === 'after';

                      return (
                        <div
                          key={project.id}
                          className={`
                          ${styles.draggableProject}
                          ${styles.draggable}
                          ${isDragging ? styles.dragging : ''}
                          ${showDropBefore ? styles.dropBefore : ''}
                          ${showDropAfter ? styles.dropAfter : ''}
                        `}
                          draggable={true}
                          onDragStart={e => handleDragStart(e, project.id, column.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={e => handleDragOver(e, project.id)}
                          onDragLeave={handleDragLeave}
                        >
                          <ProjectCard
                            project={project}
                            taskStats={taskStatsByProject?.[project.id]}
                            userTaskStats={userTaskStatsByProject?.[project.id]}
                            onToggleStar={onToggleStar}
                            onProjectClick={onProjectClick}
                            onStatusChange={(proj, newStatus) => {
                              onUpdateProject({
                                ...proj,
                                status: newStatus as Project['status'],
                              });
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
    </div>
  );
}
