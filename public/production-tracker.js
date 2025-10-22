/**
 * ============================================
 * CRM WEB TRACKER - PRODUCTION SCRIPT
 * Lead-Focused Tracking System v2.0
 * ============================================
 * 
 * Features:
 * - Form submission tracking (complete leads)
 * - Form field interaction tracking (partial leads)
 * - Chat widget with lead capture
 * - Session management
 * - Event batching and queuing
 * - Privacy-first approach
 * 
 * Tracking Strategy:
 * ✅ Form submissions (high-quality leads)
 * ✅ Form field interactions with blur + beforeunload (partial leads)
 * ✅ Chat messages (conversational leads)
 * ❌ Page views (no lead value)
 * ❌ Generic clicks (no lead value)
 * 
 * Usage:
 * <script src="http://localhost:5000/script/YOUR-CLIENT-ID.js"></script>
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  
  const CONFIG = {
    clientId: '{{CLIENT_ID}}',
    serverUrl: '{{SERVER_URL}}',
    apiKey: '{{API_KEY}}',
    // These are placeholders that will be replaced by the server.
    // They are wrapped in quotes to be syntactically valid.
    widgets: '{{WIDGETS_CONFIG}}',
    theme: '{{THEME_CONFIG}}',
    debug: '{{DEBUG_MODE}}'
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  const Utils = {
    log: function(...args) {
      if (CONFIG.debug) {
        console.log('[CRM Tracker]', ...args);
      }
    },
    
    error: function(...args) {
      console.error('[CRM Tracker]', ...args);
    },
    
    generateSessionId: function() {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    getCookie: function(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    },
    
    setCookie: function(name, value, days = 365) {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
    },
    
    getOrCreateVisitorId: function() {
      let visitorId = localStorage.getItem('crm_visitor_id');
      if (!visitorId) {
        visitorId = this.generateVisitorId();
        localStorage.setItem('crm_visitor_id', visitorId);
      }
      return visitorId;
    },
    
    generateVisitorId: function() {
      return 'visitor_' + this.generateId();
    },
    
    getOrCreateSessionId: function() {
      let sessionId = sessionStorage.getItem('crm_session_id');
      if (!sessionId) {
        sessionId = this.generateSessionId();
        sessionStorage.setItem('crm_session_id', sessionId);
      }
      return sessionId;
    },
    
    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };

  // ============================================
  // SESSION MANAGER
  // ============================================
  
  const SessionManager = {
    sessionId: null,
    visitorId: null,
    startTime: Date.now(),
    
    init: function() {
      this.visitorId = Utils.getOrCreateVisitorId();
      this.sessionId = Utils.getOrCreateSessionId();
      
      Utils.log('Session initialized:', {
        sessionId: this.sessionId,
        visitorId: this.visitorId
      });
    },
    
    getSessionData: function() {
      return {
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        duration: Date.now() - this.startTime
      };
    },
    
    getUserContext: function() {
      return {
        sessionId: this.sessionId,
        visitorId: this.visitorId,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  };

  // ============================================
  // EVENT TRACKER (WITH QUEUE & BATCH)
  // ============================================
  
  const EventTracker = {
    queue: [],
    batchSize: 10,
    flushInterval: 5000,
    apiEndpoint: null,
    flushTimer: null,
    
    init: function() {
      this.apiEndpoint = CONFIG.serverUrl + '/v1/track';
      this.batchSize = CONFIG.widgets?.forms?.batchSize || 10;
      this.flushInterval = CONFIG.widgets?.forms?.flushInterval || 5000;
      
      // Start auto-flush timer
      this.startAutoFlush();
      
      Utils.log('EventTracker initialized', {
        endpoint: this.apiEndpoint,
        batchSize: this.batchSize,
        flushInterval: this.flushInterval
      });
    },
    
    track: function(eventType, eventData) {
      const event = {
        id: 'evt_' + Utils.generateId(),
        apiKey: CONFIG.apiKey,
        clientId: CONFIG.clientId,
        type: eventType,
        timestamp: new Date().toISOString(),
        page: this.getPageContext(),
        user: SessionManager.getUserContext(),
        ...eventData
      };
      
      // Add to queue
      this.queue.push(event);
      
      // Debug logging
      if (CONFIG.debug) {
        Utils.log('[EventTracker] Event queued:', event);
      }
      
      // Auto-flush if batch size reached
      if (this.queue.length >= this.batchSize) {
        this.flushQueue();
      }
      
      return event;
    },
    
    flushQueue: function() {
      if (this.queue.length === 0) return;
      
      const events = [...this.queue];
      this.queue = [];
      
      Utils.log('[EventTracker] Flushing queue:', events.length, 'events');
      
      // Use sendBeacon for reliability (especially on beforeunload)
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(events)], { 
          type: 'application/json' 
        });
        const sent = navigator.sendBeacon(this.apiEndpoint, blob);
        
        if (CONFIG.debug) {
          Utils.log('[EventTracker] sendBeacon result:', sent);
        }
        
        if (!sent) {
          // Fallback to fetch if sendBeacon fails
          this.sendViaFetch(events);
        }
      } else {
        // Fallback to fetch
        this.sendViaFetch(events);
      }
    },
    
    sendViaFetch: function(events) {
      fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
        keepalive: true
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        Utils.log('[EventTracker] Events sent successfully:', result);
      })
      .catch(error => {
        Utils.error('[EventTracker] Failed to send events:', error);
      });
    },
    
    startAutoFlush: function() {
      this.flushTimer = setInterval(() => {
        this.flushQueue();
      }, this.flushInterval);
    },
    
    getPageContext: function() {
      return {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer
      };
    }
  };

  // ============================================
  // FORM TRACKER (LEAD-FOCUSED with blur + beforeunload)
  // ============================================
  
  const FormTracker = {
    trackedForms: new Set(),
    trackFields: [],
    excludeFields: [],
    triggers: {},
    fieldValues: {},
    debounceTimers: {},
    
    init: function() {
      if (!CONFIG.widgets?.forms?.enabled) {
        Utils.log('Form tracking disabled');
        return;
      }
      
      // Configuration
      this.trackFields = CONFIG.widgets.forms.trackFields || 
        ['email', 'phone', 'name', 'first_name', 'last_name', 'company', 'organization'];
      this.excludeFields = CONFIG.widgets.forms.excludeFields || 
        ['password', 'ssn', 'credit_card', 'cvv', 'pin'];
      this.triggers = CONFIG.widgets.forms.triggers || 
        { blur: true, beforeunload: true, change: true, visibilitychange: false };
      
      Utils.log('FormTracker initialized', {
        trackFields: this.trackFields,
        excludeFields: this.excludeFields,
        triggers: this.triggers
      });
      
      // Track existing forms
      this.trackAllForms();
      
      // Watch for new forms (SPA support)
      this.observeFormAdditions();
      
      // Attach global listeners
      this.attachGlobalListeners();
    },
    
    trackAllForms: function() {
      const selector = CONFIG.widgets.forms.captureSelector || 'form';
      const forms = document.querySelectorAll(selector);
      
      Utils.log(`Found ${forms.length} forms`);
      
      forms.forEach(form => {
        if (!this.trackedForms.has(form)) {
          this.attachFormListeners(form);
          this.trackedForms.add(form);
        }
      });
    },
    
    attachFormListeners: function(form) {
      const formId = this.getFormId(form);
      
      Utils.log('Tracking form:', formId);
      
      // 1. FORM SUBMISSION - Complete lead
      form.addEventListener('submit', (e) => {
        this.handleFormSubmission(form, e);
      });
      
      // 2. FIELD-LEVEL LISTENERS
      form.querySelectorAll('input, textarea, select').forEach(input => {
        this.attachFieldListeners(formId, input);
      });
    },
    
    attachFieldListeners: function(formId, input) {
      const fieldName = input.name || input.id;
      
      // Only track configured fields
      if (!this.shouldTrackField(fieldName, input.type)) {
        return;
      }
      
      // 1. BLUR EVENT - Primary trigger (field completed)
      if (this.triggers.blur) {
        input.addEventListener('blur', () => {
          if (input.value && input.value.trim() !== '') {
            this.trackFieldInteraction(formId, input, 'blur');
          }
        });
      }
      
      // 2. INPUT EVENT - Store in memory (don't send yet)
      input.addEventListener('input', () => {
        const key = `${formId}_${fieldName}`;
        this.fieldValues[key] = input.value;
      });
      
      // 3. CHANGE EVENT - For select/checkbox/radio (immediate capture)
      if (this.triggers.change && 
          ['select-one', 'select-multiple', 'checkbox', 'radio'].includes(input.type)) {
        input.addEventListener('change', () => {
          if (input.value) {
            this.trackFieldInteraction(formId, input, 'change');
          }
        });
      }
    },
    
    attachGlobalListeners: function() {
      // 4. BEFOREUNLOAD - Capture abandoned fields (CRITICAL)
      if (this.triggers.beforeunload) {
        window.addEventListener('beforeunload', () => {
          this.captureAllInProgressFields();
          EventTracker.flushQueue();  // Force immediate send
        });
      }
      
      // 5. VISIBILITYCHANGE - Tab hidden (optional, can be noisy)
      if (this.triggers.visibilitychange) {
        const debounceMs = CONFIG.widgets.forms.debounceMs || 2000;
        const debouncedCapture = Utils.debounce(() => {
          if (document.hidden) {
            this.captureAllInProgressFields();
            EventTracker.flushQueue();
          }
        }, debounceMs);
        
        document.addEventListener('visibilitychange', debouncedCapture);
      }
    },
    
    shouldTrackField: function(fieldName, fieldType) {
      if (!fieldName) return false;
      
      // Skip hidden fields
      if (fieldType === 'hidden') return false;
      
      // Skip password fields
      if (fieldType === 'password') return false;
      
      // Skip excluded fields (sensitive data)
      const isExcluded = this.excludeFields.some(excluded => 
        fieldName.toLowerCase().includes(excluded.toLowerCase())
      );
      if (isExcluded) return false;
      
      // Only track configured lead fields
      const isTracked = this.trackFields.some(tracked => 
        fieldName.toLowerCase().includes(tracked.toLowerCase())
      );
      return isTracked;
    },
    
    trackFieldInteraction: function(formId, input, trigger) {
      const fieldName = input.name || input.id;
      
      EventTracker.track('form_interaction', {
        formId: formId,
        trigger: trigger,
        fieldName: fieldName,
        fieldValue: input.value,  // Full value for lead fields
        fieldType: input.type,
        formProgress: this.calculateFormProgress(formId)
      });
      
      Utils.log('[FormTracker] Field interaction:', {
        formId,
        fieldName,
        trigger,
        valueLength: input.value.length
      });
    },
    
    captureAllInProgressFields: function() {
      document.querySelectorAll('form').forEach(form => {
        const formId = this.getFormId(form);
        const fields = this.getInProgressFields(form);
        
        if (Object.keys(fields).length > 0) {
          EventTracker.track('form_interaction', {
            formId: formId,
            trigger: 'beforeunload',
            fields: fields,
            formProgress: this.calculateFormProgress(formId)
          });
          
          Utils.log('[FormTracker] Captured in-progress fields:', {
            formId,
            fieldCount: Object.keys(fields).length
          });
        }
      });
    },
    
    getInProgressFields: function(form) {
      const fields = {};
      
      form.querySelectorAll('input, textarea, select').forEach(input => {
        const fieldName = input.name || input.id;
        
        // Only capture lead fields with values
        if (this.shouldTrackField(fieldName, input.type) && 
            input.value && input.value.trim() !== '') {
          fields[fieldName] = input.value;
        }
      });
      
      return fields;
    },
    
    handleFormSubmission: function(form, event) {
      const formId = this.getFormId(form);
      const fields = this.getFormData(form);
      
      EventTracker.track('form_submission', {
        formId: formId,
        formName: form.getAttribute('name') || formId,
        formAction: form.action || window.location.href,
        fields: fields
      });
      
      Utils.log('[FormTracker] Form submitted:', {
        formId,
        fieldCount: Object.keys(fields).length
      });
    },
    
    getFormData: function(form) {
      const formData = new FormData(form);
      const fields = {};
      
      for (const [key, value] of formData.entries()) {
        // Check if field should be excluded
        const isExcluded = this.excludeFields.some(excluded => 
          key.toLowerCase().includes(excluded.toLowerCase())
        );
        
        if (isExcluded) {
          fields[key] = '[REDACTED]';
        } else {
          fields[key] = value;
        }
      }
      
      return fields;
    },
    
    getFormId: function(form) {
      return form.id || 
             form.name || 
             form.getAttribute('data-form-id') || 
             'form_' + this.trackedForms.size;
    },
    
    calculateFormProgress: function(formId) {
      const form = document.getElementById(formId) || 
                   document.querySelector(`form[name="${formId}"]`) ||
                   document.querySelector(`form[data-form-id="${formId}"]`);
      
      if (!form) return null;
      
      const allFields = form.querySelectorAll('input:not([type=hidden]), textarea, select');
      const filledFields = Array.from(allFields).filter(el => el.value && el.value.trim() !== '');
      const completedFieldNames = Array.from(filledFields).map(el => el.name || el.id).filter(Boolean);
      
      return {
        completedFields: completedFieldNames,
        totalFields: allFields.length,
        percentComplete: allFields.length > 0 
          ? Math.round((filledFields.length / allFields.length) * 100) 
          : 0
      };
    },
    
    observeFormAdditions: function() {
      // Watch for dynamically added forms (SPA support)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {  // Element node
              if (node.tagName === 'FORM') {
                this.attachFormListeners(node);
                this.trackedForms.add(node);
              } else if (node.querySelectorAll) {
                node.querySelectorAll('form').forEach(form => {
                  if (!this.trackedForms.has(form)) {
                    this.attachFormListeners(form);
                    this.trackedForms.add(form);
                  }
                });
              }
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      Utils.log('Form observer started (SPA support enabled)');
    }
  };

  // ============================================
  // CHAT WIDGET
  // ============================================
  
  const ChatWidget = {
    isOpen: false,
    container: null,
    
    init: function() {
      if (!CONFIG.widgets?.chat?.enabled) return;
      
      Utils.log('Initializing chat widget');
      this.createWidget();
    },
    
    createWidget: function() {
      const config = CONFIG.widgets.chat;
      const position = config.position || 'bottom-right';
      const color = config.color || '#0066cc';
      const greeting = config.greeting || 'Hi! How can we help?';
      
      // Create container
      this.container = document.createElement('div');
      this.container.id = 'crm-chat-widget';
      this.container.innerHTML = `
        <style>
          #crm-chat-widget {
            position: fixed;
            ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
            ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          
          .crm-chat-bubble {
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: ${color};
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.2s;
          }
          
          .crm-chat-bubble:hover {
            transform: scale(1.1);
          }
          
          .crm-chat-bubble svg {
            width: 30px;
            height: 30px;
          }
          
          .crm-chat-window {
            display: none;
            position: absolute;
            ${position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
            ${position.includes('right') ? 'right: 0;' : 'left: 0;'}
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 40px rgba(0,0,0,0.16);
            flex-direction: column;
          }
          
          .crm-chat-window.open {
            display: flex;
          }
          
          .crm-chat-header {
            background: ${color};
            color: white;
            padding: 15px;
            border-radius: 10px 10px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .crm-chat-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }
          
          .crm-chat-body {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #f5f5f5;
          }
          
          .crm-chat-message {
            background: white;
            padding: 10px 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          
          .crm-chat-input-container {
            padding: 15px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
          }
          
          .crm-chat-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 20px;
            outline: none;
          }
          
          .crm-chat-send {
            background: ${color};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
          }
        </style>
        
        <div class="crm-chat-bubble" onclick="CRMTracker.ChatWidget.toggle()">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.33 0-2.58-.31-3.71-.86l-.26-.14-2.74.46.46-2.74-.14-.26C5.31 14.58 5 13.33 5 12c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7z"/>
          </svg>
        </div>
        
        <div class="crm-chat-window" id="crm-chat-window">
          <div class="crm-chat-header">
            <div>
              <div style="font-weight: bold;">Chat Support</div>
              <div style="font-size: 12px; opacity: 0.9;">We typically reply in minutes</div>
            </div>
            <button class="crm-chat-close" onclick="CRMTracker.ChatWidget.toggle()">×</button>
          </div>
          <div class="crm-chat-body" id="crm-chat-body">
            <div class="crm-chat-message">${greeting}</div>
          </div>
          <div class="crm-chat-input-container">
            <input type="text" class="crm-chat-input" id="crm-chat-input" placeholder="Type a message..."/>
            <button class="crm-chat-send" onclick="CRMTracker.ChatWidget.sendMessage()">Send</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.container);
      
      // Track chat widget shown
      EventTracker.track('widget_shown', {
        widget: { type: 'chat' }
      });
    },
    
    toggle: function() {
      this.isOpen = !this.isOpen;
      const window = document.getElementById('crm-chat-window');
      if (window) {
        window.classList.toggle('open', this.isOpen);
        
        EventTracker.track(this.isOpen ? 'chat_opened' : 'chat_closed', {
          widget: { type: 'chat' }
        });
      }
    },
    
    sendMessage: function() {
      const input = document.getElementById('crm-chat-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      Utils.log('Chat message sent:', message);
      
      EventTracker.track('chat_message_sent', {
        widget: {
          type: 'chat',
          message: message
        }
      });
      
      // Add message to chat
      const chatBody = document.getElementById('crm-chat-body');
      const messageEl = document.createElement('div');
      messageEl.className = 'crm-chat-message';
      messageEl.style.background = CONFIG.widgets.chat.color || '#0066cc';
      messageEl.style.color = 'white';
      messageEl.style.marginLeft = 'auto';
      messageEl.style.maxWidth = '70%';
      messageEl.textContent = message;
      chatBody.appendChild(messageEl);
      chatBody.scrollTop = chatBody.scrollHeight;
      
      input.value = '';
      
      // Simulate response (in production, this would be real-time via WebSocket)
      setTimeout(() => {
        const responseEl = document.createElement('div');
        responseEl.className = 'crm-chat-message';
        responseEl.textContent = 'Thanks for your message! Our team will respond shortly.';
        chatBody.appendChild(responseEl);
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 1000);
    }
  };

  // ============================================
  // MAIN INITIALIZATION
  // ============================================
  
  const CRMTracker = {
    initialized: false,
    
    init: function() {
      if (this.initialized) {
        Utils.log('Already initialized');
        return;
      }
      
      Utils.log('Initializing CRM Tracker (Lead-Focused v2.0)', CONFIG);
      
      // Initialize core systems
      SessionManager.init();
      EventTracker.init();
      
      // Initialize lead-focused tracking
      FormTracker.init();
      
      // Initialize widgets
      ChatWidget.init();
      
      // Track initialization
      EventTracker.track('tracker_initialized', {
        clientId: CONFIG.clientId,
        version: '2.0.0',
        strategy: 'lead-focused',
        features: {
          formSubmissions: CONFIG.widgets?.forms?.enabled,
          formInteractions: CONFIG.widgets?.forms?.trackInteractions !== false,
          fieldTriggers: CONFIG.widgets?.forms?.triggers,
          chatWidget: CONFIG.widgets?.chat?.enabled,
          pageViews: false,  // Disabled for lead-focused approach
          clickTracking: false  // Disabled for lead-focused approach
        }
      });
      
      this.initialized = true;
      Utils.log('CRM Tracker initialized successfully - Lead-Focused Mode');
      
      // Expose public API
      window.CRMTracker = {
        track: EventTracker.track.bind(EventTracker),
        ChatWidget: ChatWidget,
        getSession: SessionManager.getSessionData.bind(SessionManager),
        version: '2.0.0',
        mode: 'lead-focused'
      };
    }
  };

  // ============================================
  // AUTO-INITIALIZE
  // ============================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CRMTracker.init());
  } else {
    CRMTracker.init();
  }

})();
