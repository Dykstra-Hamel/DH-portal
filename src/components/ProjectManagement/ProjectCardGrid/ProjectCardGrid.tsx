import React from 'react';
import { Project } from '@/types/project';
import { ProjectCard } from '@/components/Common/ProjectCard/ProjectCard';
import kanbanStyles from '../ProjectKanbanView/ProjectKanbanView.module.scss';
import styles from './ProjectCardGrid.module.scss';

interface ProjectCardGridProps {
  projects: Project[];
  taskStatsByProject?: Record<string, { completed: number; total: number }>;
  userTaskStatsByProject?: Record<string, { completed: number; total: number }>;
  onProjectClick: (project: Project) => void;
  onToggleStar?: (projectId: string) => void;
  onUpdateProject?: (project: Project) => void;
}

export function ProjectCardGrid({
  projects,
  taskStatsByProject,
  userTaskStatsByProject,
  onProjectClick,
  onToggleStar,
  onUpdateProject,
}: ProjectCardGridProps) {
  if (!projects.length) {
    return <div className={kanbanStyles.emptyColumn}>No projects to display</div>;
  }

  return (
    <div className={styles.grid}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          taskStats={taskStatsByProject?.[project.id]}
          userTaskStats={userTaskStatsByProject?.[project.id]}
          onProjectClick={onProjectClick}
          onToggleStar={onToggleStar}
          onStatusChange={onUpdateProject ? (proj, newStatus) => {
            onUpdateProject({
              ...proj,
              status: newStatus as Project['status'],
            });
          } : undefined}
        />
      ))}
    </div>
  );
}
