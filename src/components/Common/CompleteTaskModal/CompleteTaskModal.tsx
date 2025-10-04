'use client';

import { Phone, X, CircleCheck } from 'lucide-react';
import styles from './CompleteTaskModal.module.scss';
import { useState } from 'react';

interface CompleteTaskModalProps {
  isOpen: boolean;
  task: {
    day_number: number;
    action_type: string;
    time_of_day: string;
    due_date?: string;
    due_time?: string;
    priority?: string;
  } | null;
  onConfirm: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function CompleteTaskModal({
  isOpen,
  task,
  onConfirm,
  onSkip,
  onCancel,
}: CompleteTaskModalProps) {
  const [selectedOption, setSelectedOption] = useState<'complete' | 'separate'>(
    'complete'
  );

  if (!isOpen || !task) return null;

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'outbound_call':
        return 'Call';
      case 'text_message':
        return 'Text Message';
      case 'ai_call':
        return 'AI Call';
      case 'email':
        return 'Email';
      default:
        return type;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(`1970-01-01T${timeStr}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const handleSubmit = () => {
    if (selectedOption === 'complete') {
      onConfirm();
    } else {
      onSkip();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Complete this task?</h2>
          <button onClick={onCancel} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.taskCard}>
          <div className={styles.taskIcon}>
            <Phone size={12} />
          </div>
          <div className={styles.taskInfo}>
            <div className={styles.taskTitle}>
              Day {task.day_number}:{' '}
              {task.time_of_day === 'morning' ? 'Morning' : 'Afternoon'}{' '}
              {getActionLabel(task.action_type)}
            </div>
            <div className={styles.taskTarget}>
              Target: {formatDate(task.due_date)} | {formatTime(task.due_time)}
            </div>
          </div>
          {task.priority && (
            <div className={styles.priorityBadge}>
              <span>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
              <div
                className={styles.priorityDot}
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              />
            </div>
          )}
        </div>

        <div className={styles.options}>
          <label
            className={`${styles.option} ${selectedOption === 'complete' ? styles.selected : ''}`}
          >
            <input
              type="radio"
              name="taskAction"
              value="complete"
              checked={selectedOption === 'complete'}
              onChange={() => setSelectedOption('complete')}
            />
            <span className={styles.radioIcon}>
              {selectedOption === 'complete' && (
                <div className={styles.radioDot} />
              )}
            </span>
            <span className={styles.optionText}>
              Yes, mark this task as complete
            </span>
          </label>

          <label
            className={`${styles.option} ${selectedOption === 'separate' ? styles.selected : ''}`}
          >
            <input
              type="radio"
              name="taskAction"
              value="separate"
              checked={selectedOption === 'separate'}
              onChange={() => setSelectedOption('separate')}
            />
            <span className={styles.radioIcon}>
              {selectedOption === 'separate' && (
                <div className={styles.radioDot} />
              )}
            </span>
            <span className={styles.optionText}>
              No, this activity was separate
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSubmit} className={styles.confirmButton}>
            {selectedOption === 'complete' ? (
              <>
                <CircleCheck size={18} />
                Mark Complete
              </>
            ) : (
              'Log Activity'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
