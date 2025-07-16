'use client';

import React from 'react';
import { Filter, Building, X } from 'lucide-react';
import { ProjectFilters as FilterValues, Company, statusOptions, priorityOptions } from '@/types/project';
import styles from './ProjectFilters.module.scss';

interface ProjectFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  companies: Company[];
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  companies 
}) => {
  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: '',
      priority: '',
      companyId: ''
    });
  };

  const hasActiveFilters = filters.status || filters.priority || filters.companyId;

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <Filter size={16} />
        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          {statusOptions.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <select 
          value={filters.priority} 
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All Priority</option>
          {priorityOptions.map(priority => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <Building size={16} />
        <select 
          value={filters.companyId} 
          onChange={(e) => handleFilterChange('companyId', e.target.value)}
        >
          <option value="">All Companies</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button 
          onClick={handleClearFilters}
          className={styles.clearFilters}
        >
          <X size={16} />
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default ProjectFilters;