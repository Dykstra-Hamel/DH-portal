import React, { useState, useMemo } from 'react';
import { Task } from '@/types/taskManagement';
import { PriorityBadge } from '../shared/PriorityBadge';
import styles from './CalendarView.module.scss';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { monthName, year, calendarDays } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName = monthNames[month];

    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Get starting day of week (0 = Sunday)
    const startingDayOfWeek = firstDayOfMonth.getDay();

    // Get days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        day: prevMonthLastDay - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1),
      })
    );

    // Get days for current month
    const currentMonthDays = Array.from(
      { length: daysInMonth },
      (_, i) => ({
        day: i + 1,
        isCurrentMonth: true,
        date: new Date(year, month, i + 1),
      })
    );

    // Get days for next month to fill grid
    const totalCellsNeeded = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
    const nextMonthDaysCount = totalCellsNeeded - (startingDayOfWeek + daysInMonth);
    const nextMonthDays = Array.from(
      { length: nextMonthDaysCount },
      (_, i) => ({
        day: i + 1,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i + 1),
      })
    );

    const calendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

    return { monthName, year, calendarDays };
  }, [currentDate]);

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className={styles.calendarContainer}>
      {/* Calendar Header */}
      <div className={styles.calendarHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.monthTitle}>{monthName} {year}</h2>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.todayButton} onClick={handleToday}>
            Today
          </button>
          <div className={styles.navButtons}>
            <button className={styles.navButton} onClick={handlePrevMonth} aria-label="Previous month">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className={styles.navButton} onClick={handleNextMonth} aria-label="Next month">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarGrid}>
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className={styles.dayHeader}>
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((dayInfo, index) => {
          const dayTasks = getTasksForDate(dayInfo.date);
          const isTodayDate = isToday(dayInfo.date);

          return (
            <div
              key={index}
              className={`${styles.calendarDay} ${!dayInfo.isCurrentMonth ? styles.otherMonth : ''} ${isTodayDate ? styles.today : ''}`}
            >
              <div className={styles.dayNumber}>
                {dayInfo.day}
              </div>
              <div className={styles.dayTasks}>
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={styles.taskItem}
                    onClick={() => onTaskClick(task)}
                  >
                    <PriorityBadge priority={task.priority} size="small" />
                    <span className={styles.taskTitle}>{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className={styles.moreTasksIndicator}>
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
