'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ProjectTypeSubtype, PROJECT_TYPE_CODES, ProjectTypeCode } from '@/types/project';
import SubtypeFormModal from './SubtypeFormModal';
import styles from './CategorySettings.module.scss';

export default function ProjectTypeSubtypesManager() {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [subtypesByType, setSubtypesByType] = useState<Record<string, ProjectTypeSubtype[]>>({});
  const [isSubtypeModalOpen, setIsSubtypeModalOpen] = useState(false);
  const [subtypeFormMode, setSubtypeFormMode] = useState<'create' | 'edit'>('create');
  const [selectedSubtype, setSelectedSubtype] = useState<ProjectTypeSubtype | null>(null);
  const [currentProjectType, setCurrentProjectType] = useState<ProjectTypeCode | null>(null);

  // Toggle project type expansion
  const toggleProjectType = (projectType: ProjectTypeCode) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(projectType)) {
      newExpanded.delete(projectType);
    } else {
      newExpanded.add(projectType);
      // Fetch subtypes if not already loaded
      if (!subtypesByType[projectType]) {
        fetchSubtypes(projectType);
      }
    }
    setExpandedTypes(newExpanded);
  };

  // Fetch subtypes for a project type
  const fetchSubtypes = async (projectType: ProjectTypeCode) => {
    try {
      const response = await fetch(`/api/admin/project-types/${projectType}/subtypes`);
      if (response.ok) {
        const data = await response.json();
        setSubtypesByType(prev => ({ ...prev, [projectType]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch subtypes:', err);
    }
  };

  // Handle subtype create
  const handleCreateSubtype = async (subtypeData: Partial<ProjectTypeSubtype>) => {
    if (!currentProjectType) return;

    const response = await fetch(`/api/admin/project-types/${currentProjectType}/subtypes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subtypeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create subtype');
    }

    await fetchSubtypes(currentProjectType);
  };

  // Handle subtype update
  const handleUpdateSubtype = async (subtypeData: Partial<ProjectTypeSubtype>) => {
    if (!selectedSubtype || !currentProjectType) return;

    const response = await fetch(
      `/api/admin/project-types/${currentProjectType}/subtypes/${selectedSubtype.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subtypeData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update subtype');
    }

    await fetchSubtypes(currentProjectType);
  };

  // Handle subtype delete
  const handleDeleteSubtype = async (projectType: ProjectTypeCode, subtypeId: string) => {
    if (!confirm('Are you sure you want to delete this subtype?')) return;

    const response = await fetch(
      `/api/admin/project-types/${projectType}/subtypes/${subtypeId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete subtype');
    }

    await fetchSubtypes(projectType);
  };

  return (
    <div className={styles.section} style={{ marginTop: '40px' }}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Project Type Subtypes</h2>
          <p style={{
            fontFamily: 'var(--font-satoshi)',
            fontSize: '14px',
            color: 'var(--gray-600)',
            margin: '4px 0 0 0',
            fontWeight: '500',
          }}>
            Manage subtypes for each project type (WEB, SOC, EML, etc.)
          </p>
        </div>
      </div>

      <div className={styles.categoriesList}>
        {(Object.keys(PROJECT_TYPE_CODES) as ProjectTypeCode[]).map((typeCode) => {
          const typeInfo = PROJECT_TYPE_CODES[typeCode];
          const isExpanded = expandedTypes.has(typeCode);
          return (
            <div key={typeCode} className={styles.projectTypeCard}>
              <button
                className={styles.projectTypeHeader}
                onClick={() => toggleProjectType(typeCode)}
              >
                <div className={styles.projectTypeInfo}>
                  <span className={styles.projectTypeCode}>{typeCode}</span>
                  <div className={styles.projectTypeText}>
                    <h3 className={styles.projectTypeLabel}>{typeInfo.label}</h3>
                    <p className={styles.projectTypeDescription}>{typeInfo.description}</p>
                  </div>
                </div>
                <div className={styles.projectTypeExpand}>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {/* Subtypes section - expanded */}
              {isExpanded && (
                <div className={styles.subtypesSection}>
                  <div className={styles.subtypesHeader}>
                    <h4 className={styles.subtypesTitle}>
                      Subtypes for {typeInfo.label}
                    </h4>
                    <button
                      className={styles.addSubtypeButton}
                      onClick={() => {
                        setCurrentProjectType(typeCode);
                        setSelectedSubtype(null);
                        setSubtypeFormMode('create');
                        setIsSubtypeModalOpen(true);
                      }}
                    >
                      <Plus size={14} />
                      Add Subtype
                    </button>
                  </div>

                  {!subtypesByType[typeCode] || subtypesByType[typeCode].length === 0 ? (
                    <div className={styles.emptySubtypes}>
                      No subtypes yet. Add one to get started.
                    </div>
                  ) : (
                    <div className={styles.subtypesList}>
                      {subtypesByType[typeCode]?.map((subtype) => (
                        <div key={subtype.id} className={styles.subtypeItem}>
                          <div className={styles.subtypeInfo}>
                            <span className={styles.subtypeName}>{subtype.name}</span>
                            {subtype.description && (
                              <span className={styles.subtypeDescription}>{subtype.description}</span>
                            )}
                          </div>
                          <div className={styles.subtypeActions}>
                            <button
                              className={styles.iconButton}
                              onClick={() => {
                                setCurrentProjectType(typeCode);
                                setSelectedSubtype(subtype);
                                setSubtypeFormMode('edit');
                                setIsSubtypeModalOpen(true);
                              }}
                              title="Edit subtype"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleDeleteSubtype(typeCode, subtype.id)}
                              title="Delete subtype"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SubtypeFormModal
        isOpen={isSubtypeModalOpen}
        onClose={() => setIsSubtypeModalOpen(false)}
        onSave={subtypeFormMode === 'create' ? handleCreateSubtype : handleUpdateSubtype}
        subtype={selectedSubtype}
        mode={subtypeFormMode}
      />
    </div>
  );
}
