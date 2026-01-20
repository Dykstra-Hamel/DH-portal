'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Task } from '@/types/task';
import { DataTable } from '@/components/Common/DataTable';
import { getTaskColumns, getTaskTabs } from './TasksListConfig';
import { TabDefinition } from '@/components/Common/DataTable';
import { Toast } from '@/components/Common/Toast';
import styles from '@/components/Common/DataTable/DataTableTabs.module.scss';

interface TasksListProps {
  tasks: Task[];
  loading?: boolean;
  onTaskUpdated?: () => void;
  onEdit?: (task: Task) => void;
  onView?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onUnarchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onComplete?: (taskId: string, actualHours?: number) => void;
  showArchived?: boolean;
  showCompanyColumn?: boolean;
  userProfile?: { role?: string; id?: string };
  customTabs?: TabDefinition<Task>[] | null;
  customColumnWidths?: string; // Custom CSS grid template columns (e.g., "2fr 120px 100px 180px 200px 300px")
}

function TasksList({
  tasks,
  loading = false,
  onTaskUpdated,
  onEdit,
  onView,
  onArchive,
  onUnarchive,
  onDelete,
  onComplete,
  showArchived = false,
  showCompanyColumn = false,
  userProfile,
  customTabs,
  customColumnWidths,
}: TasksListProps) {
  // Tab and search state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast state for undo functionality
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showUndoOnToast, setShowUndoOnToast] = useState(false);
  const [previousTaskState, setPreviousTaskState] = useState<any>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
  }, []);

  // Handle item actions (edit, archive, etc.)
  const handleItemAction = (action: string, task: Task) => {
    if (action === 'view') {
      onView?.(task);
    } else if (action === 'edit') {
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

  // Filter data based on active tab
  const filteredByTab = useMemo(() => {
    if (!filteredTabs || filteredTabs.length === 0) return tasks;
    const activeTabConfig = filteredTabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return tasks;
    return activeTabConfig.filter(tasks);
  }, [tasks, activeTab, filteredTabs]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;

    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(task => {
      // Search in title
      if (task.title?.toLowerCase().includes(query)) return true;

      // Search in description
      if (task.description?.toLowerCase().includes(query)) return true;

      // Search in status
      if (task.status?.toLowerCase().includes(query)) return true;

      // Search in priority
      if (task.priority?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [filteredByTab, searchQuery]);

  return (
    <>
      {/* Tabs and Search Row */}
      {filteredTabs && filteredTabs.length > 0 && (
        <div className={styles.tabsRow}>
          <div className={styles.tabsSection}>
            {filteredTabs.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
                {tab.getCount && (
                  <span className={styles.tabCount}>
                    {tab.getCount(tasks)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>
      )}

      {/* DataTable Component */}
      <DataTable
        data={filteredData}
        loading={loading}
        title="Tasks"
        columns={getTaskColumns(showCompanyColumn)}
        onItemAction={handleItemAction}
        onDataUpdated={onTaskUpdated}
        tableType="tasks"
        customColumnWidths={customColumnWidths}
        searchEnabled={false}
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