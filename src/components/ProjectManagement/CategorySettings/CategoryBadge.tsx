import React from 'react';
import { ProjectCategory } from '@/types/project';
import styles from './CategorySettings.module.scss';

interface CategoryBadgeProps {
  category: ProjectCategory;
  showIcon?: boolean;
}

export default function CategoryBadge({ category, showIcon = false }: CategoryBadgeProps) {
  return (
    <span className={styles.categoryBadge}>
      {showIcon && <span className={styles.categoryBadgeIcon} aria-hidden="true" />}
      {category.name}
    </span>
  );
}
