'use client';

import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api-client';
import WidgetConfig from '../Widget/WidgetConfig';

interface Company {
  id: string;
  name: string;
  widget_config?: any;
}

const WidgetManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminAPI.getCompanies();
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      setError('Failed to load companies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '18px', 
            marginBottom: '8px' 
          }}>
            Loading companies...
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666' 
          }}>
            Please wait while we fetch your company data.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            ⚠️ Error Loading Data
          </div>
          <div style={{ fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
          <button 
            onClick={loadCompanies}
            style={{
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          color: '#92400e'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            📋 No Companies Found
          </div>
          <div style={{ fontSize: '14px' }}>
            You need to create companies first before configuring widgets.
            <br />
            Please go to the &quot;Companies&quot; section to add companies.
          </div>
        </div>
      </div>
    );
  }

  return (
    <WidgetConfig
      companies={companies}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={handleCompanyChange}
    />
  );
};

export default WidgetManager;