# CRM Web Tracker - API Documentation

## Overview

This service implements the scalable CRM widget platform architecture with dynamic script loading, client configuration management, and event tracking.

## Architecture

The system follows the **Inline Bootloader (Command Queue)** pattern:

1. **Client Integration**: Clients add a single `<script>` tag to their website
2. **Dynamic Loader**: The script tag loads a personalized JavaScript loader from `/script/:clientId.js`
3. **Configuration Injection**: The loader contains client-specific configuration (widgets, theme, etc.)
4. **Main App Loading**: The loader dynamically fetches the main application from CDN
5. **Widget Initialization**: The main app reads the configuration and initializes enabled widgets

## API Endpoints

### 1. Client Configuration Management

#### Create Client Configuration
```http
POST /v1/clients
Content-Type: application/json

{
  "clientId": "abc-123",
  "domain": "example.com",
  "apiKey": "sk_live_abc123",
  "isActive": true,
  "widgets": {
    "chat": {
      "enabled": true,
      "position": "bottom-right",
      "color": "#0066cc",
      "greeting": "Hi! How can we help?"
    },
    "analytics": {
      "enabled": true,
      "trackPageViews": true,
      "trackClicks": true
    }
  },
  "theme": {
    "primaryColor": "#0066cc",
    "fontFamily": "Arial, sans-serif"
  }
}
```

#### Get All Clients
```http
GET /v1/clients
```

#### Get Client by ID
```http
GET /v1/clients/:clientId
```

#### Update Client Configuration
```http
PUT /v1/clients/:clientId
Content-Type: application/json

{
  "widgets": {
    "chat": {
      "enabled": false
    }
  }
}
```

#### Delete Client
```http
DELETE /v1/clients/:clientId
```

### 2. Script Generation

#### Get Dynamic Loader Script
```http
GET /script/:clientId.js
```

Returns a personalized JavaScript loader with embedded client configuration.

**Response Headers:**
- `Content-Type: application/javascript`
- `Cache-Control: public, max-age=300`

**Example Response:**
```javascript
// YourCRM Loader Script for Client: abc-123
(function() {
  'use strict';
  
  window.YourCRM = window.YourCRM || function() {
    (window.YourCRM.q = window.YourCRM.q || []).push(arguments);
  };
  
  var config = {
    "clientId": "abc-123",
    "widgets": { /* ... */ }
  };
  
  window.YourCRM('init', config);
  
  // Load main app from CDN
  var script = document.createElement('script');
  script.src = config.cdnUrl + '/main-app.' + config.appVersion + '.js';
  // ...
})();
```

#### Get Embed Snippet
```http
GET /script/:clientId/embed
```

Returns the HTML snippet that clients should add to their websites.

**Response:**
```json
{
  "snippet": "<script src=\"https://api.yourcrm.com/script/abc-123.js\" async defer></script>"
}
```

### 3. Event Tracking

#### Track Events
```http
POST /v1/track
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "apiKey": "sk_live_abc123",
  "type": "pageview",
  "page": {
    "url": "https://example.com/pricing",
    "path": "/pricing",
    "title": "Pricing - Example.com"
  },
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

#### Track Form Submission
```http
POST /v1/track
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "apiKey": "sk_live_abc123",
  "type": "form_submission",
  "form": {
    "formId": "contact-form",
    "formName": "Contact Us Form",
    "fields": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "message": "I'm interested in your product",
      "password": "[REDACTED]"
    },
    "submittedAt": "2025-10-16T10:30:00.000Z"
  },
  "page": {
    "url": "https://example.com/contact",
    "path": "/contact",
    "title": "Contact Us - Example.com"
  },
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Event Types:**
- `pageview`: Page view tracking
- `identify`: User identification
- `custom`: Custom events
- `form_submission`: Form submission tracking (NEW)

**Response:** `202 Accepted` (event queued for processing)

**Note:** Sensitive fields (password, credit_card, ssn, cvv) are automatically redacted based on the `excludeFields` configuration.

## Client Integration Example

### Step 1: Create Client Configuration

```bash
curl -X POST http://localhost:5000/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "my-company",
    "domain": "mycompany.com",
    "apiKey": "sk_live_mykey123",
    "widgets": {
      "chat": { "enabled": true },
      "analytics": { "enabled": true }
    }
  }'
```

### Step 2: Get Embed Snippet

```bash
curl http://localhost:5000/script/my-company/embed
```

Response:
```json
{
  "snippet": "<script src=\"https://api.yourcrm.com/script/my-company.js\" async defer></script>"
}
```

### Step 3: Add to Website

Add the snippet to your website's `<head>` or before `</body>`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  <script src="https://api.yourcrm.com/script/my-company.js" async defer></script>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

### Step 4: Script Loads Automatically

When a user visits your website:
1. The loader script loads from `/script/my-company.js`
2. Configuration is injected into the page
3. Main application loads from CDN
4. Widgets initialize based on configuration
5. Events are tracked automatically

## Development

### Running the Server

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Access Swagger Documentation

Once the server is running, visit:
```
http://localhost:5000/api
```

## Testing

### Test the Dynamic Script Generation

```bash
# Get the loader script
curl http://localhost:5000/script/abc-123.js

# Get embed snippet
curl http://localhost:5000/script/abc-123/embed
```

### Test Event Tracking

```bash
curl -X POST http://localhost:5000/v1/track \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "apiKey": "sk_live_abc123",
    "type": "pageview",
    "page": {
      "url": "https://example.com/",
      "path": "/"
    }
  }'
```

## Architecture Benefits

1. **Zero Configuration**: Clients only add one script tag
2. **Centralized Control**: Update widget behavior without client changes
3. **Performance**: CDN delivery, async loading, command queue prevents blocking
4. **Flexibility**: Enable/disable widgets per client
5. **Scalability**: Stateless design, queue-based event processing

## Production Considerations

1. **Database**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Message Queue**: Integrate with SQS/RabbitMQ for event processing
3. **CDN**: Host `main-app.js` on CloudFront/Cloudflare
4. **Authentication**: Add API key validation for client endpoints
5. **Rate Limiting**: Implement rate limiting on tracking endpoint
6. **Monitoring**: Add application metrics and logging
7. **Caching**: Cache client configurations in Redis

## Example Client Configuration

The seeded example client (`abc-123`) demonstrates all features:

```json
{
  "clientId": "abc-123",
  "domain": "example.com",
  "isActive": true,
  "apiKey": "sk_live_abc123",
  "widgets": {
    "chat": {
      "enabled": true,
      "position": "bottom-right",
      "color": "#0066cc",
      "greeting": "Hi! How can we help you today?"
    },
    "analytics": {
      "enabled": true,
      "trackPageViews": true,
      "trackClicks": true
    },
    "forms": {
      "enabled": false
    }
  },
  "theme": {
    "primaryColor": "#0066cc",
    "fontFamily": "Arial, sans-serif"
  },
  "cdnUrl": "https://cdn.yourcrm.com",
  "appVersion": "v1"
}
```
