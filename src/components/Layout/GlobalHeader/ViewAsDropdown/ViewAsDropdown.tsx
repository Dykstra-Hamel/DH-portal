'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Check, X } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useUser } from '@/hooks/useUser';
import { useViewAs, type ViewAsRole } from '@/hooks/useViewAs';

const ROLE_LABELS: Record<ViewAsRole, string> = {
  admin: 'Company Admin',
  manager: 'Manager',
  inspector: 'Inspector',
  tech: 'Technician',
};

const ROLE_DESCRIPTIONS: Record<ViewAsRole, string> = {
  admin: 'Full admin dashboard (default).',
  manager: 'Manager-style team overview layout.',
  inspector: 'Inspector tabs: Route, Leads, Actions, Tasks.',
  tech: 'Technician tabs: Dashboard, Route, Opportunities.',
};

export function ViewAsDropdown() {
  const { selectedCompany, isAdmin } = useCompany();
  const { user } = useUser();
  const { viewAs, setViewAs } = useViewAs();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Hide entirely for non-global-admins, or when no company is selected.
  const enabled = isAdmin && !!selectedCompany?.id;

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

  const currentRole: ViewAsRole = viewAs?.role ?? 'admin';

  const triggerLabel = useMemo(() => {
    if (currentRole === 'admin') return 'View as Admin';
    return `Viewing: ${ROLE_LABELS[currentRole]}`;
  }, [currentRole]);

  if (!enabled) return null;

  const handlePickRole = (role: ViewAsRole) => {
    if (!selectedCompany?.id || !user?.id) return;
    setViewAs({
      role,
      // Always pin view-as to the signed-in admin's own user_id so all data
      // (routes, leads, actions, tasks, etc.) stays in their own scope. The
      // dropdown changes layout only — never which user owns the data.
      userId: user.id,
      userLabel: 'Self',
      companyId: selectedCompany.id,
    });
    setOpen(false);
  };

  const overrideActive = currentRole !== 'admin';

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
              marginBottom: 10,
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
            role="radiogroup"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {(['admin', 'manager', 'inspector', 'tech'] as const).map(role => {
              const active = currentRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handlePickRole(role)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${active ? '#3b82f6' : '#e5e7eb'}`,
                    background: active ? '#eff6ff' : 'white',
                    color: active ? '#1d4ed8' : '#111827',
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
                    <span style={{ fontWeight: 600 }}>{ROLE_LABELS[role]}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: active ? '#1d4ed8' : '#6b7280',
                      }}
                    >
                      {ROLE_DESCRIPTIONS[role]}
                    </span>
                  </div>
                  {active && <Check size={14} />}
                </button>
              );
            })}
          </div>

          <p
            style={{
              marginTop: 10,
              fontSize: 11,
              color: '#9ca3af',
              lineHeight: 1.4,
            }}
          >
            Layout preview only — your own data is shown in every role.
          </p>
        </div>
      )}
    </div>
  );
}
