'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project, statusOptions } from '@/types/project';
import { CompanyIcon } from '@/components/Common/CompanyIcon/CompanyIcon';
import styles from './ProjectSelect.module.scss';

interface ProjectSelectProps {
  projects: Project[];
  value: string;
  onChange: (projectId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function ProjectSelect({
  projects,
  value,
  onChange,
  placeholder = 'Select a project',
  className = '',
  disabled = false,
}: ProjectSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProject = projects.find(p => p.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const matchesName = project.name.toLowerCase().includes(query);
    const matchesShortcode = project.shortcode?.toLowerCase().includes(query);
    const matchesCompany = project.company?.name.toLowerCase().includes(query);
    const matchesType = project.project_type?.toLowerCase().includes(query);
    const matchesSubtype = project.project_subtype
      ?.toLowerCase()
      .includes(query);

    return (
      matchesName ||
      matchesShortcode ||
      matchesCompany ||
      matchesType ||
      matchesSubtype
    );
  });

  console.log(filteredProjects);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSelect = (projectId: string) => {
    onChange(projectId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  const toCamelCase = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const sanitized = hex.replace('#', '');
    if (sanitized.length !== 6) return hex;
    const r = parseInt(sanitized.slice(0, 2), 16);
    const g = parseInt(sanitized.slice(2, 4), 16);
    const b = parseInt(sanitized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    const color = option?.color ?? '#6b7280';
    const label = option?.label ?? status;
    return { label, color, background: hexToRgba(color, 0.16) };
  };

  return (
    <div className={`${styles.projectSelect} ${className}`} ref={dropdownRef}>
      <div
        className={`${styles.selectTrigger} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
        onClick={handleToggle}
      >
        {selectedProject ? (
          <div className={styles.selectedValue}>
            <div className={styles.selectedMain}>
              <span className={styles.projectName}>
                {selectedProject.shortcode
                  ? selectedProject.shortcode
                  : selectedProject.name}
              </span>
            </div>
            <div className={styles.selectedMeta}>
              {selectedProject.company?.name && (
                <span className={styles.company}>
                  {selectedProject.company.name}
                </span>
              )}
              {selectedProject.project_type && (
                <span className={styles.type}>
                  {toCamelCase(selectedProject.project_type)}
                  {selectedProject.project_subtype &&
                    ` - ${selectedProject.project_subtype}`}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}

        <div className={styles.actions}>
          {value && !disabled && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <svg
            className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
          >
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 14L11.1 11.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          <div className={styles.options}>
            {!value && (
              <div
                className={`${styles.option} ${!value ? styles.selected : ''}`}
                onClick={() => handleSelect('')}
              >
                <div className={styles.optionContent}>
                  <div className={styles.optionMain}>
                    <span className={styles.noProject}>No Project</span>
                  </div>
                </div>
              </div>
            )}

            {filteredProjects.length === 0 && searchQuery && (
              <div className={styles.noResults}>
                No projects found matching &quot;{searchQuery}&quot;
              </div>
            )}

            {filteredProjects.map(project => (
              <div
                key={project.id}
                className={`${styles.option} ${project.id === value ? styles.selected : ''}`}
                onClick={() => handleSelect(project.id)}
              >
                <div className={styles.optionContent}>
                  <div className={styles.optionMain}>
                    <span className={styles.projectName}>
                      {project.shortcode ? project.shortcode : project.name}
                    </span>
                  </div>
                  <div className={styles.optionMeta}>
                    <span className={styles.companyIcon}>
                      <CompanyIcon
                        companyName={project.company.name}
                        iconUrl={
                          Array.isArray(project.company?.branding)
                            ? project.company.branding[0]?.icon_logo_url
                            : project.company?.branding?.icon_logo_url
                        }
                        size="small"
                        showTooltip={true}
                      />
                    </span>
                    {project.company?.name && (
                      <div className={styles.metaItem}>
                        {project.company.name}
                      </div>
                    )}
                    {project.project_type && (
                      <div className={styles.metaItem}>
                        {toCamelCase(project.project_type)}
                        {project.project_subtype &&
                          ` - ${project.project_subtype}`}
                      </div>
                    )}
                    {project.status &&
                      (() => {
                        const badge = getStatusBadge(project.status);
                        return (
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: badge.background,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
