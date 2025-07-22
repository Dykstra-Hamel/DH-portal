'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import WidgetPreview from '@/components/Widget/WidgetPreview/WidgetPreview';

interface WidgetConfig {
  companyId: string;
  companyName: string;
  branding: {
    primaryColor: string;
    logo?: string;
    companyName: string;
  };
  messaging: {
    welcome: string;
    fallback: string;
  };
  hasConfiguration: boolean;
}

function WidgetPreviewContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        const response = await fetch(`/api/widget/config/${companyId}`);
        const data = await response.json();
        
        if (data.success) {
          setWidgetConfig(data.config);
        } else {
          setError(data.error || 'Failed to load widget configuration');
        }
      } catch (err) {
        setError('Failed to fetch widget configuration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [companyId]);

  if (!companyId) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Widget Preview</h1>
          <p>Please provide a company ID in the URL parameters.</p>
          <p>Example: /widget-preview?companyId=your-company-id</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Loading Widget Preview...</h1>
          <p>Loading configuration for company: {companyId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Error Loading Widget</h1>
          <p style={{ color: 'red' }}>{error}</p>
          <p>Company ID: {companyId}</p>
        </div>
      </div>
    );
  }

  if (!widgetConfig) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Widget Configuration Not Found</h1>
          <p>No widget configuration found for company: {companyId}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        margin: '0 auto 40px auto'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#1f2937', textAlign: 'center' }}>Widget Preview</h2>
        <p style={{ margin: '0 0 12px 0', color: '#6b7280', textAlign: 'center' }}>
          Company: <strong>{widgetConfig.companyName}</strong>
        </p>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          This is how your widget will appear on customer websites
        </p>
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <WidgetPreview config={widgetConfig} companyId={companyId} />
      </div>
    </div>
  );
}

export default function WidgetPreviewPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Loading Widget Preview...</h1>
        </div>
      </div>
    }>
      <WidgetPreviewContent />
    </Suspense>
  );
}