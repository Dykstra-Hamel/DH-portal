'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Lead } from '@/types/lead';
import { Search } from 'lucide-react';
import { DataTable, SortConfig } from '@/components/Common/DataTable';
import { getLeadColumns, getLeadTabs } from './LeadsListConfig';
import { TabDefinition } from '@/components/Common/DataTable';
import { Toast } from '@/components/Common/Toast';
import styles from '@/components/Common/DataTable/DataTableTabs.module.scss';

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
  defaultSort?: SortConfig;
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
  defaultSort,
}: LeadsListProps) {
  // Tab and search state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast state for undo functionality
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showUndoOnToast, setShowUndoOnToast] = useState(false);
  const [previousLeadState, setPreviousLeadState] = useState<any>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Get tabs configuration
  const tabs = useMemo(
    () => (customTabs !== undefined ? customTabs || getLeadTabs() : getLeadTabs()),
    [customTabs]
  );

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
  }, []);

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
        throw new Error(errorData.error || 'Failed to undo lead action');
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

  const sortedLeads = useMemo(() => {
    const scopedLeads = leads.filter(lead =>
      !showArchived ? !lead.archived : lead.archived
    );

    const unassigned = scopedLeads
      .filter(lead => lead.lead_status === 'new')
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

    const others = scopedLeads
      .filter(lead => lead.lead_status !== 'new')
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

    return [...unassigned, ...others];
  }, [leads, showArchived]);

  // Filter data based on active tab
  const filteredByTab = useMemo(() => {
    if (!tabs || tabs.length === 0) return sortedLeads;
    const activeTabConfig = tabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return sortedLeads;
    return activeTabConfig.filter(sortedLeads);
  }, [sortedLeads, activeTab, tabs]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;

    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(lead => {
      // Search in customer name
      const customerName =
        `${lead.customer?.first_name || ''} ${lead.customer?.last_name || ''}`.toLowerCase();
      if (customerName.includes(query)) return true;

      // Search in phone
      if (lead.customer?.phone?.toLowerCase().includes(query)) return true;

      // Search in email
      if (lead.customer?.email?.toLowerCase().includes(query)) return true;

      // Search in status
      if (lead.lead_status?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [filteredByTab, searchQuery]);

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

      {/* Tabs and Search Row */}
      {tabs && tabs.length > 0 && (
        <div className={styles.tabsRow}>
          <div className={styles.tabsSection}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
                {tab.getCount && (
                  <span className={styles.tabCount}>
                    {tab.getCount(sortedLeads)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>
      )}

      {/* DataTable Component */}
      <DataTable
        data={filteredData}
        loading={loading}
        title="Leads Overview"
        columns={getLeadColumns()}
        tableType="leads"
        onItemAction={handleItemAction}
        onDataUpdated={onLeadUpdated}
        emptyStateMessage="No leads found for this category."
        onShowToast={handleShowToast}
        defaultSort={defaultSort}
        searchEnabled={false}
      />
    </>
  );
}

export default LeadsList;
