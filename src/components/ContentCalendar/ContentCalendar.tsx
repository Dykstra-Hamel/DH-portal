'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, Check } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { usePageActions } from '@/contexts/PageActionsContext';
import { FilterPanel } from '@/components/Common/FilterPanel/FilterPanel';
import type { FilterOption } from '@/components/Common/FilterPanel/FilterPanel';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import ProjectTaskDetail from '@/components/Projects/ProjectTaskDetail/ProjectTaskDetail';
import { useStarredItems } from '@/hooks/useStarredItems';
import { useLocalStorageFilter } from '@/hooks/useLocalStorageFilter';
import { ProjectTask } from '@/types/project';
import {
  createAdminContentPieceChannel,
  subscribeToContentPieceUpdates,
  removeContentPieceChannel,
} from '@/lib/realtime/content-piece-channel';
import {
  createAdminProjectChannel,
  subscribeToProjectUpdates,
  removeProjectChannel,
} from '@/lib/realtime/project-channel';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import styles from './ContentCalendar.module.scss';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog: 'Blog',
  evergreen: 'Evergreen',
  location: 'Location',
  pillar: 'Pillar',
  cluster: 'Cluster',
  pest_id: 'Pest ID',
  other: 'Other',
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  blog: '#3b82f6',
  evergreen: '#10b981',
  location: '#f59e0b',
  pillar: '#8b5cf6',
  cluster: '#ec4899',
  pest_id: '#ef4444',
  other: '#6b7280',
};

interface ContentPieceCalendarItem {
  id: string;
  content_type: string | null;
  title: string | null;
  publish_date: string | null;
  link: string | null;
  google_doc_link: string | null;
  topic: string | null;
  task_id: string | null;
  is_completed: boolean;
  is_planned: false;
  sort_order: number | null;
  task_is_completed: boolean | null;
  task_due_date: string | null;
  task_assignee_name: string | null;
  task_assignee_email: string | null;
  task_assignee_avatar_url: string | null;
  social_media_task_id: string | null;
  social_media_task_is_completed: boolean | null;
  social_media_task_due_date: string | null;
  social_media_task_assignee_name: string | null;
  social_media_task_assignee_email: string | null;
  social_media_task_assignee_avatar_url: string | null;
}

interface PlannedContentItem {
  template_id: string;
  content_type: string | null;
  title: string;
  is_planned: true;
  week_of_month: number | null;
}

type CalendarItem = ContentPieceCalendarItem | PlannedContentItem;

interface ServiceCalendarRow {
  id: string;
  service_name: string;
  company_id: string;
  company_name: string;
  months: Record<string, CalendarItem[]>;
}

interface PopoverState {
  item: CalendarItem;
  serviceId: string;
  monthKey: string;
  itemIndex: number;
}

