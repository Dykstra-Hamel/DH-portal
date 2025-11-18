import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { Project } from '@/types/project';
import { ProjectBadge } from '@/components/TaskManagement/shared/ProjectBadge';
import styles from './ProjectKanbanView.module.scss';

type ProjectStatus = 'coming_up' | 'design' | 'development' | 'out_to_client' | 'waiting_on_client' | 'bill_client';

interface ProjectKanbanViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
}

interface Column {
  id: ProjectStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'coming_up', title: 'Coming Up', color: '#6b7280' },
  { id: 'design', title: 'Design', color: '#8b5cf6' },
  { id: 'development', title: 'Development', color: '#3b82f6' },
  { id: 'out_to_client', title: 'Out To Client', color: '#f59e0b' },
  { id: 'waiting_on_client', title: 'Waiting On Client', color: '#ef4444' },
  { id: 'bill_client', title: 'Bill Client', color: '#10b981' },
];

export function ProjectKanbanView({ projects, onProjectClick, onUpdateProject }: ProjectKanbanViewProps) {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ProjectStatus | null>(null);
  const [columnScrollStates, setColumnScrollStates] = useState<Record<ProjectStatus, boolean>>({
    'coming_up': false,
    'design': false,
    'development': false,
    'out_to_client': false,
    'waiting_on_client': false,
    'bill_client': false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<ProjectStatus, HTMLDivElement | null>>({
    'coming_up': null,
    'design': null,
    'development': null,
    'out_to_client': null,
    'waiting_on_client': null,
    'bill_client': null,
  });
  const scrollAnimationRef = useRef<number | null>(null);

  const getProjectsByStatus = (status: ProjectStatus): Project[] => {
    return projects.filter(project => project.status === status);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverColumn(null);

    // Stop auto-scroll
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.clientX === 0) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const scrollEdgeSize = 100; // Distance from edge to trigger scroll
    const maxScrollSpeed = 10; // Maximum scroll speed

    // Calculate distance from edges
    const distanceFromLeft = e.clientX - containerRect.left;
    const distanceFromRight = containerRect.right - e.clientX;

    // Determine scroll direction and speed
    let scrollSpeed = 0;

    if (distanceFromLeft < scrollEdgeSize && distanceFromLeft > 0) {
      // Near left edge - scroll left
      scrollSpeed = -maxScrollSpeed * (1 - distanceFromLeft / scrollEdgeSize);
    } else if (distanceFromRight < scrollEdgeSize && distanceFromRight > 0) {
      // Near right edge - scroll right
      scrollSpeed = maxScrollSpeed * (1 - distanceFromRight / scrollEdgeSize);
    }

    // Apply scroll
    if (scrollSpeed !== 0) {
      const scroll = () => {
        if (container) {
          container.scrollLeft += scrollSpeed;
          scrollAnimationRef.current = requestAnimationFrame(scroll);
        }
      };

      // Cancel previous animation and start new one
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      scrollAnimationRef.current = requestAnimationFrame(scroll);
    } else if (scrollAnimationRef.current) {
      // Stop scrolling if not near edge
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

  const checkColumnScroll = (columnId: ProjectStatus) => {
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

  const handleDragEnter = (status: ProjectStatus) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: ProjectStatus) => {
    e.preventDefault();

    if (draggedProject && draggedProject.status !== newStatus) {
      const updatedProject: Project = {
        ...draggedProject,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      onUpdateProject(updatedProject);
    }

    setDraggedProject(null);
    setDragOverColumn(null);
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
          const columnProjects = getProjectsByStatus(column.id);
          const isDragOver = dragOverColumn === column.id;

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
                      className={styles.draggableProject}
                      draggable
                      onDragStart={(e) => handleDragStart(e, project)}
                      onDragEnd={handleDragEnd}
                      onDrag={handleDrag}
                      onClick={() => onProjectClick(project)}
                    >
                      <div className={styles.projectCard}>
                        <div className={styles.projectHeader}>
                          <h3 className={styles.projectName}>{project.name}</h3>
                          <ProjectBadge
                            projectName={project.name}
                            projectType={project.project_type as any}
                            size="small"
                          />
                        </div>

                        <div className={styles.projectClient}>
                          {project.company.name}
                        </div>

                        <div className={styles.projectFooter}>
                          <div className={styles.projectPriority}>
                            <span className={styles.priorityText}>
                              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                            </span>
                          </div>
                          <div className={styles.projectDeadline}>
                            Due: {formatDate(project.due_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnProjects.length === 0 && (
                  <div className={styles.emptyColumn}>
                    No projects in this phase
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
