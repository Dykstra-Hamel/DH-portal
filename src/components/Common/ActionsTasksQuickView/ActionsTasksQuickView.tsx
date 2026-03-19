'use client';

import { Task } from '@/types/task';
import styles from './ActionsTasksQuickView.module.scss';

interface ActionsTasksQuickViewProps {
  loading: boolean;
  actions: Task[];
  tasks: Task[];
  onActionItemClick: (task: Task) => void;
  onTaskItemClick: (task: Task) => void;
  onViewAllActions: () => void;
  onViewAllTasks: () => void;
}

export default function ActionsTasksQuickView({
  loading,
  actions,
  tasks,
  onActionItemClick,
  onTaskItemClick,
  onViewAllActions,
  onViewAllTasks,
}: ActionsTasksQuickViewProps) {
  if (!loading && actions.length === 0 && tasks.length === 0) {
    return null;
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.panel}>
        <div className={styles.columns}>
          {/* Actions Column */}
          {(loading || actions.length > 0) && (
            <div className={styles.column}>
              {loading ? (
                <div className={styles.skeleton}>
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <>
                  <p className={styles.columnTitle}>
                    You have {actions.length} Action{actions.length !== 1 ? 's' : ''} that {actions.length !== 1 ? 'require' : 'requires'} your attention
                  </p>
                  <ul className={styles.list}>
                    {actions.slice(0, 5).map(task => (
                      <li key={task.id}>
                        <button
                          className={styles.item}
                          onClick={() => onActionItemClick(task)}
                          title={task.title}
                        >
                          {task.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button className={styles.viewAll} onClick={onViewAllActions}>
                    View All Actions
                  </button>
                </>
              )}
            </div>
          )}

          {/* Tasks Column */}
          {(loading || tasks.length > 0) && (
            <div className={styles.column}>
              {loading ? (
                <div className={styles.skeleton}>
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <>
                  <p className={styles.columnTitle}>
                    You have {tasks.length} Personal Task{tasks.length !== 1 ? 's' : ''}
                  </p>
                  <ul className={styles.list}>
                    {tasks.slice(0, 5).map(task => (
                      <li key={task.id}>
                        <button
                          className={styles.item}
                          onClick={() => onTaskItemClick(task)}
                          title={task.title}
                        >
                          {task.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button className={styles.viewAll} onClick={onViewAllTasks}>
                    View All Tasks
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
