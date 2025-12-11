'use client';

import { useState } from 'react';
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

export default function BusinessHoursEditor({
  businessHours,
  onChange,
  className
}: BusinessHoursEditorProps) {
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ];

  const handleDayToggle = (day: string) => {
    onChange({
      ...businessHours,
      [day]: {
        ...businessHours[day],
        closed: !businessHours[day].closed
      }
    });
  };

  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    onChange({
      ...businessHours,
      [day]: {
        ...businessHours[day],
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
        {days.map(day => (
          <div key={day} className={styles.businessHoursDay}>
            <div className={styles.dayHeader}>
              <span className={styles.dayName}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={!businessHours[day]?.closed}
                  onChange={() => handleDayToggle(day)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            {!businessHours[day]?.closed && (
              <div className={styles.timeSettings}>
                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>Start</label>
                  <input
                    type="time"
                    value={businessHours[day]?.start || '09:00'}
                    onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                    className={styles.timeInput}
                  />
                </div>

                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>End</label>
                  <input
                    type="time"
                    value={businessHours[day]?.end || '17:00'}
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
