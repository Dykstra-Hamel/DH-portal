'use client';

import React, { useState } from 'react';
import { SupportCase } from '@/types/support-case';
import { adminAPI } from '@/lib/api-client';
import styles from './SupportCaseRow.module.scss';

interface SupportCaseRowProps {
  supportCase: SupportCase;
  onUpdated?: () => void;
  onShowToast?: (message: string) => void;
}

export default function SupportCaseRow({ 
  supportCase, 
  onUpdated,
  onShowToast 
}: SupportCaseRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Format phone number
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '--';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  // Get customer display name
  const getCustomerName = () => {
    if (!supportCase.customer) return 'Unknown Customer';
    
    const { first_name, last_name } = supportCase.customer;
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    } else if (first_name) {
      return first_name;
    } else if (last_name) {
      return last_name;
    }
    
    return supportCase.customer.email || 'Unknown Customer';
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await adminAPI.supportCases.updateStatus(supportCase.id, newStatus);
      onUpdated?.();
      onShowToast?.(`Support case status updated to ${newStatus.replace('_', ' ')}.`);
    } catch (error) {
      console.error('Error updating support case status:', error);
      onShowToast?.('Failed to update support case status.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get issue type display label
  const getIssueTypeLabel = (issueType: string) => {
    const labels: Record<string, string> = {
      billing: 'Billing',
      scheduling: 'Scheduling',
      complaint: 'Complaint',
      service_quality: 'Service Quality',
      treatment_request: 'Treatment Request',
      re_service: 'Re-service',
      general_inquiry: 'General Inquiry',
      warranty_claim: 'Warranty Claim',
    };
    return labels[issueType] || issueType;
  };

  // Get status display label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'New',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      awaiting_customer: 'Awaiting Customer',
      awaiting_internal: 'Awaiting Internal',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return labels[status] || status;
  };

  return (
    <div className={styles.supportCaseRow}>
      {/* Created Date */}
      <div className={`${styles.cell} ${styles.dateCell}`}>
        {formatDate(supportCase.created_at)}
      </div>

      {/* Customer Name */}
      <div className={styles.cell}>
        <span className={styles.customerName}>
          {getCustomerName()}
        </span>
      </div>

      {/* Phone Number */}
      <div className={styles.cell}>
        <span className={styles.phoneNumber}>
          {formatPhoneNumber(supportCase.customer?.phone)}
        </span>
      </div>

      {/* Summary */}
      <div className={styles.cell}>
        <span className={styles.summary} title={supportCase.summary}>
          {supportCase.summary}
        </span>
      </div>

      {/* Issue Type */}
      <div className={styles.cell}>
        <span className={`${styles.issueTypeBadge} ${styles[supportCase.issue_type]}`}>
          {getIssueTypeLabel(supportCase.issue_type)}
        </span>
      </div>

      {/* Priority */}
      <div className={styles.cell}>
        <span className={`${styles.priorityBadge} ${styles[supportCase.priority]}`}>
          {supportCase.priority}
        </span>
      </div>

      {/* Status */}
      <div className={styles.cell}>
        <span className={`${styles.statusBadge} ${styles[supportCase.status]}`}>
          {getStatusLabel(supportCase.status)}
        </span>
      </div>

      {/* Actions */}
      <div className={`${styles.cell} ${styles.actionsCell}`}>
        {supportCase.status === 'new' && (
          <button
            className={styles.actionButton}
            onClick={() => handleStatusChange('in_progress')}
            disabled={isUpdating}
            title="Start working on case"
          >
            ▶
          </button>
        )}
        
        {supportCase.status === 'in_progress' && (
          <button
            className={styles.actionButton}
            onClick={() => handleStatusChange('resolved')}
            disabled={isUpdating}
            title="Mark as resolved"
          >
            ✓
          </button>
        )}
        
        {supportCase.status === 'resolved' && (
          <button
            className={styles.actionButton}
            onClick={() => handleStatusChange('closed')}
            disabled={isUpdating}
            title="Close case"
          >
            🔒
          </button>
        )}
        
        <button
          className={styles.actionButton}
          onClick={() => {
            // TODO: Open edit modal
            console.log('Edit support case:', supportCase.id);
          }}
          disabled={isUpdating}
          title="Edit case"
        >
          ✏️
        </button>
      </div>
    </div>
  );
}