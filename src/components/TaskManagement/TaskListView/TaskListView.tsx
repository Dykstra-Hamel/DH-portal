import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Calendar, Check, ChevronLeft, ChevronRight, Lock, MessageSquare, Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { Task, TaskStatus } from '@/types/taskManagement';
import { Project, statusOptions as projectStatusOptions } from '@/types/project';
import { PriorityBadge } from '../shared/PriorityBadge';
import { ProjectBadge } from '../shared/ProjectBadge';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { CompanyIcon } from '@/components/Common/CompanyIcon/CompanyIcon';
import { formatProjectShortcode } from '@/lib/formatProjectShortcode';
import { formatDateOnlyLocal, parseDateString } from '@/lib/date-utils';
import { createClient } from '@/lib/supabase/client';
import styles from './TaskListView.module.scss';

type SortField = 'title' | 'project' | 'client' | 'status' | 'priority' | 'due_date';
type SortDirection = 'asc' | 'desc';
type DueDateFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'next_30_days';
type ProjectStatus = Project['status'];
type StatusFilter = 'all' | ProjectStatus;

interface TaskListViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleStar?: (taskId: string) => void;
  onProjectClick?: (project: Project) => void;
  onToggleStarProject?: (projectId: string) => void;
  onProjectUpdate?: () => void | Promise<void>;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void> | void;
  groupTasksByProject?: boolean;
  currentUserId?: string;
  viewTabsElement?: React.ReactNode;
  personalTasks?: Task[];
  monthlyServices?: Task[];
  monthlyServiceMetaByTaskId?: Record<
    string,
    {
      companyId: string | null;
      companyName: string;
      iconUrl: string | null;
      serviceName: string;
    }
  >;
}

