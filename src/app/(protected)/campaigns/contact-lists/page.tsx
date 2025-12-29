'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { DataTable } from '@/components/Common/DataTable';
import ContactListModal from '@/components/ContactLists/ContactListModal';
import ContactListRow from '@/components/ContactLists/ContactListRow';
import ConfirmationModal from '@/components/Common/ConfirmationModal/ConfirmationModal';
import {
  ContactList,
  getContactListColumns,
  getContactListTabs,
} from '@/components/ContactLists/ContactListsConfig';

export default function ContactListsPage() {
  const { selectedCompany } = useCompany();
  const { registerPageAction, unregisterPageAction } = usePageActions();
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'primary' as 'primary' | 'danger',
    onConfirm: () => {},
  });

  // Register page action for Create List button
  useEffect(() => {
    registerPageAction('add', () => {
      setSelectedList(null);
      setShowModal(true);
    });
    return () => {
      unregisterPageAction('add');
    };
  }, [registerPageAction, unregisterPageAction]);

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchLists();
    }
  }, [selectedCompany?.id]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/contact-lists?company_id=${selectedCompany!.id}&include_archived=true`
      );
      const result = await response.json();

      if (result.success) {
        setLists(result.lists || []);
      }
    } catch (error) {
      console.error('Error fetching contact lists:', error);
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleListAction = async (action: string, list: ContactList) => {
    switch (action) {
      case 'edit':
        setSelectedList(list);
        setShowModal(true);
        break;

      case 'duplicate':
        setConfirmationModal({
          isOpen: true,
          title: 'Duplicate Contact List',
          message: `Create a copy of "${list.name}"?`,
          confirmText: 'Duplicate',
          confirmVariant: 'primary',
          onConfirm: async () => {
            setConfirmationModal({ ...confirmationModal, isOpen: false });
            try {
              const response = await fetch(`/api/contact-lists/${list.id}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              });
              const result = await response.json();
              if (result.success) {
                fetchLists();
              } else {
                alert(result.error || 'Failed to duplicate list');
              }
            } catch (error) {
              console.error('Error duplicating list:', error);
              alert('Failed to duplicate list');
            }
          },
        });
        break;

      case 'archive':
        setConfirmationModal({
          isOpen: true,
          title: 'Archive Contact List',
          message: `Archive "${list.name}"? It will no longer be available for new campaigns but historical data will be preserved.`,
          confirmText: 'Archive',
          confirmVariant: 'danger',
          onConfirm: async () => {
            setConfirmationModal({ ...confirmationModal, isOpen: false });
            try {
              const response = await fetch(`/api/contact-lists/${list.id}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              if (result.success) {
                fetchLists();
              } else {
                alert(result.error || 'Failed to archive list');
              }
            } catch (error) {
              console.error('Error archiving list:', error);
              alert('Failed to archive list');
            }
          },
        });
        break;

      case 'unarchive':
        setConfirmationModal({
          isOpen: true,
          title: 'Restore Contact List',
          message: `Restore "${list.name}"? It will be available for use in campaigns again.`,
          confirmText: 'Restore',
          confirmVariant: 'primary',
          onConfirm: async () => {
            setConfirmationModal({ ...confirmationModal, isOpen: false });
            try {
              const response = await fetch(`/api/contact-lists/${list.id}/unarchive`, {
                method: 'POST',
              });
              const result = await response.json();
              if (result.success) {
                fetchLists();
              } else {
                alert(result.error || 'Failed to restore list');
              }
            } catch (error) {
              console.error('Error restoring list:', error);
              alert('Failed to restore list');
            }
          },
        });
        break;
    }
  };

  const handleModalClose = (shouldRefresh: boolean) => {
    setShowModal(false);
    setSelectedList(null);
    if (shouldRefresh) {
      fetchLists();
    }
  };

  return (
    <>
      <DataTable<ContactList>
        data={lists}
        title="Contact Lists"
        columns={getContactListColumns()}
        tabs={getContactListTabs()}
        loading={loading}
        emptyStateMessage="No contact lists found. Create your first contact list to get started."
        onItemAction={handleListAction}
        customComponents={{
          itemRow: ContactListRow,
        }}
        customColumnWidths="200px 300px 120px 160px 140px 120px 1fr"
        searchEnabled={true}
        searchPlaceholder="Search lists..."
      />

      {showModal && (
        <ContactListModal
          list={selectedList}
          companyId={selectedCompany!.id}
          onClose={handleModalClose}
        />
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        confirmVariant={confirmationModal.confirmVariant}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
      />
    </>
  );
}
