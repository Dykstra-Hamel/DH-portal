'use client';

import React from 'react';
import { Lead } from '@/types/lead';
import { TabDefinition } from '@/components/Common/DataTable';

// Define tabs for scheduling page filtering - focuses on scheduling-related lead statuses
// This handles the later stages of the lead lifecycle: Scheduling, Won, Lost
export const getSchedulingLeadTabs = (): TabDefinition<Lead>[] => [
  {
    key: 'ready_to_schedule',
    label: 'Ready To Schedule',
    filter: (leads: Lead[]) =>
      leads.filter(
        lead => !lead.archived && lead.lead_status === 'scheduling'
      ),
    getCount: (leads: Lead[]) =>
      leads.filter(
        lead => !lead.archived && lead.lead_status === 'scheduling'
      ).length,
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'won'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'won')
        .length,
  },
  {
    key: 'won',
    label: 'Won',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'won'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'won').length,
  },
  {
    key: 'lost',
    label: 'Lost',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'lost'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'lost')
        .length,
  },
  {
    key: 'archived',
    label: 'Archived',
    filter: (leads: Lead[]) => leads.filter(lead => lead.archived),
    getCount: (leads: Lead[]) => leads.filter(lead => lead.archived).length,
  },
];