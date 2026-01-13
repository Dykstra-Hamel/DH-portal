import React from 'react';
import { ProjectCategory } from '@/types/project';
import styles from './CategorySettings.module.scss';

interface CategoryBadgeProps {
  category: ProjectCategory;
  showIcon?: boolean;
}

export default function CategoryBadge({ category, showIcon = false }: CategoryBadgeProps) {
  const badgeStyle = category.color
    ? {
        backgroundColor: `${category.color}20`, // 20% opacity
        color: category.color,
        borderColor: `${category.color}40`,
      }
    : {};

  return (
    <span
      className={styles.categoryBadge}
      style={badgeStyle}
    >
      {showIcon && category.icon && (
        <span>{category.icon}</span>
      )}
      {category.name}
    </span>
  );
}
