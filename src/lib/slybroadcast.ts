import { normalizePhoneNumber } from './utils';

// Slybroadcast API types
export interface SlybroadcastConfig {
  username: string;
  password: string;
  defaultAudioFile?: string;
  enabled: boolean;
}

export interface VoicemailDropRequest {
  customerPhone: string;
  customerName: string;
  pestType?: string;
  urgency?: string;
  address?: string;
  audioFile?: string;
  scheduleDate?: Date;
  requestId?: string; // Unique identifier to prevent duplicates
}

export interface SlybroadcastApiRequest {
  c_uid: string;
  c_password: string;
  c_phone: string;
  c_record_audio?: string;
  c_url?: string;
  c_date?: string;
  c_comments?: string; // For unique identifier to prevent duplicates
}

export interface SlybroadcastApiResponse {
  success: boolean;
  session_id?: string;
  message?: string;
  error?: string;
  status_code?: number;
}

export interface AudioFile {
  id: string;
  name: string;
  duration?: string;
  created_date?: string;
  file_size?: string;
}

export interface AudioFileListResponse {
  success: boolean;
  files?: AudioFile[];
  error?: string;
  raw_response?: string;
}

// Get Slybroadcast configuration from environment variables
export function getSlybroadcastConfig(): SlybroadcastConfig {
  const config = {
    username: process.env.SLYBROADCAST_USERNAME || '',
    password: process.env.SLYBROADCAST_PASSWORD || '',
    defaultAudioFile: process.env.SLYBROADCAST_DEFAULT_AUDIO_FILE || '',
    enabled: process.env.SLYBROADCAST_ENABLED === 'true',
  };
  
  // Debug log configuration (without exposing password)
  console.log('🔧 Slybroadcast environment config loaded:', {
    username: config.username ? `"${config.username}" (${config.username.length} chars)` : 'NOT SET',
    password: config.password ? `[SET] (${config.password.length} chars)` : 'NOT SET',
    defaultAudioFile: config.defaultAudioFile ? `"${config.defaultAudioFile}"` : 'NOT SET',
    enabled: config.enabled,
    env_vars_present: {
      SLYBROADCAST_USERNAME: !!process.env.SLYBROADCAST_USERNAME,
      SLYBROADCAST_PASSWORD: !!process.env.SLYBROADCAST_PASSWORD,
      SLYBROADCAST_DEFAULT_AUDIO_FILE: !!process.env.SLYBROADCAST_DEFAULT_AUDIO_FILE,
      SLYBROADCAST_ENABLED: process.env.SLYBROADCAST_ENABLED,
    }
  });
  
  return config;
}

// Validate phone number for Slybroadcast (US format)
export function validatePhoneForVoicemail(phone: string): boolean {
  if (!phone) return false;
  
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return false;
  
  // Check if it's a valid US phone number (10 digits)
  const digits = normalized.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

// Format phone number for Slybroadcast API (10 digits, no formatting)
export function formatPhoneForSlybroadcast(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return '';
  
  const digits = normalized.replace(/\D/g, '');
  
  // Remove leading 1 if present (Slybroadcast expects 10 digits)
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  
  return digits.length === 10 ? digits : '';
}

// Rate limiting tracker
const lastCallTimestamps = new Map<string, number>();
const MIN_CALL_INTERVAL_MS = 30000; // 30 seconds between calls to same number

// Generate unique request ID
function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `req_${timestamp}_${random}`;
}

