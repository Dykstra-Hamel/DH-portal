import { Edit2, Copy, Archive, RotateCcw } from 'lucide-react';
import { ContactList } from './ContactListsConfig';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

interface ContactListRowProps {
  item: ContactList;
  onAction?: (action: string, item: ContactList) => void;
}

export default function ContactListRow({ item, onAction }: ContactListRowProps) {
  const isArchived = item.archived_at !== null;

  return (
    <div
      className={styles.defaultRow}
      onClick={() => onAction?.('edit', item)}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.defaultCell}>
        <strong>{item.name}</strong>
      </div>
      <div className={styles.defaultCell}>
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '300px',
          display: 'block',
          color: 'var(--gray-700)'
        }}>
          {item.description || '-'}
        </span>
      </div>
      <div className={styles.defaultCell}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {item.total_contacts}
        </div>
      </div>
      <div className={styles.defaultCell}>
        {item.campaign_count}
      </div>
      <div className={styles.defaultCell}>
        {item.last_used_at ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {new Date(item.last_used_at).toLocaleDateString()}
          </div>
        ) : (
          '-'
        )}
      </div>
      <div className={styles.defaultCell}>
        {new Date(item.created_at).toLocaleDateString()}
      </div>
      <div className={styles.defaultCell} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('edit', item);
            }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px',
              background: 'var(--gray-50)',
              color: 'var(--gray-900)',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-200)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('duplicate', item);
            }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px',
              background: 'var(--gray-50)',
              color: 'var(--gray-900)',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-200)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
            title="Duplicate"
          >
            <Copy size={16} />
          </button>
          {isArchived ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('unarchive', item);
              }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px',
                background: 'var(--gray-50)',
                color: 'var(--gray-900)',
                border: '1px solid var(--gray-300)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-200)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
              title="Restore"
            >
              <RotateCcw size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('archive', item);
              }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px',
                background: 'var(--gray-50)',
                color: 'var(--gray-900)',
                border: '1px solid var(--gray-300)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-200)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
              title="Archive"
            >
              <Archive size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
