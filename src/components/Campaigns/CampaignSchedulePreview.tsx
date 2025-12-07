'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import styles from './CampaignSchedulePreview.module.scss';

interface CampaignSchedulePreviewProps {
  campaignId?: string;
  companyId: string;
  totalContacts: number;
  dailyLimit: number;
  respectBusinessHours: boolean;
  startDate?: string;
}

interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  contactsCount: number;
  batchesCount: number;
  batchSize: number;
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  estimatedStartTime: string;
  estimatedEndTime: string;
}

interface ScheduleSummary {
  totalDays: number;
  totalBatches: number;
  contactsPerDay: number;
  estimatedCompletionDate: string | null;
  respectsBusinessHours: boolean;
  businessHoursSettings: {
    timezone: string;
    workingDays: string[];
  };
}

export default function CampaignSchedulePreview({
  campaignId,
  companyId,
  totalContacts,
  dailyLimit,
  respectBusinessHours,
  startDate,
}: CampaignSchedulePreviewProps) {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [summary, setSummary] = useState<ScheduleSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchSchedulePreview();
    } else if (totalContacts > 0 && dailyLimit > 0) {
      // For new campaigns, generate a simple preview
      generateSimplePreview();
    }
  }, [campaignId, totalContacts, dailyLimit, respectBusinessHours]);

  const fetchSchedulePreview = async () => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/schedule-preview`);
      const result = await response.json();

      if (result.success) {
        setSchedule(result.schedule || []);
        setSummary(result.summary || null);
      } else {
        setError(result.error || 'Failed to fetch schedule');
      }
    } catch (err) {
      console.error('Error fetching schedule preview:', err);
      setError('Failed to load schedule preview');
    } finally {
      setLoading(false);
    }
  };

  const generateSimplePreview = () => {
    // Simple preview for campaigns being created
    const estimatedDays = Math.ceil(totalContacts / dailyLimit);
    const previewDays = Math.min(estimatedDays, 14); // Show first 2 weeks max

    const days: ScheduleDay[] = [];
    let remainingContacts = totalContacts;
    const start = startDate ? new Date(startDate) : new Date();

    for (let i = 0; i < previewDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      const contactsThisDay = Math.min(remainingContacts, dailyLimit);
      const batchesThisDay = Math.ceil(contactsThisDay / 10);

      days.push({
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        contactsCount: contactsThisDay,
        batchesCount: batchesThisDay,
        batchSize: 10,
        businessHours: { enabled: true, start: '09:00', end: '17:00' },
        estimatedStartTime: '09:00',
        estimatedEndTime: calculateEndTime('09:00', batchesThisDay, 10),
      });

      remainingContacts -= contactsThisDay;
    }

    setSchedule(days);
    setSummary({
      totalDays: estimatedDays,
      totalBatches: Math.ceil(totalContacts / 10),
      contactsPerDay: Math.round(totalContacts / estimatedDays),
      estimatedCompletionDate: days.length > 0 ? days[days.length - 1].date : null,
      respectsBusinessHours: respectBusinessHours,
      businessHoursSettings: {
        timezone: 'America/New_York',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      },
    });
  };

  const calculateEndTime = (startTime: string, batchCount: number, intervalMinutes: number): string => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMin + (batchCount * intervalMinutes);
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading schedule preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <AlertCircle size={20} />
        <p>{error}</p>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className={styles.empty}>
        <Calendar size={48} />
        <p>Add contacts to see campaign schedule</p>
      </div>
    );
  }

  return (
    <div className={styles.schedulePreview}>
      {/* Summary Cards */}
      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <Calendar size={20} />
            <div>
              <p className={styles.summaryLabel}>Total Days</p>
              <p className={styles.summaryValue}>{summary.totalDays}</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <Users size={20} />
            <div>
              <p className={styles.summaryLabel}>Avg Contacts/Day</p>
              <p className={styles.summaryValue}>{summary.contactsPerDay}</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <Clock size={20} />
            <div>
              <p className={styles.summaryLabel}>Total Batches</p>
              <p className={styles.summaryValue}>{summary.totalBatches}</p>
            </div>
          </div>
          {summary.estimatedCompletionDate && (
            <div className={styles.summaryCard}>
              <Calendar size={20} />
              <div>
                <p className={styles.summaryLabel}>Est. Completion</p>
                <p className={styles.summaryValue}>
                  {new Date(summary.estimatedCompletionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Business Hours Info */}
      {summary?.respectsBusinessHours && (
        <div className={styles.businessHoursInfo}>
          <Clock size={16} />
          <span>
            Sending only during business hours ({summary.businessHoursSettings.timezone})
          </span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className={styles.calendar}>
        <h4>Daily Schedule</h4>
        <div className={styles.calendarGrid}>
          {schedule.map((day, index) => (
            <div
              key={day.date}
              className={`${styles.dayCard} ${!day.businessHours.enabled ? styles.nonWorkingDay : ''}`}
            >
              <div className={styles.dayHeader}>
                <span className={styles.dayOfWeek}>{day.dayOfWeek}</span>
                <span className={styles.date}>
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {day.businessHours.enabled ? (
                <div className={styles.dayContent}>
                  <div className={styles.stat}>
                    <Users size={16} />
                    <span>{day.contactsCount} contacts</span>
                  </div>
                  <div className={styles.stat}>
                    <Clock size={16} />
                    <span>{day.batchesCount} batches</span>
                  </div>
                  <div className={styles.timeRange}>
                    <span>{day.estimatedStartTime}</span>
                    <span>→</span>
                    <span>{day.estimatedEndTime}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.dayContent}>
                  <p className={styles.nonWorking}>Non-working day</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {summary && summary.totalDays > schedule.length && (
          <div className={styles.moreInfo}>
            <p>
              + {summary.totalDays - schedule.length} more days...
              {summary.estimatedCompletionDate && (
                <span> (until {new Date(summary.estimatedCompletionDate).toLocaleDateString()})</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