// Format date for Slybroadcast API (Eastern Time, YYYY-MM-DD HH:MM:SS)
function formatDateForSlybroadcast(date: Date): string {
  // Convert to Eastern Time using Intl.DateTimeFormat
  const easternFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit', 
    second: '2-digit',
    hour12: false // 24-hour format required by Slybroadcast
  });
  
  const parts = easternFormatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;
  
  // Format as YYYY-MM-DD HH:MM:SS (Slybroadcast requirement)
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// Send voicemail drop via Slybroadcast API
export async function sendVoicemailDrop(
  request: VoicemailDropRequest
): Promise<SlybroadcastApiResponse> {
  const config = getSlybroadcastConfig();
  
  // Check if Slybroadcast is enabled
  if (!config.enabled) {
    return {
      success: false,
      error: 'Slybroadcast integration is disabled',
    };
  }
  
  // Validate configuration
  if (!config.username || !config.password) {
    return {
      success: false,
      error: 'Slybroadcast credentials not configured',
    };
  }
  
  // Validate and format phone number
  if (!validatePhoneForVoicemail(request.customerPhone)) {
    return {
      success: false,
      error: 'Invalid phone number for voicemail drop',
    };
  }
  
  const formattedPhone = formatPhoneForSlybroadcast(request.customerPhone);
  if (!formattedPhone) {
    return {
      success: false,
      error: 'Could not format phone number for Slybroadcast',
    };
  }

  // Check rate limiting - prevent duplicate calls to same number too quickly
  const lastCallTime = lastCallTimestamps.get(formattedPhone);
  const now = Date.now();
  if (lastCallTime && (now - lastCallTime) < MIN_CALL_INTERVAL_MS) {
    const waitSeconds = Math.ceil((MIN_CALL_INTERVAL_MS - (now - lastCallTime)) / 1000);
    return {
      success: false,
      error: `Rate limit: Please wait ${waitSeconds} seconds before calling this number again`,
    };
  }

  // Update last call timestamp
  lastCallTimestamps.set(formattedPhone, now);
  
  // Determine audio file to use
  const audioFile = request.audioFile || config.defaultAudioFile;
  if (!audioFile) {
    return {
      success: false,
      error: 'No audio file specified for voicemail drop',
    };
  }
  
  // Determine the date to send (always required by Slybroadcast)
  const sendDate = request.scheduleDate || new Date();
  
  // Convert to Eastern Time (Slybroadcast requirement)
  // Slybroadcast documentation: "All campaigns are sent out in Eastern Time"
  const easternTimeString = formatDateForSlybroadcast(sendDate);
  
  console.log('🕐 Date conversion debug:', {
    originalDate: sendDate.toISOString(),
    easternTime: easternTimeString,
    localTime: sendDate.toLocaleString(),
    isImmediate: !request.scheduleDate
  });

  // Generate unique request ID to prevent duplicates
  const requestId = request.requestId || generateRequestId();
  
  // Create unique comment with request details to prevent duplicates
  let uniqueComment = `${request.customerName} - ${requestId}`;
  if (request.pestType) {
    uniqueComment += ` - ${request.pestType}`;
  }

  // Prepare API request data
  const apiRequest: SlybroadcastApiRequest = {
    c_uid: config.username,
    c_password: config.password,
    c_phone: formattedPhone,
    c_record_audio: audioFile,
    c_date: easternTimeString, // Eastern Time format required by Slybroadcast
    c_comments: uniqueComment, // Unique identifier to prevent duplicates
  };
  
  try {
    // Create FormData for the POST request
    const formData = new FormData();
    Object.entries(apiRequest).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });
    
    console.log('🌐 Slybroadcast API request details:', {
      url: 'https://www.mobile-sphere.com/gateway/vmb.php',
      method: 'POST',
      parameters: {
        ...apiRequest,
        c_password: apiRequest.c_password ? `[HIDDEN - ${apiRequest.c_password.length} chars]` : 'NOT SET'
      },
      scheduledFor: request.scheduleDate ? 'delayed' : 'immediate',
      formattedDate: easternTimeString,
      credential_debug: {
        username_length: apiRequest.c_uid.length,
        password_length: apiRequest.c_password.length,
        username_starts_with: apiRequest.c_uid.substring(0, 3) + '...',
        username_contains_spaces: apiRequest.c_uid.includes(' '),
        password_contains_spaces: apiRequest.c_password.includes(' ')
      }
    });
    
    // Make request to Slybroadcast API
    const requestStart = Date.now();
    const response = await fetch('https://www.mobile-sphere.com/gateway/vmb.php', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header, let the browser set it for FormData
      },
    });
    const requestDuration = Date.now() - requestStart;
    
    console.log(`🔗 Slybroadcast HTTP response (${requestDuration}ms):`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const errorMessage = `Slybroadcast API returned ${response.status}: ${response.statusText}`;
      console.error('❌ Slybroadcast HTTP error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        status_code: response.status,
      };
    }
    
    // Parse response (Slybroadcast may return various formats)
    const responseText = await response.text();
    console.log('📄 Slybroadcast raw response:', responseText);
    
    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('📊 Slybroadcast parsed JSON:', jsonResponse);
      
      return {
        success: true,
        session_id: jsonResponse.session_id,
        message: jsonResponse.message || 'Voicemail drop queued successfully',
        ...jsonResponse,
      };
    } catch (parseError) {
      console.log('📝 Response is not JSON, checking for success indicators...');
      
      // Check for specific error types first
      const lowerResponse = responseText.toLowerCase();
      
      if (lowerResponse.includes('duplicates request') || lowerResponse.includes('duplicate')) {
        console.error('❌ Duplicate request detected');
        return {
          success: false,
          error: 'Duplicate request: This phone number was called too recently. Please wait before trying again.',
        };
      }
      
      // Check for success indicators - Slybroadcast returns "OK" for success
      if (lowerResponse.includes('success') || 
          lowerResponse.includes('queued') || 
          lowerResponse.includes('ok\n') ||
          lowerResponse.startsWith('ok\n') ||
          responseText.trim().toLowerCase().startsWith('ok')) {
        
        console.log('✅ Found success indicator in text response');
        
        // Extract session_id if present
        const sessionMatch = responseText.match(/session_id=(\w+)/);
        const sessionId = sessionMatch ? sessionMatch[1] : undefined;
        
        return {
          success: true,
          message: 'Voicemail drop queued successfully',
          session_id: sessionId,
        };
      } else {
        console.error('❌ No success indicators found in text response');
        return {
          success: false,
          error: `Unexpected response from Slybroadcast: ${responseText}`,
        };
      }
    }
  } catch (error) {
    console.error('💥 Network error sending voicemail drop:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown network error occurred',
    };
  }
}

