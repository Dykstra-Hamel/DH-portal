import React, { useState } from 'react';
import { Project } from '@/types/project';
import { ProjectCard } from '@/components/Common/ProjectCard/ProjectCard';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';
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
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    project: Project;
    newStatus: string;
  } | null>(null);

  if (!projects.length) {
    return <div className={kanbanStyles.emptyColumn}>No projects to display</div>;
  }

  return (
    <>
      <ConfirmationModal
        isOpen={!!pendingStatusChange}
        title="Mark Project Complete?"
        message="Are you sure you want to mark this project as complete?"
        confirmText="Mark Complete"
        onConfirm={() => {
          if (pendingStatusChange && onUpdateProject) {
            onUpdateProject({
              ...pendingStatusChange.project,
              status: 'complete',
            });
          }
          setPendingStatusChange(null);
        }}
        onCancel={() => setPendingStatusChange(null)}
      />
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
              if (newStatus === 'complete') {
                setPendingStatusChange({ project: proj, newStatus });
              } else {
                onUpdateProject({
                  ...proj,
                  status: newStatus as Project['status'],
                });
              }
            } : undefined}
          />
        ))}
      </div>
    </>
  );
}
