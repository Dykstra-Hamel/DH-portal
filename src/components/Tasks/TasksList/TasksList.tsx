'use client';

import React, { useState } from 'react';
import { Task } from '@/types/task';
import { DataTable } from '@/components/Common/DataTable';
import { getTaskColumns, getTaskTabs } from './TasksListConfig';
import { TabDefinition } from '@/components/Common/DataTable';
import { Toast } from '@/components/Common/Toast';

interface TasksListProps {
  tasks: Task[];
  loading?: boolean;
  onTaskUpdated?: () => void;
  onEdit?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onUnarchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onComplete?: (taskId: string, actualHours?: number) => void;
  showArchived?: boolean;
  showCompanyColumn?: boolean;
  userProfile?: { role?: string; id?: string };
  customTabs?: TabDefinition<Task>[] | null;
}

function TasksList({
  tasks,
  loading = false,
  onTaskUpdated,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  onComplete,
  showArchived = false,
  showCompanyColumn = false,
  userProfile,
  customTabs,
}: TasksListProps) {
  // Toast state for undo functionality
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showUndoOnToast, setShowUndoOnToast] = useState(false);
  const [previousTaskState, setPreviousTaskState] = useState<any>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Handle item actions (edit, archive, etc.)
  const handleItemAction = (action: string, task: Task) => {
    if (action === 'edit') {
      onEdit?.(task);
    } else if (action === 'archive') {
      handleArchiveTask(task.id);
    } else if (action === 'unarchive') {
      handleUnarchiveTask(task.id);
    } else if (action === 'delete') {
      handleDeleteTask(task.id);
    } else if (action === 'complete') {
      handleCompleteTask(task.id);
    } else if (action === 'reopen') {
      handleReopenTask(task.id);
    }
  };

  const handleArchiveTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setPreviousTaskState({ id: taskId, archived: false });
    setToastMessage(`Task "${task.title}" archived`);
    setShowUndoOnToast(true);
    setShowToast(true);
    onArchive?.(taskId);
  };

  const handleUnarchiveTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setPreviousTaskState({ id: taskId, archived: true });
    setToastMessage(`Task "${task.title}" unarchived`);
    setShowUndoOnToast(true);
    setShowToast(true);
    onUnarchive?.(taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (window.confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
      onDelete?.(taskId);
    }
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // For now, complete without asking for actual hours
    // TODO: Add modal to capture actual hours
    onComplete?.(taskId);
  };

  const handleReopenTask = (taskId: string) => {
    // Reopen by changing status back to in_progress
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // This would need to call an update endpoint
    // For now, just trigger the updated callback
    onTaskUpdated?.();
  };

  const handleUndoAction = async () => {
    if (!previousTaskState || isUndoing) return;

    setIsUndoing(true);
    try {
      if (previousTaskState.archived) {
        onArchive?.(previousTaskState.id);
      } else {
        onUnarchive?.(previousTaskState.id);
      }
    } finally {
      setIsUndoing(false);
      setPreviousTaskState(null);
      setShowToast(false);
    }
  };

  const handleCloseToast = () => {
    setShowToast(false);
    setPreviousTaskState(null);
  };


  // Use custom tabs if provided, otherwise use default tabs
  const tabs = customTabs === null ? [] : (customTabs || getTaskTabs());

  // Filter tabs based on current context
  const filteredTabs = tabs.map(tab => ({
    ...tab,
    filter: (tasks: Task[]) => tab.filter(tasks),
    getCount: (tasks: Task[]) => tab.getCount(tasks),
  }));

  return (
    <>
      <DataTable
        data={tasks}
        loading={loading}
        title="Tasks"
        columns={getTaskColumns(showCompanyColumn, userProfile?.role)}
        tabs={filteredTabs}
        onItemAction={handleItemAction}
        onDataUpdated={onTaskUpdated}
      />

      {showToast && (
        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={handleCloseToast}
          showUndo={showUndoOnToast}
          onUndo={handleUndoAction}
          undoLoading={isUndoing}
        />
      )}
    </>
  );
}

export default TasksList;