/**
 * YourCRM Main Application
 * This script is loaded by the bootloader and provides full tracking functionality
 * The bootloader has already injected the configuration via YourCRM('init', config)
 */
(function() {
  'use strict';

  console.log('[YourCRM] Main application loaded');

  // Get the queue that was set up by the bootloader
  const queue = window.YourCRM.q || [];
  let config = null;
  let apiKey = null;
  let apiUrl = null;

  // Find the init command in the queue (pre-loaded by bootloader)
  queue.forEach(args => {
    if (args[0] === 'init') {
      config = args[1];
      apiKey = config.apiKey;
      apiUrl = config.apiUrl || 'http://localhost:5000';
    }
  });

  if (!config || !apiKey) {
    console.error('[YourCRM] No configuration provided. The bootloader should have called YourCRM("init", {...}) with embedded config.');
    return;
  }

  console.log('[YourCRM] Configuration loaded from bootloader:', config);

  // Store config globally
  window.YourCRM.config = config;

  // Initialize tracking immediately (no API call needed!)
  initializeTracking(config, apiKey, apiUrl);

  /**
   * Initialize tracking with the fetched configuration
   */
  function initializeTracking(config, apiKey, apiUrl) {
    console.log('[YourCRM] Initializing tracking with config');

    // Track pageview automatically if analytics enabled
    if (config.widgets?.analytics?.enabled && config.widgets?.analytics?.trackPageViews) {
      sendEvent({
        apiKey: apiKey,
        type: 'pageview',
        page: {
          path: window.location.pathname,
          title: document.title || 'Untitled',
          search: window.location.search,
          hash: window.location.hash,
          referrer: document.referrer || undefined
        }
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
    console.log('[YourCRM] 🔍 initFormTracking called with formConfig:', formConfig);
    
    const autoCapture = formConfig.autoCapture !== false;
    const selector = formConfig.captureSelector || 'form';
    const excludeFields = formConfig.excludeFields || ['password', 'credit_card', 'ssn', 'cvv'];
    const trackFields = formConfig.trackFields || ['email', 'phone', 'name', 'first_name', 'last_name', 'company', 'organization'];
    const triggers = formConfig.triggers || { blur: true, beforeunload: true, change: true };
    const trackInteractions = formConfig.trackInteractions !== false;
    const batchCapture = formConfig.batchCapture || { enabled: false };

    console.log('[YourCRM] 🔍 batchCapture extracted:', batchCapture);
    console.log('[YourCRM] 🔍 batchCapture.enabled:', batchCapture.enabled);
    
    console.log('[YourCRM] Form tracking initialized', {
      autoCapture,
      selector,
      excludeFields,
      trackFields,
      triggers,
      trackInteractions,
      batchCapture
    });

    if (autoCapture) {
      // 1. Track form submissions
      document.addEventListener('submit', function(event) {
        const form = event.target;
        if (form.matches(selector)) {
          captureFormSubmission(form, excludeFields, apiKey, apiUrl);
        }
      }, true);

      console.log('[YourCRM] Form submission tracking enabled');
    }

    if (trackInteractions) {
      // Check if batch capture is enabled
      if (batchCapture.enabled) {
        console.log('[YourCRM] 🔥 Batch capture mode enabled');
        trackFormFieldInteractionsBatched(selector, trackFields, excludeFields, triggers, batchCapture, apiKey, apiUrl);
      } else {
        // Legacy: Track field interactions one at a time
        console.log('[YourCRM] Field-by-field tracking mode (legacy)');
        trackFormFieldInteractions(selector, trackFields, excludeFields, triggers, apiKey, apiUrl);
        
        // Track abandoned fields on beforeunload
        if (triggers.beforeunload) {
          window.addEventListener('beforeunload', function() {
            captureAbandonedFields(selector, trackFields, excludeFields, apiKey, apiUrl);
          });
          console.log('[YourCRM] beforeunload tracking enabled');
        }
      }
    }
  }

  /**
   * Batch capture: Track all fields together and send as one event
   */
  function trackFormFieldInteractionsBatched(formSelector, trackFields, excludeFields, triggers, batchConfig, apiKey, apiUrl) {
    // State tracker for all forms
    const formStateTracker = new Map(); // formId → { fields, lastActivity, lastSent, form }
    const debounceTimers = new Map();   // formId → timerId
    
    const debounceMs = batchConfig.debounceMs || 5000;
    const minFields = batchConfig.minFieldsForCapture || 1;
    
    console.log('[YourCRM] Batch capture config:', { debounceMs, minFields });
    
    /**
     * Send batched form data for a specific form
     */
    function sendBatchedFormData(formId) {
      const state = formStateTracker.get(formId);
      if (!state || Object.keys(state.fields).length < minFields) {
        console.log('[YourCRM] Not enough fields to send for:', formId);
        return;
      }
      
      // Check if already sent recently
      if (state.lastSent && (Date.now() - state.lastSent) < 1000) {
        console.log('[YourCRM] Already sent recently, skipping:', formId);
        return;
      }
      
      console.log('[YourCRM] 📦 Sending batched form data:', formId, state.fields);
      
      const fieldCount = Object.keys(state.fields).length;
      const formProgress = state.form ? calculateFormProgress(state.form) : null;
      
      sendEvent({
        apiKey: apiKey,
        type: 'form_interaction',
        form: {
          formId: formId,
          trigger: 'batch_capture',
          fields: state.fields,          // ALL fields at once!
          fieldCount: fieldCount,
          formProgress: formProgress
        },
        page: {
          path: window.location.pathname,
          title: document.title || 'Untitled',
          search: window.location.search,
          hash: window.location.hash
        }
      }, apiUrl);
      
      // Mark as sent
      state.lastSent = Date.now();
    }
    
    /**
     * Reset debounce timer for a form
     */
    function resetDebounceTimer(formId) {
      // Clear existing timer
      if (debounceTimers.has(formId)) {
        clearTimeout(debounceTimers.get(formId));
      }
      
      // Set new timer
      const timer = setTimeout(function() {
        console.log('[YourCRM] ⏰ Debounce timer fired for:', formId);
        sendBatchedFormData(formId);
      }, debounceMs);
      
      debounceTimers.set(formId, timer);
      console.log('[YourCRM] ⏲️  Debounce timer reset for:', formId, '(' + debounceMs + 'ms)');
    }
    
    /**
     * Track a field value in memory (don't send immediately)
     */
    function trackFieldInMemory(formId, form, fieldName, fieldValue) {
      console.log('[YourCRM] 💾 Tracking field in memory:', formId, fieldName);
      
      if (!formStateTracker.has(formId)) {
        formStateTracker.set(formId, { 
          fields: {}, 
          lastActivity: Date.now(),
          lastSent: null,
          form: form
        });
      }
      
      const state = formStateTracker.get(formId);
      state.fields[fieldName] = fieldValue;
      state.lastActivity = Date.now();
      
      console.log('[YourCRM] Current fields for', formId + ':', Object.keys(state.fields));
      
      // Reset debounce timer
      resetDebounceTimer(formId);
    }
    
    /**
     * Attach listeners to forms
     */
    function attachBatchListeners() {
      const forms = document.querySelectorAll(formSelector);
      console.log('[YourCRM] Attaching batch listeners to', forms.length, 'forms');
      
      forms.forEach(function(form) {
        const formId = form.id || form.name || generateFormId(form);
        console.log('[YourCRM] Setting up batch tracking for form:', formId);
        
        const allFields = form.querySelectorAll('input, textarea, select');
        
        allFields.forEach(function(input) {
          const fieldName = input.name || input.id;
          
          if (!shouldTrackField(fieldName, input.type, trackFields, excludeFields)) {
            return;
          }
          
          // Blur event - track in memory
          if (triggers.blur) {
            input.addEventListener('blur', function() {
              if (input.value && input.value.trim() !== '') {
                console.log('[YourCRM] ⚡ Blur on:', fieldName, '→ tracking in memory');
                trackFieldInMemory(formId, form, fieldName, input.value);
              }
            });
          }
          
          // Change event for selects/checkboxes/radio
          if (triggers.change && ['select-one', 'select-multiple', 'checkbox', 'radio'].includes(input.type)) {
            input.addEventListener('change', function() {
              if (input.value) {
                console.log('[YourCRM] ⚡ Change on:', fieldName, '→ tracking in memory');
                trackFieldInMemory(formId, form, fieldName, input.value);
              }
            });
          }
        });
      });
    }
    
    // Attach listeners when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachBatchListeners);
    } else {
      attachBatchListeners();
    }
    
    // Watch for dynamically added forms
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.tagName === 'FORM' && node.matches(formSelector)) {
              attachBatchListeners();
            } else if (node.querySelectorAll) {
              const forms = node.querySelectorAll(formSelector);
              if (forms.length > 0) {
                attachBatchListeners();
              }
            }
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Capture on visibility change (tab switch)
    if (batchConfig.captureOnVisibilityChange) {
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          console.log('[YourCRM] 👁️ Tab hidden, sending batched data...');
          formStateTracker.forEach(function(state, formId) {
            if (!state.lastSent || state.lastActivity > state.lastSent) {
              sendBatchedFormData(formId);
            }
          });
        }
      });
      console.log('[YourCRM] visibilitychange capture enabled');
    }
    
    // Capture on beforeunload (page close)
    if (batchConfig.captureOnBeforeUnload) {
      window.addEventListener('beforeunload', function() {
        console.log('[YourCRM] 🚪 Page closing, sending batched data...');
        formStateTracker.forEach(function(state, formId) {
          if (!state.lastSent || state.lastActivity > state.lastSent) {
            sendBatchedFormData(formId);
          }
        });
      });
      console.log('[YourCRM] beforeunload capture enabled');
    }
  }

  /**
   * Track field-level interactions (blur, change) - LEGACY MODE
   */
  function trackFormFieldInteractions(formSelector, trackFields, excludeFields, triggers, apiKey, apiUrl) {
    function attachToExistingForms() {
      const forms = document.querySelectorAll(formSelector);
      console.log('[YourCRM] Found ' + forms.length + ' forms to track');
      
      forms.forEach(function(form) {
        attachFieldListeners(form, trackFields, excludeFields, triggers, apiKey, apiUrl);
      });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachToExistingForms);
    } else {
      // DOM is already ready
      attachToExistingForms();
    }

    // Watch for dynamically added forms (SPA support)
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.tagName === 'FORM' && node.matches(formSelector)) {
              console.log('[YourCRM] New form detected:', node.id || node.name || 'unnamed');
              attachFieldListeners(node, trackFields, excludeFields, triggers, apiKey, apiUrl);
            } else if (node.querySelectorAll) {
              node.querySelectorAll(formSelector).forEach(function(form) {
                console.log('[YourCRM] New form detected in added node:', form.id || form.name || 'unnamed');
                attachFieldListeners(form, trackFields, excludeFields, triggers, apiKey, apiUrl);
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[YourCRM] Field interaction tracking enabled (blur, change)');
  }

  /**
   * Attach listeners to form fields
   */
  function attachFieldListeners(form, trackFields, excludeFields, triggers, apiKey, apiUrl) {
    const formId = form.id || form.name || generateFormId(form);
    console.log('[YourCRM] Attaching listeners to form:', formId);

    const allFields = form.querySelectorAll('input, textarea, select');
    console.log('[YourCRM] Form has', allFields.length, 'fields');
    
    let trackedFieldCount = 0;

    allFields.forEach(function(input) {
      const fieldName = input.name || input.id;
      
      if (!shouldTrackField(fieldName, input.type, trackFields, excludeFields)) {
        console.log('[YourCRM] Skipping field:', fieldName, '(type:', input.type + ')');
        return;
      }

      trackedFieldCount++;
      console.log('[YourCRM] ✓ Tracking field:', fieldName, '(type:', input.type + ')');

      // Blur event - primary trigger for partial leads
      if (triggers.blur) {
        input.addEventListener('blur', function() {
          console.log('[YourCRM] ⚡ Blur event fired on:', fieldName, 'value:', input.value);
          if (input.value && input.value.trim() !== '') {
            trackFieldInteraction(formId, form, input, 'blur', apiKey, apiUrl);
          } else {
            console.log('[YourCRM] Field empty, not tracking');
          }
        });
      }

      // Change event - for select/checkbox/radio
      if (triggers.change && ['select-one', 'select-multiple', 'checkbox', 'radio'].includes(input.type)) {
        input.addEventListener('change', function() {
          console.log('[YourCRM] ⚡ Change event fired on:', fieldName);
          if (input.value) {
            trackFieldInteraction(formId, form, input, 'change', apiKey, apiUrl);
          }
        });
      }
    });

    console.log('[YourCRM] Attached listeners to', trackedFieldCount, 'trackable fields in form:', formId);
  }

  /**
   * Check if field should be tracked
   */
  function shouldTrackField(fieldName, fieldType, trackFields, excludeFields) {
    if (!fieldName) {
      console.log('[YourCRM] shouldTrackField: No field name');
      return false;
    }
    
    if (fieldType === 'hidden' || fieldType === 'password') {
      console.log('[YourCRM] shouldTrackField: Skipping', fieldName, '- hidden/password field');
      return false;
    }

    // Skip excluded fields
    const isExcluded = excludeFields.some(function(excluded) {
      return fieldName.toLowerCase().includes(excluded.toLowerCase());
    });
    if (isExcluded) {
      console.log('[YourCRM] shouldTrackField: Skipping', fieldName, '- excluded field');
      return false;
    }

    // Only track configured lead fields
    const isTracked = trackFields.some(function(tracked) {
      return fieldName.toLowerCase().includes(tracked.toLowerCase());
    });
    
    console.log('[YourCRM] shouldTrackField:', fieldName, '→', isTracked ? 'YES' : 'NO', 
                '(trackFields:', trackFields.join(', ') + ')');
    
    return isTracked;
  }

  /**
   * Track individual field interaction
   */
  function trackFieldInteraction(formId, form, input, trigger, apiKey, apiUrl) {
    const fieldName = input.name || input.id;
    
    console.log('[YourCRM] Field interaction:', formId, fieldName, trigger);

    sendEvent({
      apiKey: apiKey,
      type: 'form_interaction',
      form: {
        formId: formId,
        trigger: trigger,
        fieldName: fieldName,
        fieldValue: input.value,
        fieldType: input.type,
        formProgress: calculateFormProgress(form)
      },
      page: {
        path: window.location.pathname,
        title: document.title || 'Untitled',
        search: window.location.search,
        hash: window.location.hash
      }
    }, apiUrl);
  }

  /**
   * Capture abandoned fields on page unload
   */
  function captureAbandonedFields(formSelector, trackFields, excludeFields, apiKey, apiUrl) {
    document.querySelectorAll(formSelector).forEach(function(form) {
      const formId = form.id || form.name || generateFormId(form);
      const fields = {};
      let hasFields = false;

      form.querySelectorAll('input, textarea, select').forEach(function(input) {
        const fieldName = input.name || input.id;
        
        if (shouldTrackField(fieldName, input.type, trackFields, excludeFields) &&
            input.value && input.value.trim() !== '') {
          fields[fieldName] = input.value;
          hasFields = true;
        }
      });

      if (hasFields) {
        console.log('[YourCRM] Capturing abandoned fields:', formId, fields);

        sendEvent({
          apiKey: apiKey,
          type: 'form_interaction',
          form: {
            formId: formId,
            trigger: 'beforeunload',
            fields: fields,
            formProgress: calculateFormProgress(form)
          },
          page: {
            path: window.location.pathname,
            title: document.title || 'Untitled',
            search: window.location.search,
            hash: window.location.hash
          }
        }, apiUrl);
      }
    });
  }

  /**
   * Calculate form completion progress
   */
  function calculateFormProgress(form) {
    const allFields = form.querySelectorAll('input:not([type=hidden]), textarea, select');
    const filledFields = Array.from(allFields).filter(function(el) {
      return el.value && el.value.trim() !== '';
    });
    
    const completedFieldNames = Array.from(filledFields)
      .map(function(el) { return el.name || el.id; })
      .filter(Boolean);

    return {
      completedFields: completedFieldNames,
      totalFields: allFields.length,
      percentComplete: allFields.length > 0 
        ? Math.round((filledFields.length / allFields.length) * 100) 
        : 0
    };
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
    
    sendEvent({
      apiKey: apiKey,
      type: 'form_submission',
      form: {
        formId: formData.formId,
        formName: formName,
        fields: formData.fields,
        submittedAt: new Date().toISOString()
      },
      page: {
        path: window.location.pathname,
        title: document.title || 'Untitled',
        search: window.location.search,
        hash: window.location.hash
      }
    }, apiUrl);
  }

  /**
   * Get or create session ID
   */
  function getSessionId() {
    let sessionId = sessionStorage.getItem('yourcrm_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('yourcrm_session_id', sessionId);
      sessionStorage.setItem('yourcrm_session_start', Date.now().toString());
    }
    return sessionId;
  }

  /**
   * Get or create visitor ID
   */
  function getVisitorId() {
    let visitorId = localStorage.getItem('yourcrm_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('yourcrm_visitor_id', visitorId);
    }
    return visitorId;
  }

  /**
   * Get session duration
   */
  function getSessionDuration() {
    const startTime = sessionStorage.getItem('yourcrm_session_start');
    if (startTime) {
      return Date.now() - parseInt(startTime, 10);
    }
    return 0;
  }

  /**
   * Get screen resolution
   */
  function getScreenResolution() {
    return window.screen.width + 'x' + window.screen.height;
  }

  /**
   * Send event to backend (DTO compliant)
   */
  function sendEvent(eventData, apiUrl) {
    console.log('[YourCRM] Sending event:', eventData.type, eventData);
    
    // Build DTO-compliant event
    let pageUrl = window.location.href;
    
    // Ensure URL is valid for DTO validation
    // The @IsUrl() decorator requires a proper protocol and valid format
    if (!pageUrl.startsWith('http://') && !pageUrl.startsWith('https://')) {
      // For file:// or other protocols, use a valid fallback
      pageUrl = 'https://localhost' + (window.location.pathname || '/');
    }
    
    // Additional check: ensure URL is properly formatted
    // Some validators reject URLs with just domain (need path)
    try {
      const urlObj = new URL(pageUrl);
      if (!urlObj.pathname || urlObj.pathname === '') {
        urlObj.pathname = '/';
      }
      pageUrl = urlObj.toString();
    } catch (e) {
      console.warn('[YourCRM] Invalid URL, using fallback:', e);
      pageUrl = 'https://localhost/';
    }
    
    console.log('[YourCRM] Using URL for tracking:', pageUrl);
    
    const dtoEvent = {
      type: eventData.type,
      apiKey: eventData.apiKey,
      timestamp: new Date().toISOString(),
      url: pageUrl,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      screenResolution: getScreenResolution(),
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      duration: getSessionDuration()
    };

    // Add event-specific properties
    if (eventData.page) {
      dtoEvent.page = {
        title: eventData.page.title,
        path: eventData.page.path,
        search: eventData.page.search,
        hash: eventData.page.hash,
        referrer: eventData.page.referrer
      };
    }

    if (eventData.form) {
      dtoEvent.form = eventData.form;
    }

    if (eventData.widget) {
      dtoEvent.widget = eventData.widget;
    }

    if (eventData.config) {
      dtoEvent.config = eventData.config;
    }

    console.log('[YourCRM] DTO-compliant event:', dtoEvent);
    
    fetch(apiUrl + '/v1/track/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [dtoEvent] }),
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

  // Expose debug function globally
  window.YourCRMDebug = function() {
    console.log('=== YourCRM Debug Info ===');
    console.log('Config loaded:', !!window.YourCRM?.config);
    console.log('Forms enabled:', window.YourCRM?.config?.widgets?.forms?.enabled);
    console.log('Track interactions:', window.YourCRM?.config?.widgets?.forms?.trackInteractions);
    console.log('Track fields:', window.YourCRM?.config?.widgets?.forms?.trackFields);
    console.log('Triggers:', window.YourCRM?.config?.widgets?.forms?.triggers);
    
    // Check forms
    const forms = document.querySelectorAll('form');
    console.log('Forms in DOM:', forms.length);
    forms.forEach((form, i) => {
      console.log(`  Form ${i+1}:`, form.id || form.name || 'unnamed');
      const fields = form.querySelectorAll('input, textarea, select');
      console.log(`    Fields:`, fields.length);
      fields.forEach(field => {
        console.log(`      -`, field.name || field.id, `(${field.type})`);
      });
    });
  };

  console.log('[YourCRM] Tracker initialized successfully');
  console.log('[YourCRM] Type YourCRMDebug() in console to see debug info');
})();
