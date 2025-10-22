# 🎯 Form Submission Tracking - Testing Guide

## Overview

The form submission tracking feature is now fully implemented! This guide will help you test it.

## What's Been Implemented

### Backend Changes

1. **Updated DTOs**:
   - `FormsConfigDto` - Added `autoCapture`, `captureSelector`, and `excludeFields` properties
   - `TrackEventDto` - Added `form_submission` event type and `form` property

2. **Updated Services**:
   - `ClientConfigService` - Added `findByApiKey()` method and updated seed data with form config
   - `TrackingService` - Added validation and processing for form submission events

3. **Updated Controllers**:
   - `TrackingController` - Handles POST `/v1/track` for form submissions
   - `AssetsController` - Serves `main-app.v1.js` and demo page

4. **Client-Side Tracking**:
   - Created `public/main-app.v1.js` - Full-featured tracking script with:
     - Automatic page view tracking
     - Automatic form submission tracking
     - Chat widget initialization
     - Manual tracking APIs

5. **Demo Page**:
   - Created `public/demo.html` - Interactive test page with multiple forms

## Quick Start Testing

### Option 1: Use the Demo Page (Easiest)

1. **Start the server** (if not already running):
   ```bash
   npm run start:dev
   ```

2. **Open the demo page** in your browser:
   ```
   http://localhost:5000/demo
   ```

3. **Open Developer Console** (F12) to see tracking logs

4. **Fill out and submit the form** - You'll see:
   - Console logs from the YourCRM tracking script
   - Server logs in your terminal showing the tracked event
   - The password field will be automatically redacted

### Option 2: Test with cURL

#### Test Form Submission Tracking

```bash
curl -X POST http://localhost:5000/v1/track \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "apiKey": "sk_live_abc123",
    "type": "form_submission",
    "form": {
      "formId": "contact-form",
      "formName": "Contact Form",
      "fields": {
        "name": "John Doe",
        "email": "john@example.com",
        "message": "Test message",
        "password": "should-be-redacted"
      },
      "submittedAt": "2025-10-16T10:30:00.000Z"
    },
    "page": {
      "url": "https://example.com/contact",
      "path": "/contact"
    }
  }'
```

#### Test Page View Tracking

```bash
curl -X POST http://localhost:5000/v1/track \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "apiKey": "sk_live_abc123",
    "type": "pageview",
    "page": {
      "url": "https://example.com/",
      "path": "/"
    }
  }'
```

### Option 3: Integrate into Your Own HTML

Add this script tag to any HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  <!-- Add YourCRM tracking script -->
  <script src="http://localhost:5000/script/abc-123.js" async defer></script>
</head>
<body>
  <h1>Contact Us</h1>
  
  <form id="contact-form">
    <input type="text" name="name" placeholder="Your Name" required>
    <input type="email" name="email" placeholder="Your Email" required>
    <input type="password" name="password" placeholder="Password" required>
    <textarea name="message" placeholder="Your Message"></textarea>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

## Configuration Options

### Client Configuration

You can configure form tracking per client:

```bash
curl -X PUT http://localhost:5000/v1/clients/abc-123 \
  -H "Content-Type: application/json" \
  -d '{
    "widgets": {
      "forms": {
        "enabled": true,
        "autoCapture": true,
        "captureSelector": "form",
        "excludeFields": ["password", "credit_card", "ssn", "cvv"]
      }
    }
  }'
```

#### Configuration Properties:

- **`enabled`** (boolean): Enable/disable form tracking
- **`autoCapture`** (boolean): Automatically capture all forms (default: true)
- **`captureSelector`** (string): CSS selector for forms to track (default: "form")
- **`excludeFields`** (array): Field names to redact (default: ["password", "credit_card", "ssn", "cvv"])

### Example Configurations

#### 1. Track All Forms (Default)
```json
{
  "forms": {
    "enabled": true,
    "autoCapture": true
  }
}
```

#### 2. Track Only Specific Forms
```json
{
  "forms": {
    "enabled": true,
    "autoCapture": false,
    "captureSelector": ".track-me, #contact-form"
  }
}
```

