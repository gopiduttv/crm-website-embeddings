# Partial Form Capture Strategy - Batch All Fields

**Date**: October 22, 2025  
**Status**: Design Document

---

## 🎯 Problem Statement

**Current Behavior** (One field at a time):
```
User fills email → blur → Event #1 sent (email only)
User fills name → blur → Event #2 sent (name only)
User fills phone → blur → Event #3 sent (phone only)
User closes tab → beforeunload → Event #4 sent (all fields)
```

**Result**: 4 separate tracking events for one form interaction

---

## ✅ Desired Behavior (Batch capture)

**New Behavior** (All fields at once):
```
User fills email → blur → Field tracked locally (no event sent)
User fills name → blur → Field tracked locally (no event sent)
User fills phone → blur → Field tracked locally (no event sent)
User closes tab → beforeunload → Event #1 sent (email + name + phone)
```

**Result**: 1 tracking event with all partial data

---

## 🔍 When to Capture Partial Form Data

### Option 1: **Debounced Capture** (Recommended)
Capture all filled fields after user stops interacting for X seconds.

```javascript
// User fills fields
email blur → Start 3s timer
name blur → Reset 3s timer
phone blur → Reset 3s timer
// 3 seconds pass with no activity...
→ Send event with ALL fields (email, name, phone)
```

**Pros**:
- ✅ Single event per form session
- ✅ Captures all progress before user leaves
- ✅ Works even if user doesn't close tab
- ✅ Reduces server load (fewer events)

**Cons**:
- ⚠️ Small delay before capture (acceptable)

---

### Option 2: **On Page Leave Only**
Only capture when user tries to leave (beforeunload / visibilitychange).

```javascript
// User fills fields (no events sent)
User closes tab → beforeunload → Send event with ALL fields
User switches tab → visibilitychange → Send event with ALL fields
```

**Pros**:
- ✅ Absolutely minimal server load
- ✅ Only captures "abandoned" forms

**Cons**:
- ❌ Misses long sessions where user doesn't leave
- ❌ Browser limitations on beforeunload

---

### Option 3: **Hybrid Approach** (Best)
Combine debounced + page leave for maximum capture rate.

```javascript
// Capture on inactivity (debounced)
User stops typing for 5s → Send event with ALL fields

// Also capture on page leave (backup)
User closes tab → beforeunload → Send event with ALL fields (if not already sent)
```

**Pros**:
- ✅ Highest capture rate
- ✅ Handles all scenarios
- ✅ Still minimal events (1-2 per session)

**Cons**:
- ⚠️ Slightly more complex logic

---

## 🛠️ Implementation Strategy

### Step 1: Track Fields in Memory
Instead of sending events on blur, store field values in memory.

```javascript
// Per-form state tracker
const formStateTracker = new Map(); // formId → { fields, lastActivity }

function onFieldBlur(formId, fieldName, fieldValue) {
  // Don't send event immediately!
  if (!formStateTracker.has(formId)) {
    formStateTracker.set(formId, { fields: {}, lastActivity: Date.now() });
  }
  
  const state = formStateTracker.get(formId);
  state.fields[fieldName] = fieldValue;
  state.lastActivity = Date.now();
  
  // Start/reset debounce timer
  resetDebounceTimer(formId);
}
```

---

### Step 2: Debounced Batch Send
Send all fields after inactivity period.

```javascript
const debounceTimers = new Map();
const DEBOUNCE_DELAY = 5000; // 5 seconds

function resetDebounceTimer(formId) {
  // Clear existing timer
  if (debounceTimers.has(formId)) {
    clearTimeout(debounceTimers.get(formId));
  }
  
  // Set new timer
  const timer = setTimeout(() => {
    sendBatchedFormData(formId);
  }, DEBOUNCE_DELAY);
  
  debounceTimers.set(formId, timer);
}

function sendBatchedFormData(formId) {
  const state = formStateTracker.get(formId);
  if (!state || Object.keys(state.fields).length === 0) {
    return; // Nothing to send
  }
  
  console.log('[YourCRM] Sending batched form data:', formId, state.fields);
  
  sendEvent({
    apiKey: apiKey,
    type: 'form_interaction',
    form: {
      formId: formId,
      trigger: 'batch_capture',
      fields: state.fields, // ALL fields at once!
      fieldCount: Object.keys(state.fields).length,
      formProgress: calculateFormProgress(formId)
    },
    page: getPageContext()
  }, apiUrl);
  
  // Mark as sent
  state.lastSent = Date.now();
}
```

---

### Step 3: Backup Capture on Page Leave
Ensure we capture data even if user closes tab before debounce.

```javascript
window.addEventListener('beforeunload', function() {
  // Send any unsent form data immediately
  formStateTracker.forEach((state, formId) => {
    if (!state.lastSent || state.lastActivity > state.lastSent) {
      // Has new data that hasn't been sent
      sendBatchedFormData(formId);
    }
  });
});

// Also capture on tab switch (better browser support)
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    formStateTracker.forEach((state, formId) => {
      if (!state.lastSent || state.lastActivity > state.lastSent) {
        sendBatchedFormData(formId);
      }
    });
  }
});
```

---

## 📊 Configuration Options

Add new config options to control batch behavior:

