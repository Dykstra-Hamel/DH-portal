import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  ProjectCategory,
  ProjectTaskDraft,
  User,
  taskPriorityOptions,
} from '@/types/project';
import CategoryBadge from '@/components/ProjectManagement/CategorySettings/CategoryBadge';
import styles from '@/components/ProjectTemplates/TemplateForm/TemplateForm.module.scss';

interface DepartmentOption {
  id: string;
  name: string;
  icon?: string | null;
}

interface ProjectTaskBuilderProps {
  tasks: ProjectTaskDraft[];
  onChange: (tasks: ProjectTaskDraft[]) => void;
  users: User[];
  availableCategories: ProjectCategory[];
  projectCategoryIds: string[];
  isFetchingCategories: boolean;
  departments: DepartmentOption[];
  title?: string;
}

const createTempId = () => `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const sortByOrder = (a: ProjectTaskDraft, b: ProjectTaskDraft) =>
  Number(a.display_order || 0) - Number(b.display_order || 0);

const normalizeTopLevelOrder = (tasks: ProjectTaskDraft[]): ProjectTaskDraft[] => {
  const topLevel = tasks.filter((task) => !task.parent_temp_id).sort(sortByOrder);
  const childrenByParent = new Map<string, ProjectTaskDraft[]>();

  tasks
    .filter((task) => !!task.parent_temp_id)
    .forEach((task) => {
      const key = task.parent_temp_id || '';
      const list = childrenByParent.get(key) || [];
      list.push(task);
      childrenByParent.set(key, list);
    });

  const ordered: ProjectTaskDraft[] = [];
  topLevel.forEach((task, index) => {
    const normalizedParent: ProjectTaskDraft = {
      ...task,
      display_order: index.toString(),
    };
    ordered.push(normalizedParent);

    const children = (childrenByParent.get(task.temp_id || '') || []).sort(sortByOrder);
    children.forEach((child, childIndex) => {
      ordered.push({
        ...child,
        display_order: childIndex.toString(),
      });
    });
  });

  return ordered;
};

export function ProjectTaskBuilder({
  tasks,
  onChange,
  users,
  availableCategories,
  projectCategoryIds,
  isFetchingCategories,
  departments,
  title = 'Project Tasks',
}: ProjectTaskBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [collapsedTaskCards, setCollapsedTaskCards] = useState<Record<string, boolean>>({});
  const [collapsedSubtasks, setCollapsedSubtasks] = useState<Record<string, boolean>>({});
  const [collapsedSubtaskCards, setCollapsedSubtaskCards] = useState<Record<string, boolean>>({});
  const [hasInitializedTaskCollapse, setHasInitializedTaskCollapse] = useState(false);
  const [draggingTaskIndex, setDraggingTaskIndex] = useState<number | null>(null);
  const [dragOverTaskIndex, setDragOverTaskIndex] = useState<number | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (hasInitializedTaskCollapse) return;
    if (tasks.length === 0) return;

    const nextCollapsed: Record<string, boolean> = {};
    const nextSubtaskCollapsed: Record<string, boolean> = {};
    const nextSubtasksCollapsed: Record<string, boolean> = {};

    tasks.forEach((task) => {
      if (task.parent_temp_id) {
        if (task.temp_id) nextSubtaskCollapsed[task.temp_id] = true;
      } else if (task.temp_id) {
        nextCollapsed[task.temp_id] = true;
        nextSubtasksCollapsed[task.temp_id] = true;
      }
    });

    setCollapsedTaskCards(nextCollapsed);
    setCollapsedSubtaskCards(nextSubtaskCollapsed);
    setCollapsedSubtasks(nextSubtasksCollapsed);
    setHasInitializedTaskCollapse(true);
  }, [tasks, hasInitializedTaskCollapse]);

  const groupedTasks = useMemo(() => {
    const map = new Map<string, ProjectTaskDraft[]>();
    tasks.forEach((task) => {
      const parentId = task.parent_temp_id || '';
      const list = map.get(parentId) || [];
      list.push(task);
      map.set(parentId, list);
    });
    return map;
  }, [tasks]);

  const topLevelTasks = useMemo(() => {
    return (groupedTasks.get('') || []).sort(sortByOrder);
  }, [groupedTasks]);

  const setTasks = (updater: (prev: ProjectTaskDraft[]) => ProjectTaskDraft[]) => {
    onChange(normalizeTopLevelOrder(updater(tasks)));
  };

  const getUserDisplayName = (user: User) => {
    const firstName = (user as any).first_name || user.profiles?.first_name || '';
    const lastName = (user as any).last_name || user.profiles?.last_name || '';
    const email = user.profiles?.email || user.email || '';
    const name = `${firstName} ${lastName}`.trim();
    return name ? `${name} (${email})` : email || 'User';
  };

  const handleTaskChange = (taskId: string, field: keyof ProjectTaskDraft, value: string | null) => {
    setTasks((prev) =>
      prev.map((task) => (task.temp_id === taskId ? { ...task, [field]: value } : task))
    );
  };

  const handleAddTask = () => {
    const newTaskId = createTempId();
    const currentTopLevel = tasks.filter((task) => !task.parent_temp_id);
    const nextCollapsed: Record<string, boolean> = {};
    const nextSubtasksCollapsed: Record<string, boolean> = {};

    currentTopLevel.forEach((task) => {
      if (task.temp_id) {
        nextCollapsed[task.temp_id] = true;
        nextSubtasksCollapsed[task.temp_id] = true;
      }
    });

    nextCollapsed[newTaskId] = false;
    nextSubtasksCollapsed[newTaskId] = true;
    setCollapsedTaskCards(nextCollapsed);
    setCollapsedSubtasks(nextSubtasksCollapsed);
    setHasInitializedTaskCollapse(true);
    setIsExpanded(true);

    setTasks((prev) => [
      ...prev,
      {
        temp_id: newTaskId,
        parent_temp_id: '',
        title: '',
        description: '',
        priority: 'medium',
        due_date_offset_days: '0',
        display_order: currentTopLevel.length.toString(),
        tags: '',
        default_assigned_to: '',
        category_ids: [],
      },
    ]);
  };

  const handleAddSubtask = (parentTempId: string) => {
    setTasks((prev) => {
      const siblingCount = prev.filter((task) => task.parent_temp_id === parentTempId).length;
      return [
        ...prev,
        {
          temp_id: createTempId(),
          parent_temp_id: parentTempId,
          title: '',
          description: '',
          priority: 'medium',
          due_date_offset_days: '0',
          display_order: siblingCount.toString(),
          tags: '',
          default_assigned_to: '',
          category_ids: [],
        },
      ];
    });
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks((prev) =>
      prev.filter((task) => task.temp_id !== taskId && task.parent_temp_id !== taskId)
    );
  };

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTaskCards((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleSubtasksCollapse = (taskId: string) => {
    setCollapsedSubtasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleSubtaskCollapse = (subtaskId: string) => {
    setCollapsedSubtaskCards((prev) => ({ ...prev, [subtaskId]: !prev[subtaskId] }));
  };

  const getBlockedTaskDepartmentId = (blocksTaskId: string | null) => {
    if (!blocksTaskId) return '';
    const blockedTask = tasks.find((task) => task.temp_id === blocksTaskId);
    return blockedTask?.department_id || '';
  };

  const handleBlockedTaskDepartmentChange = (blocksTaskId: string | null, departmentId: string) => {
    if (!blocksTaskId) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.temp_id === blocksTaskId
          ? { ...task, department_id: departmentId || null }
          : task
      )
    );
  };

  const handleTaskDragStart = (e: React.DragEvent, index: number) => {
    setDraggingTaskIndex(index);
    setDraggingTaskId((e.currentTarget as HTMLElement).dataset.taskId || null);
    e.dataTransfer.effectAllowed = 'move';
    const taskId = (e.currentTarget as HTMLElement).dataset.taskId || '';
    e.dataTransfer.setData('text/plain', taskId || index.toString());
  };

  const handleTaskDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTaskIndex(index);
  };

  const handleTaskDragLeave = () => {
    setDragOverTaskIndex(null);
  };

  const handleTaskDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverTaskIndex(null);

    const draggedId = draggingTaskId || e.dataTransfer.getData('text/plain');
    let resolvedDragIndex = draggingTaskIndex;
    if (resolvedDragIndex === null && draggedId) {
      resolvedDragIndex = topLevelTasks.findIndex((task) => task.temp_id === draggedId);
    }

    if (resolvedDragIndex === null || resolvedDragIndex === -1 || resolvedDragIndex === dropIndex) {
      setDraggingTaskIndex(null);
      setDraggingTaskId(null);
      return;
    }

    const reorderedTopLevel = [...topLevelTasks];
    const [draggedTask] = reorderedTopLevel.splice(resolvedDragIndex, 1);
    reorderedTopLevel.splice(dropIndex, 0, draggedTask);

    const newTasks: ProjectTaskDraft[] = [];
    reorderedTopLevel.forEach((task, idx) => {
      newTasks.push({ ...task, display_order: idx.toString() });

      const children = (groupedTasks.get(task.temp_id || '') || []).sort(sortByOrder);
      children.forEach((child, childIdx) => {
        newTasks.push({ ...child, display_order: childIdx.toString() });
      });
    });

    onChange(newTasks);
    setDraggingTaskIndex(null);
    setDraggingTaskId(null);
  };

  const handleTaskDragEnd = () => {
    setDraggingTaskIndex(null);
    setDragOverTaskIndex(null);
    setDraggingTaskId(null);
  };

  const renderCategories = (task: ProjectTaskDraft) => {
    if (isFetchingCategories) {
      return <p className={styles.hint}>Loading categories...</p>;
    }

    const filteredCategories = availableCategories.filter((cat) =>
      projectCategoryIds.includes(cat.id)
    );

    if (projectCategoryIds.length === 0) {
      return (
        <p className={styles.hint}>
          Please select project categories first to assign them to tasks.
        </p>
      );
    }

    if (filteredCategories.length === 0) {
      return (
        <p className={styles.hint}>
          No categories available from selected project categories.
        </p>
      );
    }

    return filteredCategories.map((category) => {
      const isSelected = task.category_ids?.includes(category.id) || false;
      return (
        <button
          key={category.id}
          type="button"
          className={`${styles.categoryOption} ${isSelected ? styles.selected : ''}`}
          onClick={() => {
            const currentCategories = task.category_ids || [];
            const nextCategories = isSelected
              ? currentCategories.filter((id) => id !== category.id)
              : [...currentCategories, category.id];
            handleTaskChange(task.temp_id || '', 'category_ids', nextCategories as any);
          }}
        >
          <CategoryBadge category={category} />
        </button>
      );
    });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.sectionActions}>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={styles.collapseButton}
          >
            <ChevronDown size={16} className={!isExpanded ? styles.collapseIconCollapsed : ''} />
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button type="button" onClick={handleAddTask} className={styles.addButton}>
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {!isExpanded ? null : tasks.length === 0 ? (
        <p className={styles.emptyState}>
          No tasks added yet. Click &quot;Add Task&quot; to create tasks.
        </p>
      ) : (
        <div className={styles.tasksList}>
          {topLevelTasks.map((task, index) => {
            const subTasks = (groupedTasks.get(task.temp_id || '') || []).sort(sortByOrder);
            const isCollapsed = collapsedTaskCards[task.temp_id || ''] ?? false;
            const areSubtasksCollapsed = collapsedSubtasks[task.temp_id || ''] ?? false;
            const isDragging = draggingTaskIndex === index;
            const isDragOver = dragOverTaskIndex === index && draggingTaskIndex !== index;

            return (
              <div
                key={task.temp_id || `task-${index}`}
                className={`${styles.taskCard} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
                onDragOver={(e) => handleTaskDragOver(e, index)}
                onDragLeave={handleTaskDragLeave}
                onDrop={(e) => handleTaskDrop(e, index)}
                onDragEnd={handleTaskDragEnd}
              >
                <div className={styles.taskHeader}>
                  <div className={styles.taskHeaderLeft}>
                    <button
                      type="button"
                      className={styles.dragHandle}
                      draggable
                      data-task-id={task.temp_id || ''}
                      onDragStart={(e) => handleTaskDragStart(e, index)}
                      onDragEnd={handleTaskDragEnd}
                      aria-label="Reorder task"
                    >
                      <GripVertical size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTaskCollapse(task.temp_id || '')}
                      className={styles.taskCollapseButton}
                      aria-label={isCollapsed ? 'Expand task' : 'Collapse task'}
                    >
                      <ChevronDown size={16} className={isCollapsed ? styles.collapseIconCollapsed : ''} />
                    </button>
                    <span className={styles.taskNumber}>{task.title?.trim() || 'Untitled Task'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.temp_id || '')}
                    className={styles.removeButton}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {!isCollapsed && (
                  <div className={styles.taskBody}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Title <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleTaskChange(task.temp_id || '', 'title', e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Description</label>
                      <textarea
                        value={task.description}
                        onChange={(e) => handleTaskChange(task.temp_id || '', 'description', e.target.value)}
                        className={styles.textarea}
                        rows={2}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Priority</label>
                        <select
                          value={task.priority}
                          onChange={(e) => handleTaskChange(task.temp_id || '', 'priority', e.target.value)}
                          className={styles.select}
                        >
                          {taskPriorityOptions.map((priority) => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Due Date Offset (Days)</label>
                        <input
                          type="number"
                          value={task.due_date_offset_days}
                          onChange={(e) =>
                            handleTaskChange(task.temp_id || '', 'due_date_offset_days', e.target.value)
                          }
                          className={styles.input}
                          placeholder="0"
                        />
                        <small className={styles.hint}>
                          Days from project start (negative = before, positive = after)
                        </small>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Default Assignee</label>
                      <select
                        value={task.default_assigned_to}
                        onChange={(e) =>
                          handleTaskChange(task.temp_id || '', 'default_assigned_to', e.target.value)
                        }
                        className={styles.select}
                      >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {getUserDisplayName(user)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Task Categories</label>
                      <div className={styles.categoryMultiSelect}>{renderCategories(task)}</div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Blocks Task</label>
                        <select
                          value={task.blocks_task_id || ''}
                          onChange={(e) =>
                            handleTaskChange(task.temp_id || '', 'blocks_task_id', e.target.value || null)
                          }
                          className={styles.select}
                        >
                          <option value="">No blocked task</option>
                          {tasks
                            .filter((t) => t.temp_id !== task.temp_id)
                            .map((t) => (
                              <option key={t.temp_id} value={t.temp_id}>
                                {t.title || 'Untitled Task'}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Blocked By Task</label>
                        <select
                          value={task.blocked_by_task_id || ''}
                          onChange={(e) =>
                            handleTaskChange(task.temp_id || '', 'blocked_by_task_id', e.target.value || null)
                          }
                          className={styles.select}
                        >
                          <option value="">Not blocked</option>
                          {tasks
                            .filter((t) => t.temp_id !== task.temp_id)
                            .map((t) => (
                              <option key={t.temp_id} value={t.temp_id}>
                                {t.title || 'Untitled Task'}
                              </option>
                            ))}
                        </select>
                        <small className={styles.hint}>
                          Select a task that must be complete before this task can start
                        </small>
                      </div>

                      {task.blocked_by_task_id ? (
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Move Project To When Unblocked</label>
                          <select
                            value={getBlockedTaskDepartmentId(task.blocked_by_task_id || null)}
                            onChange={(e) =>
                              handleBlockedTaskDepartmentChange(
                                task.blocked_by_task_id || null,
                                e.target.value
                              )
                            }
                            className={styles.select}
                          >
                            <option value="">Stay where it is</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                          <small className={styles.hint}>
                            This task&apos;s project will move here when the blocking task completes
                          </small>
                        </div>
                      ) : (
                        <div className={styles.formGroupPlaceholder} />
                      )}
                    </div>

                    <div className={styles.subtaskActions}>
                      <button
                        type="button"
                        className={styles.addSubtaskButton}
                        onClick={() => handleAddSubtask(task.temp_id || '')}
                      >
                        <Plus size={14} />
                        Add Subtask
                      </button>
                      {subTasks.length > 0 && (
                        <button
                          type="button"
                          className={styles.collapseButton}
                          onClick={() => toggleSubtasksCollapse(task.temp_id || '')}
                        >
                          <ChevronDown
                            size={14}
                            className={areSubtasksCollapsed ? styles.collapseIconCollapsed : ''}
                          />
                          {areSubtasksCollapsed ? 'Show Subtasks' : 'Hide Subtasks'}
                        </button>
                      )}
                    </div>

                    {subTasks.length > 0 && !areSubtasksCollapsed && (
                      <div className={styles.subtasksList}>
                        {subTasks.map((subtask, subIndex) => {
                          const isSubtaskCollapsed = collapsedSubtaskCards[subtask.temp_id || ''] ?? false;
                          return (
                            <div key={subtask.temp_id || `subtask-${index}-${subIndex}`} className={styles.subtaskCard}>
                              <div className={styles.taskHeader}>
                                <div className={styles.taskHeaderLeft}>
                                  <button
                                    type="button"
                                    onClick={() => toggleSubtaskCollapse(subtask.temp_id || '')}
                                    className={styles.taskCollapseButton}
                                    aria-label={isSubtaskCollapsed ? 'Expand subtask' : 'Collapse subtask'}
                                  >
                                    <ChevronDown
                                      size={16}
                                      className={isSubtaskCollapsed ? styles.collapseIconCollapsed : ''}
                                    />
                                  </button>
                                  <span className={styles.taskNumber}>
                                    {subtask.title?.trim() || 'Untitled Subtask'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTask(subtask.temp_id || '')}
                                  className={styles.removeButton}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {!isSubtaskCollapsed && (
                                <div className={styles.taskBody}>
                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                      Title <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={subtask.title}
                                      onChange={(e) =>
                                        handleTaskChange(subtask.temp_id || '', 'title', e.target.value)
                                      }
                                      className={styles.input}
                                      required
                                    />
                                  </div>

                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>Description</label>
                                    <textarea
                                      value={subtask.description}
                                      onChange={(e) =>
                                        handleTaskChange(subtask.temp_id || '', 'description', e.target.value)
                                      }
                                      className={styles.textarea}
                                      rows={2}
                                    />
                                  </div>

                                  <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                      <label className={styles.label}>Priority</label>
                                      <select
                                        value={subtask.priority}
                                        onChange={(e) =>
                                          handleTaskChange(subtask.temp_id || '', 'priority', e.target.value)
                                        }
                                        className={styles.select}
                                      >
                                        {taskPriorityOptions.map((priority) => (
                                          <option key={priority.value} value={priority.value}>
                                            {priority.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                      <label className={styles.label}>Due Date Offset (Days)</label>
                                      <input
                                        type="number"
                                        value={subtask.due_date_offset_days}
                                        onChange={(e) =>
                                          handleTaskChange(
                                            subtask.temp_id || '',
                                            'due_date_offset_days',
                                            e.target.value
                                          )
                                        }
                                        className={styles.input}
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>

                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>Default Assignee</label>
                                    <select
                                      value={subtask.default_assigned_to}
                                      onChange={(e) =>
                                        handleTaskChange(
                                          subtask.temp_id || '',
                                          'default_assigned_to',
                                          e.target.value
                                        )
                                      }
                                      className={styles.select}
                                    >
                                      <option value="">Unassigned</option>
                                      {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                          {getUserDisplayName(user)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className={styles.formGroup}>
                                    <label className={styles.label}>Task Categories</label>
                                    <div className={styles.categoryMultiSelect}>{renderCategories(subtask)}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isExpanded && (
        <div className={styles.taskListFooter}>
          <button type="button" onClick={handleAddTask} className={styles.addButton}>
            <Plus size={16} />
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}

