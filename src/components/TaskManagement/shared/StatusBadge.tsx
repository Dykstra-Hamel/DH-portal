import React from 'react';
import { TaskStatus } from '@/types/taskManagement';
import styles from './StatusBadge.module.scss';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const statusLabels: Record<TaskStatus, string> = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    review: 'Review',
    completed: 'Completed',
  };

  return (
    <span className={`${styles.statusBadge} ${styles[status]} ${styles[size]}`}>
      {statusLabels[status]}
    </span>
  );
}
