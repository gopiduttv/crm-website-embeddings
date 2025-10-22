/**
 * YourCRM Main Application
 * This script is loaded by the bootloader and provides full tracking functionality
 */
/**
 * YourCRM Tracking Script (Production)
 * Lightweight bootloader that fetches configuration and loads the appropriate tracking code
 */
(function() {
  'use strict';

  console.log('[YourCRM] Initializing tracker...');

  // Get the queue that was set up by the embed script
  const queue = window.YourCRM.q || [];
  let apiKey = null;
  let apiUrl = null;

  // Find the init command in the queue
  queue.forEach(args => {
    if (args[0] === 'init') {
      apiKey = args[1].apiKey;
      apiUrl = args[1].apiUrl || 'http://localhost:5000';
    }
  });

  if (!apiKey) {
    console.error('[YourCRM] No API key provided. Call YourCRM("init", { apiKey: "..." }) first.');
    return;
  }

  console.log('[YourCRM] Fetching configuration for API key:', apiKey);

  // Fetch client configuration from backend
  fetch(apiUrl + '/v1/config/' + apiKey)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch configuration: ' + response.statusText);
      }
      return response.json();
    })
    .then(config => {
      console.log('[YourCRM] Configuration loaded:', config);
      
      // Store config globally
      window.YourCRM.config = config;
      
      // Initialize tracking based on config
      initializeTracking(config, apiKey, apiUrl);
    })
    .catch(err => {
      console.error('[YourCRM] Failed to load configuration:', err);
    });

  /**
   * Initialize tracking with the fetched configuration
   */
  function initializeTracking(config, apiKey, apiUrl) {
    console.log('[YourCRM] Initializing tracking with config');

    // Track pageview automatically if analytics enabled
    if (config.widgets?.analytics?.enabled && config.widgets?.analytics?.trackPageViews) {
      const pageUrl = window.location.href;
      const isValidUrl = pageUrl.startsWith('http://') || pageUrl.startsWith('https://');
      
      sendEvent({
        id: generateUUID(),
        apiKey: apiKey,
        type: 'pageview',
        page: {
          url: isValidUrl ? pageUrl : 'https://unknown.local' + window.location.pathname,
          path: window.location.pathname,
          title: document.title || 'Untitled',
          referrer: document.referrer || undefined
        },
        userAgent: navigator.userAgent
      }, apiUrl);
    }

    // Initialize form tracking if enabled
    if (config.widgets?.forms?.enabled) {
      console.log('[YourCRM] Form tracking is ENABLED');
      initFormTracking(config.widgets.forms, apiKey, apiUrl);
    } else {
      console.log('[YourCRM] Form tracking is DISABLED by configuration');
    }

    // Initialize chat widget if enabled
    if (config.widgets?.chat?.enabled) {
      console.log('[YourCRM] Chat widget is ENABLED');
      initChatWidget(config.widgets.chat);
    } else {
      console.log('[YourCRM] Chat widget is DISABLED by configuration');
    }

    // Replace queue function with real API
    window.YourCRM = function(command, data) {
      if (command === 'trackForm') {
        if (!config.widgets?.forms?.enabled) {
          console.warn('[YourCRM] Form tracking is disabled - event not sent');
          return;
        }
        trackFormSubmission(data, apiKey, apiUrl);
      } else if (command === 'identify') {
        identifyUser(data, apiKey, apiUrl);
      } else if (command === 'track') {
        trackCustomEvent(data, apiKey, apiUrl);
      }
    };

    // Preserve config on the function
    window.YourCRM.config = config;

    // Process any queued commands
    queue.forEach(args => {
      if (args[0] !== 'init') {
        window.YourCRM.apply(null, args);
      }
    });
  }

  /**
   * Initialize form tracking
   */
  function initFormTracking(formConfig, apiKey, apiUrl) {
    const autoCapture = formConfig.autoCapture !== false;
    const selector = formConfig.captureSelector || 'form';
    const excludeFields = formConfig.excludeFields || ['password', 'credit_card', 'ssn', 'cvv'];

    console.log('[YourCRM] Form tracking initialized', {
      autoCapture,
      selector,
      excludeFields
    });

    if (autoCapture) {
      document.addEventListener('submit', function(event) {
        const form = event.target;
        if (form.matches(selector)) {
          captureFormSubmission(form, excludeFields, apiKey, apiUrl);
        }
      }, true);

      console.log('[YourCRM] Auto-capture enabled for forms matching:', selector);
    }
  }

  /**
   * Capture form submission data
   */
  function captureFormSubmission(form, excludeFields, apiKey, apiUrl) {
    const formData = new FormData(form);
    const fields = {};
    const formId = form.id || form.name || generateFormId(form);
    const formName = form.getAttribute('data-form-name') || form.name || form.id || 'Unnamed Form';

    // Extract form fields
    for (let [key, value] of formData.entries()) {
      // Skip excluded fields
      if (excludeFields.some(excluded => key.toLowerCase().includes(excluded.toLowerCase()))) {
        fields[key] = '[REDACTED]';
        continue;
      }

      // Handle file inputs
      if (value instanceof File) {
        fields[key] = {
          type: 'file',
          name: value.name,
          size: value.size,
          mimeType: value.type
        };
      } else {
        fields[key] = value;
      }
    }

    console.log('[YourCRM] Form captured:', formName, fields);

    trackFormSubmission({
      formId,
      formName,
      fields
    }, apiKey, apiUrl);
  }

  /**
   * Track form submission
   */
  function trackFormSubmission(formData, apiKey, apiUrl) {
    const formName = (formData.formName && String(formData.formName).trim()) || 'Unnamed Form';
    const pageUrl = window.location.href;
    const isValidUrl = pageUrl.startsWith('http://') || pageUrl.startsWith('https://');
    
    sendEvent({
      id: generateUUID(),
      apiKey: apiKey,
      type: 'form_submission',
      form: {
        formId: formData.formId,
        formName: formName,
        fields: formData.fields,
        submittedAt: new Date().toISOString()
      },
      page: {
        url: isValidUrl ? pageUrl : 'https://unknown.local' + window.location.pathname,
        path: window.location.pathname,
        title: document.title || 'Untitled'
      },
      userAgent: navigator.userAgent
    }, apiUrl);
  }

  /**
   * Send event to backend
   */
  function sendEvent(eventData, apiUrl) {
    console.log('[YourCRM] Sending event:', eventData.type, eventData);
    
    fetch(apiUrl + '/v1/track/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [eventData] }),
      keepalive: true
    })
    .then(response => {
      if (response.ok) {
        console.log('[YourCRM] Event tracked successfully:', eventData.type);
      } else {
        return response.json().then(err => {
          console.error('[YourCRM] Tracking failed:', response.status, err);
        }).catch(() => {
          console.error('[YourCRM] Tracking failed:', response.status, response.statusText);
        });
      }
    })
    .catch(err => console.error('[YourCRM] Tracking error:', err));
  }

  /**
   * Generate UUID v4
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate form ID from form attributes
   */
  function generateFormId(form) {
    const action = form.action || '';
    const method = form.method || 'get';
    return 'form_' + btoa(action + method).substring(0, 10);
  }

  /**
   * Initialize chat widget
   */
  function initChatWidget(chatConfig) {
    console.log('[YourCRM] Chat widget initialized', chatConfig);
    
    // Create chat UI based on chatConfig
    const chatContainer = document.createElement('div');
    chatContainer.id = 'yourcrm-chat-widget';
    chatContainer.style.cssText = `
      position: fixed;
      ${chatConfig.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${chatConfig.color || '#0066cc'};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
    `;
    
    chatContainer.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    
    chatContainer.addEventListener('click', function() {
      alert(chatConfig.greeting || 'Hi! How can we help you today?');
    });
    
    document.body.appendChild(chatContainer);
  }

  /**
   * Identify user
   */
  function identifyUser(userData, apiKey, apiUrl) {
    sendEvent({
      id: generateUUID(),
      apiKey: apiKey,
      type: 'identify',
      traits: userData,
      userAgent: navigator.userAgent
    }, apiUrl);
  }

  /**
   * Track custom event
   */
  function trackCustomEvent(eventData, apiKey, apiUrl) {
    sendEvent({
      id: generateUUID(),
      apiKey: apiKey,
      type: 'custom',
      name: eventData.name,
      properties: eventData.properties,
      page: {
        url: window.location.href,
        path: window.location.pathname
      },
      userAgent: navigator.userAgent
    }, apiUrl);
  }

  console.log('[YourCRM] Tracker initialized successfully');
})();