```typescript
interface FormsConfig {
  // Existing options...
  trackInteractions: boolean;
  
  // NEW: Batch capture options
  batchCapture?: {
    enabled: boolean;           // Enable batch capture mode
    debounceMs: number;          // Wait time after last field blur (default: 5000)
    captureOnVisibilityChange: boolean;  // Capture when tab hidden (default: true)
    captureOnBeforeUnload: boolean;      // Capture on page close (default: true)
    minFieldsForCapture: number; // Min fields before sending (default: 1)
  };
}
```

**Example Configuration**:
```javascript
widgets: {
  forms: {
    enabled: true,
    trackInteractions: true,
    
    // Batch capture settings
    batchCapture: {
      enabled: true,              // Enable batching
      debounceMs: 5000,           // Wait 5s after last interaction
      captureOnVisibilityChange: true,  // Capture on tab switch
      captureOnBeforeUnload: true,      // Capture on page close
      minFieldsForCapture: 1      // Send even if just 1 field filled
    }
  }
}
```

---

## 🎯 Benefits

### Before (Current):
- ❌ 1 event per field = high server load
- ❌ Incomplete partial leads (only last field captured)
- ❌ Harder to reassemble full user journey
- ❌ More database writes

### After (Batched):
- ✅ 1 event per form session = low server load
- ✅ Complete partial leads (all fields captured together)
- ✅ Cleaner data (one record per form attempt)
- ✅ Fewer database writes (80-90% reduction)

---

## 📈 Performance Impact

### Event Reduction:
```
Before: User fills 5 fields = 5 events + 1 beforeunload = 6 events
After:  User fills 5 fields = 1 batched event = 1 event

Result: 83% reduction in tracking events!
```

### Server Load:
```
Before: 1000 form interactions/day × 5 fields avg = 5000 events
After:  1000 form interactions/day × 1 batch = 1000 events

Result: 80% reduction in server requests!
```

---

## 🔄 Migration Path

### Phase 1: Add Batch Mode (Opt-in)
- Keep existing field-by-field tracking
- Add new `batchCapture` config option
- Clients can choose which mode to use

### Phase 2: Make Batch Default
- Enable batch mode by default for new clients
- Keep field-by-field as legacy option

### Phase 3: Deprecate Field-by-Field
- Remove single-field tracking
- All clients use batch mode

---

## 🧪 Testing Scenarios

### Test 1: Debounced Capture
```
1. Fill email field
2. Wait 6 seconds (> debounce delay)
3. Expected: 1 event with email field
```

### Test 2: Multiple Fields Before Debounce
```
1. Fill email field
2. Fill name field (within 5s)
3. Fill phone field (within 5s)
4. Wait 6 seconds
5. Expected: 1 event with ALL 3 fields
```

### Test 3: Tab Switch Capture
```
1. Fill email + name
2. Switch to another tab
3. Expected: 1 event with both fields
```

### Test 4: Page Close Capture
```
1. Fill email + name + phone
2. Close tab immediately (before debounce)
3. Expected: 1 event with all 3 fields
```

### Test 5: No Duplicate Events
```
1. Fill email + name
2. Wait 6s (debounce fires → event sent)
3. Close tab
4. Expected: Only 1 event total (no duplicate on close)
```

---

## 🎨 Lead Quality Improvement

### Current Data (Field-by-Field):
```json
// Event 1
{
  "type": "form_interaction",
  "form": {
    "formId": "contact-form",
    "fieldName": "email",
    "fieldValue": "john@example.com"
  }
}

// Event 2
{
  "type": "form_interaction",
  "form": {
    "formId": "contact-form",
    "fieldName": "name",
    "fieldValue": "John Doe"
  }
}
```
❌ Harder to piece together into a lead

---

### New Data (Batched):
```json
{
  "type": "form_interaction",
  "form": {
    "formId": "contact-form",
    "trigger": "batch_capture",
    "fields": {
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1-555-1234",
      "company": "Acme Corp"
    },
    "fieldCount": 4,
    "formProgress": {
      "percentComplete": 80,
      "totalFields": 5,
      "completedFields": ["email", "name", "phone", "company"]
    }
  }
}
```
✅ Perfect for lead creation - all data in one place!

---

## 🚀 Recommended Implementation

**Best Approach**: Hybrid (Debounced + Page Leave)

**Settings**:
```javascript
batchCapture: {
  enabled: true,
  debounceMs: 5000,              // 5 seconds
  captureOnVisibilityChange: true,
  captureOnBeforeUnload: true,
  minFieldsForCapture: 1
}
```

**Captures**:
- ✅ When user stops typing (5s delay)
- ✅ When user switches tabs
- ✅ When user closes page
- ✅ Never duplicates events

**Result**:
- 80-90% fewer events
- Complete partial leads
- Better user experience (less tracking overhead)
- Cleaner database

---

## 📝 Next Steps

1. ✅ Review this strategy
2. 🔄 Implement batch capture mode in `main-app.v1.js`
3. 🔄 Add `batchCapture` config to `ClientConfig` interface
4. 🔄 Update seeded clients with batch mode enabled
5. 🔄 Test all scenarios
6. 🔄 Update documentation

---

**Status**: 📋 Design Complete - Ready for Implementation