// Create a personalized voicemail drop request from lead data
export function createVoicemailRequest(leadData: {
  customerPhone: string;
  customerName: string;
  pestType?: string;
  urgency?: string;
  address?: string;
  audioFile?: string;
  delayMinutes?: number;
}): VoicemailDropRequest {
  const request: VoicemailDropRequest = {
    customerPhone: leadData.customerPhone,
    customerName: leadData.customerName,
    pestType: leadData.pestType,
    urgency: leadData.urgency,
    address: leadData.address,
    audioFile: leadData.audioFile,
  };
  
  // Add scheduling if delay is specified
  if (leadData.delayMinutes && leadData.delayMinutes > 0) {
    const scheduleDate = new Date();
    scheduleDate.setMinutes(scheduleDate.getMinutes() + leadData.delayMinutes);
    request.scheduleDate = scheduleDate;
  }
  
  return request;
}

// Get list of available audio files from Slybroadcast account
export async function getAudioFileList(): Promise<AudioFileListResponse> {
  const config = getSlybroadcastConfig();
  
  // Check if Slybroadcast is enabled and configured
  if (!config.enabled) {
    return {
      success: false,
      error: 'Slybroadcast integration is disabled',
    };
  }
  
  if (!config.username || !config.password) {
    return {
      success: false,
      error: 'Slybroadcast credentials not configured',
    };
  }

  try {
    console.log('🎵 Fetching Slybroadcast audio file list...');
    
    // Use the correct c_method from Slybroadcast documentation
    const methodsToTry = [
      'get_audio_list'  // Correct method from documentation
    ];
    
    let successfulResponse = null;
    
    for (const method of methodsToTry) {
      console.log(`🔄 Trying c_method: "${method}"`);
      
      const formData = new FormData();
      formData.append('c_uid', config.username);
      formData.append('c_password', config.password);
      formData.append('c_method', method);
    
      console.log('🌐 Audio file list request:', {
        url: 'https://www.mobile-sphere.com/gateway/vmb.aflist.php',
        method: 'POST',
        parameters: {
          c_uid: config.username ? `"${config.username}"` : 'NOT SET',
          c_password: '[HIDDEN]',
          c_method: method
        }
      });
      
      // Make request to Slybroadcast audio file list API
      const requestStart = Date.now();
      const response = await fetch('https://www.mobile-sphere.com/gateway/vmb.aflist.php', {
        method: 'POST',
        body: formData,
      });
      const requestDuration = Date.now() - requestStart;
      
      const responseText = await response.text();
      console.log(`📄 Response for method "${method}" (${requestDuration}ms):`, responseText);
      
      // Check if this method worked (not an error response)
      if (response.ok && 
          !responseText.toLowerCase().includes('error') && 
          !responseText.toLowerCase().includes('required') &&
          !responseText.toLowerCase().includes('method not allowed')) {
        console.log(`✅ Success with method: "${method}"`);
        successfulResponse = { response, responseText, requestDuration };
        break;
      } else {
        console.log(`❌ Method "${method}" failed:`, responseText);
      }
    }
    
    // Use successful response or the last attempted response
    let response, responseText, requestDuration;
    if (successfulResponse) {
      ({ response, responseText, requestDuration } = successfulResponse);
    } else {
      // If all methods failed, return the last error
      console.error('💥 All c_method values failed, using last response');
      // For now, just try the first method one more time to get a proper response object
      const formData = new FormData();
      formData.append('c_uid', config.username);
      formData.append('c_password', config.password);
      formData.append('c_method', methodsToTry[0]);
      
      const requestStart = Date.now();
      response = await fetch('https://www.mobile-sphere.com/gateway/vmb.aflist.php', {
        method: 'POST',
        body: formData,
      });
      requestDuration = Date.now() - requestStart;
      responseText = await response.text();
    }
    
    console.log(`🔗 Audio file list HTTP response (${requestDuration}ms):`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
    
    if (!response.ok) {
      const errorMessage = `Audio file list API returned ${response.status}: ${response.statusText}`;
      console.error('❌ Audio file list HTTP error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
    
    // responseText already obtained above
    console.log('📄 Final audio file list raw response:', responseText);
    
    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('📊 Audio file list parsed JSON:', jsonResponse);
      
      // Extract audio files from response (format may vary)
      const files: AudioFile[] = [];
      if (jsonResponse.files && Array.isArray(jsonResponse.files)) {
        files.push(...jsonResponse.files);
      } else if (Array.isArray(jsonResponse)) {
        files.push(...jsonResponse);
      }
      
      return {
        success: true,
        files,
        raw_response: responseText,
      };
    } catch (parseError) {
      console.log('📝 Audio file list response is not JSON, parsing as text...');
      
      // Parse text response - Slybroadcast returns pipe-delimited format
      const files: AudioFile[] = [];
      const lines = responseText.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        // Skip error lines
        if (line.toLowerCase().includes('error')) {
          continue;
        }
        
        // Slybroadcast returns pipe-delimited format: "filename"|"display_name"|"date"
        const parts = line.split('|');
        if (parts.length >= 1) {
          // Remove quotes from each part
          const filename = parts[0]?.replace(/"/g, '').trim();
          const displayName = parts[1]?.replace(/"/g, '').trim();
          const createdDate = parts[2]?.replace(/"/g, '').trim();
          
          if (filename) {
            files.push({
              id: filename, // Use the actual filename as ID for API calls
              name: displayName || filename, // Use display name if available
              created_date: createdDate,
            });
          }
        }
      }
      
      return {
        success: true,
        files,
        raw_response: responseText,
      };
    }
  } catch (error) {
    console.error('💥 Network error fetching audio file list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown network error occurred',
    };
  }
}

// Log voicemail drop attempt for debugging
export function logVoicemailAttempt(
  request: VoicemailDropRequest,
  response: SlybroadcastApiResponse,
  leadId?: string
) {
  const logData = {
    timestamp: new Date().toISOString(),
    leadId,
    customerPhone: request.customerPhone.replace(/\d(?=\d{4})/g, '*'), // Mask phone for privacy
    customerName: request.customerName,
    pestType: request.pestType,
    success: response.success,
    sessionId: response.session_id,
    error: response.error,
  };
  
  if (response.success) {
    console.log('Voicemail drop sent successfully:', logData);
  } else {
    console.error('Voicemail drop failed:', logData);
  }
}