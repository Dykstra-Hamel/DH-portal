import React from 'react';
import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable';
import {
  Task,
  TaskStatus,
  TaskPriority,
  formatTaskDueDateTime,
  isTaskOverdue,
} from '@/types/task';
import { Eye, CheckCircle } from 'lucide-react';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

export const getTaskColumns = (
  showCompanyColumn: boolean = false,
  hideAssignedToColumn: boolean = false
): ColumnDefinition<Task>[] => {
  const columns: ColumnDefinition<Task>[] = [
    {
      key: 'title',
      title: 'Title',
      sortable: true,
      render: (task: Task) => (
        <div className="flex flex-col">
          <span className="font-medium">{task.title}</span>
          {task.related_entity && task.related_entity_type && (
            <span className="text-sm text-gray-500">
              Related to:{' '}
              {task.related_entity.title ||
                task.related_entity.name ||
                task.related_entity.summary ||
                `${task.related_entity_type.replace('_', ' ')}`}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (task: Task) => {
        const getStatusClassName = (status: TaskStatus): string => {
          switch (status) {
            case 'new':
              return `${styles.statusCell} ${styles.statusNew}`;
            case 'pending':
              return `${styles.statusCell} ${styles.statusPending}`;
            case 'in_progress':
              return `${styles.statusCell} ${styles.statusInProgress}`;
            case 'completed':
              return `${styles.statusCell} ${styles.statusCompleted}`;
            default:
              return styles.statusCell;
          }
        };

        return (
          <span className={getStatusClassName(task.status)}>
            {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        );
      },
    },
    {
      key: 'priority',
      title: 'Priority',
      sortable: true,
      render: (task: Task) => {
        const getPriorityClassName = (priority: TaskPriority): string => {
          return `${styles.priorityCell} ${styles[priority]}`;
        };

        return (
          <span className={getPriorityClassName(task.priority)}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        );
      },
    },
    ...(!hideAssignedToColumn
      ? [
          {
            key: 'assigned_to',
            title: 'Assigned To',
            sortable: true,
            sortKey: 'assigned_user.first_name',
            render: (task: Task) => (
              <div>
                {task.assigned_user ? (
                  <span>
                    {task.assigned_user.first_name}{' '}
                    {task.assigned_user.last_name}
                  </span>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'due_date',
      title: 'Due Date',
      sortable: true,
      render: (task: Task) => {
        const dueDateStr = formatTaskDueDateTime(task.due_date, task.due_time);
        const overdue = isTaskOverdue(task);

        if (!dueDateStr) {
          return <span className="text-gray-400">No due date</span>;
        }

        return (
          <span className={overdue ? 'text-red-600 font-medium' : ''}>
            {dueDateStr}
            {overdue && <span className="ml-1 text-xs">(Overdue)</span>}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: '',
      sortable: false,
      render: (task: Task, onAction?: (action: string, item: Task) => void) => (
        <div className={styles.taskActions}>
          <button
            className={styles.actionButton}
            onClick={e => {
              e.stopPropagation();
              onAction?.('view', task);
            }}
          >
            <Eye size={14} />
            View Task
          </button>
          <button
            className={styles.actionButton}
            onClick={e => {
              e.stopPropagation();
              onAction?.('complete', task);
            }}
          >
            <CheckCircle size={14} />
            Complete Task
          </button>
        </div>
      ),
    },
  ];

  if (showCompanyColumn) {
    columns.splice(2, 0, {
      key: 'company_id',
      title: 'Company',
      width: '150px',
      sortable: true,
      sortKey: 'company.name',
      render: (task: Task) => <span>{task.company?.name || 'Unknown'}</span>,
    });
  }

  return columns;
};

export const getTaskTabs = (
  excludeMyTasksTab: boolean = false
): TabDefinition<Task>[] => {
  const tabs: TabDefinition<Task>[] = [
    {
      key: 'all',
      label: 'All Tasks',
      filter: (tasks: Task[]) => tasks.filter(task => !task.archived),
      getCount: (tasks: Task[]) => tasks.filter(task => !task.archived).length,
    },
    {
      key: 'new',
      label: 'New',
      filter: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && task.status === 'new'),
      getCount: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && task.status === 'new').length,
    },
    {
      key: 'pending',
      label: 'Pending',
      filter: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && task.status === 'pending'),
      getCount: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && task.status === 'pending')
          .length,
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      filter: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && task.status === 'in_progress'),
      getCount: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && task.status === 'in_progress')
          .length,
    },
    {
      key: 'overdue',
      label: 'Overdue',
      filter: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && isTaskOverdue(task)),
      getCount: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && isTaskOverdue(task)).length,
    },
    {
      key: 'completed',
      label: 'Completed',
      filter: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && task.status === 'completed'),
      getCount: (tasks: Task[]) =>
        tasks.filter(task => !task.archived && task.status === 'completed')
          .length,
    },
    {
      key: 'my_tasks',
      label: 'My Tasks',
      filter: (tasks: Task[], currentUserId?: string) =>
        tasks.filter(
          task => !task.archived && task.assigned_to === currentUserId
        ),
      getCount: (tasks: Task[], currentUserId?: string) =>
        tasks.filter(
          task => !task.archived && task.assigned_to === currentUserId
        ).length,
    },
  ];

  // Filter out "My Tasks" tab if requested (e.g., when on My Tasks page)
  if (excludeMyTasksTab) {
    return tabs.filter(tab => tab.key !== 'my_tasks');
  }

  return tabs;
};
