'use client';

import React from 'react';
import { Lead } from '@/types/lead';
import { TabDefinition } from '@/components/Common/DataTable';

// Define tabs for scheduling page filtering - focuses on scheduling-related lead statuses
// This handles the later stages of the lead lifecycle: Ready To Schedule, Scheduled, Won, Lost
export const getSchedulingLeadTabs = (): TabDefinition<Lead>[] => [
  {
    key: 'ready_to_schedule',
    label: 'Ready To Schedule',
    filter: (leads: Lead[]) =>
      leads.filter(
        lead => !lead.archived && lead.lead_status === 'ready_to_schedule'
      ),
    getCount: (leads: Lead[]) =>
      leads.filter(
        lead => !lead.archived && lead.lead_status === 'ready_to_schedule'
      ).length,
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'scheduled'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'scheduled')
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