'use client';

import { useMemo } from 'react';
import styles from './BusinessHoursEditor.module.scss';

export interface BusinessHoursData {
  [day: string]: {
    start: string;   // HH:MM
    end: string;     // HH:MM
    closed: boolean; // true = business NOT operating
  };
}

interface BusinessHoursEditorProps {
  businessHours: BusinessHoursData;
  onChange: (businessHours: BusinessHoursData) => void;
  className?: string;
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export default function BusinessHoursEditor({
  businessHours,
  onChange,
  className
}: BusinessHoursEditorProps) {
  const normalizedBusinessHours = useMemo<BusinessHoursData>(() => {
    const defaults: BusinessHoursData = {
      monday: { start: '09:00', end: '17:00', closed: false },
      tuesday: { start: '09:00', end: '17:00', closed: false },
      wednesday: { start: '09:00', end: '17:00', closed: false },
      thursday: { start: '09:00', end: '17:00', closed: false },
      friday: { start: '09:00', end: '17:00', closed: false },
      saturday: { start: '09:00', end: '17:00', closed: true },
      sunday: { start: '09:00', end: '17:00', closed: true },
    };

    const parseClosed = (value: unknown, fallback: boolean) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value === 'true';
      return fallback;
    };

    const input =
      businessHours && typeof businessHours === 'object' && !Array.isArray(businessHours)
        ? (businessHours as Record<string, any>)
        : {};

    const normalized: BusinessHoursData = {};
    DAYS.forEach(day => {
      const raw = input[day] || {};
      const fallback = defaults[day];
      normalized[day] = {
        start: typeof raw.start === 'string' ? raw.start : fallback.start,
        end: typeof raw.end === 'string' ? raw.end : fallback.end,
        closed: parseClosed(raw.closed, fallback.closed),
      };
    });

    return normalized;
  }, [businessHours]);

  const handleDayToggle = (day: string) => {
    onChange({
      ...normalizedBusinessHours,
      [day]: {
        ...normalizedBusinessHours[day],
        closed: !normalizedBusinessHours[day].closed
      }
    });
  };

  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    onChange({
      ...normalizedBusinessHours,
      [day]: {
        ...normalizedBusinessHours[day],
        [field]: value
      }
    });
  };

  return (
    <div className={`${styles.businessHoursEditor} ${className || ''}`}>
      <h3 className={styles.title}>Business Hours</h3>
      <p className={styles.description}>
        Configure business hours for each day of the week. These settings are used
        for business hours webhook logic and campaign scheduling.
      </p>

      <div className={styles.daysContainer}>
        {DAYS.map(day => (
          <div key={day} className={styles.businessHoursDay}>
            <div className={styles.dayHeader}>
              <span className={styles.dayName}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={!normalizedBusinessHours[day]?.closed}
                  onChange={() => handleDayToggle(day)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            {!normalizedBusinessHours[day]?.closed && (
              <div className={styles.timeSettings}>
                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Start</label>
                  <input
                    type="time"
                    value={normalizedBusinessHours[day]?.start || '09:00'}
                    onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                    className={styles.timeInput}
                  />
                </div>

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>End</label>
                  <input
                    type="time"
                    value={normalizedBusinessHours[day]?.end || '17:00'}
                    onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                    className={styles.timeInput}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
