import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable/DataTable.types';
import { Users, Calendar } from 'lucide-react';

export interface ContactList {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  total_contacts: number;
  created_at: string;
  archived_at: string | null;
  archived_by: string | null;
  campaign_count: number;
  last_used_at: string | null;
  last_used_campaign: any;
}

export function getContactListColumns(): ColumnDefinition<ContactList>[] {
  return [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (list) => <strong>{list.name}</strong>,
    },
    {
      key: 'description',
      title: 'Description',
      render: (list) => (
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '300px',
          display: 'block'
        }}>
          {list.description || '-'}
        </span>
      ),
    },
    {
      key: 'total_contacts',
      title: 'Contacts',
      sortable: true,
      render: (list) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} />
          {list.total_contacts}
        </div>
      ),
    },
    {
      key: 'campaign_count',
      title: 'Used In Campaigns',
      sortable: true,
      render: (list) => list.campaign_count,
    },
    {
      key: 'last_used_at',
      title: 'Last Used',
      sortable: true,
      sortKey: 'last_used_at',
      render: (list) =>
        list.last_used_at ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            {new Date(list.last_used_at).toLocaleDateString()}
          </div>
        ) : (
          '-'
        ),
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (list) => new Date(list.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: () => null, // Will be handled by custom row component
    },
  ];
}

export function getContactListTabs(): TabDefinition<ContactList>[] {
  return [
    {
      key: 'active',
      label: 'Active Lists',
      filter: (lists) => lists.filter((list) => list.archived_at === null),
      getCount: (lists) => lists.filter((list) => list.archived_at === null).length,
    },
    {
      key: 'archived',
      label: 'Archived',
      filter: (lists) => lists.filter((list) => list.archived_at !== null),
      getCount: (lists) => lists.filter((list) => list.archived_at !== null).length,
    },
  ];
}
