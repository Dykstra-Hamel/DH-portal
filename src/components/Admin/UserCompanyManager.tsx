'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api-client';
import { useCompanyDepartments, useUserDepartments } from '@/hooks/useUserDepartments';
import { DepartmentSelector, DepartmentBadges } from '@/components/Common/DepartmentSelector';
import { Department, canHaveDepartments } from '@/types/user';
import styles from './AdminManager.module.scss';

interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  joined_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  companies?: {
    name: string;
  };
}

interface User {
  id: string;
  email: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

export default function UserCompanyManager() {
  const [relationships, setRelationships] = useState<UserCompany[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRelationship, setEditingRelationship] =
    useState<UserCompany | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartments, setEditingDepartments] = useState<{
    userId: string;
    companyId: string;
    userName: string;
    companyName: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    company_id: '',
    role: 'member',
    is_primary: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await adminAPI.getUserCompanies();
      setRelationships(data.relationships || []);
      setUsers(data.users || []);
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await adminAPI.createUserCompany(formData);

      setFormData({
        user_id: '',
        company_id: '',
        role: 'member',
        is_primary: false,
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating relationship:', error);
    }
  };

  const handleUpdateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRelationship) return;

    try {
      await adminAPI.updateUserCompany(editingRelationship.id, {
        role: editingRelationship.role,
        is_primary: editingRelationship.is_primary,
      });

      setEditingRelationship(null);
      loadData();
    } catch (error) {
      console.error('Error updating relationship:', error);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to remove this user from the company?'))
      return;

    try {
      await adminAPI.deleteUserCompany(relationshipId);

      loadData();
    } catch (error) {
      console.error('Error deleting relationship:', error);
    }
  };

  const handleEditDepartments = (relationship: UserCompany) => {
    if (!canHaveDepartments(relationship.role as any)) {
      alert('Only users with Member or Manager roles can have departments assigned.');
      return;
    }

    setEditingDepartments({
      userId: relationship.user_id,
      companyId: relationship.company_id,
      userName: relationship.profiles
        ? `${relationship.profiles.first_name} ${relationship.profiles.last_name}`
        : 'Unknown User',
      companyName: relationship.companies?.name || 'Unknown Company'
    });
  };

  const getUserDisplayName = (user: User) => {
    if (user.profiles) {
      return `${user.profiles.first_name} ${user.profiles.last_name} (${user.email})`;
    }
    return user.email;
  };

  if (loading) {
    return <div>Loading relationships...</div>;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>User-Company Relationships</h2>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          Add User to Company
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add User to Company</h3>
            <form onSubmit={handleCreateRelationship}>
              <div className={styles.formGroup}>
                <label>User:</label>
                <select
                  value={formData.user_id}
                  onChange={e =>
                    setFormData({ ...formData, user_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Company:</label>
                <select
                  value={formData.company_id}
                  onChange={e =>
                    setFormData({ ...formData, company_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Role:</label>
                <select
                  value={formData.role}
                  onChange={e =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={e =>
                      setFormData({ ...formData, is_primary: e.target.checked })
                    }
                  />
                  Primary Company
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  Add
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRelationship && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit Relationship</h3>
            <form onSubmit={handleUpdateRelationship}>
              <div className={styles.formGroup}>
                <label>User:</label>
                <input
                  type="text"
                  value={editingRelationship.profiles?.email || 'Unknown user'}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>Company:</label>
                <input
                  type="text"
                  value={
                    editingRelationship.companies?.name || 'Unknown company'
                  }
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>Role:</label>
                <select
                  value={editingRelationship.role}
                  onChange={e =>
                    setEditingRelationship({
                      ...editingRelationship,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={editingRelationship.is_primary}
                    onChange={e =>
                      setEditingRelationship({
                        ...editingRelationship,
                        is_primary: e.target.checked,
                      })
                    }
                  />
                  Primary Company
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  Save
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setEditingRelationship(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Management Modal */}
      {editingDepartments && (
        <DepartmentManagementModal
          userId={editingDepartments.userId}
          companyId={editingDepartments.companyId}
          userName={editingDepartments.userName}
          companyName={editingDepartments.companyName}
          onClose={() => setEditingDepartments(null)}
        />
      )}

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Departments</th>
              <th>Primary</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {relationships.map(relationship => (
              <tr key={relationship.id}>
                <td>
                  {relationship.profiles
                    ? `${relationship.profiles.first_name} ${relationship.profiles.last_name}`
                    : 'Unknown user'}
                </td>
                <td>
                  {relationship.profiles?.email || 'No email'}
                </td>
                <td>{relationship.companies?.name || 'Unknown company'}</td>
                <td>
                  <span
                    className={`${styles.roleTag} ${styles[relationship.role]}`}
                  >
                    {relationship.role}
                  </span>
                </td>
                <td>
                  <UserDepartmentDisplay
                    userId={relationship.user_id}
                    companyId={relationship.company_id}
                    canHaveDepartments={canHaveDepartments(relationship.role as any)}
                  />
                </td>
                <td>{relationship.is_primary ? '✓' : '-'}</td>
                <td>{new Date(relationship.joined_at).toLocaleDateString()}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => setEditingRelationship(relationship)}
                    >
                      Edit
                    </button>
                    {canHaveDepartments(relationship.role as any) && (
                      <button
                        className={styles.departmentButton}
                        onClick={() => handleEditDepartments(relationship)}
                        title="Manage Departments"
                      >
                        Depts
                      </button>
                    )}
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteRelationship(relationship.id)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper component to display user departments
function UserDepartmentDisplay({
  userId,
  companyId,
  canHaveDepartments: canHaveDepts
}: {
  userId: string;
  companyId: string;
  canHaveDepartments: boolean;
}) {
  const { departments, isLoading } = useUserDepartments(userId, companyId);

  if (!canHaveDepts) {
    return <span className={styles.noDepartments}>N/A</span>;
  }

  if (isLoading) {
    return <span className={styles.loading}>Loading...</span>;
  }

  if (departments.length === 0) {
    return <span className={styles.noDepartments}>None</span>;
  }

  return <DepartmentBadges departments={departments} size="small" maxDisplay={2} />;
}

// Department Management Modal Component
function DepartmentManagementModal({
  userId,
  companyId,
  userName,
  companyName,
  onClose
}: {
  userId: string;
  companyId: string;
  userName: string;
  companyName: string;
  onClose: () => void;
}) {
  const {
    departments,
    isLoading,
    error,
    updateDepartments
  } = useUserDepartments(userId, companyId);

  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedDepartments(departments);
  }, [departments]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateDepartments(selectedDepartments);
    if (success) {
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h3>Manage Departments</h3>
        <div className={styles.modalHeader}>
          <p>
            <strong>User:</strong> {userName}
          </p>
          <p>
            <strong>Company:</strong> {companyName}
          </p>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading current departments...</div>
        ) : (
          <div className={styles.departmentSelection}>
            <DepartmentSelector
              selectedDepartments={selectedDepartments}
              onDepartmentChange={setSelectedDepartments}
              disabled={saving}
              error={error || undefined}
              layout="vertical"
              size="medium"
            />
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving || isLoading}
          >
            {saving ? 'Saving...' : 'Save Departments'}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
