import React from 'react';
import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable';
import { Task, getTaskStatusColor, getTaskPriorityColor, formatTaskDueDateTime, isTaskOverdue } from '@/types/task';

export const getTaskColumns = (
  showCompanyColumn: boolean = false,
  userRole?: string
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
              Related to: {task.related_entity.title || 
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
      width: '100px',
      sortable: true,
      render: (task: Task) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium bg-${getTaskStatusColor(
            task.status
          )}-100 text-${getTaskStatusColor(task.status)}-800`}
        >
          {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      width: '90px',
      sortable: true,
      render: (task: Task) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium bg-${getTaskPriorityColor(
            task.priority
          )}-100 text-${getTaskPriorityColor(task.priority)}-800`}
        >
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      ),
    },
    {
      key: 'assigned_to',
      title: 'Assigned To',
      width: '150px',
      sortable: true,
      sortKey: 'assigned_user.first_name',
      render: (task: Task) => (
        <div>
          {task.assigned_user ? (
            <span>
              {task.assigned_user.first_name} {task.assigned_user.last_name}
            </span>
          ) : (
            <span className="text-gray-400">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'due_date',
      title: 'Due Date',
      width: '150px',
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
            {overdue && (
              <span className="ml-1 text-xs">(Overdue)</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      title: 'Created',
      width: '120px',
      sortable: true,
      render: (task: Task) => (
        <span className="text-sm">
          {new Date(task.created_at).toLocaleDateString()}
        </span>
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
      render: (task: Task) => (
        <span>{task.company?.name || 'Unknown'}</span>
      ),
    });
  }

  return columns;
};

export const getTaskTabs = (): TabDefinition<Task>[] => [
  {
    key: 'all',
    label: 'All Tasks',
    filter: (tasks: Task[]) => tasks.filter(task => !task.archived),
    getCount: (tasks: Task[]) => tasks.filter(task => !task.archived).length,
  },
  {
    key: 'new',
    label: 'New',
    filter: (tasks: Task[]) => tasks.filter(task => !task.archived && task.status === 'new'),
    getCount: (tasks: Task[]) => tasks.filter(task => !task.archived && task.status === 'new').length,
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    filter: (tasks: Task[]) => tasks.filter(task => !task.archived && task.status === 'in_progress'),
    getCount: (tasks: Task[]) => tasks.filter(task => !task.archived && task.status === 'in_progress').length,
  },
  {
    key: 'overdue',
    label: 'Overdue',
    filter: (tasks: Task[]) => tasks.filter(task => !task.archived && isTaskOverdue(task)),
    getCount: (tasks: Task[]) => tasks.filter(task => !task.archived && isTaskOverdue(task)).length,
  },
  {
    key: 'completed',
    label: 'Completed',
    filter: (tasks: Task[]) => tasks.filter(task => !task.archived && task.status === 'completed'),
    getCount: (tasks: Task[]) => tasks.filter(task => !task.archived && task.status === 'completed').length,
  },
  {
    key: 'my_tasks',
    label: 'My Tasks',
    filter: (tasks: Task[], currentUserId?: string) => 
      tasks.filter(task => !task.archived && task.assigned_to === currentUserId),
    getCount: (tasks: Task[], currentUserId?: string) => 
      tasks.filter(task => !task.archived && task.assigned_to === currentUserId).length,
  },
];