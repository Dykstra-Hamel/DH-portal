'use client';

import { useState, useEffect } from 'react';
import { Phone, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Agent } from '@/types/agent';
import styles from './AdminManager.module.scss';

interface TestCallingProps {
  companyId: string;
}

interface CallResponse {
  success: boolean;
  message: string;
  callId?: string;
  callStatus?: string;
  error?: string;
}

export default function TestCalling({ companyId }: TestCallingProps) {
  // State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callResult, setCallResult] = useState<CallResponse | null>(null);

  // Load outbound calling agents when component mounts or companyId changes
  useEffect(() => {
    loadOutboundAgents();
  }, [companyId]);

  const loadOutboundAgents = async () => {
    if (!companyId) return;

    try {
      setAgentsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/companies/${companyId}/agents?agent_direction=outbound&agent_type=calling&is_active=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch outbound agents');
      }

      const agentsData = await response.json();
      setAgents(agentsData);

      // Auto-select first agent if available
      if (agentsData.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentsData[0].agent_id);
      }
    } catch (error) {
      console.error('Error loading outbound agents:', error);
      setError('Failed to load outbound calling agents');
    } finally {
      setAgentsLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone validation - supports various formats
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,20}$/;
    return phoneRegex.test(phone.trim());
  };

  const handleMakeCall = async () => {
    // Clear previous results
    setError(null);
    setCallResult(null);

    // Validation
    if (!selectedAgentId) {
      setError('Please select an outbound agent');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);

      // Prepare call data for the existing retell-call API
      const callData = {
        firstName: 'Test',
        lastName: 'Call',
        email: 'admin@test.com',
        phone: phoneNumber.trim(),
        message: 'Admin test call - verifying outbound agent configuration',
        companyId: companyId
      };

      const response = await fetch('/api/retell-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate call');
      }

      setCallResult({
        success: true,
        message: result.message || 'Call initiated successfully',
        callId: result.callId,
        callStatus: result.callStatus,
      });

      // Clear phone number for next test
      setPhoneNumber('');
    } catch (error) {
      console.error('Error making test call:', error);
      setCallResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate call',
        message: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    // Clear previous errors when user starts typing
    if (error) setError(null);
    if (callResult) setCallResult(null);
  };

  return (
    <div className={styles.testCallSection}>
      <div className={styles.header}>
        <h3>Test Outbound Calling</h3>
        <p>Test your outbound calling configuration by making a test call to any phone number.</p>
      </div>

      {/* Agent Selection */}
      <div className={styles.setting}>
        <div className={styles.settingInfo}>
          <label htmlFor="test-agent-select" className={styles.settingLabel}>
            Select Outbound Agent
          </label>
          <p className={styles.settingDescription}>
            Choose which outbound calling agent to use for the test call.
          </p>
        </div>
        <div className={styles.settingControl}>
          {agentsLoading ? (
            <div className={styles.loadingState}>
              <Loader size={16} className={styles.spinner} />
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className={styles.noAgents}>
              <AlertCircle size={16} />
              No outbound calling agents found. Please configure an outbound calling agent first.
            </div>
          ) : (
            <select
              id="test-agent-select"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className={styles.textInput}
              disabled={loading}
            >
              <option value="">-- Select Agent --</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.agent_id}>
                  {agent.agent_name} ({agent.agent_id})
                  {agent.phone_number ? ` - ${agent.phone_number}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Phone Number Input */}
      <div className={styles.setting}>
        <div className={styles.settingInfo}>
          <label htmlFor="test-phone-number" className={styles.settingLabel}>
            Phone Number
          </label>
          <p className={styles.settingDescription}>
            Enter the phone number to call for testing (e.g., +12074197718).
          </p>
        </div>
        <div className={styles.settingControl}>
          <input
            id="test-phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => handlePhoneNumberChange(e.target.value)}
            placeholder="+1234567890"
            className={styles.textInput}
            disabled={loading}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`${styles.message} ${styles.error}`}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Call Result Display */}
      {callResult && (
        <div className={`${styles.message} ${callResult.success ? styles.success : styles.error}`}>
          {callResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <div>
            <div className={styles.resultMessage}>
              {callResult.success ? callResult.message : callResult.error}
            </div>
            {callResult.success && callResult.callId && (
              <div className={styles.resultDetails}>
                <small>
                  Call ID: {callResult.callId}
                  {callResult.callStatus && ` | Status: ${callResult.callStatus}`}
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Make Call Button */}
      <div className={styles.actions}>
        <button
          onClick={handleMakeCall}
          disabled={loading || agents.length === 0 || !selectedAgentId || !phoneNumber.trim()}
          className={styles.testCallButton}
        >
          <Phone size={16} />
          {loading ? 'Making Call...' : 'Make Test Call'}
        </button>
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <h4>Test Call Information</h4>
        <ul>
          <li>Test calls use default customer information (Name: &quot;Test Call&quot;)</li>
          <li>The call will be tracked through your normal webhook system</li>
          <li>All call records and tickets will be created as usual</li>
          <li>This verifies your complete outbound calling setup</li>
        </ul>
      </div>
    </div>
  );
}