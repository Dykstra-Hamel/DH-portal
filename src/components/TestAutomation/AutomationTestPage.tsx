'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Settings,
  Trash2,
  Eye,
  Copy,
  Users,
} from 'lucide-react';
import styles from './AutomationTestPage.module.scss';

interface Company {
  id: string;
  name: string;
  website?: string;
}

interface ServicePlan {
  id: string;
  plan_name: string;
  plan_description?: string;
  initial_price?: number;
  recurring_price: number;
  billing_frequency: string;
  highlight_badge?: string;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  data: TestLeadData;
}

interface TestLeadData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pestType: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  address: string;
  homeSize?: number;
  selectedPlan?: string; // Keep for backwards compatibility
  selectedPlanId?: string; // New UUID reference to service plan
  startDate?: string; // For scheduling variables
  arrivalTime?: string; // For scheduling variables
  leadSource: string;
  comments?: string;
}

interface TestResult {
  id: string;
  timestamp: string;
  scenario: string;
  trigger: string;
  status: 'running' | 'completed' | 'failed';
  leadId?: string;
  customerId?: string;
  workflowResults?: any[];
  executionTime?: number;
  error?: string;
}

interface AutomationTestPageProps {
  user: User;
  profile: any;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'urgent-termites',
    name: 'Urgent Termite Problem',
    description: 'Large home with urgent termite infestation requiring immediate attention',
    data: {
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.johnson+test@example.com',
      customerPhone: '(555) 123-4567',
      pestType: 'termites',
      urgency: 'urgent',
      address: '1234 Oak Street, Austin, TX 78701',
      homeSize: 3500,
      selectedPlanId: undefined, // Will be populated from service plan dropdown
      startDate: '2024-10-15',
      arrivalTime: 'morning',
      leadSource: 'widget_submission',
      comments: 'Found termite damage in the basement. Need immediate inspection.',
    },
  },
  {
    id: 'standard-ants',
    name: 'Standard Ant Problem',
    description: 'Medium urgency ant issue for average sized home',
    data: {
      customerName: 'Mike Chen',
      customerEmail: 'mike.chen+test@example.com',
      customerPhone: '(555) 234-5678',
      pestType: 'ants',
      urgency: 'medium',
      address: '5678 Pine Avenue, Austin, TX 78702',
      homeSize: 2100,
      selectedPlanId: undefined, // Will be populated from service plan dropdown
      startDate: '2024-10-18',
      arrivalTime: 'afternoon',
      leadSource: 'widget_submission',
      comments: 'Ants in kitchen and dining room areas.',
    },
  },
  {
    id: 'commercial-bedbugs',
    name: 'Commercial Bed Bug Issue',
    description: 'High-priority bed bug problem at commercial property',
    data: {
      customerName: 'Jessica Martinez',
      customerEmail: 'jessica.martinez+test@example.com',
      customerPhone: '(555) 345-6789',
      pestType: 'bed bugs',
      urgency: 'high',
      address: '9876 Business Blvd, Austin, TX 78703',
      homeSize: 8000,
      selectedPlanId: undefined, // Will be populated from service plan dropdown
      startDate: '2024-10-16',
      arrivalTime: 'anytime',
      leadSource: 'widget_submission',
      comments: 'Commercial hotel property with guest complaints.',
    },
  },
  {
    id: 'referral-mice',
    name: 'Referral Mouse Problem',
    description: 'High-value referral lead with mouse issue',
    data: {
      customerName: 'David Thompson',
      customerEmail: 'david.thompson+test@example.com',
      customerPhone: '(555) 456-7890',
      pestType: 'mice',
      urgency: 'medium',
      address: '2468 Elm Street, Austin, TX 78704',
      homeSize: 2800,
      selectedPlanId: undefined, // Will be populated from service plan dropdown
      startDate: '2024-10-20',
      arrivalTime: 'evening',
      leadSource: 'referral',
      comments: 'Referred by John Smith (existing customer). Mice in garage and attic.',
    },
  },
];

const TRIGGER_TYPES = [
  {
    value: 'widget/schedule-completed',
    label: 'Widget Schedule Completed',
    description: 'Triggers when widget form is completed',
  },
  {
    value: 'lead/created',
    label: 'New Lead Created',
    description: 'Triggers when any new lead is created',
  },
  {
    value: 'lead/status-changed',
    label: 'Lead Status Changed',
    description: 'Triggers when lead status changes',
  },
];

