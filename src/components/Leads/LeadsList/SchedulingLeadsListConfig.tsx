'use client';

import React from 'react';
import { Lead } from '@/types/lead';
import { TabDefinition } from '@/components/Common/DataTable';

// Define tabs for scheduling page filtering - focuses on scheduling-related lead statuses
// This handles the later stages of the lead lifecycle: Scheduling and Scheduled
export const getSchedulingLeadTabs = (): TabDefinition<Lead>[] => [
  {
    key: 'ready_to_schedule',
    label: 'Ready To Schedule',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'scheduling'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'scheduling')
        .length,
  },
];
