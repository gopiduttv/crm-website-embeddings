# Batch Capture Testing Guide

**Date**: October 22, 2025  
**Feature**: Batch Form Field Capture  
**Status**: ✅ Implemented - Ready for Testing

---

## 🎯 What to Test

The batch capture feature collects all filled form fields in memory and sends them together as **one event** instead of sending separate events for each field.

---

## 🚀 Quick Start

### 1. Start the Server
```bash
cd /home/gopiduttv/crm-web-tracker/website-service
npm run start:dev
```

### 2. Open Demo Page
```
http://localhost:5000/demo
```

### 3. Open Browser Console
Press `F12` and look for logs starting with `[YourCRM]`

---

## 🧪 Test Scenarios

### ✅ Test 1: Debounced Batch Capture

**Goal**: Verify that fields are batched and sent after user stops typing

**Steps**:
1. Open `http://localhost:5000/demo`
2. Fill in the **email** field
3. Press TAB (blur event triggers)
4. Fill in the **name** field  
5. Press TAB (blur event triggers)
6. Fill in the **phone** field
7. Press TAB (blur event triggers)
8. **Wait 3 seconds** (debounce timer)

**Expected Behavior**:
```
[YourCRM] ⚡ Blur on: email → tracking in memory
[YourCRM] 💾 Tracking field in memory: contact-form email
[YourCRM] ⏲️  Debounce timer reset for: contact-form (3000ms)

[YourCRM] ⚡ Blur on: name → tracking in memory
[YourCRM] 💾 Tracking field in memory: contact-form name
[YourCRM] ⏲️  Debounce timer reset for: contact-form (3000ms)

[YourCRM] ⚡ Blur on: phone → tracking in memory
[YourCRM] 💾 Tracking field in memory: contact-form phone
[YourCRM] ⏲️  Debounce timer reset for: contact-form (3000ms)

// 3 seconds later...
[YourCRM] ⏰ Debounce timer fired for: contact-form
[YourCRM] 📦 Sending batched form data: contact-form { email: "...", name: "...", phone: "..." }
```

**✅ Success Criteria**:
- Only **1 event** sent with all 3 fields
- Event type: `form_interaction`
- Event trigger: `batch_capture`
- Event contains `fields` object with all values

---

### ✅ Test 2: Tab Switch Capture

**Goal**: Verify immediate capture when user switches tabs

**Steps**:
1. Open `http://localhost:5000/demo`
2. Fill in **email** and **name** fields (blur on each)
3. **Immediately switch to another tab** (before 3s debounce)

**Expected Behavior**:
```
[YourCRM] 💾 Tracking field in memory: contact-form email
[YourCRM] 💾 Tracking field in memory: contact-form name
[YourCRM] 👁️ Tab hidden, sending batched data...
[YourCRM] 📦 Sending batched form data: contact-form { email: "...", name: "..." }
```

**✅ Success Criteria**:
- Event sent **immediately** on tab switch (no 3s wait)
- All filled fields captured together
- Works even if debounce hasn't fired yet

---

### ✅ Test 3: Page Close Capture

**Goal**: Verify capture when user closes tab/window

**Steps**:
1. Open `http://localhost:5000/demo`
2. Fill in **email**, **name**, and **company** fields
3. **Close the tab** (or reload page)

**Expected Behavior**:
```
[YourCRM] 💾 Tracking field in memory: contact-form email
[YourCRM] 💾 Tracking field in memory: contact-form name
[YourCRM] 💾 Tracking field in memory: contact-form company
[YourCRM] 🚪 Page closing, sending batched data...
[YourCRM] 📦 Sending batched form data: contact-form { email: "...", name: "...", company: "..." }
```

**✅ Success Criteria**:
- `beforeunload` event triggers batch send
- All fields captured before page closes
- No data loss

---

### ✅ Test 4: No Duplicate Events

**Goal**: Ensure no duplicate events when both debounce and beforeunload fire

**Steps**:
1. Fill in fields
2. Wait for debounce (3s) → event sent
3. Then close tab immediately

**Expected Behavior**:
```
// After 3s debounce
[YourCRM] 📦 Sending batched form data: contact-form {...}

// On page close
[YourCRM] 🚪 Page closing, sending batched data...
[YourCRM] Already sent recently, skipping: contact-form
```

**✅ Success Criteria**:
- Only **1 event total**
- Second attempt is skipped (detected as duplicate)
- `lastSent` timestamp prevents duplicates

---

### ✅ Test 5: Multiple Forms

**Goal**: Verify that multiple forms on one page are tracked independently

**Steps**:
1. Create a page with 2 forms
2. Fill fields in form #1
3. Fill fields in form #2
4. Wait or close tab

