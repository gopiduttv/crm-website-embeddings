/**
 * Widget-specific configuration interfaces
 */
export interface ChatWidgetConfig {
  enabled: boolean;
  position?: 'bottom-right' | 'bottom-left';
  color?: string;
  greeting?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackPageViews?: boolean;
  trackClicks?: boolean;
}

export interface BatchCaptureConfig {
  enabled: boolean;                    // Enable batch capture mode
  debounceMs?: number;                 // Wait time after last field blur (default: 5000)
  captureOnVisibilityChange?: boolean; // Capture when tab hidden (default: true)
  captureOnBeforeUnload?: boolean;     // Capture on page close (default: true)
  minFieldsForCapture?: number;        // Min fields before sending (default: 1)
}

export interface FormsConfig {
  enabled: boolean;
  autoCapture?: boolean;
  captureSelector?: string;
  excludeFields?: string[];
  
  // Field interaction tracking for partial leads
  trackInteractions?: boolean;
  trackFields?: string[];  // e.g., ['email', 'phone', 'name', 'company']
  
  // Event triggers configuration
  triggers?: {
    blur?: boolean;           // Primary trigger (field completed)
    beforeunload?: boolean;   // Critical trigger (tab close)
    change?: boolean;         // For select/checkbox/radio
    visibilitychange?: boolean; // Optional (tab hidden)
  };
  
  // Batch capture configuration (NEW)
  batchCapture?: BatchCaptureConfig;
  
  // Performance settings
  debounceMs?: number;      // Debounce for visibilitychange
  batchSize?: number;       // Number of events to batch before sending
  flushInterval?: number;   // Auto-flush interval in milliseconds
}

/**
 * Complete client configuration
 * This represents the configuration stored for each client
 */
export interface ClientConfig {
  clientId: string;
  domain: string;
  isActive: boolean;
  apiKey: string;
  widgets: {
    chat?: ChatWidgetConfig;
    analytics?: AnalyticsConfig;
    forms?: FormsConfig;
  };
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  cdnUrl: string;
  appVersion: string;
  apiUrl: string;
  debugMode?: boolean;
}
