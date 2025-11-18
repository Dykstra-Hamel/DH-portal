import React from 'react';
import { TaskPriority } from '@/types/taskManagement';
import styles from './PriorityBadge.module.scss';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'small' | 'medium';
}

export function PriorityBadge({ priority, size = 'medium' }: PriorityBadgeProps) {
  const priorityLabels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };

  return (
    <span className={`${styles.priorityBadge} ${styles[priority]} ${styles[size]}`}>
      {priorityLabels[priority]}
    </span>
  );
}