**Expected Behavior**:
```
[YourCRM] 📦 Sending batched form data: form-1 { email: "..." }
[YourCRM] 📦 Sending batched form data: form-2 { email: "..." }
```

**✅ Success Criteria**:
- Each form tracked separately
- Each form sends own batch event
- No cross-contamination of field data

---

### ✅ Test 6: Min Fields Threshold

**Goal**: Verify that events only send if minimum fields are filled

**Steps**:
1. Configure `minFieldsForCapture: 2` in config
2. Fill only 1 field
3. Wait or close tab

**Expected Behavior**:
```
[YourCRM] Not enough fields to send for: contact-form
```

**✅ Success Criteria**:
- No event sent with only 1 field
- Event sent when 2+ fields filled
- Configurable threshold works

---

## 📊 Verify in Backend

### Check Tracking Endpoint

Open a second terminal and monitor the tracking endpoint:

```bash
# Watch for incoming events
tail -f /path/to/server/logs | grep "form_interaction"
```

Or use curl to check the last event:

```bash
curl http://localhost:5000/v1/events/recent
```

**Expected Event Structure**:
```json
{
  "type": "form_interaction",
  "apiKey": "sk_test_demo123",
  "timestamp": "2025-10-22T16:45:00.000Z",
  "form": {
    "formId": "contact-form",
    "trigger": "batch_capture",
    "fields": {
      "email": "test@example.com",
      "name": "John Doe",
      "phone": "+1-555-1234",
      "company": "Acme Corp"
    },
    "fieldCount": 4,
    "formProgress": {
      "completedFields": ["email", "name", "phone", "company"],
      "totalFields": 5,
      "percentComplete": 80
    }
  },
  "page": {
    "path": "/demo",
    "title": "YourCRM - Demo Page"
  }
}
```

---

## 🐛 Troubleshooting

### Issue: No events being sent

**Check**:
1. Is `batchCapture.enabled` set to `true` in config?
2. Are you filling **tracked fields**? (email, name, phone, etc.)
3. Are you waiting the full debounce time (3s)?
4. Check console for errors

### Issue: Events sent one at a time (not batched)

**Check**:
1. Verify batch capture is enabled: `window.YourCRM.config.widgets.forms.batchCapture.enabled`
2. Look for log: `[YourCRM] 🔥 Batch capture mode enabled`
3. If you see legacy mode, batch is disabled

### Issue: Fields not being tracked

**Check**:
1. Field name must match one in `trackFields` array
2. Field type must not be `hidden` or `password`
3. Field name must not match `excludeFields`
4. Field must have a value (not empty)

### Issue: Duplicate events

**Check**:
1. Look for "Already sent recently" log
2. Verify `lastSent` timestamp is being set
3. Check if multiple listeners are attached

---

## 🎨 Browser Console Commands

### Check if batch mode is enabled
```javascript
window.YourCRM.config.widgets.forms.batchCapture.enabled
```

### See all tracked forms
```javascript
// This won't work as formStateTracker is in closure
// Instead, check console logs for form IDs
```

### Manually trigger batch send
```javascript
// Not exposed publicly, use tab switch or wait for debounce
// Or close and reopen tab
```

---

## 📈 Performance Metrics

### Before Batch Capture (Field-by-Field)
- **User fills 5 fields**: 5-6 events sent
- **100 users/day**: ~500-600 events
- **Server load**: High
- **Database writes**: 500-600 records

### After Batch Capture
- **User fills 5 fields**: 1 event sent
- **100 users/day**: ~100 events
- **Server load**: Low
- **Database writes**: 100 records

**Result**: **80-83% reduction** in events! 🎉

---

## ✅ Acceptance Criteria

For this feature to be considered working:

- ✅ Fields are tracked in memory on blur
- ✅ Debounce timer resets on each new field
- ✅ Batch event sent after debounce timeout
- ✅ Batch event sent on tab switch (visibilitychange)
- ✅ Batch event sent on page close (beforeunload)
- ✅ No duplicate events
- ✅ All fields included in one event
- ✅ Event structure matches expected format
- ✅ Multiple forms tracked independently
- ✅ Min fields threshold respected

---

## 🚀 Next Steps

1. ✅ Test all scenarios above
2. Monitor production for 1 week
3. Gather metrics on event reduction
4. Collect user feedback
5. Adjust debounce timing if needed
6. Consider making batch mode default for all clients

---

**Status**: ✅ Ready for Testing
**Estimated Testing Time**: 30 minutes
**Required**: Browser with DevTools + Running server

---

## 📞 Questions?

If you encounter issues:
1. Check browser console for errors
2. Verify server logs
3. Review configuration in `client-config.service.ts`
4. Check `main-app.v1.js` implementation

Happy Testing! 🎉
