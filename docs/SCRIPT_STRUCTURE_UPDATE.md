# Script Structure Update - Production-Tracker Pattern

## Overview
Updated [`public/main-app.v1.js`](public/main-app.v1.js ) to use the production-tracker bootloader pattern. This script now dynamically fetches client configuration before initializing tracking features.

## What Changed

### ✅ New Bootloader Pattern
- **Dynamic Configuration**: Fetches client config from `/v1/config/:apiKey` before initialization
- **Explicit Parameters**: All functions now receive `apiKey` and `apiUrl` as parameters (no global config dependency)
- **Better Separation**: Clear separation between initialization and execution

### ✅ Key Improvements

1. **Configuration Fetching**
   ```javascript
   fetch(apiUrl + '/v1/config/' + apiKey)
     .then(response => response.json())
     .then(config => {
       window.YourCRM.config = config;
       initializeTracking(config, apiKey, apiUrl);
     });
   ```

2. **Parameter Passing**
   - All tracking functions now accept `apiKey` and `apiUrl` explicitly
   - No reliance on global `config` object for API calls
   - Functions: `sendEvent()`, `trackFormSubmission()`, `initFormTracking()`, etc.

3. **Updated API Endpoint**
   - Changed from `/v1/track` to `/v1/track/events`
   - Now sends events in batch format: `{ events: [eventData] }`

4. **Single Script Name**
   - Removed `production-tracker.js` references
   - Using only [`public/main-app.v1.js`](public/main-app.v1.js ) for all environments
   - Simplified architecture

## Usage

### Client Embed Code
```html
<script>
  window.YourCRM = window.YourCRM || function() {
    (window.YourCRM.q = window.YourCRM.q || []).push(arguments);
  };
  YourCRM('init', {
    apiKey: 'your-api-key-here',
    apiUrl: 'http://localhost:5000'
  });
  
  var script = document.createElement('script');
  script.src = 'http://localhost:5000/main-app.v1.js';
  script.async = true;
  document.head.appendChild(script);
</script>
```

### Script Flow
1. Client loads embed code
2. `YourCRM('init', {...})` is queued
3. [`public/main-app.v1.js`](public/main-app.v1.js ) loads and executes
4. Script fetches configuration from `/v1/config/:apiKey`
5. Configuration determines which features to initialize:
   - Form tracking (if `config.widgets.forms.enabled`)
   - Chat widget (if `config.widgets.chat.enabled`)
   - Analytics (if `config.widgets.analytics.enabled`)

## Benefits

### 🎯 Dynamic Configuration
- Real-time config updates without re-deploying script
- Server-side control over client features
- A/B testing and feature flags

### 🔒 Security
- API key validated server-side
- No sensitive config in client-side code
- Centralized configuration management

### 🚀 Performance
- Single script to maintain
- Configuration cached in `window.YourCRM.config`
- Lazy-loading of features based on config

### 🛠️ Maintainability
- Clear function signatures with explicit parameters
- No hidden dependencies on global state
- Easier to test and debug

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/config/:apiKey` | GET | Fetch client configuration |
| `/v1/track/events` | POST | Submit tracking events (batch) |

## Migration Notes

### For Existing Clients
- No changes needed to embed code
- Existing `apiKey` and `apiUrl` continue to work
- Configuration now loaded dynamically

### For Developers
- All tracking functions now require `apiKey` and `apiUrl` parameters
- Use `window.YourCRM.config` to access loaded configuration
- Events sent to `/v1/track/events` in batch format

## Testing

To test the updated script:

1. **Start the server**
   ```bash
   npm run start:dev
   ```

2. **Open demo page**
   ```
   http://localhost:5000/demo
   ```

3. **Check console logs**
   - Should see configuration fetching
   - Should see feature initialization based on config
   - Should see tracking events being sent

## Related Files

- [`public/main-app.v1.js`](public/main-app.v1.js ) - Main tracking script
- `src/embedding/embedding.controller.ts` - Serves the script
- `src/embedding/embedding.service.ts` - Generates loader scripts
- `src/tracking/tracking.controller.ts` - Handles tracking events
- `src/tracking/client-config.service.ts` - Manages client configurations

## Future Enhancements

- [ ] Add script versioning for cache busting
- [ ] Implement CDN deployment strategy
- [ ] Add minification for production
- [ ] Add retry logic for failed config fetches
- [ ] Implement offline queue for events

---

**Last Updated**: October 22, 2025
