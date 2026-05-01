'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Check, Search, X } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useViewAs, type ViewAsRole, type ViewAsState } from '@/hooks/useViewAs';

interface ApiUser {
  id: string;
  display_name: string;
  email: string;
  departments: string[];
  roles?: string[];
}

const ROLE_LABELS: Record<ViewAsRole, string> = {
  admin: 'Company Admin',
  manager: 'Manager',
  inspector: 'Inspector',
  tech: 'Technician',
};

function filterUsersForRole(
  users: ApiUser[],
  role: Exclude<ViewAsRole, 'admin'>
): ApiUser[] {
  switch (role) {
    case 'manager':
      return users.filter(u => (u.roles || []).includes('manager'));
    case 'inspector':
      return users.filter(u => (u.departments || []).includes('inspector'));
    case 'tech':
      return users.filter(u => (u.departments || []).includes('technician'));
  }
}

export function ViewAsDropdown() {
  const { selectedCompany, isAdmin } = useCompany();
  const { viewAs, setViewAs, clear } = useViewAs();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [activeRole, setActiveRole] = useState<ViewAsRole>('admin');
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Hide entirely for non-global-admins, or when no company is selected.
  const enabled = isAdmin && !!selectedCompany?.id;

  // Clear stale view-as if it points at a different company than the one
  // currently selected — picking from a stale company would give confusing
  // results.
  useEffect(() => {
    if (!enabled) return;
    if (viewAs && viewAs.companyId !== selectedCompany!.id) {
      clear();
    }
  }, [enabled, viewAs, selectedCompany, clear]);

  // Load users for the selected company when the popover opens for the
  // first time (and refetch when the company changes).
  useEffect(() => {
    if (!open || !selectedCompany?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/companies/${selectedCompany.id}/users`
        );
        if (!res.ok) {
          if (!cancelled) setUsers([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setUsers(data.users || []);
      } catch {
        if (!cancelled) setUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, selectedCompany?.id]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const filteredUsers = useMemo(() => {
    if (!users || activeRole === 'admin') return [];
    const list = filterUsersForRole(users, activeRole);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      u =>
        u.display_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, activeRole, search]);

  const triggerLabel = useMemo(() => {
    if (!viewAs || viewAs.role === 'admin') return 'View as Admin';
    return `Viewing: ${viewAs.userLabel} (${ROLE_LABELS[viewAs.role]})`;
  }, [viewAs]);

  if (!enabled) return null;

  const handlePickAdmin = () => {
    if (!selectedCompany?.id) return;
    setViewAs({
      role: 'admin',
      userId: '', // not used for admin
      userLabel: 'Company Admin',
      companyId: selectedCompany.id,
    });
    setOpen(false);
  };

  const handlePickUser = (user: ApiUser) => {
    if (!selectedCompany?.id || activeRole === 'admin') return;
    const next: ViewAsState = {
      role: activeRole,
      userId: user.id,
      userLabel: user.display_name || user.email,
      companyId: selectedCompany.id,
    };
    setViewAs(next);
    setOpen(false);
  };

  const overrideActive = !!viewAs && viewAs.role !== 'admin';

  return (
    <div ref={popoverRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Preview the field-sales dashboard as a different role"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          border: `1px solid ${overrideActive ? '#3b82f6' : '#e5e7eb'}`,
          background: overrideActive ? '#eff6ff' : 'white',
          color: overrideActive ? '#1d4ed8' : '#374151',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          maxWidth: 260,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <Eye size={14} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {triggerLabel}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 320,
            maxWidth: 360,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow:
              '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)',
            zIndex: 1000,
            padding: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
              View Field Sales Dashboard As…
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#6b7280',
                padding: 2,
              }}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div
            role="tablist"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
              padding: 4,
              background: '#f4f4f5',
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            {(['admin', 'manager', 'inspector', 'tech'] as const).map(role => {
              const active = activeRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveRole(role);
                    setSearch('');
                  }}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 6,
                    border: 'none',
                    background: active ? 'white' : 'transparent',
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    color: active ? '#111827' : '#525252',
                    boxShadow: active
                      ? '0 1px 2px rgba(0,0,0,0.06)'
                      : 'none',
                  }}
                >
                  {ROLE_LABELS[role]}
                </button>
              );
            })}
          </div>

          {activeRole === 'admin' ? (
            <button
              type="button"
              onClick={handlePickAdmin}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: 'white',
                fontSize: 13,
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Apply admin view (default)</span>
              {(!viewAs || viewAs.role === 'admin') && <Check size={14} />}
            </button>
          ) : (
            <>
              <div
                style={{
                  position: 'relative',
                  marginBottom: 8,
                }}
              >
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type="text"
                  placeholder={`Search ${ROLE_LABELS[activeRole].toLowerCase()}s`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 30px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
              <div
                style={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {users === null && (
                  <div
                    style={{
                      padding: 12,
                      color: '#6b7280',
                      fontSize: 13,
                    }}
                  >
                    Loading…
                  </div>
                )}
                {users !== null && filteredUsers.length === 0 && (
                  <div
                    style={{
                      padding: 12,
                      color: '#6b7280',
                      fontSize: 13,
                    }}
                  >
                    No {ROLE_LABELS[activeRole].toLowerCase()}s found.
                  </div>
                )}
                {filteredUsers.map(u => {
                  const isSelected =
                    viewAs?.role === activeRole && viewAs.userId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handlePickUser(u)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: isSelected ? '#eff6ff' : 'transparent',
                        color: isSelected ? '#1d4ed8' : '#111827',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                          }}
                        >
                          {u.display_name || u.email}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {u.email}
                        </span>
                      </div>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {overrideActive && (
            <button
              type="button"
              onClick={() => {
                clear();
                setOpen(false);
              }}
              style={{
                marginTop: 10,
                padding: '8px 10px',
                width: '100%',
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Reset to admin view
            </button>
          )}

          <p
            style={{
              marginTop: 10,
              fontSize: 11,
              color: '#9ca3af',
              lineHeight: 1.4,
            }}
          >
            Only affects the field-sales dashboard layout. No data access
            changes.
          </p>
        </div>
      )}
    </div>
  );
}