#### 3. Disable Form Tracking
```json
{
  "forms": {
    "enabled": false
  }
}
```

#### 4. Custom Field Exclusions
```json
{
  "forms": {
    "enabled": true,
    "excludeFields": ["password", "secret", "api_key", "token"]
  }
}
```

## What to Look For

### In Browser Console

You should see logs like:
```
[YourCRM] Loader initialized for client: abc-123
[YourCRM] Main app loading...
[YourCRM] Initialized for client: abc-123
[YourCRM] Form tracking initialized {autoCapture: true, selector: "form", excludeFields: Array(4)}
[YourCRM] Event tracked successfully: pageview
[YourCRM] Form captured: Contact Us Form {name: "John Doe", email: "john@example.com", ...}
[YourCRM] Sending event: form_submission
[YourCRM] Event tracked successfully: form_submission
```

### In Server Terminal

You should see logs like:
```
[ClientConfigService] Seeded example client configuration: abc-123
[TrackingService] Queueing event type 'pageview' for client 'abc-123'
[TrackingService] Event processed: {...}
[TrackingService] Queueing event type 'form_submission' for client 'abc-123'
[TrackingService] Form submission: Contact Us Form with 5 fields
[TrackingService] Event processed: {...}
```

## Manual Tracking API

You can also manually track forms using the JavaScript API:

```javascript
// Track a specific form submission
YourCRM('trackForm', {
  formId: 'newsletter-form',
  formName: 'Newsletter Signup',
  fields: {
    email: 'user@example.com'
  }
});

// Identify a user
YourCRM('identify', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Track custom events
YourCRM('track', {
  name: 'button_clicked',
  properties: {
    buttonId: 'cta-button',
    section: 'hero'
  }
});
```

## Troubleshooting

### Form Not Being Tracked?

1. **Check if form tracking is enabled**:
   ```bash
   curl http://localhost:5000/v1/clients/abc-123
   ```
   Look for `widgets.forms.enabled: true`

2. **Check the selector**: If using a custom selector, make sure your form matches it
   ```html
   <!-- Will match with captureSelector: ".tracked-form" -->
   <form class="tracked-form">...</form>
   ```

3. **Check browser console**: Look for errors or warnings from YourCRM

4. **Check server logs**: Look for tracking events being received

### Script Not Loading?

1. Verify the script URL is correct:
   ```
   http://localhost:5000/script/abc-123.js
   ```

2. Check if the client exists:
   ```bash
   curl http://localhost:5000/v1/clients
   ```

3. Check browser Network tab for 404 errors

## API Endpoints

### Get All Clients
```bash
curl http://localhost:5000/v1/clients
```

### Get Client Configuration
```bash
curl http://localhost:5000/v1/clients/abc-123
```

### Get Loader Script
```bash
curl http://localhost:5000/script/abc-123.js
```

### Get Embed Snippet
```bash
curl http://localhost:5000/script/abc-123/embed
```

### Get Main App
```bash
curl http://localhost:5000/main-app.v1.js
```

### View Swagger Docs
```
http://localhost:5000/api
```

## Next Steps

1. **Add Database**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Add Message Queue**: Integrate with SQS/RabbitMQ for scalable event processing
3. **Add Webhooks**: Notify external systems when forms are submitted
4. **Add Analytics Dashboard**: Visualize form submission data
5. **Add CRM Integration**: Send form data to your CRM system
6. **Add Email Notifications**: Send emails when forms are submitted
7. **Deploy to Production**: Use a real CDN for the main-app.js file

## Security Notes

- Sensitive fields are automatically redacted based on `excludeFields` configuration
- Default excluded fields: `password`, `credit_card`, `ssn`, `cvv`
- File uploads only capture metadata (name, size, type), not content
- All tracking is done via HTTPS in production
- API keys should be validated before accepting events

## Support

For issues or questions:
1. Check server logs: Look at the terminal where `npm run start:dev` is running
2. Check browser console: Open DevTools (F12) and look at the Console tab
3. Test with cURL: Use the examples above to test the API directly
4. View Swagger docs: Visit `http://localhost:5000/api` for interactive API documentation

---

**Happy tracking! 🚀**
