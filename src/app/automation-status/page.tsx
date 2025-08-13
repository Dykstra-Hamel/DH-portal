'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalTemplates: number;
  recentExecutions: any[];
}

export default function AutomationStatus() {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const supabase = createClient();
      
      // Get workflows count
      const { data: workflows } = await supabase
        .from('automation_workflows')
        .select('id, is_active');
      
      // Get templates count
      const { data: templates } = await supabase
        .from('email_templates')
        .select('id');
      
      // Get recent executions
      const { data: executions } = await supabase
        .from('automation_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalWorkflows: workflows?.length || 0,
        activeWorkflows: workflows?.filter(w => w.is_active).length || 0,
        totalTemplates: templates?.length || 0,
        recentExecutions: executions || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAutomation = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          pestType: 'ants',
          urgency: 'high',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult('✅ Test automation triggered successfully!');
        // Refresh stats after a moment
        setTimeout(fetchStats, 2000);
      } else {
        setTestResult('❌ Test failed: ' + result.error);
      }
    } catch (error) {
      setTestResult('❌ Test failed: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Automation System Status</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🤖 Automation System Status</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px' 
      }}>
        <div style={{ 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          padding: '16px' 
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Total Workflows</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {stats?.totalWorkflows || 0}
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          padding: '16px' 
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Active Workflows</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            {stats?.activeWorkflows || 0}
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          padding: '16px' 
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Email Templates</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {stats?.totalTemplates || 0}
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          padding: '16px' 
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Recent Executions</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {stats?.recentExecutions.length || 0}
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Test Automation</h3>
        <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>
          Click the button below to test the automation system with a sample lead.
        </p>
        
        <button
          onClick={testAutomation}
          disabled={testing}
          style={{
            background: testing ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: '14px',
            cursor: testing ? 'not-allowed' : 'pointer',
            marginBottom: '12px',
          }}
        >
          {testing ? 'Testing...' : 'Run Test'}
        </button>
        
        {testResult && (
          <div style={{ 
            padding: '12px',
            background: testResult.startsWith('✅') ? '#f0f9f3' : '#fed7d7',
            border: '1px solid ' + (testResult.startsWith('✅') ? '#c6f6d5' : '#feb2b2'),
            borderRadius: '6px',
            fontSize: '14px',
          }}>
            {testResult}
          </div>
        )}
      </div>

      <div style={{ 
        background: 'white', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px', 
        padding: '20px' 
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Recent Executions</h3>
        {stats?.recentExecutions && stats.recentExecutions.length > 0 ? (
          <div style={{ fontSize: '14px' }}>
            {stats.recentExecutions.map((execution, index) => (
              <div 
                key={execution.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: index < stats.recentExecutions.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <span>Execution {execution.id.slice(0, 8)}...</span>
                <span style={{ 
                  color: execution.execution_status === 'completed' ? '#22c55e' : 
                         execution.execution_status === 'failed' ? '#ef4444' : '#f59e0b'
                }}>
                  {execution.execution_status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: '14px' }}>No executions yet. Run a test to see results!</p>
        )}
      </div>

      <div style={{ marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
        <p>🚀 <strong>Next Steps:</strong></p>
        <ul>
          <li>Visit <a href="/settings" style={{ color: '#3b82f6' }}>/settings</a> to configure automation workflows</li>
          <li>Check the Inngest dashboard at <code>http://localhost:3000/api/inngest</code></li>
          <li>Test the widget form to trigger real automations</li>
        </ul>
      </div>
    </div>
  );
}