export function TaskListView({
  tasks,
  projects,
  onTaskClick,
  onDeleteTask,
  onToggleStar,
  onProjectClick,
  onToggleStarProject,
  onProjectUpdate,
  onToggleComplete,
  onUpdateTask,
  groupTasksByProject = false,
  currentUserId,
  viewTabsElement,
  personalTasks,
  monthlyServices,
  monthlyServiceMetaByTaskId,
}: TaskListViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [datePickerTaskId, setDatePickerTaskId] = useState<string | null>(null);
  const [datePickerProjectId, setDatePickerProjectId] = useState<string | null>(null);
  const [calendarMonthByTask, setCalendarMonthByTask] = useState<Record<string, Date>>({});
  const [calendarMonthByProject, setCalendarMonthByProject] = useState<Record<string, Date>>({});
  const [expandedWorkingOnProjects, setExpandedWorkingOnProjects] = useState<Record<string, boolean>>({});
  const [hoveredMonthlyServiceLink, setHoveredMonthlyServiceLink] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const editInputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const projectDatePickerRef = useRef<HTMLDivElement>(null);
  const monthlyServiceLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // Helper function to get authentication headers
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
    };
  };

  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M7.33317 3.33329V7.33329L9.99984 8.66663M13.9998 7.33329C13.9998 11.0152 11.0151 14 7.33317 14C3.65127 14 0.666504 11.0152 0.666504 7.33329C0.666504 3.65139 3.65127 0.666626 7.33317 0.666626C11.0151 0.666626 13.9998 3.65139 13.9998 7.33329Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const handleToggleComplete = (event: React.MouseEvent, task: Task) => {
    event.stopPropagation();
    if (!onToggleComplete) return;
    onToggleComplete(task.id, task.status !== 'completed');
  };

  useEffect(() => {
    if (!editingTaskId) return;
    editInputRef.current?.focus();
  }, [editingTaskId]);

  useEffect(() => {
    if (!datePickerTaskId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setDatePickerTaskId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [datePickerTaskId]);

  useEffect(() => {
    if (!datePickerProjectId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (projectDatePickerRef.current && !projectDatePickerRef.current.contains(event.target as Node)) {
        setDatePickerProjectId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [datePickerProjectId]);

  // Calculate tooltip position when hovering over monthly service link
  useEffect(() => {
    if (hoveredMonthlyServiceLink && monthlyServiceLinkRefs.current[hoveredMonthlyServiceLink]) {
      const linkElement = monthlyServiceLinkRefs.current[hoveredMonthlyServiceLink];
      if (linkElement) {
        const rect = linkElement.getBoundingClientRect();
        setTooltipPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
      }
    }
  }, [hoveredMonthlyServiceLink]);

  // Get project for a task
  const getProjectForTask = useCallback((taskProjectId?: string): Project | null => {
    if (!taskProjectId) return null;
    return projects.find(p => p.id === taskProjectId) ?? null;
  }, [projects]);

  const getTaskDueDateSortValue = useCallback((task: Task) => {
    if (!task.due_date) return Number.POSITIVE_INFINITY;
    const parsed = parseDateString(task.due_date);
    return parsed ? parsed.getTime() : Number.POSITIVE_INFINITY;
  }, []);

  const isInDueDateFilter = useCallback((dueDate?: string | null) => {
    if (dueDateFilter === 'all') return true;
    if (!dueDate) return false;

    const parsed = parseDateString(dueDate);
    if (!parsed) return false;

    const targetDate = new Date(parsed);
    targetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDateFilter === 'today') {
      return targetDate.getTime() <= today.getTime();
    }

    if (dueDateFilter === 'this_week') {
      const dayOfWeek = today.getDay();
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + (6 - dayOfWeek));
      saturday.setHours(23, 59, 59, 999);
      return targetDate.getTime() <= saturday.getTime();
    }

    if (dueDateFilter === 'this_month') {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return targetDate.getTime() <= endOfMonth.getTime();
    }

    if (dueDateFilter === 'next_30_days') {
      const end = new Date(today);
      end.setDate(today.getDate() + 30);
      end.setHours(23, 59, 59, 999);
      return targetDate.getTime() >= today.getTime() && targetDate.getTime() <= end.getTime();
    }

    return true;
  }, [dueDateFilter]);

  const matchesTaskFilters = useCallback((
    task: Task,
    project: Project | null,
    dueDateValue?: string | null
  ) => {
    if (statusFilter !== 'all') {
      if (!project?.status || project.status !== statusFilter) {
        return false;
      }
    }

    if (!isInDueDateFilter(dueDateValue)) {
      return false;
    }

    if (companyFilter !== 'all') {
      if (!project?.company?.id || project.company.id !== companyFilter) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const clientName = project?.company?.name || '';
      const projectName = project?.name || '';
      return (
        task.title.toLowerCase().includes(query) ||
        projectName.toLowerCase().includes(query) ||
        clientName.toLowerCase().includes(query)
      );
    }

    return true;
  }, [statusFilter, companyFilter, searchQuery, isInDueDateFilter]);

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get starred projects (exclude completed)
  const starredProjects = useMemo(() => {
    return projects.filter(p => p.is_starred && p.status !== 'complete');
  }, [projects]);

  // Separate starred and non-starred tasks
  const { starredTasks, regularTasks } = useMemo(() => {
    const hideCompletedTasks = statusFilter !== 'complete';

    // Only include directly starred tasks (exclude completed from starred section)
    const starred = tasks.filter(t => {
      return t.is_starred && t.status !== 'completed';
    });

    // Regular tasks: show ALL tasks (including starred), exclude completed unless filtering by completed
    const regular = tasks.filter(t => {
      // Exclude completed tasks unless user is filtering by complete projects
      if (hideCompletedTasks && t.status === 'completed') {
        return false;
      }
      return true;
    });

    return { starredTasks: starred, regularTasks: regular };
  }, [tasks, statusFilter]);

  // Filter and sort tasks
  const processedTasks = useMemo(() => {
    const getProjectStatusForTask = (task: Task) =>
      getProjectForTask(task.project_id)?.status;

    const filterAndSort = (taskList: Task[]) => {
      return taskList
        .filter(task => {
          const project = getProjectForTask(task.project_id);
          const dueDateToFilter = groupTasksByProject ? project?.due_date : task.due_date;
          return matchesTaskFilters(task, project, dueDateToFilter);
        })
        .sort((a, b) => {
          let comparison = 0;

          switch (sortField) {
            case 'title':
              comparison = a.title.localeCompare(b.title);
              break;
            case 'project': {
              const projectA = getProjectForTask(a.project_id)?.name || '';
              const projectB = getProjectForTask(b.project_id)?.name || '';
              comparison = projectA.localeCompare(projectB);
              break;
            }
            case 'client': {
              const clientA = getProjectForTask(a.project_id)?.company?.name || '';
              const clientB = getProjectForTask(b.project_id)?.company?.name || '';
              comparison = clientA.localeCompare(clientB);
              break;
            }
            case 'status': {
              const statusOrder = projectStatusOptions.reduce<Record<string, number>>(
                (acc, option, index) => {
                  acc[option.value] = index;
                  return acc;
                },
                {}
              );
              const statusA = getProjectStatusForTask(a);
              const statusB = getProjectStatusForTask(b);
              comparison =
                (statusOrder[statusA ?? ''] ?? Number.MAX_SAFE_INTEGER) -
                (statusOrder[statusB ?? ''] ?? Number.MAX_SAFE_INTEGER);
              break;
            }
            case 'priority': {
              const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'urgent': 3 };
              comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
              break;
            }
            case 'due_date':
              comparison =
                (parseDateString(a.due_date)?.getTime() ?? Number.POSITIVE_INFINITY) -
                (parseDateString(b.due_date)?.getTime() ?? Number.POSITIVE_INFINITY);
              break;
            default:
              comparison = 0;
          }

          return sortDirection === 'asc' ? comparison : -comparison;
        });
    };

    return {
      starred: filterAndSort(starredTasks),
      regular: filterAndSort(regularTasks),
    };
  }, [starredTasks, regularTasks, sortField, sortDirection, groupTasksByProject, getProjectForTask, matchesTaskFilters]);

  const companyOptions = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((project) => {
      if (project.company?.id && project.company?.name) {
        map.set(project.company.id, project.company.name);
      }
    });
    Object.values(monthlyServiceMetaByTaskId || {}).forEach((meta) => {
      if (meta.companyId && meta.companyName) {
        map.set(meta.companyId, meta.companyName);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, monthlyServiceMetaByTaskId]);

  const sidebarPersonalTasks = useMemo(() => {
    if (!personalTasks) return [];
    return personalTasks.filter((task) => task.recurring_frequency !== 'monthly');
  }, [personalTasks]);

  const sidebarMonthlyServices = useMemo(() => {
    if (monthlyServices) return monthlyServices;
    if (!personalTasks) return [];
    return personalTasks.filter((task) => task.recurring_frequency === 'monthly');
  }, [monthlyServices, personalTasks]);

  const personalTasksList = useMemo(() => {
    return sidebarPersonalTasks
      .filter((task) => {
        const project = getProjectForTask(task.project_id);
        return matchesTaskFilters(task, project, task.due_date);
      })
      .sort((a, b) => getTaskDueDateSortValue(a) - getTaskDueDateSortValue(b));
  }, [sidebarPersonalTasks, getProjectForTask, matchesTaskFilters, getTaskDueDateSortValue]);

  const monthlyServicesList = useMemo(() => {
    return sidebarMonthlyServices
      .filter((task) => {
        if (statusFilter !== 'all') {
          return false;
        }

        if (!isInDueDateFilter(task.due_date)) {
          return false;
        }

        const serviceMeta = monthlyServiceMetaByTaskId?.[task.id];

        if (companyFilter !== 'all') {
          if (!serviceMeta?.companyId || serviceMeta.companyId !== companyFilter) {
            return false;
          }
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return (
            task.title.toLowerCase().includes(query) ||
            (serviceMeta?.serviceName || '').toLowerCase().includes(query) ||
            (serviceMeta?.companyName || '').toLowerCase().includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => getTaskDueDateSortValue(a) - getTaskDueDateSortValue(b));
  }, [
    sidebarMonthlyServices,
    statusFilter,
    companyFilter,
    searchQuery,
    isInDueDateFilter,
    getTaskDueDateSortValue,
    monthlyServiceMetaByTaskId,
  ]);

  const groupedTasks = useMemo(() => {
    if (!groupTasksByProject) {
      return { projectGroups: [], personalTasks: [] };
    }

    // Create a map of projects to their tasks
    const projectTaskMap = new Map<string, { project: Project; tasks: Task[] }>();
    const personalTasks: Task[] = [];

    processedTasks.regular.forEach((task) => {
      const project = getProjectForTask(task.project_id);
      if (!project || !project.company?.id) {
        personalTasks.push(task);
        return;
      }

      const existing = projectTaskMap.get(project.id);
      if (existing) {
        existing.tasks.push(task);
      } else {
        projectTaskMap.set(project.id, { project, tasks: [task] });
      }
    });

    // Include empty projects assigned to current user
    const includeEmptyAssignedProjects =
      !!currentUserId &&
      statusFilter === 'all' &&
      dueDateFilter === 'all' &&
      !searchQuery.trim();

    if (includeEmptyAssignedProjects) {
      projects.forEach((project) => {
        const assignedId = project.assigned_to_profile?.id || (project as { assigned_to?: string | null }).assigned_to;
        if (!assignedId || assignedId !== currentUserId) return;
        if (companyFilter !== 'all' && project.company?.id !== companyFilter) return;

        if (!projectTaskMap.has(project.id)) {
          projectTaskMap.set(project.id, { project, tasks: [] });
        }
      });
    }

    const sortDueDate = (task: Task) => {
      if (!task.due_date) return Number.POSITIVE_INFINITY;
      const parsed = parseDateString(task.due_date);
      return parsed ? parsed.getTime() : Number.POSITIVE_INFINITY;
    };

    const getProjectDueDate = (projectGroup: { project: Project; tasks: Task[] }) => {
      const projectDue = projectGroup.project.due_date;
      if (projectDue) {
        return parseDateString(projectDue)?.getTime() ?? Number.POSITIVE_INFINITY;
      }
      // Fall back to earliest task due date
      const taskDue = projectGroup.tasks.reduce((min, task) => {
        const due = parseDateString(task.due_date);
        if (!due) return min;
        const time = due.getTime();
        return Math.min(min, time);
      }, Number.POSITIVE_INFINITY);
      return taskDue;
    };

    // Convert to array and sort by project due date
    const sortedProjectGroups = Array.from(projectTaskMap.values())
      .map((projectGroup) => ({
        ...projectGroup,
        tasks: [...projectGroup.tasks].sort((a, b) => sortDueDate(a) - sortDueDate(b)),
      }))
      .sort((a, b) => {
        const dueA = getProjectDueDate(a);
        const dueB = getProjectDueDate(b);
        if (dueA !== dueB) return dueA - dueB;

        // Secondary sort by project name
        const nameA = a.project.name || '';
        const nameB = b.project.name || '';
        return nameA.localeCompare(nameB);
      });

    const sortedPersonalTasks = [...personalTasks].sort((a, b) => sortDueDate(a) - sortDueDate(b));

    return {
      projectGroups: sortedProjectGroups,
      personalTasks: sortedPersonalTasks,
    };
  }, [groupTasksByProject, processedTasks.regular, projects, currentUserId, statusFilter, dueDateFilter, companyFilter, searchQuery, getProjectForTask]);

  const getInitialCalendarMonth = (task?: Task) => {
    if (task?.due_date) {
      const parsed = parseDateString(task.due_date);
      if (parsed) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const generateCalendarDays = (task: Task) => {
    const currentMonth =
      calendarMonthByTask[task.id] || getInitialCalendarMonth(task);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = task.due_date ? parseDateString(task.due_date) : null;
    if (selectedDate) {
      selectedDate.setHours(0, 0, 0, 0);
    }

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
      });
    }

    return {
      days,
      monthLabel: currentMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    };
  };

  const handleMonthChange = (
    event: React.MouseEvent,
    taskId: string,
    direction: 'prev' | 'next'
  ) => {
    event.stopPropagation();
    setCalendarMonthByTask(prev => {
      const current = prev[taskId] || getInitialCalendarMonth();
      const nextMonth = new Date(
        current.getFullYear(),
        current.getMonth() + (direction === 'next' ? 1 : -1),
        1
      );
      return { ...prev, [taskId]: nextMonth };
    });
  };

  const handleCalendarClick = (event: React.MouseEvent, task: Task) => {
    event.stopPropagation();
    const nextTaskId = datePickerTaskId === task.id ? null : task.id;
    setDatePickerTaskId(nextTaskId);

    if (nextTaskId) {
      setCalendarMonthByTask(prev => ({
        ...prev,
        [task.id]: prev[task.id] || getInitialCalendarMonth(task),
      }));
    }
  };

  const handleDateSelect = async (taskId: string, date: string) => {
    if (onUpdateTask) {
      await onUpdateTask(taskId, { due_date: date || null } as Partial<Task>);
    }
    setDatePickerTaskId(null);
  };

  const handleEditClick = (event: React.MouseEvent, task: Task) => {
    event.stopPropagation();
    if (!onUpdateTask) {
      onTaskClick(task);
      return;
    }
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleEditSave = async (task: Task) => {
    if (!onUpdateTask) {
      setEditingTaskId(null);
      setEditingTitle('');
      return;
    }

    const nextTitle = editingTitle.trim();
    if (nextTitle && nextTitle !== task.title) {
      await onUpdateTask(task.id, { title: nextTitle });
    }

    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleEditKeyDown = (event: React.KeyboardEvent, task: Task) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleEditSave(task);
    } else if (event.key === 'Escape') {
      setEditingTaskId(null);
      setEditingTitle('');
    }
  };

  const handleCommentClick = (event: React.MouseEvent, task: Task) => {
    event.stopPropagation();
    onTaskClick(task);
  };

  const handleDeleteClick = (event: React.MouseEvent, taskId: string) => {
    event.stopPropagation();
    if (onDeleteTask) {
      onDeleteTask(taskId);
    }
  };

  const toggleWorkingOnProject = useCallback((projectId: string) => {
    setExpandedWorkingOnProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  }, []);

  // Project-level handlers
  const handleProjectCalendarClick = (event: React.MouseEvent, project: Project) => {
    event.stopPropagation();
    const nextProjectId = datePickerProjectId === project.id ? null : project.id;
    setDatePickerProjectId(nextProjectId);

    if (nextProjectId) {
      setCalendarMonthByProject(prev => ({
        ...prev,
        [project.id]: prev[project.id] || (() => {
          if (project.due_date) {
            const parsed = parseDateString(project.due_date);
            if (parsed) {
              return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
            }
          }
          const now = new Date();
          return new Date(now.getFullYear(), now.getMonth(), 1);
        })(),
      }));
    }
  };

  const handleProjectDateSelect = async (projectId: string, date: string) => {
    try {
      const headers = await getAuthHeaders();

      // First, get the current project data
      const projectResponse = await fetch(`/api/admin/projects/${projectId}`, { headers });
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project');
      }
      const project = await projectResponse.json();

      // Update with all required fields
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: project.name,
          project_type: project.project_type,
          due_date: date || project.due_date,
          // Include other required fields
          description: project.description,
          status: project.status,
          priority: project.priority,
        }),
      });

      if (response.ok && onProjectUpdate) {
        await onProjectUpdate();
      }
    } catch (error) {
      console.error('Error updating project date:', error);
    }
    setDatePickerProjectId(null);
  };

  const handleProjectMonthChange = (
    event: React.MouseEvent,
    projectId: string,
    direction: 'prev' | 'next'
  ) => {
    event.stopPropagation();
    setCalendarMonthByProject(prev => {
      const current = prev[projectId] || (() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
      })();
      const nextMonth = new Date(
        current.getFullYear(),
        current.getMonth() + (direction === 'next' ? 1 : -1),
        1
      );
      return { ...prev, [projectId]: nextMonth };
    });
  };

  const generateProjectCalendarDays = (project: Project) => {
    const currentMonth =
      calendarMonthByProject[project.id] || (() => {
        if (project.due_date) {
          const parsed = parseDateString(project.due_date);
          if (parsed) {
            return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
          }
        }
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
      })();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = project.due_date ? parseDateString(project.due_date) : null;
    if (selectedDate) {
      selectedDate.setHours(0, 0, 0, 0);
    }

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
      });
    }

    return {
      days,
      monthLabel: currentMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    };
  };


  const renderGroupedTaskRow = (task: Task) => {
    const overdue = isOverdue(task.due_date, task.status);
    const isEditing = editingTaskId === task.id;
    const showDatePicker = datePickerTaskId === task.id;

    return (
      <li
        key={task.id}
        className={`${styles.projectTaskItem} ${task.status === 'completed' ? styles.taskCompleted : ''}`}
        onClick={() => onTaskClick(task)}
      >
        <button
          type="button"
          className={`${styles.projectTaskToggle} ${task.status === 'completed' ? styles.projectTaskToggleDone : ''} ${task.blocked_by_task && !task.blocked_by_task.is_completed ? styles.projectTaskToggleBlocked : ''}`}
          onClick={(event) => handleToggleComplete(event, task)}
          aria-label={task.status === 'completed' ? 'Mark task incomplete' : 'Mark task complete'}
          disabled={!onToggleComplete || !!(task.blocked_by_task && !task.blocked_by_task.is_completed)}
        >
          {task.blocked_by_task && !task.blocked_by_task.is_completed ? (
            <Lock size={12} />
          ) : task.status === 'completed' ? (
            <Check size={12} />
          ) : null}
        </button>
        <div className={styles.taskTitleRow}>
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              className={styles.taskEditInput}
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              onKeyDown={(event) => handleEditKeyDown(event, task)}
              onBlur={() => handleEditSave(task)}
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <span className={styles.taskTitleText}>{task.title}</span>
          )}
          <div className={styles.taskMetaActions}>
            <span className={`${styles.taskDueDate} ${overdue ? styles.taskDueDateOverdue : ''}`}>
              <ClockIcon />
              <span>{formatDate(task.due_date)}</span>
            </span>
            {onToggleStar && (
              <div className={styles.taskStarAction}>
                <StarButton
                  isStarred={task.is_starred || false}
                  onToggle={() => onToggleStar(task.id)}
                  size="small"
                />
              </div>
            )}

            {!isEditing && (
              <div className={styles.hoverActions}>
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(event) => handleEditClick(event, task)}
                  title="Edit task name"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(event) => handleCalendarClick(event, task)}
                  title={
                    task.due_date
                      ? `Due on ${formatDate(task.due_date)}`
                      : 'No due date set.'
                  }
                >
                  <Calendar size={14} />
                </button>
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(event) => handleCommentClick(event, task)}
                  title="Go to comments"
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.actionIcon} ${styles.deleteIcon}`}
                  onClick={(event) => handleDeleteClick(event, task.id)}
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {showDatePicker && (
              <div
                ref={datePickerRef}
                className={styles.datePicker}
                onClick={(event) => event.stopPropagation()}
              >
                {(() => {
                  const { days, monthLabel } = generateCalendarDays(task);
                  return (
                    <>
                      <div className={styles.datePickerHeader}>
                        <button
                          type="button"
                          className={styles.datePickerNav}
                          onClick={(event) => handleMonthChange(event, task.id, 'prev')}
                          aria-label="Previous month"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className={styles.datePickerLabel}>{monthLabel}</span>
                        <button
                          type="button"
                          className={styles.datePickerNav}
                          onClick={(event) => handleMonthChange(event, task.id, 'next')}
                          aria-label="Next month"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
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
                            onClick={() =>
                              handleDateSelect(
                                task.id,
                                day.date.toISOString().split('T')[0]
                              )
                            }
                          >
                            {day.date.getDate()}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={styles.datePickerClear}
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
        </div>
      </li>
    );
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'Not Set';
    const localDate = formatDateOnlyLocal(dateString) || new Date(dateString);
    if (Number.isNaN(localDate.getTime())) return 'Not Set';
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const year = localDate.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const isOverdue = (dueDate: string, status: TaskStatus): boolean => {
    if (status === 'completed' || !dueDate) return false;
    const parsed = parseDateString(dueDate);
    if (!parsed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    return parsed < today;
  };

  // Render a single task row
  const renderTaskRow = (
    task: Task,
    options: { actionsMode?: 'full' | 'star-only'; showToggle?: boolean } = {}
  ) => {
    const project = getProjectForTask(task.project_id);
    const clientName = project?.company?.name || '—'; // FIXED: Use real company data
    const projectShortcode = project?.shortcode
      ? formatProjectShortcode(project.shortcode)
      : '—';
    const overdue = isOverdue(task.due_date, task.status);
    const { actionsMode = 'full', showToggle = false } = options;
    const showFullActions = actionsMode === 'full';

    return (
      <div key={task.id} className={styles.tableRow} onClick={() => onTaskClick(task)}>
        {showToggle && (
          <div className={styles.cell}>
            <button
              type="button"
              className={`${styles.projectTaskToggle} ${task.status === 'completed' ? styles.projectTaskToggleDone : ''} ${task.blocked_by_task && !task.blocked_by_task.is_completed ? styles.projectTaskToggleBlocked : ''}`}
              onClick={(event) => handleToggleComplete(event, task)}
              aria-label={task.status === 'completed' ? 'Mark task incomplete' : 'Mark task complete'}
              disabled={!onToggleComplete || !!(task.blocked_by_task && !task.blocked_by_task.is_completed)}
            >
              {task.blocked_by_task && !task.blocked_by_task.is_completed ? (
                <Lock size={12} />
              ) : task.status === 'completed' ? (
                <Check size={12} />
              ) : null}
            </button>
          </div>
        )}
        <div className={styles.cell}>
          <div className={styles.taskTitle}>{task.title}</div>
        </div>
        <div className={styles.cell}>
          {project ? (
            <ProjectBadge projectName={project.name} projectType={project.project_type as any} size="medium" />
          ) : (
            <span className={styles.noProject}>No Project</span>
          )}
        </div>
        <div className={styles.cell}>
          <div className={styles.projectShortcode}>{projectShortcode}</div>
        </div>
        <div className={styles.cell}>
          <div className={styles.clientName}>{clientName}</div>
        </div>
        <div className={styles.cell}>
          <PriorityBadge priority={task.priority} />
        </div>
        <div className={styles.cell}>
          <div className={`${styles.dueDate} ${overdue ? styles.overdue : ''}`}>
            {formatDate(task.due_date)}
          </div>
        </div>
        <div className={styles.cell}>
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            {onToggleStar && (
              <StarButton
                isStarred={task.is_starred || false}
                onToggle={() => onToggleStar(task.id)}
                size={showFullActions ? 'medium' : 'small'}
              />
            )}
            {showFullActions && (
              <>
                <button
                  className={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                  title="Edit task"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M11.3333 2.00004C11.5084 1.82494 11.716 1.68605 11.9445 1.59129C12.1731 1.49653 12.4183 1.44775 12.6666 1.44775C12.9149 1.44775 13.1602 1.49653 13.3887 1.59129C13.6172 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.38278 14.4087 2.61131C14.5035 2.83984 14.5523 3.08507 14.5523 3.33337C14.5523 3.58168 14.5035 3.82691 14.4087 4.05544C14.314 4.28397 14.1751 4.49162 14 4.66671L5 13.6667L1.33333 14.6667L2.33333 11L11.3333 2.00004Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {onDeleteTask && (
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    title="Delete task"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 4H3.33333H14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };


  const renderCurrentlyWorkingOn = () => {
    // Build starred items structure similar to main list
    const starredProjectMap = new Map<string, { project: Project; tasks: Task[] }>();
    const starredStandaloneTasks: Task[] = [];

    // First, add all starred projects with all user's tasks
    starredProjects.forEach((project) => {
      const userTasks = tasks.filter(
        (t) => t.project_id === project.id && t.assigned_to === currentUserId && t.status !== 'completed'
      );
      starredProjectMap.set(project.id, { project, tasks: userTasks });
    });

    // Then, add projects that have starred tasks (if not already added)
    starredTasks.forEach((task) => {
      if (task.project_id) {
        const project = getProjectForTask(task.project_id);
        if (project) {
          if (!starredProjectMap.has(project.id)) {
            // Project not starred, so only show the starred task
            starredProjectMap.set(project.id, { project, tasks: [task] });
          }
          // If project is already starred, the task is already included from the first loop
        }
      } else {
        // Standalone task (no project)
        starredStandaloneTasks.push(task);
      }
    });

    const starredProjectGroups = Array.from(starredProjectMap.values());

    if (starredProjectGroups.length === 0 && starredStandaloneTasks.length === 0) {
      return null;
    }

    const sortDueDate = (task: Task) => {
      if (!task.due_date) return Number.POSITIVE_INFINITY;
      const parsed = parseDateString(task.due_date);
      return parsed ? parsed.getTime() : Number.POSITIVE_INFINITY;
    };

    return (
      <div className={styles.currentlyWorkingOnSection}>
        <h2 className={styles.sectionTitle}>Currently Working On</h2>

        <div className={styles.starredProjectsList}>
          {starredProjectGroups.map((projectGroup) => {
            const projectId = projectGroup.project?.id;
            const hasTasks = projectGroup.tasks.length > 0;
            const isExpanded = projectId ? !!expandedWorkingOnProjects[projectId] : false;
            const projectName = projectGroup.project?.name || 'No Project';
            const projectCode = projectGroup.project?.shortcode
              ? formatProjectShortcode(projectGroup.project.shortcode)
              : '';
            const projectDueDate = projectGroup.project?.due_date || '';
            const projectOverdue = projectDueDate
              ? (() => {
                  const parsed = parseDateString(projectDueDate);
                  if (!parsed) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  parsed.setHours(0, 0, 0, 0);
                  return parsed < today;
                })()
              : false;
            const showProjectDatePicker = datePickerProjectId === projectGroup.project?.id;

            return (
              <div key={projectGroup.project?.id || 'no-project'} className={styles.projectGroup}>
                <div
                  className={styles.projectGroupHeader}
                  onClick={() => projectGroup.project && onProjectClick && onProjectClick(projectGroup.project)}
                  style={{ cursor: projectGroup.project && onProjectClick ? 'pointer' : 'default' }}
                >
                  {/* Company Logo at the start */}
                  {projectGroup.project && (
                    <div className={styles.companyLogoWrapper}>
                      <CompanyIcon
                        companyName={projectGroup.project.company?.name || 'No company'}
                        iconUrl={
                          Array.isArray(projectGroup.project.company?.branding)
                            ? projectGroup.project.company.branding[0]?.icon_logo_url
                            : projectGroup.project.company?.branding?.icon_logo_url
                        }
                        size="small"
                        showTooltip={true}
                      />
                    </div>
                  )}
                  {projectId && hasTasks && (
                    <button
                      type="button"
                      className={styles.cwoExpandToggle}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleWorkingOnProject(projectId);
                      }}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Collapse tasks for ${projectName}` : `Expand tasks for ${projectName}`}
                    >
                      <ChevronRight
                        size={14}
                        className={`${styles.cwoExpandIcon} ${isExpanded ? styles.cwoExpandIconExpanded : ''}`}
                      />
                    </button>
                  )}

                  <span className={styles.projectGroupTitle}>{projectName}</span>
                  {projectCode && (
                    <span className={styles.projectGroupCode}>{projectCode}</span>
                  )}
                  <div className={styles.projectMetaActions}>
                    {projectDueDate && (
                      <span className={`${styles.projectDueDate} ${projectOverdue ? styles.projectDueDateOverdue : ''}`}>
                        <ClockIcon />
                        <span>{formatDate(projectDueDate)}</span>
                      </span>
                    )}
                    {projectGroup.project && onToggleStarProject && (
                      <div className={styles.projectStarAction}>
                        <StarButton
                          isStarred={projectGroup.project.is_starred || false}
                          onToggle={() => onToggleStarProject(projectGroup.project!.id)}
                          size="small"
                        />
                      </div>
                    )}

                    {projectGroup.project && (
                      <div className={styles.projectHoverActions} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={styles.actionIcon}
                          onClick={(event) => handleProjectCalendarClick(event, projectGroup.project!)}
                          title={
                            projectGroup.project.due_date
                              ? `Due on ${formatDate(projectGroup.project.due_date)}`
                              : 'No due date set.'
                          }
                        >
                          <Calendar size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionIcon}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (onProjectClick) onProjectClick(projectGroup.project!);
                          }}
                          title="Go to project"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {showProjectDatePicker && projectGroup.project && (
                    <div
                      ref={projectDatePickerRef}
                      className={styles.projectDatePicker}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {(() => {
                        const { days, monthLabel } = generateProjectCalendarDays(projectGroup.project);
                        return (
                          <>
                            <div className={styles.datePickerHeader}>
                              <button
                                type="button"
                                className={styles.datePickerNav}
                                onClick={(event) => handleProjectMonthChange(event, projectGroup.project!.id, 'prev')}
                                aria-label="Previous month"
                              >
                                <ChevronLeft size={14} />
                              </button>
                              <span className={styles.datePickerLabel}>{monthLabel}</span>
                              <button
                                type="button"
                                className={styles.datePickerNav}
                                onClick={(event) => handleProjectMonthChange(event, projectGroup.project!.id, 'next')}
                                aria-label="Next month"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
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
                                  onClick={() =>
                                    handleProjectDateSelect(
                                      projectGroup.project!.id,
                                      day.date.toISOString().split('T')[0]
                                    )
                                  }
                                >
                                  {day.date.getDate()}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              className={styles.datePickerClear}
                              onClick={() => handleProjectDateSelect(projectGroup.project!.id, '')}
                            >
                              Clear date
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                {hasTasks && isExpanded && (
                  <ul className={styles.projectTaskList}>
                    {projectGroup.tasks.sort((a, b) => sortDueDate(a) - sortDueDate(b)).map((task) => renderGroupedTaskRow(task))}
                  </ul>
                )}
              </div>
            );
          })}

          {/* Standalone starred tasks */}
          {starredStandaloneTasks.length > 0 && (
            <div className={styles.standaloneTasksSection}>
              <ul className={styles.projectTaskList}>
                {starredStandaloneTasks.sort((a, b) => sortDueDate(a) - sortDueDate(b)).map((task) => renderGroupedTaskRow(task))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const showPersonalTasksCard = personalTasks !== undefined || monthlyServices !== undefined;

  const renderPersonalTaskRow = (task: Task) => {
    const overdue = isOverdue(task.due_date, task.status);
    const isEditing = editingTaskId === task.id;
    const showDatePicker = datePickerTaskId === task.id;

    return (
      <li
        key={task.id}
        className={`${styles.personalTaskRow} ${styles.projectTaskItem} ${task.status === 'completed' ? styles.taskCompleted : ''}`}
        onClick={() => onTaskClick(task)}
      >
        <button
          type="button"
          className={`${styles.projectTaskToggle} ${task.status === 'completed' ? styles.projectTaskToggleDone : ''} ${task.blocked_by_task && !task.blocked_by_task.is_completed ? styles.projectTaskToggleBlocked : ''}`}
          onClick={(event) => handleToggleComplete(event, task)}
          aria-label={task.status === 'completed' ? 'Mark task incomplete' : 'Mark task complete'}
          disabled={!onToggleComplete || !!(task.blocked_by_task && !task.blocked_by_task.is_completed)}
        >
          {task.blocked_by_task && !task.blocked_by_task.is_completed ? (
            <Lock size={12} />
          ) : task.status === 'completed' ? (
            <Check size={12} />
          ) : null}
        </button>
        <div className={`${styles.taskTitleRow} ${styles.personalTaskTitleRow}`}>
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              className={styles.taskEditInput}
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              onKeyDown={(event) => handleEditKeyDown(event, task)}
              onBlur={() => handleEditSave(task)}
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <span className={styles.taskTitleText}>{task.title}</span>
          )}
          <div className={styles.taskMetaActions}>
            <span className={`${styles.taskDueDate} ${overdue ? styles.taskDueDateOverdue : ''}`}>
              <ClockIcon />
              <span>{formatDate(task.due_date)}</span>
            </span>
            {onToggleStar && (
              <div className={styles.taskStarAction}>
                <StarButton
                  isStarred={task.is_starred || false}
                  onToggle={() => onToggleStar(task.id)}
                  size="small"
                />
              </div>
            )}

            {!isEditing && (
              <div className={styles.hoverActions}>
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(event) => handleEditClick(event, task)}
                  title="Edit task name"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(event) => handleCalendarClick(event, task)}
                  title={
                    task.due_date
                      ? `Due on ${formatDate(task.due_date)}`
                      : 'No due date set.'
                  }
                >
                  <Calendar size={14} />
                </button>
                <button
                  type="button"
                  className={styles.actionIcon}
                  onClick={(event) => handleCommentClick(event, task)}
                  title="Go to comments"
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.actionIcon} ${styles.deleteIcon}`}
                  onClick={(event) => handleDeleteClick(event, task.id)}
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {showDatePicker && (
              <div
                ref={datePickerRef}
                className={styles.datePicker}
                onClick={(event) => event.stopPropagation()}
              >
                {(() => {
                  const { days, monthLabel } = generateCalendarDays(task);
                  return (
                    <>
                      <div className={styles.datePickerHeader}>
                        <button
                          type="button"
                          className={styles.datePickerNav}
                          onClick={(event) => handleMonthChange(event, task.id, 'prev')}
                          aria-label="Previous month"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className={styles.datePickerLabel}>{monthLabel}</span>
                        <button
                          type="button"
                          className={styles.datePickerNav}
                          onClick={(event) => handleMonthChange(event, task.id, 'next')}
                          aria-label="Next month"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
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
                            onClick={() =>
                              handleDateSelect(
                                task.id,
                                day.date.toISOString().split('T')[0]
                              )
                            }
                          >
                            {day.date.getDate()}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={styles.datePickerClear}
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
        </div>
      </li>
    );
  };

  const renderPersonalTasksCard = () => {
    if (!showPersonalTasksCard) return null;

    const renderMonthlyServiceRow = (task: Task) => {
      const overdue = isOverdue(task.due_date, task.status);
      const serviceMeta = monthlyServiceMetaByTaskId?.[task.id];
      const monthlyServiceId = (task as any).monthly_service_id;

      return (
        <li
          key={task.id}
          className={`${styles.personalTaskRow} ${styles.projectTaskItem} ${task.status === 'completed' ? styles.taskCompleted : ''}`}
          onClick={() => onTaskClick(task)}
        >
          <button
            type="button"
            className={`${styles.projectTaskToggle} ${task.status === 'completed' ? styles.projectTaskToggleDone : ''} ${task.blocked_by_task && !task.blocked_by_task.is_completed ? styles.projectTaskToggleBlocked : ''}`}
            onClick={(event) => handleToggleComplete(event, task)}
            aria-label={task.status === 'completed' ? 'Mark task incomplete' : 'Mark task complete'}
            disabled={!onToggleComplete || !!(task.blocked_by_task && !task.blocked_by_task.is_completed)}
          >
            {task.blocked_by_task && !task.blocked_by_task.is_completed ? (
              <Lock size={12} />
            ) : task.status === 'completed' ? (
              <Check size={12} />
            ) : null}
          </button>
          <div className={styles.companyLogoWrapper}>
            <CompanyIcon
              companyName={serviceMeta?.companyName || 'Company'}
              iconUrl={serviceMeta?.iconUrl || null}
              size="small"
              showTooltip={true}
            />
          </div>
          <div className={`${styles.taskTitleRow} ${styles.personalTaskTitleRow}`}>
            <div className={styles.taskTitleWithLink}>
              <span className={styles.taskTitleText}>{task.title}</span>
              {monthlyServiceId && serviceMeta && (
                <Link
                  ref={(el) => {
                    if (el) monthlyServiceLinkRefs.current[task.id] = el;
                  }}
                  href={`/admin/monthly-services/${monthlyServiceId}`}
                  className={styles.monthlyServiceLink}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHoveredMonthlyServiceLink(task.id)}
                  onMouseLeave={() => setHoveredMonthlyServiceLink(null)}
                >
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
            <div className={styles.taskMetaActions}>
              <span className={`${styles.taskDueDate} ${overdue ? styles.taskDueDateOverdue : ''}`}>
                <ClockIcon />
                <span>{formatDate(task.due_date)}</span>
              </span>
              {onToggleStar && (
                <div className={styles.taskStarAction}>
                  <StarButton
                    isStarred={task.is_starred || false}
                    onToggle={() => onToggleStar(task.id)}
                    size="small"
                  />
                </div>
              )}
            </div>
          </div>
        </li>
      );
    };

    return (
      <>
        <InfoCard title="Personal Tasks" isCollapsible={true} startExpanded={true}>
          {personalTasksList.length === 0 ? (
            <p className={styles.emptyPersonalTasks}>No personal tasks</p>
          ) : (
            <ul className={styles.personalTasksList}>
              {personalTasksList.map(renderPersonalTaskRow)}
            </ul>
          )}
        </InfoCard>
        <InfoCard title="Monthly Services" isCollapsible={true} startExpanded={true}>
          {monthlyServicesList.length === 0 ? (
            <p className={styles.emptyPersonalTasks}>No monthly services</p>
          ) : (
            <ul className={styles.personalTasksList}>
              {monthlyServicesList.map(renderMonthlyServiceRow)}
            </ul>
          )}
        </InfoCard>
      </>
    );
  };

  return (
    <div className={styles.tasksContainer}>
      {/* Filters and View Tabs */}
      <div className={styles.filtersAndViewTabs}>
        <div className={styles.filters}>
          <div className={styles.searchBar}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 14L10.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="all">All Companies</option>
          {companyOptions.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={dueDateFilter}
          onChange={(e) => setDueDateFilter(e.target.value as DueDateFilter)}
        >
          <option value="all">All Due Dates</option>
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="next_30_days">Next 30 Days</option>
        </select>

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All Status</option>
          {projectStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        </div>

        {/* View Tabs */}
        {viewTabsElement && <div className={styles.viewTabsWrapper}>{viewTabsElement}</div>}
      </div>

      {/* Tasks List */}
      {renderCurrentlyWorkingOn()}
      {groupTasksByProject ? (
        <div className={showPersonalTasksCard ? styles.taskGrid : undefined}>
          <div className={showPersonalTasksCard ? styles.taskGridMain : undefined}>
            <InfoCard title="Projects" isCollapsible={true} startExpanded={true}>
              <div className={styles.groupedTasks}>
          {groupedTasks.projectGroups.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path
                  d="M50 16H14C11.7909 16 10 17.7909 10 20V44C10 46.2091 11.7909 48 14 48H50C52.2091 48 54 46.2091 54 44V20C54 17.7909 52.2091 16 50 16Z"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10 26H54M22 16V26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <h3>No tasks found</h3>
              <p>Try adjusting your filters or create a new task</p>
            </div>
          ) : (
            <>
              {groupedTasks.projectGroups.length === 0 && (
                <div className={styles.emptyState}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path
                      d="M50 16H14C11.7909 16 10 17.7909 10 20V44C10 46.2091 11.7909 48 14 48H50C52.2091 48 54 46.2091 54 44V20C54 17.7909 52.2091 16 50 16Z"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M10 26H54M22 16V26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <h3>No tasks found</h3>
                  <p>Try adjusting your filters or create a new task</p>
                </div>
              )}
              {groupedTasks.projectGroups.map((projectGroup) => {
                const projectName = projectGroup.project?.name || 'No Project';
                const projectCode = projectGroup.project?.shortcode
                  ? formatProjectShortcode(projectGroup.project.shortcode)
                  : '';
                const projectDueDate = projectGroup.project?.due_date || '';
                const projectOverdue = projectDueDate
                  ? (() => {
                      const parsed = parseDateString(projectDueDate);
                      if (!parsed) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      parsed.setHours(0, 0, 0, 0);
                      return parsed < today;
                    })()
                  : false;
                const showProjectDatePicker = datePickerProjectId === projectGroup.project?.id;
                return (
                  <div key={projectGroup.project?.id || 'no-project'} className={styles.projectGroup}>
                    <div
                      className={styles.projectGroupHeader}
                      onClick={() => projectGroup.project && onProjectClick && onProjectClick(projectGroup.project)}
                      style={{ cursor: projectGroup.project && onProjectClick ? 'pointer' : 'default' }}
                    >
                      {/* Company Logo at the start */}
                      {projectGroup.project && (
                        <div className={styles.companyLogoWrapper}>
                          <CompanyIcon
                            companyName={projectGroup.project.company?.name || 'No company'}
                            iconUrl={
                              Array.isArray(projectGroup.project.company?.branding)
                                ? projectGroup.project.company.branding[0]?.icon_logo_url
                                : projectGroup.project.company?.branding?.icon_logo_url
                            }
                            size="small"
                            showTooltip={true}
                          />
                        </div>
                      )}

                      <span className={styles.projectGroupTitle}>{projectName}</span>
                      {projectCode && (
                        <span className={styles.projectGroupCode}>{projectCode}</span>
                      )}
                      <div className={styles.projectMetaActions}>
                        {projectDueDate && (
                          <span className={`${styles.projectDueDate} ${projectOverdue ? styles.projectDueDateOverdue : ''}`}>
                            <ClockIcon />
                            <span>{formatDate(projectDueDate)}</span>
                          </span>
                        )}
                        {projectGroup.project && onToggleStarProject && (
                          <div className={styles.projectStarAction}>
                            <StarButton
                              isStarred={projectGroup.project.is_starred || false}
                              onToggle={() => onToggleStarProject(projectGroup.project!.id)}
                              size="small"
                            />
                          </div>
                        )}

                        {projectGroup.project && (
                          <div className={styles.projectHoverActions} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={styles.actionIcon}
                              onClick={(event) => handleProjectCalendarClick(event, projectGroup.project!)}
                              title={
                                projectGroup.project.due_date
                                  ? `Due on ${formatDate(projectGroup.project.due_date)}`
                                  : 'No due date set.'
                              }
                            >
                              <Calendar size={14} />
                            </button>
                            <button
                              type="button"
                              className={styles.actionIcon}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (onProjectClick) onProjectClick(projectGroup.project!);
                              }}
                              title="Go to project"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {showProjectDatePicker && projectGroup.project && (
                        <div
                          ref={projectDatePickerRef}
                          className={styles.projectDatePicker}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {(() => {
                            const { days, monthLabel } = generateProjectCalendarDays(projectGroup.project);
                            return (
                              <>
                                <div className={styles.datePickerHeader}>
                                  <button
                                    type="button"
                                    className={styles.datePickerNav}
                                    onClick={(event) => handleProjectMonthChange(event, projectGroup.project!.id, 'prev')}
                                    aria-label="Previous month"
                                  >
                                    <ChevronLeft size={14} />
                                  </button>
                                  <span className={styles.datePickerLabel}>{monthLabel}</span>
                                  <button
                                    type="button"
                                    className={styles.datePickerNav}
                                    onClick={(event) => handleProjectMonthChange(event, projectGroup.project!.id, 'next')}
                                    aria-label="Next month"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                </div>
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
                                      onClick={() =>
                                        handleProjectDateSelect(
                                          projectGroup.project!.id,
                                          day.date.toISOString().split('T')[0]
                                        )
                                      }
                                    >
                                      {day.date.getDate()}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  className={styles.datePickerClear}
                                  onClick={() => handleProjectDateSelect(projectGroup.project!.id, '')}
                                >
                                  Clear date
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <ul className={styles.projectTaskList}>
                      {projectGroup.tasks.map((task) => renderGroupedTaskRow(task))}
                    </ul>
                  </div>
                );
              })}
            </>
          )}
              </div>
            </InfoCard>
          </div>
          {showPersonalTasksCard && (
            <div className={styles.taskGridSidebar}>
              {renderPersonalTasksCard()}
            </div>
          )}
        </div>
      ) : (
        <div className={showPersonalTasksCard ? styles.taskGrid : undefined}>
          <div className={showPersonalTasksCard ? styles.taskGridMain : undefined}>
            <InfoCard title="Projects" isCollapsible={true} startExpanded={true}>
              <div className={styles.tasksTable}>
          <div className={styles.tableHeader}>
            <div
              className={`${styles.headerCell} ${styles.sortable}`}
              onClick={() => handleSort('title')}
            >
              Task Title
              {sortField === 'title' && (
                <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div
              className={`${styles.headerCell} ${styles.sortable}`}
              onClick={() => handleSort('project')}
            >
              Project
              {sortField === 'project' && (
                <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div className={styles.headerCell}>Project Code</div>
            <div
              className={`${styles.headerCell} ${styles.sortable}`}
              onClick={() => handleSort('client')}
            >
              Client
              {sortField === 'client' && (
                <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div
              className={`${styles.headerCell} ${styles.sortable}`}
              onClick={() => handleSort('priority')}
            >
              Priority
              {sortField === 'priority' && (
                <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div
              className={`${styles.headerCell} ${styles.sortable}`}
              onClick={() => handleSort('due_date')}
            >
              Due Date
              {sortField === 'due_date' && (
                <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div className={styles.headerCell}>Actions</div>
          </div>

          <div className={styles.tableBody}>
            {processedTasks.regular.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path
                    d="M50 16H14C11.7909 16 10 17.7909 10 20V44C10 46.2091 11.7909 48 14 48H50C52.2091 48 54 46.2091 54 44V20C54 17.7909 52.2091 16 50 16Z"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M10 26H54M22 16V26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <h3>No tasks found</h3>
                <p>Try adjusting your filters or create a new task</p>
              </div>
            ) : (
              processedTasks.regular.map((task) => renderTaskRow(task))
            )}
          </div>
              </div>
            </InfoCard>
          </div>
          {showPersonalTasksCard && (
            <div className={styles.taskGridSidebar}>
              {renderPersonalTasksCard()}
            </div>
          )}
        </div>
      )}

      {/* Monthly Service Link Tooltip */}
      {hoveredMonthlyServiceLink && monthlyServiceMetaByTaskId?.[hoveredMonthlyServiceLink] && (
        <div
          className={styles.monthlyServiceTooltip}
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          View Monthly Service: {monthlyServiceMetaByTaskId[hoveredMonthlyServiceLink].serviceName}
          <div className={styles.monthlyServiceTooltipArrow} />
        </div>
      )}
    </div>
  );
}
