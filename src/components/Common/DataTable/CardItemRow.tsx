'use client';

import React from 'react';
import { CardViewConfig } from './DataTable.types';
import styles from './DataTable.module.scss';

export interface CardItemRowProps<T> {
  item: T;
  config: CardViewConfig<T>;
  onAction?: (action: string, item: T) => void;
  rowKey?: string;
}

export default function CardItemRow<T>({
  item,
  config,
  onAction,
  rowKey,
}: CardItemRowProps<T>) {
  const handleClick = () => {
    onAction?.('navigate', item);
  };

  const hasBottomRow = !!(config.summary || config.avatar || config.statusBar);
  const isUnread = !!config.unread?.(item);

  const cardClassName = [
    styles.card,
    !hasBottomRow && styles.cardSingleRow,
    isUnread && styles.cardUnread,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClassName}
      onClick={handleClick}
      data-row-key={rowKey}
      role="button"
      tabIndex={0}
    >
      <div className={styles.cardTopRow}>
        {config.topFields.map(field => {
          const rendered = field.render(item);
          const content =
            typeof rendered === 'string' || typeof rendered === 'number' ? (
              <span className={styles.cardFieldValue}>{rendered}</span>
            ) : (
              rendered
            );
          return (
            <div key={field.key} className={styles.cardTopCell}>
              {content}
            </div>
          );
        })}
        {!hasBottomRow && config.primaryAction && (
          <div
            className={styles.cardAction}
            onClick={e => e.stopPropagation()}
          >
            {config.primaryAction(item)}
          </div>
        )}
      </div>

      {hasBottomRow && (
        <>
          <div className={styles.cardSeparator} />
          <div className={styles.cardBottomRow}>
            {config.summary && (
              <div className={styles.cardSummary}>
                {config.summary.label && (
                  <span className={styles.cardSummaryLabel}>
                    {config.summary.label}
                  </span>
                )}
                <span className={styles.cardSummaryText}>
                  {config.summary.render(item)}
                </span>
              </div>
            )}

            <div className={styles.cardMiddle}>
              {config.avatar && (
                <div className={styles.cardAvatar}>{config.avatar(item)}</div>
              )}
              {config.statusBar && (
                <div className={styles.cardStatusBar}>{config.statusBar(item)}</div>
              )}
            </div>

            {config.primaryAction && (
              <div
                className={styles.cardAction}
                onClick={e => e.stopPropagation()}
              >
                {config.primaryAction(item)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