export function ContentCalendar() {
  const { setPageHeader } = usePageActions();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const yearRef = useRef(year);
  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  const contentPieceChannelRef = useRef<RealtimeChannel | null>(null);
  const projectTaskChannelRef = useRef<RealtimeChannel | null>(null);

  const [services, setServices] = useState<ServiceCalendarRow[]>([]);
  const servicesRef = useRef<ServiceCalendarRow[]>([]);
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState<PopoverState | null>(null);

  type CalendarView = 'year' | 'month';
  const [view, setView] = useState<CalendarView>('month');
  const [activeMonth, setActiveMonth] = useState<number>(
    () => new Date().getMonth() + 1
  ); // 1–12

  // Editable field state for the popover
  const [editContentType, setEditContentType] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editWeek, setEditWeek] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [filterCompanyId, setFilterCompanyId] = useLocalStorageFilter(
    'contentCalendar.filterCompanyId'
  );
  const [filterContentType, setFilterContentType] = useLocalStorageFilter(
    'contentCalendar.filterContentType'
  );
  const [filterStatus, setFilterStatus] = useLocalStorageFilter(
    'contentCalendar.filterStatus'
  );

  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [taskPanelUsers, setTaskPanelUsers] = useState<any[]>([]);
  const [taskPanelDepartments, setTaskPanelDepartments] = useState<
    { id: string; name: string; icon?: string }[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { isStarred, toggleStar } = useStarredItems();

  const getAuthHeaders = useCallback(async () => {
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
  }, []);

  const fetchCalendar = useCallback(
    async (targetYear: number) => {
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(
          `/api/admin/content-calendar?year=${targetYear}`,
          { headers }
        );
        if (response.ok) {
          const data = await response.json();
          setServices(data.services || []);
        }
      } catch (error) {
        console.error('Error fetching content calendar:', error);
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const fetchAndUpdatePiece = useCallback(
    async (recordId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/content-pieces/${recordId}`, {
        headers,
      });
      if (!res.ok) return;
      const { contentPiece: cp } = await res.json();

      const is_completed =
        (cp.task_is_completed ?? false) &&
        (cp.social_media_task_id
          ? (cp.social_media_task_is_completed ?? false)
          : true);

      const updatedItem: ContentPieceCalendarItem = {
        id: cp.id,
        content_type: cp.content_type,
        title: cp.title,
        publish_date: cp.publish_date,
        link: cp.link,
        google_doc_link: cp.google_doc_link,
        topic: cp.topic,
        task_id: cp.task_id,
        is_completed,
        is_planned: false,
        sort_order: cp.sort_order ?? null,
        task_is_completed: cp.task_is_completed,
        task_due_date: cp.task_due_date ?? null,
        task_assignee_name: cp.task_assignee_name,
        task_assignee_email: cp.task_assignee_email ?? null,
        task_assignee_avatar_url: cp.task_assignee_avatar_url ?? null,
        social_media_task_id: cp.social_media_task_id,
        social_media_task_is_completed: cp.social_media_task_is_completed,
        social_media_task_due_date: cp.social_media_task_due_date ?? null,
        social_media_task_assignee_name: cp.social_media_task_assignee_name,
        social_media_task_assignee_email:
          cp.social_media_task_assignee_email ?? null,
        social_media_task_assignee_avatar_url:
          cp.social_media_task_assignee_avatar_url ?? null,
      };

      setServices(prev =>
        prev.map(service => {
          const updatedMonths = { ...service.months };
          let changed = false;
          for (const [monthKey, items] of Object.entries(updatedMonths)) {
            const idx = items.findIndex(
              item =>
                !item.is_planned &&
                (item as ContentPieceCalendarItem).id === recordId
            );
            if (idx !== -1) {
              const newItems = [...items];
              newItems[idx] = updatedItem;
              updatedMonths[monthKey] = newItems;
              changed = true;
            }
          }
          return changed ? { ...service, months: updatedMonths } : service;
        })
      );
    },
    [getAuthHeaders]
  );

  const fetchAndInsertPiece = useCallback(
    async (recordId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/content-pieces/${recordId}`, {
        headers,
      });
      if (!res.ok) return;
      const { contentPiece: cp } = await res.json();

      const monthKey =
        cp.service_month ||
        (cp.publish_date ? cp.publish_date.slice(0, 7) : null) ||
        (cp.task_due_date ? cp.task_due_date.slice(0, 7) : null);
      if (!monthKey) return;
      if (parseInt(monthKey.slice(0, 4), 10) !== yearRef.current) return;

      const is_completed =
        (cp.task_is_completed ?? false) &&
        (cp.social_media_task_id
          ? (cp.social_media_task_is_completed ?? false)
          : true);

      const newItem: ContentPieceCalendarItem = {
        id: cp.id,
        content_type: cp.content_type,
        title: cp.title,
        publish_date: cp.publish_date,
        link: cp.link,
        google_doc_link: cp.google_doc_link,
        topic: cp.topic,
        task_id: cp.task_id,
        is_completed,
        is_planned: false,
        sort_order: cp.sort_order ?? null,
        task_is_completed: cp.task_is_completed,
        task_due_date: cp.task_due_date ?? null,
        task_assignee_name: cp.task_assignee_name,
        task_assignee_email: cp.task_assignee_email ?? null,
        task_assignee_avatar_url: cp.task_assignee_avatar_url ?? null,
        social_media_task_id: cp.social_media_task_id,
        social_media_task_is_completed: cp.social_media_task_is_completed,
        social_media_task_due_date: cp.social_media_task_due_date ?? null,
        social_media_task_assignee_name: cp.social_media_task_assignee_name,
        social_media_task_assignee_email:
          cp.social_media_task_assignee_email ?? null,
        social_media_task_assignee_avatar_url:
          cp.social_media_task_assignee_avatar_url ?? null,
      };

      setServices(prev =>
        prev.map(service => {
          if (service.id !== cp.monthly_service_id) return service;
          const existing = service.months[monthKey] || [];
          if (
            existing.some(
              i => !i.is_planned && (i as ContentPieceCalendarItem).id === cp.id
            )
          )
            return service;
          return {
            ...service,
            months: { ...service.months, [monthKey]: [...existing, newItem] },
          };
        })
      );
    },
    [getAuthHeaders]
  );

  useEffect(() => {
    fetchCalendar(year);
  }, [year, fetchCalendar]);

  useEffect(() => {
    // Subscribe to content piece changes
    const cpChannel = createAdminContentPieceChannel();
    contentPieceChannelRef.current = cpChannel;
    subscribeToContentPieceUpdates(cpChannel, payload => {
      if (payload.action === 'UPDATE') {
        fetchAndUpdatePiece(payload.record_id);
      } else if (payload.action === 'INSERT') {
        fetchAndInsertPiece(payload.record_id);
      } else if (payload.action === 'DELETE') {
        setServices(prev =>
          prev.map(service => {
            const updatedMonths = { ...service.months };
            let changed = false;
            for (const [monthKey, items] of Object.entries(updatedMonths)) {
              const filtered = items.filter(
                item =>
                  item.is_planned ||
                  (item as ContentPieceCalendarItem).id !== payload.record_id
              );
              if (filtered.length !== items.length) {
                updatedMonths[monthKey] = filtered;
                changed = true;
              }
            }
            return changed ? { ...service, months: updatedMonths } : service;
          })
        );
      }
    });

    // Subscribe to project_tasks changes (for assignee / completion updates)
    const ptChannel = createAdminProjectChannel();
    projectTaskChannelRef.current = ptChannel;
    subscribeToProjectUpdates(ptChannel, payload => {
      if (payload.table !== 'project_tasks') return;
      for (const service of servicesRef.current) {
        for (const items of Object.values(service.months)) {
          for (const item of items) {
            if (!item.is_planned) {
              const piece = item as ContentPieceCalendarItem;
              if (
                piece.task_id === payload.record_id ||
                piece.social_media_task_id === payload.record_id
              ) {
                fetchAndUpdatePiece(piece.id);
              }
            }
          }
        }
      }
    });

    return () => {
      removeContentPieceChannel(cpChannel);
      removeProjectChannel(ptChannel);
    };
  }, [fetchAndUpdatePiece, fetchAndInsertPiece]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? '');
    });
  }, []);

  // Initialize edit fields when popover opens
  useEffect(() => {
    if (!popover) return;
    const { item } = popover;
    setEditContentType(item.content_type || '');
    setEditTitle(item.title || '');
    setEditLink(
      !item.is_planned && (item as ContentPieceCalendarItem).link
        ? (item as ContentPieceCalendarItem).link!
        : ''
    );
    setEditTopic(
      !item.is_planned && (item as ContentPieceCalendarItem).topic
        ? (item as ContentPieceCalendarItem).topic!
        : ''
    );
    setEditWeek(
      item.is_planned
        ? ((item as PlannedContentItem).week_of_month ?? null)
        : ((item as ContentPieceCalendarItem).sort_order ?? null)
    );
  }, [popover]);

  const handleBadgeClick = (
    e: React.MouseEvent,
    item: CalendarItem,
    serviceId: string,
    monthKey: string,
    itemIndex: number
  ) => {
    e.stopPropagation();
    setPopover({ item, serviceId, monthKey, itemIndex });
  };

  const navigateMonth = (direction: 1 | -1) => {
    setPopover(null);
    setActiveMonth(prev => {
      const next = prev + direction;
      if (next > 12) {
        setYear(y => y + 1);
        return 1;
      }
      if (next < 1) {
        setYear(y => y - 1);
        return 12;
      }
      return next;
    });
  };

  const handleViewSwitch = (newView: CalendarView) => {
    if (newView === 'month') {
      const now = new Date();
      setActiveMonth(year === now.getFullYear() ? now.getMonth() + 1 : 1);
    }
    setPopover(null);
    setView(newView);
  };

  const companyOptions = useMemo((): FilterOption[] => {
    const seen = new Set<string>();
    const opts: FilterOption[] = [];
    for (const s of services) {
      if (!seen.has(s.company_id)) {
        seen.add(s.company_id);
        opts.push({ value: s.company_id, label: s.company_name });
      }
    }
    opts.sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: null, label: 'All Companies' }, ...opts];
  }, [services]);

  const contentTypeOptions: FilterOption[] = [
    { value: null, label: 'All Types' },
    ...Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const statusOptions: FilterOption[] = [
    { value: null, label: 'All Statuses' },
    { value: 'planned', label: 'Planned' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  const filteredServices = useMemo(() => {
    let result = services;

    if (filterCompanyId) {
      result = result.filter(s => s.company_id === filterCompanyId);
    }

    if (filterContentType || filterStatus) {
      result = result
        .map(service => {
          const filteredMonths: Record<string, CalendarItem[]> = {};
          for (const [monthKey, items] of Object.entries(service.months)) {
            let filteredItems = items;
            if (filterContentType) {
              filteredItems = filteredItems.filter(
                item => item.content_type === filterContentType
              );
            }
            if (filterStatus) {
              filteredItems = filteredItems.filter(item => {
                if (filterStatus === 'planned') return item.is_planned;
                const piece = item as ContentPieceCalendarItem;
                if (filterStatus === 'completed')
                  return !item.is_planned && piece.is_completed;
                if (filterStatus === 'active')
                  return !item.is_planned && !piece.is_completed;
                return true;
              });
            }
            if (filteredItems.length > 0)
              filteredMonths[monthKey] = filteredItems;
          }
          return { ...service, months: filteredMonths };
        })
        .filter(service =>
          Object.values(service.months).some(items => items.length > 0)
        );
    }

    return result.sort((a, b) => a.service_name.localeCompare(b.service_name));
  }, [services, filterCompanyId, filterContentType, filterStatus]);

  const handleClearAllFilters = useCallback(() => {
    setFilterCompanyId(null);
    setFilterContentType(null);
    setFilterStatus(null);
  }, []);

  useEffect(() => {
    setPageHeader({
      title: 'Content Calendar',
      description:
        'Year-wide view of planned content across all active monthly services',
      customActions: (
        <FilterPanel
          onClearAll={handleClearAllFilters}
          filters={[
            {
              key: 'company',
              label: 'Company',
              value: filterCompanyId,
              options: companyOptions,
              onChange: setFilterCompanyId,
              searchable: true,
            },
            {
              key: 'contentType',
              label: 'Content Type',
              value: filterContentType,
              options: contentTypeOptions,
              onChange: setFilterContentType,
            },
            {
              key: 'status',
              label: 'Status',
              value: filterStatus,
              options: statusOptions,
              onChange: setFilterStatus,
            },
          ]}
        />
      ),
    });
    return () => setPageHeader(null);
  }, [
    setPageHeader,
    filterCompanyId,
    filterContentType,
    filterStatus,
    companyOptions,
    handleClearAllFilters,
  ]);

  const monthViewRows = useMemo(() => {
    if (view !== 'month') return [];
    const monthKey = `${year}-${String(activeMonth).padStart(2, '0')}`;
    const rows: Array<{
      item: CalendarItem;
      service: ServiceCalendarRow;
      monthKey: string;
      itemIndex: number;
    }> = [];
    for (const service of filteredServices) {
      const items = service.months[monthKey] || [];
      items.forEach((item, itemIndex) =>
        rows.push({ item, service, monthKey, itemIndex })
      );
    }
    rows.sort((a, b) =>
      a.service.company_name.localeCompare(b.service.company_name)
    );
    return rows;
  }, [view, filteredServices, year, activeMonth]);

  const mentionUsers = useMemo(() => {
    return taskPanelUsers.map(u => {
      const profile = (u as any).profiles;
      return {
        id: profile?.id || u.id,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        email: profile?.email || (u as any).email || null,
        avatar_url: profile?.avatar_url || null,
      };
    });
  }, [taskPanelUsers]);

  const handleOpenTaskPanel = useCallback(
    async (taskId: string, monthlyServiceId: string) => {
      const headers = await getAuthHeaders();
      const [taskRes, usersRes, depsRes] = await Promise.all([
        fetch(`/api/admin/tasks/${taskId}`, { headers }),
        fetch('/api/admin/users?include_system=true', { headers }),
        fetch('/api/admin/monthly-services/departments', { headers }),
      ]);
      if (taskRes.ok) {
        const taskData = await taskRes.json();
        const task = taskData.task ?? taskData;
        setSelectedTask({ ...task, monthly_service_id: monthlyServiceId });
      }
      if (usersRes.ok) setTaskPanelUsers(await usersRes.json());
      if (depsRes.ok) {
        const depsData = await depsRes.json();
        setTaskPanelDepartments(depsData.departments || []);
      }
      setIsTaskDetailOpen(true);
    },
    [getAuthHeaders]
  );

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<ProjectTask>
  ) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) return;
    const data = await res.json();
    setSelectedTask(data.task ?? data);
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedTask) return null;
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/admin/tasks/${selectedTask.id}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) return null;
    return (await res.json()).comment ?? null;
  };

  const handleUpdateProgress = async (progress: number) => {
    if (!selectedTask) return;
    await handleUpdateTask(selectedTask.id, { progress_percentage: progress });
  };

  const handleSave = async () => {
    if (!popover) return;
    const { item, serviceId, monthKey, itemIndex } = popover;
    setIsSaving(true);

    try {
      const headers = await getAuthHeaders();
      const body = {
        content_type: editContentType || null,
        title: editTitle || null,
        link: editLink || null,
        topic: editTopic || null,
        sort_order: editWeek ?? null,
      };

      let savedPiece: ContentPieceCalendarItem | null = null;

      if (!item.is_planned) {
        // PATCH existing content piece
        const piece = item as ContentPieceCalendarItem;
        const response = await fetch(
          `/api/admin/monthly-services/${serviceId}/content/${piece.id}`,
          { method: 'PATCH', headers, body: JSON.stringify(body) }
        );
        if (response.ok) {
          const data = await response.json();
          savedPiece = {
            ...piece,
            ...data.contentPiece,
            is_planned: false as const,
          };
        }
      } else {
        // POST to create a new content piece from a planned item
        const response = await fetch(
          `/api/admin/monthly-services/${serviceId}/content`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...body,
              task_id: null,
              service_month: monthKey,
            }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          savedPiece = {
            id: data.contentPiece.id,
            content_type: data.contentPiece.content_type,
            title: data.contentPiece.title,
            publish_date: data.contentPiece.publish_date,
            link: data.contentPiece.link,
            google_doc_link: data.contentPiece.google_doc_link ?? null,
            topic: data.contentPiece.topic,
            task_id: data.contentPiece.task_id,
            is_completed: false,
            is_planned: false as const,
            sort_order: data.contentPiece.sort_order ?? null,
            task_is_completed: null,
            task_due_date: null,
            task_assignee_name: null,
            task_assignee_email: null,
            task_assignee_avatar_url: null,
            social_media_task_id: null,
            social_media_task_is_completed: null,
            social_media_task_due_date: null,
            social_media_task_assignee_name: null,
            social_media_task_assignee_email: null,
            social_media_task_assignee_avatar_url: null,
          };
        }
      }

      if (savedPiece) {
        // Update local services state so the badge reflects changes immediately
        setServices(prev =>
          prev.map(service => {
            if (service.id !== serviceId) return service;
            const monthItems = [...(service.months[monthKey] || [])];
            monthItems[itemIndex] = savedPiece!;
            return {
              ...service,
              months: { ...service.months, [monthKey]: monthItems },
            };
          })
        );

        // Update the popover item reference so re-opening shows fresh data
        setPopover(prev => (prev ? { ...prev, item: savedPiece! } : null));
      }
    } catch (error) {
      console.error('Error saving content piece:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBadge = (
    item: CalendarItem,
    serviceId: string,
    monthKey: string,
    idx: number
  ) => {
    const type = item.content_type;
    const label = type ? (CONTENT_TYPE_LABELS[type] ?? type) : 'Unknown';
    const color = type ? (CONTENT_TYPE_COLORS[type] ?? '#6b7280') : '#6b7280';
    const isPlanned = item.is_planned;
    const isCompleted =
      !isPlanned && (item as ContentPieceCalendarItem).is_completed;

    return (
      <button
        key={idx}
        className={`${styles.badge} ${isPlanned ? styles.badgePlanned : ''} ${isCompleted ? styles.badgeCompleted : ''}`}
        style={{ '--badge-color': color } as React.CSSProperties}
        onClick={e => handleBadgeClick(e, item, serviceId, monthKey, idx)}
        title={label}
      >
        {isCompleted && <span className={styles.checkmark}>✓</span>}
        {label}
      </button>
    );
  };

  const renderPopover = () => {
    if (!popover) return null;
    const { item } = popover;
    const isPlanned = item.is_planned;
    const currentColor = editContentType
      ? (CONTENT_TYPE_COLORS[editContentType] ?? '#6b7280')
      : '#6b7280';

    return (
      <Modal isOpen={!!popover} onClose={() => setPopover(null)} size="small">
        <ModalTop
          title={isPlanned ? 'Planned Content' : 'Edit Content'}
          onClose={() => setPopover(null)}
        />
        <ModalMiddle>
          <div className={styles.modalHeader}>
            <span
              className={styles.popoverTypeBadge}
              style={{ background: currentColor }}
            >
              {editContentType
                ? (CONTENT_TYPE_LABELS[editContentType] ?? editContentType)
                : 'Unknown'}
            </span>
            {isPlanned && (
              <span className={styles.popoverPlannedTag}>Planned</span>
            )}
            {!isPlanned && (item as ContentPieceCalendarItem).id && (
              <Link
                href={`/admin/content-pieces/${(item as ContentPieceCalendarItem).id}`}
                className={styles.viewDetailsBtn}
                title="View full details"
              >
                <ExternalLink size={14} />
              </Link>
            )}
          </div>

          <div className={styles.modalFields}>
            <label className={styles.fieldLabel}>Content Type</label>
            <select
              className={styles.fieldSelect}
              value={editContentType}
              onChange={e => setEditContentType(e.target.value)}
            >
              <option value="">Select type...</option>
              <option value="blog">Blog</option>
              <option value="evergreen">Evergreen</option>
              <option value="location">Location</option>
              <option value="pillar">Pillar</option>
              <option value="cluster">Cluster</option>
              <option value="pest_id">Pest ID</option>
              <option value="other">Other</option>
            </select>

            <label className={styles.fieldLabel}>Week</label>
            <select
              className={styles.fieldSelect}
              value={editWeek ?? ''}
              onChange={e =>
                setEditWeek(e.target.value ? parseInt(e.target.value) : null)
              }
            >
              <option value="">Select week...</option>
              <option value="1">Week 1</option>
              <option value="2">Week 2</option>
              <option value="3">Week 3</option>
              <option value="4">Week 4</option>
            </select>

            <label className={styles.fieldLabel}>Topic</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={editTopic}
              onChange={e => setEditTopic(e.target.value)}
              placeholder="Content topic..."
            />

            <label className={styles.fieldLabel}>Title</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Content title..."
            />

            <label className={styles.fieldLabel}>Link</label>
            <input
              type="url"
              className={styles.fieldInput}
              value={editLink}
              onChange={e => setEditLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </ModalMiddle>
        <ModalBottom>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button className={styles.cancelBtn} onClick={() => setPopover(null)}>
            Cancel
          </button>
        </ModalBottom>
      </Modal>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.calendarNav}>
        <div className={styles.navControls}>
          <button
            className={styles.yearNavBtn}
            onClick={() =>
              view === 'year' ? setYear(y => y - 1) : navigateMonth(-1)
            }
            aria-label={view === 'year' ? 'Previous year' : 'Previous month'}
          >
            <ChevronLeft size={18} />
          </button>
          <span className={styles.yearLabel}>
            {view === 'year' ? year : `${MONTHS[activeMonth - 1]} ${year}`}
          </span>
          <button
            className={styles.yearNavBtn}
            onClick={() =>
              view === 'year' ? setYear(y => y + 1) : navigateMonth(1)
            }
            aria-label={view === 'year' ? 'Next year' : 'Next month'}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewToggleBtn} ${view === 'year' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => handleViewSwitch('year')}
          >
            Year
          </button>
          <button
            className={`${styles.viewToggleBtn} ${view === 'month' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => handleViewSwitch('month')}
          >
            Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading content calendar...</div>
      ) : view === 'year' ? (
        filteredServices.length === 0 ? (
          <div className={styles.empty}>
            No active monthly services have Content department templates
            configured.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.serviceCol}>Service</th>
                  {MONTHS.map((m, i) => (
                    <th key={i} className={styles.monthCol}>
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredServices.map(service => (
                  <tr key={service.id}>
                    <td className={styles.serviceCell}>
                      <div className={styles.serviceName}>
                        {service.service_name}
                      </div>
                      <div className={styles.companyName}>
                        {service.company_name}
                      </div>
                    </td>
                    {MONTHS.map((_, monthIdx) => {
                      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
                      const items = service.months[monthKey] || [];
                      return (
                        <td key={monthIdx} className={styles.monthCell}>
                          {items.map((item, idx) =>
                            renderBadge(item, service.id, monthKey, idx)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : monthViewRows.length === 0 ? (
        <div className={styles.empty}>
          No content pieces scheduled for {MONTHS[activeMonth - 1]} {year}.
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={`${styles.table} ${styles.tableMonthView}`}>
            <thead>
              <tr>
                <th className={styles.colCompany}>Company</th>
                <th className={styles.colType}>Type</th>
                <th className={styles.colTitle}>Title</th>
                <th className={styles.colLink}>Link</th>
                <th className={styles.colGoogleDoc}>Google Doc</th>
                <th className={styles.colTask}>Content Task</th>
                <th className={styles.colTask}>Social Task</th>
                <th className={styles.colStatus}>Status</th>
                <th className={styles.colActions}></th>
              </tr>
            </thead>
            <tbody>
              {monthViewRows.map(({ item, service, monthKey, itemIndex }) => {
                const isPlanned = item.is_planned;
                const piece = isPlanned
                  ? null
                  : (item as ContentPieceCalendarItem);
                const isCompleted = piece?.is_completed ?? false;
                const type = item.content_type;
                const color = type
                  ? (CONTENT_TYPE_COLORS[type] ?? '#6b7280')
                  : '#6b7280';
                const label = type
                  ? (CONTENT_TYPE_LABELS[type] ?? type)
                  : 'Unknown';
                const rowKey = isPlanned
                  ? `planned-${(item as PlannedContentItem).template_id}-${itemIndex}`
                  : `piece-${piece!.id}`;
                const statusLabel = isPlanned
                  ? 'Planned'
                  : isCompleted
                    ? 'Completed'
                    : 'Active';
                const statusClass = isPlanned
                  ? styles.statusPlanned
                  : isCompleted
                    ? styles.statusCompleted
                    : styles.statusActive;

                return (
                  <tr
                    key={rowKey}
                    className={`${styles.monthRow} ${isPlanned ? styles.monthRowPlanned : ''} ${isCompleted ? styles.monthRowCompleted : ''}`}
                    onClick={e =>
                      handleBadgeClick(e, item, service.id, monthKey, itemIndex)
                    }
                  >
                    <td className={styles.cellCompany}>
                      {service.company_name}
                    </td>
                    <td className={styles.cellType}>
                      <span
                        className={`${styles.typePill} ${isPlanned ? styles.typePillPlanned : ''}`}
                        style={
                          { '--badge-color': color } as React.CSSProperties
                        }
                      >
                        {label}
                      </span>
                    </td>
                    <td className={styles.cellTitle}>
                      {item.title ?? (
                        <span className={styles.untitled}>Untitled</span>
                      )}
                    </td>
                    <td className={styles.cellLink}>
                      {!isPlanned && piece?.link ? (
                        <a
                          href={piece.link}
                          className={styles.contentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                        >
                          {piece.link}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.cellGoogleDoc}>
                      {!isPlanned && piece?.google_doc_link ? (
                        <a
                          href={piece.google_doc_link}
                          className={styles.contentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                        >
                          View Doc
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.cellTask}>
                      {!isPlanned && piece?.task_id ? (
                        <div className={styles.taskCellInner}>
                          <button
                            className={`${styles.taskChip} ${piece.task_is_completed ? styles.taskChipDone : ''} ${piece.task_assignee_email ? styles.taskChipAvatar : ''}`}
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenTaskPanel(piece.task_id!, service.id);
                            }}
                          >
                            {piece.task_is_completed ? (
                              <span className={styles.taskCompletedCheck}>
                                <Check size={12} />
                              </span>
                            ) : piece.task_assignee_email ? (
                              <>
                                <MiniAvatar
                                  firstName={
                                    piece.task_assignee_name?.split(' ')[0] ||
                                    undefined
                                  }
                                  lastName={
                                    piece.task_assignee_name
                                      ?.split(' ')
                                      .slice(1)
                                      .join(' ') || undefined
                                  }
                                  email={piece.task_assignee_email}
                                  avatarUrl={piece.task_assignee_avatar_url}
                                  size="small"
                                  showTooltip={true}
                                />
                                {piece.task_due_date && (
                                  <span className={styles.taskDueDate}>
                                    Due{' '}
                                    {new Date(
                                      piece.task_due_date + 'T00:00:00'
                                    ).toLocaleDateString('en-US', {
                                      month: 'numeric',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </>
                            ) : (
                              'Unassigned'
                            )}
                          </button>
                          {!piece.task_assignee_email &&
                            !piece.task_is_completed &&
                            piece.task_due_date && (
                              <span className={styles.taskDueDate}>
                                Due{' '}
                                {new Date(
                                  piece.task_due_date + 'T00:00:00'
                                ).toLocaleDateString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.cellTask}>
                      {!isPlanned && piece?.social_media_task_id ? (
                        <div className={styles.taskCellInner}>
                          <button
                            className={`${styles.taskChip} ${piece.social_media_task_is_completed ? styles.taskChipDone : ''} ${piece.social_media_task_assignee_email ? styles.taskChipAvatar : ''}`}
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenTaskPanel(
                                piece.social_media_task_id!,
                                service.id
                              );
                            }}
                          >
                            {piece.social_media_task_is_completed ? (
                              <span className={styles.taskCompletedCheck}>
                                <Check size={12} />
                              </span>
                            ) : piece.social_media_task_assignee_email ? (
                              <>
                                <MiniAvatar
                                  firstName={
                                    piece.social_media_task_assignee_name?.split(
                                      ' '
                                    )[0] || undefined
                                  }
                                  lastName={
                                    piece.social_media_task_assignee_name
                                      ?.split(' ')
                                      .slice(1)
                                      .join(' ') || undefined
                                  }
                                  email={piece.social_media_task_assignee_email}
                                  avatarUrl={
                                    piece.social_media_task_assignee_avatar_url
                                  }
                                  size="small"
                                  showTooltip={true}
                                />
                                {piece.social_media_task_due_date && (
                                  <span className={styles.taskDueDate}>
                                    Due{' '}
                                    {new Date(
                                      piece.social_media_task_due_date +
                                        'T00:00:00'
                                    ).toLocaleDateString('en-US', {
                                      month: 'numeric',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </>
                            ) : (
                              'Unassigned'
                            )}
                          </button>
                          {!piece.social_media_task_assignee_email &&
                            !piece.social_media_task_is_completed &&
                            piece.social_media_task_due_date && (
                              <span className={styles.taskDueDate}>
                                Due{' '}
                                {new Date(
                                  piece.social_media_task_due_date + 'T00:00:00'
                                ).toLocaleDateString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.cellStatus}>
                      <span className={`${styles.statusPill} ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className={styles.cellActions}>
                      {!isPlanned && piece?.id && (
                        <Link
                          href={`/admin/content-pieces/${piece.id}`}
                          className={styles.viewDetailsBtn}
                          onClick={e => e.stopPropagation()}
                          title="View detail page"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {renderPopover()}

      {isTaskDetailOpen && selectedTask && (
        <ProjectTaskDetail
          task={selectedTask}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onDelete={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onAddComment={handleAddComment}
          onCreateSubtask={() => {}}
          onUpdateProgress={handleUpdateProgress}
          users={taskPanelUsers}
          currentUserId={currentUserId}
          onToggleStar={taskId => toggleStar('task', taskId)}
          isStarred={taskId => isStarred('task', taskId)}
          monthlyServiceDepartments={taskPanelDepartments}
          mentionUsers={mentionUsers}
          hideContentPieceLink
        />
      )}
    </div>
  );
}
