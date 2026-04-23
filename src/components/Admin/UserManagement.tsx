'use client';

import { useState, useEffect, useRef } from 'react';
import { adminAPI, authenticatedFetch } from '@/lib/api-client';
import { useUserDepartments, usePropertyTypeSettings } from '@/hooks/useUserDepartments';
import { DepartmentSelector } from '@/components/Common/DepartmentSelector';
import { Department, DepartmentType, canHaveDepartments } from '@/types/user';
import BranchSelector, { BranchSelectorHandle } from '@/components/Common/BranchSelector/BranchSelector';
import { FilterPanel } from '@/components/Common/FilterPanel/FilterPanel';
import styles from './UserManagement.module.scss';

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
    title?: string;
    phone?: string;
    contact_email?: string;
    uploaded_avatar_url?: string;
    avatar_url?: string;
  };
}

interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  joined_at: string;
  pestpac_employee_id?: string | null;
  profiles?: { first_name: string; last_name: string; email: string };
  companies?: { name: string };
}

interface Company {
  id: string;
  name: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [relationships, setRelationships] = useState<UserCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null);
  const [filterCompanyId, setFilterCompanyId] = useState<string | null>(null);
  const [filterGlobalAdmin, setFilterGlobalAdmin] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company_id: '',
    role: 'member',
    departments: [] as Department[],
    departmentTypes: {} as Partial<Record<Department, DepartmentType>>,
    sendEmail: true,
    password: '',
  });
  const { settings: invitePropertyTypeSettings } = usePropertyTypeSettings(
    inviteFormData.company_id || null
  );
  const [departmentTypeErrors, setDepartmentTypeErrors] = useState<
    Partial<Record<Department, string>>
  >({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [usersData, relData, companiesData] = await Promise.all([
        authenticatedFetch('/api/admin/users?all=true'),
        adminAPI.getUserCompanies(),
        adminAPI.getCompanies(),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRelationships(relData.relationships || []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      setError(null);
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setRelationships(prev => prev.filter(r => r.user_id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!inviteFormData.company_id) {
      setError('Company is required');
      return;
    }
    const typeErrors: Partial<Record<Department, string>> = {};
    if (canHaveDepartments(inviteFormData.role as any)) {
      if (
        invitePropertyTypeSettings.technician
        && inviteFormData.departments.includes('technician')
        && !inviteFormData.departmentTypes.technician
      ) {
        typeErrors.technician = 'Select a property type for Technician';
      }
      if (
        invitePropertyTypeSettings.inspector
        && inviteFormData.departments.includes('inspector')
        && !inviteFormData.departmentTypes.inspector
      ) {
        typeErrors.inspector = 'Select a property type for Inspector';
      }
    }
    if (Object.keys(typeErrors).length > 0) {
      setDepartmentTypeErrors(typeErrors);
      setError('Please complete the required property type selections');
      return;
    }
    setDepartmentTypeErrors({});
    // Departments are optional — users can have them assigned later
    try {
      setSubmitting(true);
      setError(null);
      await adminAPI.inviteUser(inviteFormData);
      setInviteFormData({ email: '', first_name: '', last_name: '', company_id: '', role: 'member', departments: [], departmentTypes: {}, sendEmail: true, password: '' });
      setShowInviteForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const fullName = [user.profiles?.first_name, user.profiles?.last_name]
        .filter(Boolean).join(' ').toLowerCase();
      if (!fullName.includes(q) && !user.email.toLowerCase().includes(q)) return false;
    }
    if (filterCompanyId) {
      const userRels = relationships.filter(r => r.user_id === user.id);
      if (!userRels.some(r => r.company_id === filterCompanyId)) return false;
    }
    if (filterGlobalAdmin === 'true') {
      if (user.profiles?.role !== 'admin') return false;
    }
    return true;
  }).sort((a, b) => {
    const aName = [a.profiles?.first_name, a.profiles?.last_name].filter(Boolean).join(' ') || a.email;
    const bName = [b.profiles?.first_name, b.profiles?.last_name].filter(Boolean).join(' ') || b.email;
    return aName.localeCompare(bName);
  });

  if (loading) {
    return <div className={styles.loading}>Loading users...</div>;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>User Management</h2>
          <p className={styles.subtitle}>Manage users, company memberships, roles, departments, and branch access.</p>
        </div>
        <button className={styles.inviteButton} onClick={() => setShowInviteForm(true)}>
          Invite User
        </button>
      </div>
      <div className={styles.toolbar}>
        <FilterPanel
          filters={[
            {
              key: 'company',
              label: 'Company',
              value: filterCompanyId,
              options: [
                { value: null, label: 'All Companies' },
                ...companies.map(c => ({ value: c.id, label: c.name })),
              ],
              onChange: setFilterCompanyId,
              searchable: true,
            },
            {
              key: 'globalAdmin',
              label: 'Role',
              value: filterGlobalAdmin,
              options: [
                { value: null, label: 'All Roles' },
                { value: 'true', label: 'Global Admins Only' },
              ],
              onChange: setFilterGlobalAdmin,
            },
          ]}
          onClearAll={() => { setFilterCompanyId(null); setFilterGlobalAdmin(null); }}
        />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button className={styles.dismissError} onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className={styles.userList}>
        {filteredUsers.map(user => {
          const userRels = relationships.filter(r => r.user_id === user.id);
          return (
            <div key={user.id} className={styles.userRow}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user.profiles
                    ? `${user.profiles.first_name} ${user.profiles.last_name}`
                    : 'No profile'}
                  {user.profiles?.role === 'admin' && (
                    <span className={styles.globalAdminBadge}>Global Admin</span>
                  )}
                  {!user.email_confirmed_at && (
                    <span className={styles.pendingBadge}>Pending</span>
                  )}
                </span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              <div className={styles.userMeta}>
                {userRels.length === 0 ? (
                  <span className={styles.noCompany}>No company</span>
                ) : (
                  <div className={styles.companyBadges}>
                    {userRels.map(rel => (
                      <span key={rel.id} className={styles.companyBadge}>
                        {rel.companies?.name}
                        <span className={`${styles.roleBadge} ${styles[rel.role] || ''}`}>
                          {rel.role}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.userActions}>
                <button
                  className={styles.editButton}
                  onClick={() => setEditingUser(user)}
                >
                  Edit
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {filteredUsers.length === 0 && !loading && (
          <div className={styles.emptyState}>
            {users.length === 0 ? 'No users found.' : 'No users match the current filters.'}
          </div>
        )}
      </div>

      {showInviteForm && (
        <InviteUserModal
          companies={companies}
          submitting={submitting}
          formData={inviteFormData}
          setFormData={setInviteFormData}
          propertyTypeSettings={invitePropertyTypeSettings}
          departmentTypeErrors={departmentTypeErrors}
          setDepartmentTypeErrors={setDepartmentTypeErrors}
          onSubmit={handleInviteUser}
          onClose={() => {
            setShowInviteForm(false);
            setDepartmentTypeErrors({});
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          relationships={relationships.filter(r => r.user_id === editingUser.id)}
          allCompanies={companies}
          onClose={() => setEditingUser(null)}
          onRelationshipsChange={loadData}
          onUserUpdated={updated => {
            setUsers(prev =>
              prev.map(u => u.id === updated.id ? { ...u, profiles: updated.profiles } : u)
            );
            setEditingUser(prev => prev ? { ...prev, profiles: updated.profiles } : prev);
          }}
        />
      )}
    </div>
  );
}

// ── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({
  user,
  relationships,
  allCompanies,
  onClose,
  onRelationshipsChange,
  onUserUpdated,
}: {
  user: UserWithProfile;
  relationships: UserCompany[];
  allCompanies: Company[];
  onClose: () => void;
  onRelationshipsChange: () => void;
  onUserUpdated: (user: UserWithProfile) => void;
}) {
  const [profileForm, setProfileForm] = useState({
    first_name: user.profiles?.first_name || '',
    last_name: user.profiles?.last_name || '',
    email: user.email,
    role: user.profiles?.role || 'user',
    title: user.profiles?.title || '',
    phone: user.profiles?.phone || '',
    contact_email: user.profiles?.contact_email || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const currentAvatarUrl = avatarPreview
    || user.profiles?.uploaded_avatar_url
    || user.profiles?.avatar_url
    || null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user.profiles) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    setProfileError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/admin/users/${user.profiles.id}/avatar`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setAvatarPreview(data.url);
      onUserUpdated({ ...user, profiles: user.profiles ? { ...user.profiles, uploaded_avatar_url: data.url } : user.profiles });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Avatar upload failed');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Per-relationship pending changes
  const [pendingRoles, setPendingRoles] = useState<
    Record<string, { role: string; is_primary: boolean }>
  >({});
  const [savingRole, setSavingRole] = useState<string | null>(null);

  // Add to company form
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [addCompanyForm, setAddCompanyForm] = useState({
    company_id: '',
    role: 'member',
    is_primary: false,
  });
  const [addingCompany, setAddingCompany] = useState(false);

  // Sub-modals
  const [editingDepartments, setEditingDepartments] = useState<{
    userId: string;
    companyId: string;
    companyName: string;
  } | null>(null);
  const [editingBranches, setEditingBranches] = useState<{
    userId: string;
    companyId: string;
    companyName: string;
  } | null>(null);
  const [editingPestPacId, setEditingPestPacId] = useState<{
    userCompanyId: string;
    userName: string;
    companyName: string;
    currentValue: string | null;
  } | null>(null);

  // Sync pending roles when relationships prop changes
  useEffect(() => {
    const initial: Record<string, { role: string; is_primary: boolean }> = {};
    relationships.forEach(r => {
      initial[r.id] = { role: r.role, is_primary: r.is_primary };
    });
    setPendingRoles(initial);
  }, [relationships]);

  const availableCompanies = allCompanies.filter(
    c => !relationships.find(r => r.company_id === c.id)
  );

  const handleSaveProfile = async () => {
    if (!user.profiles) return;
    setSavingProfile(true);
    setProfileError(null);
    try {
      await adminAPI.updateUser(user.profiles.id, profileForm);
      onUserUpdated({
        ...user,
        profiles: user.profiles ? { ...user.profiles, ...profileForm } : user.profiles,
      });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveRole = async (relationshipId: string) => {
    const pending = pendingRoles[relationshipId];
    if (!pending) return;
    setSavingRole(relationshipId);
    try {
      await adminAPI.updateUserCompany(relationshipId, {
        role: pending.role,
        is_primary: pending.is_primary,
      });
      onRelationshipsChange();
    } finally {
      setSavingRole(null);
    }
  };

  const handleRemoveFromCompany = async (relationshipId: string) => {
    if (!confirm('Remove this user from the company?')) return;
    try {
      await adminAPI.deleteUserCompany(relationshipId);
      onRelationshipsChange();
    } catch {
      // silently fail — parent will reload
    }
  };

  const handleAddToCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCompanyForm.company_id) return;
    setAddingCompany(true);
    try {
      await adminAPI.createUserCompany({
        user_id: user.id,
        company_id: addCompanyForm.company_id,
        role: addCompanyForm.role,
        is_primary: addCompanyForm.is_primary,
      });
      setAddCompanyForm({ company_id: '', role: 'member', is_primary: false });
      setShowAddCompany(false);
      onRelationshipsChange();
    } finally {
      setAddingCompany(false);
    }
  };

  const displayName = user.profiles
    ? `${user.profiles.first_name} ${user.profiles.last_name}`
    : user.email;

  return (
    <>
      <div className={styles.modal}>
        <div className={`${styles.modalContent} ${styles.editModal}`}>
          <div className={styles.modalHeader}>
            <h3>Edit User: {displayName}</h3>
            <button className={styles.closeButton} onClick={onClose} type="button">
              ×
            </button>
          </div>

          {/* Profile */}
          {user.profiles && (
            <section className={styles.modalSection}>
              <h4 className={styles.sectionTitle}>Profile</h4>

              {/* Avatar */}
              <div className={styles.avatarEditRow}>
                {currentAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentAvatarUrl} alt="Avatar" className={styles.avatarThumb} />
                ) : (
                  <div className={styles.avatarThumbPlaceholder}>
                    {profileForm.first_name.charAt(0)}{profileForm.last_name.charAt(0)}
                  </div>
                )}
                <button
                  type="button"
                  className={styles.uploadAvatarBtn}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? 'Uploading…' : 'Upload Photo'}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>First Name</label>
                  <input
                    className={styles.input}
                    value={profileForm.first_name}
                    onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Last Name</label>
                  <input
                    className={styles.input}
                    value={profileForm.last_name}
                    onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Global Role</label>
                  <select
                    className={styles.input}
                    value={profileForm.role}
                    onChange={e => setProfileForm(p => ({ ...p, role: e.target.value }))}
                  >
                    <option value="user">User</option>
                    <option value="customer">Customer</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Title</label>
                  <input
                    className={styles.input}
                    placeholder="e.g. Lead Sales Inspector"
                    value={profileForm.title}
                    onChange={e => setProfileForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contact Phone</label>
                  <input
                    className={styles.input}
                    type="tel"
                    placeholder="e.g. (555) 867-5309"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contact Email</label>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="e.g. john@yourcompany.com"
                    value={profileForm.contact_email}
                    onChange={e => setProfileForm(p => ({ ...p, contact_email: e.target.value }))}
                  />
                </div>
              </div>
              {profileError && <p className={styles.fieldError}>{profileError}</p>}
              <button
                className={styles.saveButton}
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </section>
          )}

          {/* Company Memberships */}
          <section className={styles.modalSection}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle} style={{ margin: 0 }}>
                Company Memberships
              </h4>
              {availableCompanies.length > 0 && (
                <button
                  className={styles.addCompanyButton}
                  type="button"
                  onClick={() => setShowAddCompany(v => !v)}
                >
                  + Add to Company
                </button>
              )}
            </div>

            {showAddCompany && (
              <form className={styles.addCompanyForm} onSubmit={handleAddToCompany}>
                <select
                  required
                  value={addCompanyForm.company_id}
                  onChange={e => setAddCompanyForm(p => ({ ...p, company_id: e.target.value }))}
                >
                  <option value="">Select company...</option>
                  {availableCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={addCompanyForm.role}
                  onChange={e => setAddCompanyForm(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <label>
                  <input
                    type="checkbox"
                    checked={addCompanyForm.is_primary}
                    onChange={e => setAddCompanyForm(p => ({ ...p, is_primary: e.target.checked }))}
                  />
                  Primary
                </label>
                <button type="submit" className={styles.addButton} disabled={addingCompany}>
                  {addingCompany ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  className={styles.cancelSmallButton}
                  onClick={() => setShowAddCompany(false)}
                >
                  Cancel
                </button>
              </form>
            )}

            {relationships.length === 0 && !showAddCompany && (
              <p className={styles.noMemberships}>Not a member of any company.</p>
            )}

            <div className={styles.relationshipList}>
              {relationships.map(rel => {
                const pending = pendingRoles[rel.id] ?? {
                  role: rel.role,
                  is_primary: rel.is_primary,
                };
                const isDirty =
                  pending.role !== rel.role || pending.is_primary !== rel.is_primary;

                return (
                  <div key={rel.id} className={styles.relationshipRow}>
                    <div className={styles.relCompanyName}>
                      {rel.companies?.name || 'Unknown Company'}
                      {pending.is_primary && (
                        <span className={styles.primaryBadge}>Primary</span>
                      )}
                    </div>
                    <div className={styles.relControls}>
                      <select
                        className={styles.roleSelect}
                        value={pending.role}
                        onChange={e =>
                          setPendingRoles(p => ({
                            ...p,
                            [rel.id]: { ...pending, role: e.target.value },
                          }))
                        }
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <label className={styles.primaryCheckbox}>
                        <input
                          type="checkbox"
                          checked={pending.is_primary}
                          onChange={e =>
                            setPendingRoles(p => ({
                              ...p,
                              [rel.id]: { ...pending, is_primary: e.target.checked },
                            }))
                          }
                        />
                        Primary
                      </label>
                      {isDirty && (
                        <button
                          type="button"
                          className={styles.saveRoleButton}
                          onClick={() => handleSaveRole(rel.id)}
                          disabled={savingRole === rel.id}
                        >
                          {savingRole === rel.id ? '...' : 'Save'}
                        </button>
                      )}
                    </div>
                    <div className={styles.relActions}>
                      {canHaveDepartments(pending.role as any) && (
                        <button
                          type="button"
                          className={styles.actionLink}
                          onClick={() =>
                            setEditingDepartments({
                              userId: user.id,
                              companyId: rel.company_id,
                              companyName: rel.companies?.name || '',
                            })
                          }
                        >
                          Departments
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() =>
                          setEditingBranches({
                            userId: user.id,
                            companyId: rel.company_id,
                            companyName: rel.companies?.name || '',
                          })
                        }
                      >
                        Branches
                      </button>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() =>
                          setEditingPestPacId({
                            userCompanyId: rel.id,
                            userName: displayName,
                            companyName: rel.companies?.name || '',
                            currentValue: rel.pestpac_employee_id ?? null,
                          })
                        }
                      >
                        PestPac ID
                      </button>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemoveFromCompany(rel.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {editingDepartments && (
        <DepartmentManagementModal
          userId={editingDepartments.userId}
          companyId={editingDepartments.companyId}
          userName={displayName}
          companyName={editingDepartments.companyName}
          onClose={() => setEditingDepartments(null)}
        />
      )}

      {editingBranches && (
        <BranchManagementModal
          userId={editingBranches.userId}
          companyId={editingBranches.companyId}
          userName={displayName}
          companyName={editingBranches.companyName}
          onClose={() => setEditingBranches(null)}
        />
      )}

      {editingPestPacId && (
        <PestPacIdModal
          userCompanyId={editingPestPacId.userCompanyId}
          userName={editingPestPacId.userName}
          companyName={editingPestPacId.companyName}
          currentValue={editingPestPacId.currentValue}
          onClose={() => setEditingPestPacId(null)}
          onSaved={newValue => {
            setEditingPestPacId(null);
            onRelationshipsChange();
          }}
        />
      )}
    </>
  );
}

// ── Invite User Modal ────────────────────────────────────────────────────────

function InviteUserModal({
  companies,
  submitting,
  formData,
  setFormData,
  propertyTypeSettings,
  departmentTypeErrors,
  setDepartmentTypeErrors,
  onSubmit,
  onClose,
}: {
  companies: Company[];
  submitting: boolean;
  formData: {
    email: string;
    first_name: string;
    last_name: string;
    company_id: string;
    role: string;
    departments: Department[];
    departmentTypes: Partial<Record<Department, DepartmentType>>;
    sendEmail: boolean;
    password: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    email: string;
    first_name: string;
    last_name: string;
    company_id: string;
    role: string;
    departments: Department[];
    departmentTypes: Partial<Record<Department, DepartmentType>>;
    sendEmail: boolean;
    password: string;
  }>>;
  propertyTypeSettings: { technician: boolean; inspector: boolean };
  departmentTypeErrors: Partial<Record<Department, string>>;
  setDepartmentTypeErrors: React.Dispatch<
    React.SetStateAction<Partial<Record<Department, string>>>
  >;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{formData.sendEmail ? 'Invite New User' : 'Add New User'}</h3>
          <button className={styles.closeButton} type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className={styles.inviteFormBody}>
            <div className={styles.sendEmailToggle}>
              <button
                type="button"
                className={`${styles.toggleOption} ${formData.sendEmail ? styles.toggleOptionActive : ''}`}
                onClick={() => setFormData(p => ({ ...p, sendEmail: true }))}
              >
                Send Invite Email
              </button>
              <button
                type="button"
                className={`${styles.toggleOption} ${!formData.sendEmail ? styles.toggleOptionActive : ''}`}
                onClick={() => setFormData(p => ({ ...p, sendEmail: false }))}
              >
                Add Without Email
              </button>
            </div>
            {!formData.sendEmail && (
              <>
                <p className={styles.noEmailNote}>
                  The user will be added directly. Set a temporary password below, or leave blank to allow login via magic link or Google OAuth only.
                </p>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Password <span className={styles.fieldOptional}>(optional)</span></label>
                  <input
                    className={styles.input}
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    placeholder="Leave blank to skip"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>First Name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={formData.first_name}
                  onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Last Name</label>
                <input
                  className={styles.input}
                  type="text"
                  value={formData.last_name}
                  onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Company *</label>
              <select
                className={styles.selectInput}
                value={formData.company_id}
                onChange={e => setFormData(p => ({ ...p, company_id: e.target.value }))}
                required
              >
                <option value="">Select a company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Role</label>
              <select
                className={styles.selectInput}
                value={formData.role}
                onChange={e => {
                  const role = e.target.value;
                  setFormData(p => ({
                    ...p,
                    role,
                    departments: canHaveDepartments(role as any) ? p.departments : [],
                    departmentTypes: canHaveDepartments(role as any) ? p.departmentTypes : {},
                  }));
                }}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            {canHaveDepartments(formData.role as any) && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Departments <span className={styles.fieldOptional}>(optional)</span></label>
                <DepartmentSelector
                  selectedDepartments={formData.departments}
                  onDepartmentChange={departments => setFormData(p => {
                    const nextTypes = { ...p.departmentTypes };
                    if (!departments.includes('technician')) delete nextTypes.technician;
                    if (!departments.includes('inspector')) delete nextTypes.inspector;
                    return { ...p, departments, departmentTypes: nextTypes };
                  })}
                  departmentTypes={formData.departmentTypes}
                  onDepartmentTypeChange={(department, type) => {
                    setFormData(p => ({
                      ...p,
                      departmentTypes: { ...p.departmentTypes, [department]: type },
                    }));
                    setDepartmentTypeErrors(prev => {
                      const next = { ...prev };
                      delete next[department];
                      return next;
                    });
                  }}
                  propertyTypeEnabled={propertyTypeSettings}
                  departmentTypeErrors={departmentTypeErrors}
                  disabled={submitting}
                  layout="vertical"
                  size="medium"
                />
                <small className={styles.fieldHelp}>
                  Can be assigned later through Edit User
                </small>
              </div>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={submitting}
            >
              {submitting
              ? (formData.sendEmail ? 'Sending Invite...' : 'Adding User...')
              : (formData.sendEmail ? 'Send Invitation' : 'Add User')}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Department Management Modal ──────────────────────────────────────────────

function DepartmentManagementModal({
  userId,
  companyId,
  userName,
  companyName,
  onClose,
}: {
  userId: string;
  companyId: string;
  userName: string;
  companyName: string;
  onClose: () => void;
}) {
  const { departments, departmentTypes, isLoading, error, updateDepartments } = useUserDepartments(
    userId,
    companyId
  );
  const { settings: propertyTypeSettings } = usePropertyTypeSettings(companyId);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [selectedDepartmentTypes, setSelectedDepartmentTypes] = useState<
    Partial<Record<Department, DepartmentType | null>>
  >({});
  const [typeErrors, setTypeErrors] = useState<Partial<Record<Department, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedDepartments(departments);
    setSelectedDepartmentTypes(departmentTypes);
  }, [departments, departmentTypes]);

  const handleSave = async () => {
    const errs: Partial<Record<Department, string>> = {};
    if (
      propertyTypeSettings.technician
      && selectedDepartments.includes('technician')
      && !selectedDepartmentTypes.technician
    ) {
      errs.technician = 'Select a property type for Technician';
    }
    if (
      propertyTypeSettings.inspector
      && selectedDepartments.includes('inspector')
      && !selectedDepartmentTypes.inspector
    ) {
      errs.inspector = 'Select a property type for Inspector';
    }
    if (Object.keys(errs).length > 0) {
      setTypeErrors(errs);
      setSaveError('Please complete the required property type selections');
      return;
    }
    setTypeErrors({});
    setSaveError(null);
    setSaving(true);
    const success = await updateDepartments(
      selectedDepartments,
      selectedDepartmentTypes as Partial<Record<Department, DepartmentType>>
    );
    if (success) onClose();
    setSaving(false);
  };

  return (
    <div className={`${styles.modal} ${styles.subModal}`}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Manage Departments</h3>
          <button className={styles.closeButton} type="button" onClick={onClose}>×</button>
        </div>
        <div className={styles.modalSection}>
          <p className={styles.subModalMeta}>
            <strong>{userName}</strong> at <strong>{companyName}</strong>
          </p>
          {isLoading ? (
            <div className={styles.loading}>Loading departments...</div>
          ) : (
            <DepartmentSelector
              selectedDepartments={selectedDepartments}
              onDepartmentChange={(next) => {
                setSelectedDepartments(next);
                setSelectedDepartmentTypes((prev) => {
                  const copy = { ...prev };
                  if (!next.includes('technician')) delete copy.technician;
                  if (!next.includes('inspector')) delete copy.inspector;
                  return copy;
                });
              }}
              departmentTypes={selectedDepartmentTypes}
              onDepartmentTypeChange={(department, type) => {
                setSelectedDepartmentTypes((prev) => ({ ...prev, [department]: type }));
                setTypeErrors((prev) => {
                  const next = { ...prev };
                  delete next[department];
                  return next;
                });
              }}
              propertyTypeEnabled={propertyTypeSettings}
              departmentTypeErrors={typeErrors}
              disabled={saving}
              error={error || saveError || undefined}
              layout="vertical"
              size="medium"
            />
          )}
        </div>
        <div className={styles.modalFooter}>
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

// ── Branch Management Modal ──────────────────────────────────────────────────

function BranchManagementModal({
  userId,
  companyId,
  userName,
  companyName,
  onClose,
}: {
  userId: string;
  companyId: string;
  userName: string;
  companyName: string;
  onClose: () => void;
}) {
  const branchRef = useRef<BranchSelectorHandle>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await branchRef.current?.save();
    setSaving(false);
    if (success) onClose();
  };

  return (
    <div className={`${styles.modal} ${styles.subModal}`}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Manage Branch Access</h3>
          <button className={styles.closeButton} type="button" onClick={onClose}>×</button>
        </div>
        <div className={styles.modalSection}>
          <p className={styles.subModalMeta}>
            <strong>{userName}</strong> at <strong>{companyName}</strong>
          </p>
          <BranchSelector ref={branchRef} userId={userId} companyId={companyId} />
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Branch Access'}
          </button>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PestPac Employee ID Modal ─────────────────────────────────────────────────

function PestPacIdModal({
  userCompanyId,
  userName,
  companyName,
  currentValue,
  onClose,
  onSaved,
}: {
  userCompanyId: string;
  userName: string;
  companyName: string;
  currentValue: string | null;
  onClose: () => void;
  onSaved: (newValue: string | null) => void;
}) {
  const [value, setValue] = useState(currentValue ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/user-companies/${userCompanyId}/pestpac-employee-id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pestpac_employee_id: value.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save');
        return;
      }
      onSaved(value.trim() || null);
    } catch {
      setError('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${styles.modal} ${styles.subModal}`}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>PestPac Employee ID</h3>
          <button className={styles.closeButton} type="button" onClick={onClose}>×</button>
        </div>
        <div className={styles.modalSection}>
          <p className={styles.subModalMeta}>
            <strong>{userName}</strong> at <strong>{companyName}</strong>
          </p>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '0 0 12px' }}>
            The PestPac employee ID used to fetch this inspector&apos;s daily route.
          </p>
          <div className={styles.formGroup}>
            <label className={styles.label}>Employee ID</label>
            <input
              className={styles.input}
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="e.g. 12345"
              disabled={saving}
            />
          </div>
          {error && <p style={{ color: 'var(--error-600)', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
