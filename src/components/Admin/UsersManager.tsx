'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api-client';
import { DepartmentSelector } from '@/components/Common/DepartmentSelector';
import { Department, canHaveDepartments } from '@/types/user';
import styles from './AdminManager.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
}

interface UserWithProfile extends AuthUser {
  profiles?: Profile;
}

interface Company {
  id: string;
  name: string;
}

export default function UsersManager() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company_id: '',
    role: 'member',
    departments: [] as Department[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [usersData, companiesData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getCompanies(),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setError(null);
      const usersData = await adminAPI.getUsers();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load users');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.company_id) {
      setError('Company selection is required');
      return;
    }

    // Validate departments for member/manager roles
    if (canHaveDepartments(formData.role as any) && formData.departments.length === 0) {
      setError('At least one department must be selected for Member and Manager roles');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.inviteUser(formData);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        company_id: '',
        role: 'member',
        departments: [],
      });
      setShowCreateForm(false);
      loadUsers();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to send invitation'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.updateUser(editingUser.id, {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
      });
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update user'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setError(null);
      await adminAPI.deleteUser(userId);
      loadUsers();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete user'
      );
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Users Management</h2>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateForm(true)}
          disabled={submitting}
        >
          Invite User
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button
            onClick={() => setError(null)}
            className={styles.dismissError}
          >
            ×
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Invite New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>First Name:</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={e =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name:</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={e =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Company: *</label>
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
                  onChange={e => {
                    const newRole = e.target.value;
                    setFormData({
                      ...formData,
                      role: newRole,
                      // Clear departments if role can't have departments
                      departments: canHaveDepartments(newRole as any) ? formData.departments : []
                    });
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {/* Department Selection - Only show for Member/Manager roles */}
              {canHaveDepartments(formData.role as any) && (
                <div className={styles.formGroup}>
                  <label>Departments: *</label>
                  <div className={styles.departmentSelection}>
                    <DepartmentSelector
                      selectedDepartments={formData.departments}
                      onDepartmentChange={(departments) =>
                        setFormData({ ...formData, departments })
                      }
                      disabled={submitting}
                      layout="vertical"
                      size="medium"
                    />
                  </div>
                  <small className={styles.fieldHelp}>
                    Select the departments this user will have access to
                  </small>
                </div>
              )}
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={submitting}
                >
                  {submitting ? 'Sending Invite...' : 'Send Invitation'}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit User Profile</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className={styles.formGroup}>
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={e =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>First Name:</label>
                <input
                  type="text"
                  value={editingUser.first_name}
                  onChange={e =>
                    setEditingUser({
                      ...editingUser,
                      first_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name:</label>
                <input
                  type="text"
                  value={editingUser.last_name}
                  onChange={e =>
                    setEditingUser({
                      ...editingUser,
                      last_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setEditingUser(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Created</th>
              <th>Confirmed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  {user.profiles
                    ? `${user.profiles.first_name} ${user.profiles.last_name}`
                    : 'No profile'}
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>{user.email_confirmed_at ? 'Yes' : 'No'}</td>
                <td>
                  <div className={styles.actions}>
                    {user.profiles && (
                      <button
                        className={styles.editButton}
                        onClick={() => setEditingUser(user.profiles!)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
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
