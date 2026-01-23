import React, { useState } from 'react';
import { Project, statusOptions } from '@/types/project';
import { Modal, ModalMiddle, ModalTop } from '@/components/Common/Modal/Modal';
import styles from './ProjectCalendarView.module.scss';

interface ProjectCalendarViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectCalendarView({ projects, onProjectClick }: ProjectCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Add previous month's days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push(prevDate);
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getProjectsForDate = (date: Date): Project[] => {
    return projects.filter(project => {
      const deadlineDate = new Date(project.due_date);
      return (
        deadlineDate.getDate() === date.getDate() &&
        deadlineDate.getMonth() === date.getMonth() &&
        deadlineDate.getFullYear() === date.getFullYear()
      );
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

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(item => item.value === status);
    return option?.color ?? '#6b7280';
  };

  const openDayModal = (date: Date, dayProjects: Project[]) => {
    setSelectedDate(date);
    setSelectedProjects(dayProjects);
    setIsDayModalOpen(true);
  };

  const closeDayModal = () => {
    setIsDayModalOpen(false);
  };

  const formatModalDate = (date: Date | null) => {
    if (!date) return 'Projects';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <button className={styles.navButton} onClick={() => navigateMonth('prev')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className={styles.monthTitle}>{monthName}</h2>
        <button className={styles.navButton} onClick={() => navigateMonth('next')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.calendarWeekdays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {days.map((date, index) => {
          const dayProjects = getProjectsForDate(date);
          const visibleProjects = dayProjects.slice(0, 2);
          const remainingCount = dayProjects.length - visibleProjects.length;
          const isCurrentDay = isToday(date);
          const isOtherMonth = !isCurrentMonth(date);

          return (
            <div
              key={index}
              className={`${styles.calendarDay} ${isCurrentDay ? styles.today : ''} ${isOtherMonth ? styles.otherMonth : ''}`}
              onClick={() => openDayModal(date, dayProjects)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDayModal(date, dayProjects);
                }
              }}
            >
              <div className={styles.dayNumber}>{date.getDate()}</div>
              <div className={styles.projectsList}>
                {visibleProjects.map(project => {
                  return (
                    <div
                      key={project.id}
                      className={styles.projectItem}
                      style={{ borderLeftColor: getStatusColor(project.status) }}
                    >
                      <div className={styles.projectItemName}>{project.name}</div>
                      <div className={styles.projectItemClient}>
                        {project.company.name}
                      </div>
                    </div>
                  );
                })}
                {remainingCount > 0 && (
                  <div className={styles.moreProjects}>+ {remainingCount} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isDayModalOpen} onClose={closeDayModal} size="medium">
        <ModalTop title={formatModalDate(selectedDate)} onClose={closeDayModal} />
        <ModalMiddle className={styles.dayModalContent}>
          {selectedProjects.length === 0 ? (
            <div className={styles.noProjects}>No projects for this day.</div>
          ) : (
            <div className={styles.modalProjectList}>
              {selectedProjects.map(project => (
                <button
                  key={project.id}
                  type="button"
                  className={styles.modalProjectItem}
                  onClick={() => {
                    closeDayModal();
                    onProjectClick(project);
                  }}
                >
                  <span className={styles.modalProjectName}>{project.name}</span>
                  <span className={styles.modalProjectMeta}>{project.company.name}</span>
                </button>
              ))}
            </div>
          )}
        </ModalMiddle>
      </Modal>
    </div>
  );
}
