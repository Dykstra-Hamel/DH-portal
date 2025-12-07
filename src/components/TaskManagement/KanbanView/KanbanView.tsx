import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { Task, TaskStatus } from '@/types/taskManagement';
import { TaskCard } from '../shared/TaskCard';
import styles from './KanbanView.module.scss';

interface KanbanViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'todo', title: 'To Do', color: '#1e40af' },
  { id: 'in-progress', title: 'In Progress', color: '#b45309' },
  { id: 'review', title: 'Review', color: '#4338ca' },
  { id: 'completed', title: 'Completed', color: '#065f46' },
];

export function KanbanView({ tasks, onTaskClick, onUpdateTask }: KanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [columnScrollStates, setColumnScrollStates] = useState<Record<TaskStatus, boolean>>({
    'todo': false,
    'in-progress': false,
    'review': false,
    'completed': false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<TaskStatus, HTMLDivElement | null>>({
    'todo': null,
    'in-progress': null,
    'review': null,
    'completed': null,
  });
  const scrollAnimationRef = useRef<number | null>(null);

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);

    // Stop auto-scroll
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.clientX === 0) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const scrollEdgeSize = 100; // Distance from edge to trigger scroll
    const maxScrollSpeed = 10; // Maximum scroll speed

    // Calculate distance from edges
    const distanceFromLeft = e.clientX - containerRect.left;
    const distanceFromRight = containerRect.right - e.clientX;

    // Determine scroll direction and speed
    let scrollSpeed = 0;

    if (distanceFromLeft < scrollEdgeSize && distanceFromLeft > 0) {
      // Near left edge - scroll left
      scrollSpeed = -maxScrollSpeed * (1 - distanceFromLeft / scrollEdgeSize);
    } else if (distanceFromRight < scrollEdgeSize && distanceFromRight > 0) {
      // Near right edge - scroll right
      scrollSpeed = maxScrollSpeed * (1 - distanceFromRight / scrollEdgeSize);
    }

    // Apply scroll
    if (scrollSpeed !== 0) {
      const scroll = () => {
        if (container) {
          container.scrollLeft += scrollSpeed;
          scrollAnimationRef.current = requestAnimationFrame(scroll);
        }
      };

      // Cancel previous animation and start new one
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      scrollAnimationRef.current = requestAnimationFrame(scroll);
    } else if (scrollAnimationRef.current) {
      // Stop scrolling if not near edge
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

  const checkColumnScroll = (columnId: TaskStatus) => {
    const columnContent = columnRefs.current[columnId];
    if (!columnContent) return;

    const { scrollTop, scrollHeight, clientHeight } = columnContent;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

    setColumnScrollStates(prev => ({
      ...prev,
      [columnId]: !isAtBottom && scrollHeight > clientHeight,
    }));
  };

  useEffect(() => {
    // Check scroll state for all columns on mount and when tasks change
    columns.forEach(column => {
      checkColumnScroll(column.id);
    });
  }, [tasks]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (status: TaskStatus) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only clear if leaving the column container itself
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
    e.preventDefault();

    if (draggedTask && draggedTask.status !== newStatus) {
      const updatedTask: Task = {
        ...draggedTask,
        status: newStatus,
        updated_at: new Date().toISOString(),
        completed_date: newStatus === 'completed' ? new Date().toISOString() : draggedTask.completed_date,
      };

      onUpdateTask(updatedTask);
    }

    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div ref={containerRef} className={styles.kanbanContainer}>
      <div className={styles.kanbanBoard}>
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`${styles.kanbanColumn} ${isOver ? styles.dragOver : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={styles.columnHeader}>
                <div className={styles.columnTitle} style={{ color: column.color }}>
                  {column.title}
                </div>
                <div className={styles.columnCount}>{columnTasks.length}</div>
              </div>

              <div
                ref={(el) => { columnRefs.current[column.id] = el; }}
                className={styles.columnContent}
                onScroll={() => checkColumnScroll(column.id)}
              >
                {columnTasks.length === 0 ? (
                  <div className={styles.emptyColumn}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path
                        d="M20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20 15V20L23 23"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p>No tasks</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onDrag={handleDrag}
                      className={styles.draggableTask}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => onTaskClick(task)}
                        isDragging={draggedTask?.id === task.id}
                      />
                    </div>
                  ))
                )}
              </div>
              {columnScrollStates[column.id] && (
                <div className={styles.scrollGradient} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
