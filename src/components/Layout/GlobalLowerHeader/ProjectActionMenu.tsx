'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import styles from './ProjectActionMenu.module.scss';

interface ProjectActionMenuProps {
  onNewProjectFromScratch: () => void;
  onNewProjectFromTemplate: () => void;
  onNewTaskFromScratch: () => void;
  onNewTaskFromTemplate: () => void;
}

type MenuState = 'closed' | 'main' | 'project' | 'task';

export function ProjectActionMenu({
  onNewProjectFromScratch,
  onNewProjectFromTemplate,
  onNewTaskFromScratch,
  onNewTaskFromTemplate,
}: ProjectActionMenuProps) {
  const [menuState, setMenuState] = useState<MenuState>('closed');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuState('closed');
      }
    };

    if (menuState !== 'closed') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuState]);

  const handleMainMenuClick = () => {
    setMenuState(menuState === 'closed' ? 'main' : 'closed');
  };

  const handleProjectClick = () => {
    setMenuState('project');
  };

  const handleTaskClick = () => {
    setMenuState('task');
  };

  const handleBack = () => {
    setMenuState('main');
  };

  const handleAction = (action: () => void) => {
    action();
    setMenuState('closed');
  };

  return (
    <div className={styles.projectActionMenu} ref={menuRef}>
      <button
        className={styles.mainButton}
        onClick={handleMainMenuClick}
        type="button"
      >
        <Plus size={18} strokeWidth={1.75} />
      </button>

      {menuState !== 'closed' && (
        <div className={styles.dropdownMenu}>
          {menuState === 'main' && (
            <>
              <button
                className={styles.menuOption}
                onClick={handleProjectClick}
                type="button"
              >
                <span>New Project</span>
                <ChevronRight size={16} />
              </button>
              <button
                className={styles.menuOption}
                onClick={handleTaskClick}
                type="button"
              >
                <span>New Task</span>
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {menuState === 'project' && (
            <>
              <button
                className={styles.backButton}
                onClick={handleBack}
                type="button"
              >
                ← Back
              </button>
              <div className={styles.separator} />
              <button
                className={styles.menuOption}
                onClick={() => handleAction(onNewProjectFromScratch)}
                type="button"
              >
                From Scratch
              </button>
              <button
                className={styles.menuOption}
                onClick={() => handleAction(onNewProjectFromTemplate)}
                type="button"
              >
                From Template
              </button>
            </>
          )}

          {menuState === 'task' && (
            <>
              <button
                className={styles.backButton}
                onClick={handleBack}
                type="button"
              >
                ← Back
              </button>
              <div className={styles.separator} />
              <button
                className={styles.menuOption}
                onClick={() => handleAction(onNewTaskFromScratch)}
                type="button"
              >
                From Scratch
              </button>
              <button
                className={styles.menuOption}
                onClick={() => handleAction(onNewTaskFromTemplate)}
                type="button"
              >
                From Template
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
