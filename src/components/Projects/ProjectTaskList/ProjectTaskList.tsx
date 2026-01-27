'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Check, ChevronDown, Pencil, Calendar, MessageSquare, Trash2, GripVertical } from 'lucide-react';
import { ProjectTask } from '@/types/project';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import styles from './ProjectTaskList.module.scss';

interface ProjectTaskListProps {
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onUpdateTask?: (taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onReorderTasks?: (taskIds: string[]) => Promise<void>;
  onToggleStar?: (taskId: string) => void;
  isStarred?: (taskId: string) => boolean;
  isLoading?: boolean;
  showHeader?: boolean;
}

export default function ProjectTaskList({
  tasks,
  onTaskClick,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
  onToggleStar,
  isStarred,
  isLoading = false,
  showHeader = true,
}: ProjectTaskListProps) {
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [datePickerTaskId, setDatePickerTaskId] = useState<string | null>(null);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setDatePickerTaskId(null);
      }
    };

    if (datePickerTaskId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [datePickerTaskId]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // First sort by display_order if available
      if (a.display_order !== undefined && b.display_order !== undefined) {
        return a.display_order - b.display_order;
      }
      // Fall back to due_date sorting
      const aVal = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bVal = b.due_date ? new Date(b.due_date).getTime() : Infinity;

      if (aVal === bVal) {
        return (a.title || '').localeCompare(b.title || '');
      }

      return aVal - bVal;
    });
  }, [tasks]);

  const childTasksByParent = useMemo(() => {
    const map = new Map<string, ProjectTask[]>();
    sortedTasks.forEach(task => {
      if (!task.parent_task_id) return;
      const list = map.get(task.parent_task_id) || [];
      list.push(task);
      map.set(task.parent_task_id, list);
    });
    return map;
  }, [sortedTasks]);

  const topLevelTasks = useMemo(() => {
    return sortedTasks.filter(task => !task.parent_task_id);
  }, [sortedTasks]);

  const toggleTaskCollapse = (event: React.MouseEvent, taskId: string) => {
    event.stopPropagation();
    setCollapsedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleToggleComplete = (
    event: React.MouseEvent,
    task: ProjectTask
  ) => {
    event.stopPropagation();
    onToggleComplete(task.id, !task.is_completed);
  };

  // Edit task name handlers
  const handleEditClick = (event: React.MouseEvent, task: ProjectTask) => {
    event.stopPropagation();
    setEditingTaskId(task.id);
    setEditingTitle(task.title || '');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleEditSave = async (taskId: string) => {
    if (onUpdateTask && editingTitle.trim()) {
      await onUpdateTask(taskId, { title: editingTitle.trim() });
    }
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleEditCancel = () => {
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleEditKeyDown = (event: React.KeyboardEvent, taskId: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleEditSave(taskId);
    } else if (event.key === 'Escape') {
      handleEditCancel();
    }
  };

  // Date picker handlers
  const handleCalendarClick = (event: React.MouseEvent, taskId: string) => {
    event.stopPropagation();
    setDatePickerTaskId(datePickerTaskId === taskId ? null : taskId);
  };

  const handleDateSelect = async (taskId: string, date: string) => {
    if (onUpdateTask) {
      await onUpdateTask(taskId, { due_date: date });
    }
    setDatePickerTaskId(null);
  };

  // Comment icon click - navigate to task and focus comments
  const handleCommentClick = (event: React.MouseEvent, task: ProjectTask) => {
    event.stopPropagation();
    // Navigate to task - the parent component handles this
    onTaskClick(task);
    // TODO: Add a way to signal that we want to scroll to comments
  };

  // Delete handlers
  const handleDeleteClick = (event: React.MouseEvent, taskId: string) => {
    event.stopPropagation();
    setDeleteConfirmTaskId(taskId);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmTaskId && onDeleteTask) {
      await onDeleteTask(deleteConfirmTaskId);
    }
    setDeleteConfirmTaskId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmTaskId(null);
  };

  // Drag and drop handlers
  const handleDragStart = (event: React.DragEvent, taskId: string) => {
    event.stopPropagation();
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (draggedTaskId && dropTargetId && dropPosition && onReorderTasks) {
      const currentOrder = topLevelTasks.map(t => t.id);
      const draggedIndex = currentOrder.indexOf(draggedTaskId);
      const targetIndex = currentOrder.indexOf(dropTargetId);

      if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
        const newOrder = [...currentOrder];
        newOrder.splice(draggedIndex, 1);
        const newTargetIndex = newOrder.indexOf(dropTargetId);
        const insertIndex = dropPosition === 'before' ? newTargetIndex : newTargetIndex + 1;
        newOrder.splice(insertIndex, 0, draggedTaskId);
        onReorderTasks(newOrder);
      }
    }

    setDraggedTaskId(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  const handleDragOver = (event: React.DragEvent, taskId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (!draggedTaskId || draggedTaskId === taskId) {
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = event.clientY < midY ? 'before' : 'after';

    setDropTargetId(taskId);
    setDropPosition(position);
  };

  // Generate calendar days for the date picker
  const generateCalendarDays = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);

    // Parse the date string directly to avoid timezone issues
    let selectedDate = null;
    let currentMonth = new Date();

    if (task?.due_date) {
      const [year, month, day] = task.due_date.split('-').map(Number);
      selectedDate = new Date(year, month - 1, day);
      currentMonth = selectedDate;
    }

    const today = new Date();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate ? date.toDateString() === selectedDate.toDateString() : false,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    return { days, monthLabel: currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  const renderTaskRow = (
    task: ProjectTask,
    isSubtask: boolean = false,
    isLastRow: boolean = false
  ) => {
    const isEditing = editingTaskId === task.id;
    const showDatePicker = datePickerTaskId === task.id;
    const isDragging = draggedTaskId === task.id;
    const isDropTarget = dropTargetId === task.id;
    const showDropBefore = isDropTarget && dropPosition === 'before';
    const showDropAfter = isDropTarget && dropPosition === 'after';
    const hasChildren = !isSubtask && (childTasksByParent.get(task.id) || []).length > 0;
    const isCollapsed = !!collapsedTasks[task.id];
    const profile = task.assigned_to_profile;

    return (
      <div
        key={task.id}
        className={`
          ${styles.taskRowWrapper}
          ${isDragging ? styles.dragging : ''}
          ${showDropBefore ? styles.dropBefore : ''}
          ${showDropAfter ? styles.dropAfter : ''}
        `}
        draggable={!isSubtask && !!onReorderTasks}
        onDragStart={!isSubtask ? (e) => handleDragStart(e, task.id) : undefined}
        onDragEnd={!isSubtask ? handleDragEnd : undefined}
        onDragOver={!isSubtask ? (e) => handleDragOver(e, task.id) : undefined}
      >
        <div
          className={`${styles.taskRow} ${isSubtask ? styles.subtaskRow : ''} ${task.is_completed ? styles.completed : ''} ${isLastRow ? styles.taskRowLast : ''}`}
          onClick={() => !isEditing && onTaskClick(task)}
        >
          {/* Drag handle - only for top-level tasks */}
          {!isSubtask && onReorderTasks && (
            <div className={styles.dragHandle}>
              <GripVertical size={16} />
            </div>
          )}

          {/* Complete toggle */}
          <button
            type="button"
            className={`${styles.completeToggle} ${task.is_completed ? styles.completeToggleDone : ''}`}
            onClick={(event) => handleToggleComplete(event, task)}
            aria-label={task.is_completed ? 'Mark task incomplete' : 'Mark task complete'}
          >
            {task.is_completed && <Check size={14} />}
          </button>

          {/* Collapse toggle for parent tasks */}
          {hasChildren && (
            <button
              type="button"
              className={`${styles.collapseToggle} ${isCollapsed ? styles.collapsed : ''}`}
              onClick={(event) => toggleTaskCollapse(event, task.id)}
              aria-label={isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}
            >
              <ChevronDown size={16} />
            </button>
          )}

          {/* Task name / edit input */}
          <div className={styles.taskNameWrapper}>
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                className={styles.editInput}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, task.id)}
                onBlur={() => handleEditSave(task.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={styles.taskName}>{task.title || 'Untitled task'}</span>
            )}

            {/* Hover actions overlay */}
            {!isEditing && (
              <div className={styles.hoverActions}>
                {onToggleStar && isStarred && (
                  <div
                    className={styles.starWrapper}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StarButton
                      isStarred={isStarred(task.id)}
                      onToggle={() => onToggleStar(task.id)}
                      size="small"
                    />
                  </div>
                )}
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(e) => handleEditClick(e, task)}
                  title="Edit task name"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(e) => handleCalendarClick(e, task.id)}
                  title={
                    task.due_date
                      ? (() => {
                          const [year, month, day] = task.due_date.split('-');
                          return `Due on ${month}/${day}/${year.slice(2)}`;
                        })()
                      : 'No due date set.'
                  }
                >
                  <Calendar size={14} />
                </button>
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(e) => handleCommentClick(e, task)}
                  title="Go to comments"
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.actionIcon} ${styles.deleteIcon}`}
                  onClick={(e) => handleDeleteClick(e, task.id)}
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Date picker dropdown */}
            {showDatePicker && (
              <div ref={datePickerRef} className={styles.datePicker} onClick={(e) => e.stopPropagation()}>
                {(() => {
                  const { days, monthLabel } = generateCalendarDays(task.id);
                  return (
                    <>
                      <div className={styles.datePickerHeader}>{monthLabel}</div>
                      <div className={styles.datePickerWeekdays}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>
                      <div className={styles.datePickerDays}>
                        {days.map((day, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`
                              ${styles.datePickerDay}
                              ${!day.isCurrentMonth ? styles.otherMonth : ''}
                              ${day.isToday ? styles.today : ''}
                              ${day.isSelected ? styles.selected : ''}
                            `}
                            onClick={() => handleDateSelect(task.id, day.date.toISOString().split('T')[0])}
                          >
                            {day.date.getDate()}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={styles.clearDateButton}
                        onClick={() => handleDateSelect(task.id, '')}
                      >
                        Clear date
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Assignee avatar using MiniAvatar */}
          <div className={styles.assigneeSection}>
            {profile ? (
              <MiniAvatar
                firstName={profile.first_name || undefined}
                lastName={profile.last_name || undefined}
                email={profile.email || ''}
                avatarUrl={profile.avatar_url}
                size="small"
                showTooltip={true}
              />
            ) : (
              <div className={styles.unassignedAvatar} title="Unassigned">
                ?
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.taskList}>
      {showHeader && (
        <div className={styles.taskHeader}>
          <h2 className={styles.taskTitle}>
            Tasks <span className={styles.taskCount}>({tasks.length})</span>
          </h2>
        </div>
      )}

      {topLevelTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No tasks yet</h3>
          <p>Use Create Task in the header to start tracking work on this project.</p>
        </div>
      ) : (
        <div className={styles.taskItems}>
          {topLevelTasks.map((task, index) => {
            const childTasks = childTasksByParent.get(task.id) || [];
            const isCollapsed = !!collapsedTasks[task.id];
            const isLastGroup = index === topLevelTasks.length - 1;
            const showSubtasks = childTasks.length > 0 && !isCollapsed;

            return (
              <div key={task.id} className={styles.taskGroup}>
                {renderTaskRow(task, false, isLastGroup && !showSubtasks)}
                {showSubtasks && (
                  <div className={styles.subtaskList}>
                    {childTasks.map((subtask, subtaskIndex) =>
                      renderTaskRow(
                        subtask,
                        true,
                        isLastGroup && subtaskIndex === childTasks.length - 1
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmTaskId && (
        <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete Task</h3>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button type="button" className={styles.deleteButton} onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
