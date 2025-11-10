'use client';

import React from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import WidgetConfig from '../Widget/WidgetConfig/WidgetConfig';

const WidgetManager: React.FC = () => {
  // Use global company context
  const { selectedCompany, isLoading } = useCompany();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '18px',
              marginBottom: '8px',
            }}
          >
            Loading companies...
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#666',
            }}
          >
            Please wait while we fetch your company data.
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCompany) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            color: '#92400e',
          }}
        >
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            📋 No Company Selected
          </div>
          <div style={{ fontSize: '14px' }}>
            Please select a company from the dropdown in the header to configure its widget settings.
          </div>
        </div>
      </div>
    );
  }

  return (
    <WidgetConfig
      companyId={selectedCompany.id}
      companyName={selectedCompany.name}
    />
  );
};

export default WidgetManager;
