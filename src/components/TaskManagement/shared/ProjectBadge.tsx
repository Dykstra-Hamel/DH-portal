import React from 'react';
import { ProjectType } from '@/types/taskManagement';
import styles from './ProjectBadge.module.scss';

interface ProjectBadgeProps {
  projectName: string;
  projectType: ProjectType;
  size?: 'small' | 'medium';
}

export function ProjectBadge({ projectName, projectType, size = 'medium' }: ProjectBadgeProps) {
  return (
    <span className={`${styles.projectBadge} ${styles[projectType]} ${styles[size]}`}>
      {projectName}
    </span>
  );
}
