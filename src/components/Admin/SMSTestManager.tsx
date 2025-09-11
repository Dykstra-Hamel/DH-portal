'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, CheckCircle, AlertCircle, Info, Loader } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './SMSTestManager.module.scss';

interface Company {
  id: string;
  name: string;
}

interface SMSTestForm {
  companyId: string;
  customerNumber: string;
  agentId: string;
  retellNumber: string;
  message: string;
  metadata: string;
}

interface TestResult {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: string;
}

interface SMSTestManagerProps {
  className?: string;
}

export default function SMSTestManager({ className }: SMSTestManagerProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState<SMSTestForm>({
    companyId: '',
    customerNumber: '',
    agentId: '',
    retellNumber: '',
    message: '',
    metadata: ''
  });
  const [errors, setErrors] = useState<Partial<SMSTestForm>>({});
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const supabase = createClient();
      
      // Get the current session to include auth headers
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authenticated session');
      }
      
      const response = await fetch('/api/admin/companies', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load companies: ${response.status}`);
      }
      
      const data = await response.json();
      setCompanies(data);
      
      // Auto-select first company if only one exists
      if (data.length === 1) {
        setFormData(prev => ({ ...prev, companyId: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SMSTestForm> = {};
    
    if (!formData.companyId) {
      newErrors.companyId = 'Company is required';
    }
    
    if (!formData.customerNumber) {
      newErrors.customerNumber = 'Customer phone number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(formData.customerNumber)) {
      newErrors.customerNumber = 'Phone number must be in E.164 format (e.g., +1234567890)';
    }
    
    if (formData.metadata) {
      try {
        JSON.parse(formData.metadata);
      } catch {
        newErrors.metadata = 'Metadata must be valid JSON';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SMSTestForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const executeTest = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setTestResult(null);
      
      const testPayload: any = {
        companyId: formData.companyId,
        customerNumber: formData.customerNumber
      };
      
      if (formData.agentId) {
        testPayload.agentId = formData.agentId;
      }
      
      if (formData.retellNumber) {
        testPayload.retellNumber = formData.retellNumber;
      }
      
      if (formData.metadata) {
        try {
          testPayload.metadata = JSON.parse(formData.metadata);
        } catch {
          // Already validated above
        }
      }
      
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });
      
      const data = await response.json();
      
      setTestResult({
        success: data.success,
        result: data.success ? data.result : undefined,
        error: data.success ? undefined : data.error,
        timestamp: data.timestamp || new Date().toISOString()
      });
      
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCompanyName = () => {
    const company = companies.find(c => c.id === formData.companyId);
    return company?.name || 'Unknown Company';
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h2>
          <MessageCircle size={20} />
          SMS Testing
        </h2>
        <p>Test SMS message delivery with custom content and configurations.</p>
      </div>

      <div className={styles.content}>
        <div className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Company <span className={styles.required}>*</span>
              </label>
              {companiesLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  Loading companies...
                </div>
              ) : (
                <select
                  className={`${styles.select} ${errors.companyId ? styles.error : ''}`}
                  value={formData.companyId}
                  onChange={(e) => handleInputChange('companyId', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a company...</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.companyId && (
                <div className={styles.errorText}>
                  <AlertCircle size={12} />
                  {errors.companyId}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Customer Phone Number <span className={styles.required}>*</span>
              </label>
              <input
                type="tel"
                className={`${styles.input} ${errors.customerNumber ? styles.error : ''}`}
                placeholder="+1234567890"
                value={formData.customerNumber}
                onChange={(e) => handleInputChange('customerNumber', e.target.value)}
                disabled={loading}
              />
              {errors.customerNumber && (
                <div className={styles.errorText}>
                  <AlertCircle size={12} />
                  {errors.customerNumber}
                </div>
              )}
              <div className={styles.helpText}>
                Must be in E.164 format (country code + number)
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                SMS Agent ID <span className={styles.optional}>(optional)</span>
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={formData.agentId}
                onChange={(e) => handleInputChange('agentId', e.target.value)}
                disabled={loading}
              />
              <div className={styles.helpText}>
                Leave empty to use company&apos;s configured SMS agent
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Retell SMS Phone Number <span className={styles.optional}>(optional)</span>
              </label>
              <input
                type="tel"
                className={styles.input}
                placeholder="+1234567890"
                value={formData.retellNumber}
                onChange={(e) => handleInputChange('retellNumber', e.target.value)}
                disabled={loading}
              />
              <div className={styles.helpText}>
                Leave empty to use company&apos;s configured SMS phone number
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>
                Custom Message <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Enter a custom test message, or leave empty for default SMS conversation behavior..."
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                disabled={loading}
              />
              <div className={styles.helpText}>
                Custom message content for testing specific scenarios
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>
                Metadata <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                className={`${styles.textarea} ${errors.metadata ? styles.error : ''}`}
                placeholder='{"test": true, "source": "admin_test"}'
                value={formData.metadata}
                onChange={(e) => handleInputChange('metadata', e.target.value)}
                disabled={loading}
                rows={3}
              />
              {errors.metadata && (
                <div className={styles.errorText}>
                  <AlertCircle size={12} />
                  {errors.metadata}
                </div>
              )}
              <div className={styles.helpText}>
                Additional metadata in JSON format
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.testButton}
            onClick={executeTest}
            disabled={loading || companiesLoading || !formData.companyId || !formData.customerNumber}
          >
            {loading && <div className={styles.spinner}></div>}
            <Send size={16} />
            {loading ? 'Testing SMS...' : 'Send Test SMS'}
          </button>

          {testResult && (
            <div className={styles.results}>
              <h3>Test Results</h3>
              
              <div className={`${styles.resultCard} ${testResult.success ? styles.success : styles.error}`}>
                <div className={styles.resultHeader}>
                  {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{testResult.success ? 'Test Successful' : 'Test Failed'}</span>
                </div>
                
                <div className={styles.resultContent}>
                  {testResult.success ? (
                    <div>
                      <p>SMS test completed successfully for <strong>{getSelectedCompanyName()}</strong></p>
                      {testResult.result && (
                        <div className={styles.resultData}>
                          <strong>Response:</strong>
                          <pre>{JSON.stringify(testResult.result, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p><strong>Error:</strong> {testResult.error}</p>
                      <p>Please check your configuration and try again.</p>
                    </div>
                  )}
                  
                  <div className={styles.resultData}>
                    <strong>Timestamp:</strong> {new Date(testResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {testResult.success && testResult.result && (
                <div className={`${styles.resultCard} ${styles.info}`}>
                  <div className={styles.resultHeader}>
                    <Info size={16} />
                    <span>Next Steps</span>
                  </div>
                  <div className={styles.resultContent}>
                    <ul>
                      <li>SMS conversation has been initiated</li>
                      <li>Check SMS logs for delivery status</li>
                      <li>Test recipient should receive the SMS shortly</li>
                      <li>Webhook will handle incoming replies automatically</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}