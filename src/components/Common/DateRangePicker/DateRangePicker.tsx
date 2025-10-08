'use client';

import { useState } from 'react';
import { TimeRange } from '@/services/reportsService';
import styles from './DateRangePicker.module.scss';

export interface DateRangePickerProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (startDate: Date, endDate: Date) => void;
  showComparison?: boolean;
  comparisonEnabled?: boolean;
  onComparisonToggle?: (enabled: boolean) => void;
}

export default function DateRangePicker({
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  showComparison = true,
  comparisonEnabled = false,
  onComparisonToggle,
}: DateRangePickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    customStartDate ? formatDateForInput(customStartDate) : ''
  );
  const [tempEndDate, setTempEndDate] = useState(
    customEndDate ? formatDateForInput(customEndDate) : ''
  );

  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  const handleRangeClick = (range: TimeRange) => {
    if (range === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onRangeChange(range);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate && onCustomDateChange) {
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);

      if (start <= end) {
        onCustomDateChange(start, end);
        onRangeChange('custom');
        setShowCustomPicker(false);
      }
    }
  };

  const handleCancelCustomRange = () => {
    setShowCustomPicker(false);
    setTempStartDate(customStartDate ? formatDateForInput(customStartDate) : '');
    setTempEndDate(customEndDate ? formatDateForInput(customEndDate) : '');
  };

  return (
    <div className={styles.container}>
      <div className={styles.rangeButtons}>
        <button
          className={`${styles.rangeButton} ${selectedRange === 'day' ? styles.active : ''}`}
          onClick={() => handleRangeClick('day')}
        >
          Last Day
        </button>
        <button
          className={`${styles.rangeButton} ${selectedRange === 'week' ? styles.active : ''}`}
          onClick={() => handleRangeClick('week')}
        >
          Last Week
        </button>
        <button
          className={`${styles.rangeButton} ${selectedRange === 'month' ? styles.active : ''}`}
          onClick={() => handleRangeClick('month')}
        >
          Last Month
        </button>
        <button
          className={`${styles.rangeButton} ${selectedRange === 'year' ? styles.active : ''}`}
          onClick={() => handleRangeClick('year')}
        >
          Last Year
        </button>
        <button
          className={`${styles.rangeButton} ${selectedRange === 'custom' ? styles.active : ''}`}
          onClick={() => handleRangeClick('custom')}
        >
          Custom Range
        </button>
      </div>

      {showCustomPicker && (
        <div className={styles.customPicker}>
          <div className={styles.customPickerInputs}>
            <div className={styles.inputGroup}>
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          </div>
          <div className={styles.customPickerActions}>
            <button
              className={styles.cancelButton}
              onClick={handleCancelCustomRange}
            >
              Cancel
            </button>
            <button
              className={styles.applyButton}
              onClick={handleApplyCustomRange}
              disabled={!tempStartDate || !tempEndDate}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {showComparison && onComparisonToggle && (
        <div className={styles.comparisonToggle}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={comparisonEnabled}
              onChange={(e) => onComparisonToggle(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Compare to previous period</span>
          </label>
        </div>
      )}
    </div>
  );
}
