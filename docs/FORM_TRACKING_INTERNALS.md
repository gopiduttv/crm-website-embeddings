# How Form Tracking Works - Complete Flow

## 📋 Overview

Form tracking in YourCRM uses **DOM event listeners** to automatically capture form submissions and send the data to your backend for processing.

---

## 🔄 Complete Tracking Flow

```
User Action → Event Listener → Data Capture → Data Sanitization → API Call → Backend Processing
```

---

## Step-by-Step Breakdown

### 1️⃣ **Page Load & Script Initialization**

**What happens:**
```javascript
// 1. HTML includes the loader script
<script src="http://localhost:5000/script/abc-123.js"></script>

// 2. Loader script loads with embedded config
var config = {
  clientId: "abc-123",
  apiKey: "sk_live_abc123",
  widgets: {
    forms: {
      enabled: true,           // ← Controls if form tracking is active
      autoCapture: true,       // ← Automatically track all forms
      captureSelector: "form", // ← CSS selector for which forms to track
      excludeFields: ["password", "credit_card", "ssn", "cvv"] // ← Sensitive fields to redact
    }
  }
}

// 3. Loader loads main app
script.src = "http://localhost:5000/main-app.v1.js"
```

**Location:** `src/tracking/tracking.service.ts` → `generateLoaderScript()`

---

### 2️⃣ **Form Tracking Initialization**

**What happens:**
```javascript
// In main-app.v1.js (lines 46-55)

if (config.widgets?.forms?.enabled) {
  console.log('[YourCRM] Form tracking is ENABLED');
  initFormTracking(config.widgets.forms);
} else {
  console.log('[YourCRM] Form tracking is DISABLED');
}
```

**Function: `initFormTracking(formConfig)`** (lines 89-109)

```javascript
function initFormTracking(formConfig) {
  const autoCapture = formConfig.autoCapture !== false;
  const selector = formConfig.captureSelector || 'form';
  const excludeFields = formConfig.excludeFields || ['password', 'credit_card', 'ssn', 'cvv'];

  if (autoCapture) {
    // 🎯 THIS IS THE KEY: Add a global submit event listener
    document.addEventListener('submit', function(event) {
      const form = event.target;
      
      // Check if this form matches the selector
      if (form.matches(selector)) {
        captureFormSubmission(form, excludeFields);
      }
    }, true); // ← 'true' = capture phase (fires before form's own handlers)
    
    console.log('[YourCRM] Auto-capture enabled for forms matching:', selector);
  }
}
```

**Key Points:**
- Uses **global event listener** on the entire document
- Listens for `submit` events on ALL forms
- Uses **event capturing phase** (third parameter = `true`)
- Filters forms using CSS selector (default: `'form'` = all forms)

---

### 3️⃣ **User Submits a Form**

**User action:**
```html
<form id="contact-form" data-form-name="Contact Form">
  <input type="text" name="name" value="John Doe">
  <input type="email" name="email" value="john@example.com">
  <input type="password" name="password" value="secret123">
  <button type="submit">Submit</button>
</form>
```

User clicks "Submit" → Browser fires `submit` event

---

### 4️⃣ **Event Listener Catches the Submission**

**What happens:**
```javascript
// Our event listener fires BEFORE the form actually submits

document.addEventListener('submit', function(event) {
  const form = event.target; // ← The <form> element that was submitted
  
  // Check: Does this form match our selector?
  if (form.matches('form')) { // ← Yes, it's a <form> element
    captureFormSubmission(form, excludeFields); // ← Capture the data!
  }
}, true);

// Note: We DON'T call event.preventDefault()
// So the form continues to submit normally after we capture the data
```

---

### 5️⃣ **Data Capture & Sanitization**

**Function: `captureFormSubmission(form, excludeFields)`** (lines 114-147)

```javascript
function captureFormSubmission(form, excludeFields) {
  // Extract form metadata
  const formId = form.id || form.name || generateFormId(form);
  // Priority: data-form-name attribute → name attribute → id → fallback
  const formName = form.getAttribute('data-form-name') || form.name || form.id || 'Unnamed Form';
  
  // Use FormData API to get all field values
  const formData = new FormData(form);
  const fields = {};
  
  // Loop through all fields
  for (let [key, value] of formData.entries()) {
    
    // 🔒 SECURITY: Redact sensitive fields
    if (excludeFields.some(excluded => key.toLowerCase().includes(excluded.toLowerCase()))) {
      fields[key] = '[REDACTED]';
      continue;
    }
    
    // Handle file uploads (don't send file content, just metadata)
    if (value instanceof File) {
      fields[key] = {
        type: 'file',
        name: value.name,
        size: value.size,
        mimeType: value.type
      };
    } else {
      // Regular field - store as-is
      fields[key] = value;
    }
  }
  
  console.log('[YourCRM] Form captured:', formName, fields);
  
  // Send to tracking function
  trackFormSubmission({
    formId,
    formName,
    fields
  });
}
```

