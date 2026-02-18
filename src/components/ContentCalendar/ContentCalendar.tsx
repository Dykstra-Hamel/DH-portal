'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './ContentCalendar.module.scss';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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
  task_id: string | null;
  is_completed: boolean;
  is_planned: false;
}

interface PlannedContentItem {
  template_id: string;
  content_type: string | null;
  title: string;
  is_planned: true;
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
  anchorRect: DOMRect;
}

export function ContentCalendar() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [services, setServices] = useState<ServiceCalendarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Editable field state for the popover
  const [editContentType, setEditContentType] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPublishDate, setEditPublishDate] = useState('');
  const [editLink, setEditLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    };
  }, []);

  const fetchCalendar = useCallback(async (targetYear: number) => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/content-calendar?year=${targetYear}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching content calendar:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchCalendar(year);
  }, [year, fetchCalendar]);

  // Initialize edit fields when popover opens
  useEffect(() => {
    if (!popover) return;
    const { item } = popover;
    setEditContentType(item.content_type || '');
    setEditTitle(item.title || '');
    setEditPublishDate(
      !item.is_planned && (item as ContentPieceCalendarItem).publish_date
        ? (item as ContentPieceCalendarItem).publish_date!
        : ''
    );
    setEditLink(
      !item.is_planned && (item as ContentPieceCalendarItem).link
        ? (item as ContentPieceCalendarItem).link!
        : ''
    );
  }, [popover]);

  // Close popover on outside click
  useEffect(() => {
    if (!popover) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popover]);

  const handleBadgeClick = (
    e: React.MouseEvent,
    item: CalendarItem,
    serviceId: string,
    monthKey: string,
    itemIndex: number
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopover({ item, serviceId, monthKey, itemIndex, anchorRect: rect });
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
        publish_date: editPublishDate || null,
        link: editLink || null,
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
            body: JSON.stringify({ ...body, task_id: null, service_month: monthKey }),
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
            task_id: data.contentPiece.task_id,
            is_completed: false,
            is_planned: false as const,
          };
        }
      }

      if (savedPiece) {
        // Update local services state so the badge reflects changes immediately
        setServices(prev => prev.map(service => {
          if (service.id !== serviceId) return service;
          const monthItems = [...(service.months[monthKey] || [])];
          monthItems[itemIndex] = savedPiece!;
          return {
            ...service,
            months: { ...service.months, [monthKey]: monthItems },
          };
        }));

        // Update the popover item reference so re-opening shows fresh data
        setPopover(prev => prev ? { ...prev, item: savedPiece! } : null);
      }
    } catch (error) {
      console.error('Error saving content piece:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBadge = (item: CalendarItem, serviceId: string, monthKey: string, idx: number) => {
    const type = item.content_type;
    const label = type ? CONTENT_TYPE_LABELS[type] ?? type : 'Unknown';
    const color = type ? CONTENT_TYPE_COLORS[type] ?? '#6b7280' : '#6b7280';
    const isPlanned = item.is_planned;
    const isCompleted = !isPlanned && (item as ContentPieceCalendarItem).is_completed;

    return (
      <button
        key={idx}
        className={`${styles.badge} ${isPlanned ? styles.badgePlanned : ''} ${isCompleted ? styles.badgeCompleted : ''}`}
        style={{ '--badge-color': color } as React.CSSProperties}
        onClick={(e) => handleBadgeClick(e, item, serviceId, monthKey, idx)}
        title={label}
      >
        {isCompleted && <span className={styles.checkmark}>✓</span>}
        {label}
      </button>
    );
  };

  const renderPopover = () => {
    if (!popover) return null;
    const { item, anchorRect } = popover;
    const isPlanned = item.is_planned;
    const currentColor = editContentType
      ? CONTENT_TYPE_COLORS[editContentType] ?? '#6b7280'
      : '#6b7280';

    const top = anchorRect.bottom + window.scrollY + 8;
    const left = Math.min(anchorRect.left + window.scrollX, window.innerWidth - 300);

    return (
      <div ref={popoverRef} className={styles.popover} style={{ top, left }}>
        <div className={styles.popoverHeader}>
          <span
            className={styles.popoverTypeBadge}
            style={{ background: currentColor }}
          >
            {editContentType ? CONTENT_TYPE_LABELS[editContentType] ?? editContentType : 'Unknown'}
          </span>
          {isPlanned && <span className={styles.popoverPlannedTag}>Planned</span>}
        </div>

        <div className={styles.popoverFields}>
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

          <label className={styles.fieldLabel}>Title</label>
          <input
            type="text"
            className={styles.fieldInput}
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Content title..."
          />

          <label className={styles.fieldLabel}>Publish Date</label>
          <input
            type="date"
            className={styles.fieldInput}
            value={editPublishDate}
            onChange={e => setEditPublishDate(e.target.value)}
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

        <div className={styles.popoverActions}>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => setPopover(null)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      {/* Year navigation */}
      <div className={styles.yearNav}>
        <button
          className={styles.yearNavBtn}
          onClick={() => setYear(y => y - 1)}
          aria-label="Previous year"
        >
          <ChevronLeft size={18} />
        </button>
        <span className={styles.yearLabel}>{year}</span>
        <button
          className={styles.yearNavBtn}
          onClick={() => setYear(y => y + 1)}
          aria-label="Next year"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading content calendar...</div>
      ) : services.length === 0 ? (
        <div className={styles.empty}>
          No active monthly services have Content department templates configured.
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.serviceCol}>Service</th>
                {MONTHS.map((m, i) => (
                  <th key={i} className={styles.monthCol}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td className={styles.serviceCell}>
                    <div className={styles.serviceName}>{service.service_name}</div>
                    <div className={styles.companyName}>{service.company_name}</div>
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
      )}

      {renderPopover()}
    </div>
  );
}
