'use client';

import React, { useState } from 'react';
import { Lead } from '@/types/lead';
import { DataTable } from '@/components/Common/DataTable';
import { getLeadColumns, getLeadTabs } from './LeadsListConfig';
import { TabDefinition } from '@/components/Common/DataTable';
import { Toast } from '@/components/Common/Toast';

interface LeadsListProps {
  leads: Lead[];
  loading?: boolean;
  onLeadUpdated?: () => void;
  onEdit?: (lead: Lead) => void;
  onArchive?: (leadId: string) => void;
  onUnarchive?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  showArchived?: boolean;
  showCompanyColumn?: boolean;
  userProfile?: { role?: string };
  customTabs?: TabDefinition<Lead>[] | null; // null means no tabs
}

function LeadsList({
  leads,
  loading = false,
  onLeadUpdated,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  showArchived = false,
  showCompanyColumn = false,
  userProfile,
  customTabs,
}: LeadsListProps) {
  // Toast state for undo functionality
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showUndoOnToast, setShowUndoOnToast] = useState(false);
  const [previousLeadState, setPreviousLeadState] = useState<any>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Handle item actions (edit, archive, etc.)
  const handleItemAction = (action: string, lead: Lead) => {
    if (action === 'edit') {
      onEdit?.(lead);
    } else if (action === 'archive') {
      handleArchiveLead(lead.id);
    } else if (action === 'unarchive') {
      handleUnarchiveLead(lead.id);
    } else if (action === 'delete') {
      handleDeleteLead(lead.id);
    }
  };

  // Handle toast with undo functionality
  const handleShowToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);

    // Show undo button for archive/unarchive messages
    const shouldShowUndo =
      message.includes('archived') ||
      message.includes('restored') ||
      message.includes('unarchived');

    if (shouldShowUndo) {
      setShowUndoOnToast(true);

      // Auto-hide undo option after 15 seconds
      setTimeout(() => {
        setShowUndoOnToast(false);
        setPreviousLeadState(null);
      }, 15000);
    } else {
      setShowUndoOnToast(false);
    }
  };

  const handleToastClose = () => {
    setShowToast(false);
    setToastMessage('');
    setShowUndoOnToast(false);
    setTimeout(() => {
      setPreviousLeadState(null);
    }, 100);
  };

  const handleUndo = async () => {
    if (!previousLeadState || isUndoing) return;

    setIsUndoing(true);
    try {
      const response = await fetch(`/api/leads/${previousLeadState.leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archived: previousLeadState.previousArchived,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to undo lead action'
        );
      }

      onLeadUpdated?.();
      setShowToast(false);
      setShowUndoOnToast(false);
      setPreviousLeadState(null);

      setTimeout(() => {
        setToastMessage('Lead action undone successfully.');
        setShowToast(true);
        setShowUndoOnToast(false);
      }, 300);
    } catch (error) {
      console.error('Error undoing lead action:', error);
      setToastMessage(
        `Failed to undo: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setShowToast(true);
      setShowUndoOnToast(false);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleArchiveLead = async (leadId: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const previousState = {
        leadId,
        previousArchived: lead.archived || false,
      };

      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive lead');
      }

      setPreviousLeadState(previousState);
      onLeadUpdated?.();
      handleShowToast('Lead archived successfully.');
    } catch (error) {
      console.error('Error archiving lead:', error);
      setToastMessage('Failed to archive lead. Please try again.');
      setShowToast(true);
      setShowUndoOnToast(false);
    }
  };

  const handleUnarchiveLead = async (leadId: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const previousState = {
        leadId,
        previousArchived: lead.archived || false,
      };

      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unarchive lead');
      }

      setPreviousLeadState(previousState);
      onLeadUpdated?.();
      handleShowToast('Lead restored successfully.');
    } catch (error) {
      console.error('Error unarchiving lead:', error);
      setToastMessage('Failed to restore lead. Please try again.');
      setShowToast(true);
      setShowUndoOnToast(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lead');
      }

      onLeadUpdated?.();
      setToastMessage('Lead deleted successfully.');
      setShowToast(true);
      setShowUndoOnToast(false);
    } catch (error) {
      console.error('Error deleting lead:', error);
      setToastMessage('Failed to delete lead. Please try again.');
      setShowToast(true);
      setShowUndoOnToast(false);
    }
  };

  return (
    <>
      {/* Custom Toast with Undo */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
        showUndo={showUndoOnToast}
        onUndo={handleUndo}
        undoLoading={isUndoing}
      />

      {/* DataTable Component */}
      <DataTable
        data={leads}
        loading={loading}
        title="Leads Overview"
        columns={getLeadColumns()}
        tabs={customTabs !== undefined ? (customTabs || getLeadTabs()) : getLeadTabs()}
        tableType="leads"
        onItemAction={handleItemAction}
        onDataUpdated={onLeadUpdated}
        emptyStateMessage="No leads found for this category."
        onShowToast={handleShowToast}
      />
    </>
  );
}

export default LeadsList;