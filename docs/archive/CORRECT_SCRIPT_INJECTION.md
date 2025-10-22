# Correct Tracking Script Injection

## ⚠️ Important: Use the Correct Script URL

### ❌ INCORRECT (Generic Endpoint)
```html
<script src="http://localhost:5000/v1/track/client-script.js?clientId=bulk-test-US" async></script>
```

### ✅ CORRECT (Loader Script Endpoint)
```html
<script src="http://localhost:5000/script/{clientId}.js"></script>
```

## Why the Loader Script?

The loader script endpoint (`/script/{clientId}.js`) is the **proper way** to embed tracking because:

1. **Includes Client Configuration** - Automatically embeds the client's specific settings
2. **Dynamic Loading** - Loads widgets based on client configuration
3. **Self-Contained** - Single script includes everything needed
4. **Version Management** - Handles script versioning automatically

## Quick Fix Script

Run this to inject the **correct** tracking script:

```bash
./inject-correct-script.sh [clientId] [position]

# Examples:
./inject-correct-script.sh my-dental-tracker body-end
./inject-correct-script.sh test-client head
```

## Manual Injection with Correct Script

### 1. Create/Update Client Configuration

```bash
curl -X PUT http://localhost:5000/v1/clients/my-tracker \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Dental Tracker",
    "domain": "localhost",
    "widgets": {
      "forms": {
        "enabled": true,
        "autoCapture": true
      }
    }
  }'
```

### 2. Inject Correct Script

```bash
curl -X POST http://localhost:5000/crawler/inject-script \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "my-tracker",
    "trackingScriptUrl": "http://localhost:5000/script/my-tracker.js",
    "position": "body-end"
  }'
```

### 3. Verify the Script

The injected script should look like:

```html
</body>
<!-- CRM Tracker Injected Script - Start -->
<script src="http://localhost:5000/script/my-tracker.js"></script>
<!-- CRM Tracker Injected Script - End -->
</html>
```

## Bulk Crawl with Correct Script

When using bulk crawl, specify the **correct script URL format**:

```bash
curl -X POST http://localhost:5000/crawler/bulk-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "country": "US",
    "maxSites": 5,
    "maxPagesPerSite": 3,
    "injectScript": true,
    "scriptConfig": {
      "clientId": "dental-us-test",
      "trackingScriptUrl": "http://localhost:5000/script/dental-us-test.js",
      "position": "body-end"
    }
  }'
```

## What Gets Loaded

When the loader script (`/script/{clientId}.js`) is embedded:

1. **Loader Script** - Initializes the tracking system
2. **Client Config** - Loads your specific settings
3. **Main App** - Loads the main tracking application
4. **Widgets** - Loads enabled widgets (forms, clicks, etc.)

## Testing the Correct Script

### 1. Verify Loader Script is Accessible

```bash
# Should return JavaScript code
curl http://localhost:5000/script/my-tracker.js
```

### 2. Open in Browser

```bash
cd downloaded-sites
python3 -m http.server 8080

# Open: http://localhost:8080/www_brightnow_com/index.html
```

### 3. Check Browser Console

You should see:
```
✅ YourCRM Tracker initialized for client: my-tracker
✅ Configuration loaded
✅ Widgets loaded: forms, clicks, sessions
```

### 4. Monitor Events

```bash
curl http://localhost:5000/v1/events?clientId=my-tracker
```

## Fix Existing Injections

If you already injected the wrong script:

```bash
# 1. Remove incorrect scripts
./inject-correct-script.sh your-client-id

# Or manually:
curl -X POST http://localhost:5000/crawler/remove-scripts

# 2. Re-inject with correct script
curl -X POST http://localhost:5000/crawler/inject-script \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "your-client-id",
    "trackingScriptUrl": "http://localhost:5000/script/your-client-id.js",
    "position": "body-end"
  }'
```

## Updated Examples in Dashboard

The interactive dashboard has been updated to use the correct script URL:

```javascript
// In public/crawler-test.html
trackingScriptUrl: 'http://localhost:5000/script/' + clientId + '.js'
```

## Summary

**Always use this format:**
```html
<script src="http://localhost:5000/script/{clientId}.js"></script>
```

**Not this:**
```html
<script src="http://localhost:5000/v1/track/client-script.js?clientId={clientId}"></script>
```

The loader script endpoint is the **official, supported way** to embed the CRM tracker.

---

**Need help?** Run `./inject-correct-script.sh` to automatically fix all downloaded sites.
