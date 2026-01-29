'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { usePageActions } from '@/contexts/PageActionsContext';
import { createClient } from '@/lib/supabase/client';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Settings } from 'lucide-react';
import { MonthlyServiceForm } from '@/components/MonthlyServices/MonthlyServiceForm/MonthlyServiceForm';
import ProjectTaskList from '@/components/Projects/ProjectTaskList/ProjectTaskList';
import ProjectTaskDetail from '@/components/Projects/ProjectTaskDetail/ProjectTaskDetail';
import { ProjectTask } from '@/types/project';
import { useStarredItems } from '@/hooks/useStarredItems';
import styles from './MonthlyServiceDetail.module.scss';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  week_of_month: number | null;
  due_day_of_week: number | null;
  recurrence_frequency: string | null;
  display_order: number;
  default_assigned_to: string | null;
  profiles: Profile | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: string | null;
  due_date: string;
  assigned_to: string | null;
  profiles: Profile | null;
}

interface WeekProgress {
  week: number;
  completed: number;
  total: number;
  percentage: number;
  tasks: Task[];
}

interface Service {
  id: string;
  service_name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_id: string;
  companies: Company;
  templates: TaskTemplate[];
  weekProgress: WeekProgress[];
}

interface MonthlyServiceDetailProps {
  service: Service;
  user: User;
  onServiceUpdate: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  cancelled: '#EF4444',
};

export function MonthlyServiceDetail({
  service,
  user,
  onServiceUpdate,
}: MonthlyServiceDetailProps) {
  const router = useRouter();
  const { setPageHeader } = usePageActions();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedMonthDayjs, setSelectedMonthDayjs] = useState<Dayjs | null>(
    () => dayjs()
  );
  const [serviceData, setServiceData] = useState<Service>(service);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const { isStarred, toggleStar } = useStarredItems();

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    };
  };

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/admin/companies', { headers });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/admin/users?include_system=true', {
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch service data when month changes
  useEffect(() => {
    const fetchServiceData = async () => {
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
          { headers }
        );
        if (response.ok) {
          const data = await response.json();
          setServiceData(data.service);
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [selectedMonth, service.id]);

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: serviceData.service_name,
      description: `${serviceData.companies.name} • Monthly Service Management`,
      customActions: (
        <div className={styles.headerActions}>
          <div className={styles.monthSelector}>
            <label htmlFor="month-select" className={styles.monthLabel}>
              Month:
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={selectedMonthDayjs}
                onChange={handleMonthChange}
                views={['year', 'month']}
                slotProps={{
                  textField: {
                    size: 'small',
                    className: styles.monthInput,
                  },
                }}
              />
            </LocalizationProvider>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className={styles.editButton}
          >
            <Settings size={18} />
            Edit Service
          </button>
        </div>
      ),
    });

    return () => setPageHeader(null);
  }, [setPageHeader, serviceData, router, selectedMonthDayjs]);

  const handleMonthChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setSelectedMonthDayjs(newValue);
      const monthStr = `${newValue.year()}-${String(newValue.month() + 1).padStart(2, '0')}`;
      setSelectedMonth(monthStr);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getUserDisplayName = (profile: Profile | null) => {
    if (!profile) return 'Unassigned';
    const name =
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || profile.email;
  };

  const handleTaskClick = (task: Task) => {
    // Convert monthly service task to ProjectTask format
    const projectTask: ProjectTask = {
      ...task,
      project_id: null,
      parent_task_id: null,
      notes: null,
      status: task.is_completed ? 'completed' : 'todo',
      start_date: null,
      completed_at: task.is_completed ? new Date().toISOString() : null,
      labels: [],
      milestone: null,
      sprint: null,
      story_points: null,
      blocked_by: [],
      blocking: [],
      blocker_reason: null,
      display_order: 0,
      kanban_column: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id,
    };
    setSelectedTask(projectTask);
    setIsTaskDetailOpen(true);
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_completed: isCompleted }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh service data
      const refreshResponse = await fetch(
        `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
        { headers }
      );
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setServiceData(data.service);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<ProjectTask>
  ) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh service data
      const refreshResponse = await fetch(
        `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
        { headers }
      );
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setServiceData(data.service);
      }

      // Update selected task if it's the one being edited
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Close detail panel if this task was selected
      if (selectedTask?.id === taskId) {
        setIsTaskDetailOpen(false);
        setSelectedTask(null);
      }

      // Refresh service data
      const refreshResponse = await fetch(
        `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
        { headers }
      );
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setServiceData(data.service);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const handleServiceSubmit = async (data: any) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/admin/monthly-services/${service.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update service');
    }

    // Refresh service data
    const refreshResponse = await fetch(
      `/api/admin/monthly-services/${service.id}?month=${selectedMonth}`,
      { headers }
    );
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      setServiceData(data.service);
    }

    // Notify parent
    onServiceUpdate();
  };

  return (
    <div className={styles.container}>

      {/* Tasks by Week */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Tasks for {formatMonth(selectedMonth)}
        </h2>
        {loading ? (
          <div className={styles.loading}>Loading tasks...</div>
        ) : (
          <div className={styles.weeksGrid}>
            {serviceData.weekProgress.map(week => (
              <div key={week.week} className={styles.weekCard}>
                <div className={styles.weekHeader}>
                  <h3 className={styles.weekTitle}>Week {week.week}</h3>
                  <span className={styles.weekProgress}>
                    {week.completed} / {week.total}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${week.percentage}%`,
                      backgroundColor:
                        week.percentage === 100 ? '#10B981' : '#3B82F6',
                    }}
                  />
                </div>
                {week.tasks.length === 0 ? (
                  <div className={styles.noTasks}>No tasks for this week</div>
                ) : (
                  <ProjectTaskList
                    tasks={week.tasks.map(task => ({
                      ...task,
                      project_id: null,
                      parent_task_id: null,
                      notes: null,
                      status: task.is_completed ? 'completed' : 'todo',
                      start_date: null,
                      completed_at: task.is_completed
                        ? new Date().toISOString()
                        : null,
                      labels: [],
                      milestone: null,
                      sprint: null,
                      story_points: null,
                      blocked_by: [],
                      blocking: [],
                      blocker_reason: null,
                      display_order: 0,
                      kanban_column: null,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      created_by: user.id,
                      assigned_to_profile: task.profiles,
                    }))}
                    onTaskClick={handleTaskClick}
                    onToggleComplete={handleToggleComplete}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onToggleStar={(taskId) => toggleStar('task', taskId)}
                    isStarred={(taskId) => isStarred('task', taskId)}
                    showHeader={false}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Service Modal */}
      <MonthlyServiceForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleServiceSubmit}
        companies={companies}
        users={users}
        service={serviceData}
      />

      {/* Task Detail Panel */}
      {isTaskDetailOpen && selectedTask && (
        <ProjectTaskDetail
          task={selectedTask}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onDelete={() => selectedTask && handleDeleteTask(selectedTask.id)}
          onAddComment={async (comment: string) => {
            // TODO: Implement comment functionality
            console.log('Add comment:', comment);
          }}
          onCreateSubtask={() => {
            // TODO: Implement subtask functionality
            console.log('Create subtask');
          }}
          onUpdateProgress={async (progress: number) => {
            await handleUpdateTask(selectedTask.id, {
              progress_percentage: progress,
            });
          }}
          users={users}
          onToggleStar={(taskId) => toggleStar('task', taskId)}
          isStarred={(taskId) => isStarred('task', taskId)}
        />
      )}
    </div>
  );
}