**Example Output:**
```javascript
{
  formId: "contact-form",
  formName: "Contact Form",
  fields: {
    name: "John Doe",
    email: "john@example.com",
    password: "[REDACTED]"  // ← Sensitive field hidden!
  }
}
```

---

### 6️⃣ **Building the Tracking Event**

**Function: `trackFormSubmission(formData)`** (lines 152-175)

```javascript
function trackFormSubmission(formData) {
  // Ensure formName is a string (fixes validation errors)
  const formName = (formData.formName && String(formData.formName).trim()) || 'Unnamed Form';
  
  // Ensure URL is valid
  const pageUrl = window.location.href;
  const isValidUrl = pageUrl.startsWith('http://') || pageUrl.startsWith('https://');
  
  // Build the complete tracking event
  sendEvent({
    id: generateUUID(),                    // ← Unique event ID
    apiKey: config.apiKey,                 // ← Client's API key
    type: 'form_submission',               // ← Event type
    form: {
      formId: formData.formId,
      formName: formName,
      fields: formData.fields,
      submittedAt: new Date().toISOString() // ← Timestamp
    },
    page: {
      url: isValidUrl ? pageUrl : 'https://unknown.local' + window.location.pathname,
      path: window.location.pathname,
      title: document.title || 'Untitled'
    },
    userAgent: navigator.userAgent         // ← Browser info
  });
}
```

**Example Event Payload:**
```json
{
  "id": "d9fd2dd6-6586-440f-9f16-e029ba7fdb8b",
  "apiKey": "sk_live_abc123",
  "type": "form_submission",
  "form": {
    "formId": "contact-form",
    "formName": "Contact Form",
    "fields": {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "[REDACTED]"
    },
    "submittedAt": "2025-10-16T12:11:36.865Z"
  },
  "page": {
    "url": "https://example.com/contact",
    "path": "/contact",
    "title": "Contact Us"
  },
  "userAgent": "Mozilla/5.0..."
}
```

---

### 7️⃣ **Sending to Backend API**

**Function: `sendEvent(eventData)`** (lines 180-205)

```javascript
function sendEvent(eventData) {
  const apiUrl = config.apiUrl || 'http://localhost:5000';
  
  console.log('[YourCRM] Sending event:', eventData.type, eventData);
  
  // Use Fetch API to send POST request
  fetch(apiUrl + '/v1/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
    keepalive: true  // ← Ensures request completes even if page navigates away
  })
  .then(response => {
    if (response.ok) {
      console.log('[YourCRM] Event tracked successfully:', eventData.type);
    } else {
      console.error('[YourCRM] Tracking failed:', response.status);
    }
  })
  .catch(err => console.error('[YourCRM] Tracking error:', err));
}
```

**HTTP Request:**
```http
POST http://localhost:5000/v1/track
Content-Type: application/json

{
  "id": "d9fd2dd6-6586-440f-9f16-e029ba7fdb8b",
  "apiKey": "sk_live_abc123",
  "type": "form_submission",
  "form": { ... },
  "page": { ... },
  "userAgent": "..."
}
```

---

### 8️⃣ **Backend Processing**

**Location:** `src/tracking/tracking.controller.ts` → `trackEvent()`

```typescript
@Post('track')
trackEvent(@Body() trackEventDto: TrackEventDto) {
  console.log('Received tracking event:', trackEventDto);
  this.trackingService.queueEvent(trackEventDto);
}
```

**Location:** `src/tracking/tracking.service.ts` → `queueEvent()`

```typescript
async queueEvent(trackEventDto: TrackEventDto): Promise<void> {
  // 1. Validate API key
  const client = await this.clientConfigService.findByApiKey(trackEventDto.apiKey);
  if (!client || !client.isActive) {
    throw new Error('Invalid or inactive API key');
  }
  
  // 2. Validate required fields
  if (trackEventDto.type === 'form_submission' && !trackEventDto.form) {
    throw new Error('Form data is required for form_submission events');
  }
  
  // 3. Log warning if forms are disabled (but still accept the event)
  if (!client.widgets?.forms?.enabled) {
    this.logger.warn(
      `Form tracking is currently disabled for client ${client.clientId}, ` +
      `but accepting event from cached frontend`
    );
  }
  
  // 4. Process the event
  await this.processEvent(trackEventDto, client);
}
```

---

## 🎯 Key Technical Details

### 1. **Event Capturing Phase**
```javascript
document.addEventListener('submit', handler, true);
                                            //  ↑
                                            // Capture phase = fires BEFORE the form's own handlers
```

