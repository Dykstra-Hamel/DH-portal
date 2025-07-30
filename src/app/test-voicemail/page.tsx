'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface TestFormData {
  customerPhone: string;
  customerName: string;
  pestType: string;
  urgency: string;
  address: string;
  audioFile: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  sessionId?: string;
  skipped?: boolean;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'success';
  message: string;
  details?: any;
}

interface AudioFile {
  id: string;
  name: string;
  duration?: string;
  created_date?: string;
  file_size?: string;
}

export default function TestVoicemailPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<TestFormData>({
    customerPhone: '',
    customerName: '',
    pestType: 'ants',
    urgency: 'medium',
    address: '',
    audioFile: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isLoadingAudioFiles, setIsLoadingAudioFiles] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const router = useRouter();

  // Add log entry
  const addLog = (level: 'info' | 'error' | 'success', message: string, details?: any) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  // Load available audio files
  const loadAudioFiles = async () => {
    setIsLoadingAudioFiles(true);
    addLog('info', 'Loading available audio files...');
    
    try {
      const response = await fetch('/api/slybroadcast/audio-files');
      const result = await response.json();
      
      if (result.success) {
        setAudioFiles(result.files || []);
        addLog('success', `Loaded ${result.count} audio files`, result.files);
      } else {
        addLog('error', `Failed to load audio files: ${result.error}`, result);
        setAudioFiles([]);
      }
    } catch (error) {
      addLog('error', 'Network error loading audio files', error);
      setAudioFiles([]);
    } finally {
      setIsLoadingAudioFiles(false);
    }
  };

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Check if user is admin (optional enhancement)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAuthenticated(true);
        addLog('success', 'Admin access confirmed');
      } else {
        // For now, allow any authenticated user for testing
        setIsAuthenticated(true);
        addLog('info', 'User authenticated for testing');
      }
      
      setIsLoading(false);
      
      // Don't auto-load audio files on page load (too many files)
      // User can click "Refresh Files" button when needed
    };

    checkAuth();
  }, [router]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate phone number
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerPhone || !formData.customerName) {
      addLog('error', 'Phone number and name are required');
      return;
    }

    if (!validatePhone(formData.customerPhone)) {
      addLog('error', 'Invalid phone number format (needs 10 digits)');
      return;
    }

    // Check client-side rate limiting (30 seconds)
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTime;
    const minInterval = 30000; // 30 seconds
    
    if (lastSubmitTime > 0 && timeSinceLastSubmit < minInterval) {
      const waitSeconds = Math.ceil((minInterval - timeSinceLastSubmit) / 1000);
      addLog('error', `Rate limit: Please wait ${waitSeconds} seconds before submitting again`);
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);
    addLog('info', 'Starting voicemail drop test...', formData);

    try {
      const requestPayload = {
        customerPhone: formData.customerPhone,
        customerName: formData.customerName,
        pestType: formData.pestType || undefined,
        urgency: formData.urgency || undefined,
        address: formData.address || undefined,
        audioFile: formData.audioFile || undefined,
        delayMinutes: 0, // No delay for testing
      };

      addLog('info', 'Sending request to API...', requestPayload);

      const response = await fetch('/api/slybroadcast/send-voicemail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const result: ApiResponse = await response.json();
      setLastResponse(result);

      if (response.ok) {
        if (result.success) {
          addLog('success', `Voicemail sent successfully! ${result.message}`, result);
        } else if (result.skipped) {
          addLog('info', 'Voicemail skipped (integration disabled)', result);
        } else {
          addLog('error', `API returned failure: ${result.error}`, result);
        }
      } else {
        addLog('error', `HTTP ${response.status}: ${result.error || 'Unknown error'}`, result);
      }

    } catch (error) {
      addLog('error', 'Network error occurred', error);
      console.error('Test voicemail error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    setLastResponse(null);
    addLog('info', 'Logs cleared');
  };

  // Copy logs to clipboard
  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.details ? '\n' + JSON.stringify(log.details, null, 2) : ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText);
    addLog('success', 'Logs copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Access denied. Please log in.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Slybroadcast Voicemail Test
          </h1>
          <p className="text-gray-600">
            Test the voicemail drop functionality directly without delays or other automations.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Test Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Form</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="5551234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">10 digits, no formatting needed</p>
              </div>

              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="pestType" className="block text-sm font-medium text-gray-700 mb-1">
                  Pest Type
                </label>
                <select
                  id="pestType"
                  name="pestType"
                  value={formData.pestType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ants">Ants</option>
                  <option value="cockroaches">Cockroaches</option>
                  <option value="spiders">Spiders</option>
                  <option value="termites">Termites</option>
                  <option value="rodents">Rodents</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State 12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="audioFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Audio File
                </label>
                <div className="space-y-2">
                  <select
                    id="audioFile"
                    name="audioFile"
                    value={formData.audioFile}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoadingAudioFiles}
                  >
                    <option value="">Use default audio file</option>
                    {audioFiles.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.name} ({file.id})
                        {file.duration && ` - ${file.duration}`}
                      </option>
                    ))}
                  </select>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={loadAudioFiles}
                      disabled={isLoadingAudioFiles}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      {isLoadingAudioFiles ? 'Loading...' : 'Refresh Files'}
                    </button>
                    <span className="text-xs text-gray-500 py-1">
                      {audioFiles.length > 0 
                        ? `${audioFiles.length} files available` 
                        : 'No files loaded'
                      }
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select from your Slybroadcast account or leave empty for default
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending Voicemail...' : 'Send Test Voicemail'}
              </button>
            </form>

            {lastResponse && (
              <div className={`mt-4 p-4 rounded-md ${
                lastResponse.success 
                  ? 'bg-green-50 border border-green-200' 
                  : lastResponse.skipped
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className="font-medium mb-2">Last Response:</h3>
                <pre className="text-sm bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Audio Files Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Available Audio Files</h2>
              <button
                onClick={loadAudioFiles}
                disabled={isLoadingAudioFiles}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-500"
              >
                {isLoadingAudioFiles ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="bg-gray-50 rounded border p-4 h-96 overflow-auto">
              {isLoadingAudioFiles ? (
                <div className="text-gray-500 italic">Loading audio files...</div>
              ) : audioFiles.length === 0 ? (
                <div className="text-gray-500 italic">
                  No audio files loaded. Click refresh to try again.
                </div>
              ) : (
                <div className="space-y-2">
                  {audioFiles.map((file, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-sm text-gray-600">ID: {file.id}</div>
                      {file.duration && (
                        <div className="text-sm text-gray-600">Duration: {file.duration}</div>
                      )}
                      {file.created_date && (
                        <div className="text-sm text-gray-600">Created: {file.created_date}</div>
                      )}
                      {file.file_size && (
                        <div className="text-sm text-gray-600">Size: {file.file_size}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logs Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Debug Logs</h2>
              <div className="space-x-2">
                <button
                  onClick={copyLogs}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Copy
                </button>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded border p-4 h-96 overflow-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">No logs yet. Submit the form to see debug information.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`mb-2 ${
                    log.level === 'error' ? 'text-red-600' :
                    log.level === 'success' ? 'text-green-600' :
                    'text-gray-800'
                  }`}>
                    <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                    <span className="font-semibold">{log.level.toUpperCase()}:</span>{' '}
                    {log.message}
                    {log.details && (
                      <pre className="mt-1 ml-4 text-xs bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}