export default function AutomationTestPage({ user, profile }: AutomationTestPageProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>(TEST_SCENARIOS[0].id);
  const [selectedTrigger, setSelectedTrigger] = useState<string>('widget/schedule-completed');
  const [customData, setCustomData] = useState<TestLeadData | null>(null);
  const [useCustomData, setUseCustomData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    fetchCompanies();
    loadTestResults();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchServicePlans();
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, website')
        .order('name');

      if (error) {
        throw error;
      }

      setCompanies(data || []);
      if (data && data.length > 0) {
        setSelectedCompany(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    } finally {
      setLoading(false);
    }
  };

  const fetchServicePlans = async () => {
    if (!selectedCompany) return;
    
    try {
      const { data, error } = await supabase
        .from('service_plans')
        .select('id, plan_name, plan_description, initial_price, recurring_price, billing_frequency, highlight_badge')
        .eq('company_id', selectedCompany)
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        throw error;
      }

      setServicePlans(data || []);
    } catch (error) {
      console.error('Error fetching service plans:', error);
      setMessage({ type: 'error', text: 'Failed to load service plans' });
    }
  };

  const loadTestResults = () => {
    const saved = localStorage.getItem('automation-test-results');
    if (saved) {
      try {
        setTestResults(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading test results:', error);
      }
    }
  };

  const saveTestResults = (results: TestResult[]) => {
    localStorage.setItem('automation-test-results', JSON.stringify(results));
    setTestResults(results);
  };

  const getCurrentTestData = (): TestLeadData => {
    if (useCustomData && customData) {
      return customData;
    }
    const scenario = TEST_SCENARIOS.find(s => s.id === selectedScenario);
    return scenario?.data || TEST_SCENARIOS[0].data;
  };

  const handleRunTest = async () => {
    if (!selectedCompany) {
      setMessage({ type: 'error', text: 'Please select a company' });
      return;
    }

    setTesting(true);
    setMessage(null);

    const testData = getCurrentTestData();
    const scenario = TEST_SCENARIOS.find(s => s.id === selectedScenario);
    
    const testResult: TestResult = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scenario: useCustomData ? 'Custom' : (scenario?.name || 'Unknown'),
      trigger: selectedTrigger,
      status: 'running',
    };

    const newResults = [testResult, ...testResults];
    saveTestResults(newResults);

    try {
      const response = await fetch('/api/test-automation/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany,
          triggerType: selectedTrigger,
          testData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const updatedResult = {
          ...testResult,
          status: 'completed' as const,
          leadId: result.leadId,
          customerId: result.customerId,
          workflowResults: result.workflowResults || [],
          executionTime: result.executionTime,
        };

        const updatedResults = newResults.map(r => 
          r.id === testResult.id ? updatedResult : r
        );
        saveTestResults(updatedResults);

        setMessage({ 
          type: 'success', 
          text: `Test completed successfully! Lead ID: ${result.leadId}` 
        });
      } else {
        const updatedResult = {
          ...testResult,
          status: 'failed' as const,
          error: result.error,
        };

        const updatedResults = newResults.map(r => 
          r.id === testResult.id ? updatedResult : r
        );
        saveTestResults(updatedResults);

        setMessage({ type: 'error', text: result.error || 'Test failed' });
      }
    } catch (error) {
      console.error('Error running test:', error);
      
      const updatedResult = {
        ...testResult,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      const updatedResults = newResults.map(r => 
        r.id === testResult.id ? updatedResult : r
      );
      saveTestResults(updatedResults);

      setMessage({ type: 'error', text: 'Failed to run test' });
    } finally {
      setTesting(false);
    }
  };

  const clearTestResults = () => {
    localStorage.removeItem('automation-test-results');
    setTestResults([]);
    setMessage({ type: 'success', text: 'Test results cleared' });
  };

  const toggleResultExpansion = (resultId: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const copyTestData = (data: TestLeadData) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setMessage({ type: 'success', text: 'Test data copied to clipboard' });
  };

  const initializeCustomData = () => {
    const scenario = TEST_SCENARIOS.find(s => s.id === selectedScenario);
    setCustomData({ ...scenario?.data || TEST_SCENARIOS[0].data });
    setUseCustomData(true);
  };

  if (loading) {
    return <div className={styles.loading}>Loading automation test page...</div>;
  }

  return (
    <div className={styles.testPage}>
      <div className={styles.header}>
        <h1>Automation Testing</h1>
        <p>Test automation workflows manually without going through the full form process</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.testSetup}>
          <div className={styles.section}>
            <h2>Test Configuration</h2>
            
            <div className={styles.formGroup}>
              <label>Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                disabled={testing}
              >
                <option value="">Select company...</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Trigger Type</label>
              <select
                value={selectedTrigger}
                onChange={(e) => setSelectedTrigger(e.target.value)}
                disabled={testing}
              >
                {TRIGGER_TYPES.map(trigger => (
                  <option key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </option>
                ))}
              </select>
              <small>{TRIGGER_TYPES.find(t => t.value === selectedTrigger)?.description}</small>
            </div>

            <div className={styles.formGroup}>
              <label>Service Plan (Optional)</label>
              <select
                value={useCustomData ? (customData?.selectedPlanId || '') : (getCurrentTestData().selectedPlanId || '')}
                onChange={(e) => {
                  if (useCustomData && customData) {
                    setCustomData({...customData, selectedPlanId: e.target.value || undefined});
                  } else {
                    // Update the scenario data for non-custom data
                    const scenario = TEST_SCENARIOS.find(s => s.id === selectedScenario);
                    if (scenario) {
                      scenario.data.selectedPlanId = e.target.value || undefined;
                    }
                  }
                }}
                disabled={testing || !selectedCompany || servicePlans.length === 0}
              >
                <option value="">No plan selected</option>
                {servicePlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.plan_name} (${plan.recurring_price}/{plan.billing_frequency === 'monthly' ? 'mo' : plan.billing_frequency})
                    {plan.highlight_badge && ` - ${plan.highlight_badge}`}
                  </option>
                ))}
              </select>
              <small>Select a service plan to test plan-related email variables</small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={useCustomData}
                  onChange={(e) => {
                    setUseCustomData(e.target.checked);
                    if (e.target.checked && !customData) {
                      initializeCustomData();
                    }
                  }}
                  disabled={testing}
                />
                Use custom test data
              </label>
            </div>

            {!useCustomData && (
              <div className={styles.formGroup}>
                <label>Test Scenario</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  disabled={testing}
                >
                  {TEST_SCENARIOS.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
                <small>{TEST_SCENARIOS.find(s => s.id === selectedScenario)?.description}</small>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>Test Data Preview</h2>
            <div className={styles.testDataPreview}>
              {useCustomData && customData ? (
                <div className={styles.customDataForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Customer Name</label>
                      <input
                        type="text"
                        value={customData.customerName}
                        onChange={(e) => setCustomData({...customData, customerName: e.target.value})}
                        disabled={testing}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={customData.customerEmail}
                        onChange={(e) => setCustomData({...customData, customerEmail: e.target.value})}
                        disabled={testing}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={customData.customerPhone}
                        onChange={(e) => setCustomData({...customData, customerPhone: e.target.value})}
                        disabled={testing}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Pest Type</label>
                      <select
                        value={customData.pestType}
                        onChange={(e) => setCustomData({...customData, pestType: e.target.value})}
                        disabled={testing}
                      >
                        <option value="ants">Ants</option>
                        <option value="roaches">Roaches</option>
                        <option value="spiders">Spiders</option>
                        <option value="mice">Mice</option>
                        <option value="rats">Rats</option>
                        <option value="termites">Termites</option>
                        <option value="bed bugs">Bed Bugs</option>
                        <option value="wasps">Wasps</option>
                        <option value="mosquitoes">Mosquitoes</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Urgency</label>
                      <select
                        value={customData.urgency}
                        onChange={(e) => setCustomData({...customData, urgency: e.target.value as any})}
                        disabled={testing}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Home Size (sq ft)</label>
                      <input
                        type="number"
                        value={customData.homeSize || ''}
                        onChange={(e) => setCustomData({...customData, homeSize: parseInt(e.target.value) || undefined})}
                        disabled={testing}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Address</label>
                    <input
                      type="text"
                      value={customData.address}
                      onChange={(e) => setCustomData({...customData, address: e.target.value})}
                      disabled={testing}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={customData.startDate || ''}
                        onChange={(e) => setCustomData({...customData, startDate: e.target.value || undefined})}
                        disabled={testing}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Arrival Time</label>
                      <select
                        value={customData.arrivalTime || ''}
                        onChange={(e) => setCustomData({...customData, arrivalTime: e.target.value || undefined})}
                        disabled={testing}
                      >
                        <option value="">Not specified</option>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="anytime">Anytime</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Comments</label>
                    <textarea
                      value={customData.comments || ''}
                      onChange={(e) => setCustomData({...customData, comments: e.target.value})}
                      disabled={testing}
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.previewData}>
                  {(() => {
                    const data = getCurrentTestData();
                    return (
                      <div className={styles.dataGrid}>
                        <div className={styles.dataItem}>
                          <strong>Customer:</strong> {data.customerName}
                        </div>
                        <div className={styles.dataItem}>
                          <strong>Email:</strong> {data.customerEmail}
                        </div>
                        <div className={styles.dataItem}>
                          <strong>Phone:</strong> {data.customerPhone}
                        </div>
                        <div className={styles.dataItem}>
                          <strong>Pest Type:</strong> {data.pestType}
                        </div>
                        <div className={styles.dataItem}>
                          <strong>Urgency:</strong> {data.urgency}
                        </div>
                        <div className={styles.dataItem}>
                          <strong>Address:</strong> {data.address}
                        </div>
                        {data.homeSize && (
                          <div className={styles.dataItem}>
                            <strong>Home Size:</strong> {data.homeSize} sq ft
                          </div>
                        )}
                        {data.startDate && (
                          <div className={styles.dataItem}>
                            <strong>Start Date:</strong> {data.startDate}
                          </div>
                        )}
                        {data.arrivalTime && (
                          <div className={styles.dataItem}>
                            <strong>Arrival Time:</strong> {data.arrivalTime}
                          </div>
                        )}
                        {data.selectedPlanId && servicePlans.find(p => p.id === data.selectedPlanId) && (
                          <div className={styles.dataItem}>
                            <strong>Selected Plan:</strong> {servicePlans.find(p => p.id === data.selectedPlanId)?.plan_name}
                          </div>
                        )}
                        {data.comments && (
                          <div className={styles.dataItem}>
                            <strong>Comments:</strong> {data.comments}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <div className={styles.previewActions}>
                <button
                  onClick={() => copyTestData(getCurrentTestData())}
                  className={styles.copyButton}
                  disabled={testing}
                >
                  <Copy size={16} />
                  Copy Data
                </button>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleRunTest}
              disabled={testing || !selectedCompany}
              className={styles.runButton}
            >
              {testing ? <RefreshCw size={16} className={styles.spinning} /> : <Play size={16} />}
              {testing ? 'Running Test...' : 'Run Test'}
            </button>
          </div>
        </div>

        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h2>Test Results</h2>
            <button
              onClick={clearTestResults}
              className={styles.clearButton}
              disabled={testResults.length === 0}
            >
              <Trash2 size={16} />
              Clear Results
            </button>
          </div>

          {testResults.length === 0 ? (
            <div className={styles.emptyResults}>
              <Clock size={48} />
              <p>No test results yet. Run a test to see results here.</p>
            </div>
          ) : (
            <div className={styles.resultsList}>
              {testResults.map(result => (
                <div key={result.id} className={styles.resultItem}>
                  <div className={styles.resultHeader} onClick={() => toggleResultExpansion(result.id)}>
                    <div className={styles.resultInfo}>
                      <div className={styles.resultTitle}>
                        {result.scenario} - {result.trigger}
                      </div>
                      <div className={styles.resultMeta}>
                        {new Date(result.timestamp).toLocaleString()}
                        {result.executionTime && ` • ${result.executionTime}ms`}
                      </div>
                    </div>
                    <div className={styles.resultStatus}>
                      <span className={`${styles.statusBadge} ${styles[result.status]}`}>
                        {result.status === 'running' && <RefreshCw size={12} className={styles.spinning} />}
                        {result.status === 'completed' && <CheckCircle size={12} />}
                        {result.status === 'failed' && <AlertCircle size={12} />}
                        {result.status}
                      </span>
                      <Eye size={16} />
                    </div>
                  </div>

                  {expandedResults.has(result.id) && (
                    <div className={styles.resultDetails}>
                      {result.leadId && (
                        <div className={styles.resultData}>
                          <strong>Lead ID:</strong> {result.leadId}
                        </div>
                      )}
                      {result.customerId && (
                        <div className={styles.resultData}>
                          <strong>Customer ID:</strong> {result.customerId}
                        </div>
                      )}
                      {result.error && (
                        <div className={styles.errorMessage}>
                          <AlertCircle size={16} />
                          <strong>Error:</strong> {result.error}
                        </div>
                      )}
                      {result.workflowResults && result.workflowResults.length > 0 && (
                        <div className={styles.workflowResults}>
                          <strong>Workflow Results:</strong>
                          <pre>{JSON.stringify(result.workflowResults, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}