**Why?** Ensures we capture the data even if the form has `event.preventDefault()` or navigates away.

### 2. **FormData API**
```javascript
const formData = new FormData(form);

// Automatically extracts all input values:
// - text inputs
// - checkboxes (only checked ones)
// - radio buttons (only selected one)
// - select dropdowns
// - textareas
// - file inputs
```

**Benefit:** Works with all standard HTML form elements automatically.

### 3. **Sensitive Field Detection**
```javascript
if (excludeFields.some(excluded => 
  key.toLowerCase().includes(excluded.toLowerCase())
)) {
  fields[key] = '[REDACTED]';
}
```

**How it works:**
- Checks if field name contains any excluded keyword
- Case-insensitive matching
- Default exclusions: `password`, `credit_card`, `ssn`, `cvv`

**Examples:**
- `password` → matches → `[REDACTED]`
- `user_password` → matches → `[REDACTED]`
- `creditCard` → matches → `[REDACTED]`
- `cc_number` → does NOT match → sent as-is (would need to add "cc" to excludeFields)

### 4. **File Upload Handling**
```javascript
if (value instanceof File) {
  fields[key] = {
    type: 'file',
    name: value.name,      // e.g., "resume.pdf"
    size: value.size,      // e.g., 1048576 (1MB)
    mimeType: value.type   // e.g., "application/pdf"
  };
}
```

**Benefit:** Tracks that a file was uploaded without sending the actual file content.

### 5. **Keepalive Flag**
```javascript
fetch(apiUrl + '/v1/track', {
  method: 'POST',
  body: JSON.stringify(eventData),
  keepalive: true  // ← Important!
})
```

**Why?** If the form navigates to another page after submission, the browser normally cancels in-flight requests. `keepalive: true` tells the browser to complete the request even if the page unloads.

---

## 🔍 Debugging Form Tracking

### Check if tracking is active:
```javascript
// Open DevTools Console
// You should see:
[YourCRM] Main app loading...
[YourCRM] Initialized for client: abc-123
[YourCRM] Form tracking is ENABLED
[YourCRM] Form tracking initialized { autoCapture: true, selector: 'form', excludeFields: [...] }
[YourCRM] Auto-capture enabled for forms matching: form
```

### Submit a form:
```javascript
// Console should show:
[YourCRM] Form captured: Contact Form { name: 'John Doe', email: 'john@example.com', password: '[REDACTED]' }
[YourCRM] Sending event: form_submission { id: '...', apiKey: '...', ... }
[YourCRM] Event tracked successfully: form_submission
```

### Check Network tab:
```
POST http://localhost:5000/v1/track
Status: 202 Accepted
```

### Check backend logs:
```
Received tracking event: TrackEventDto { id: '...', type: 'form_submission', ... }
[TrackingService] Queueing event type 'form_submission' for client 'abc-123'
[TrackingService] Form submission: Contact Form with 3 fields
```

---

## 📊 Configuration Options

### Disable form tracking:
```json
{
  "widgets": {
    "forms": {
      "enabled": false  // ← No forms tracked
    }
  }
}
```

### Track only specific forms:
```json
{
  "widgets": {
    "forms": {
      "enabled": true,
      "autoCapture": true,
      "captureSelector": ".tracked-form"  // ← Only forms with class "tracked-form"
    }
  }
}
```

### Add more excluded fields:
```json
{
  "widgets": {
    "forms": {
      "enabled": true,
      "excludeFields": [
        "password",
        "credit_card",
        "ssn",
        "cvv",
        "api_key",      // ← Custom additions
        "secret",
        "token"
      ]
    }
  }
}
```

### Manual tracking (disable auto-capture):
```json
{
  "widgets": {
    "forms": {
      "enabled": true,
      "autoCapture": false  // ← Disable automatic tracking
    }
  }
}
```

Then use the API manually:
```javascript
// In your own code
window.YourCRM('trackForm', {
  formId: 'my-form',
  formName: 'Custom Form',
  fields: {
    field1: 'value1',
    field2: 'value2'
  }
});
```

---

## 🚀 Summary

**How forms are tracked:**

1. ✅ Global `submit` event listener on entire document
2. ✅ Captures ALL form submissions automatically
3. ✅ Extracts form data using `FormData` API
4. ✅ Redacts sensitive fields (password, credit_card, etc.)
5. ✅ Handles file uploads (metadata only)
6. ✅ Sends data to backend via `fetch()` POST request
7. ✅ Backend validates and processes the event
8. ✅ Uses `keepalive` to ensure tracking completes even if page navigates

**No manual setup needed** - just include the script and all forms are automatically tracked!
