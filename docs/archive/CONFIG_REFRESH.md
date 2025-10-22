# Configuration Refresh Behavior

## How It Works

The YourCRM tracking script loads the client configuration **once when the page loads**. The configuration is embedded directly in the loader script and controls which widgets are enabled.

### Configuration Loading Flow

1. **Client embeds script**: `<script src="http://localhost:5000/script/abc-123.js"></script>`
2. **Loader script loads**: Contains the current client configuration
3. **Main app initializes**: Reads config and enables/disables widgets based on settings
4. **Widgets initialize**: Form tracking, chat widget, analytics are initialized only if enabled

### When Config Changes Take Effect

**Config changes require a page refresh to take effect.** This is by design for several reasons:

1. **Simplicity**: No need for WebSocket or polling infrastructure
2. **Performance**: Reduces unnecessary network requests
3. **Reliability**: No complex state management for widget enable/disable
4. **Typical use case**: Config changes are administrative actions, not real-time requirements

### No-Cache Headers

The loader script is served with no-cache headers to ensure users always get the latest config on refresh:

```http
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

This means:
- ✅ Normal refresh (F5) will fetch the latest config
- ✅ No need for hard refresh (Ctrl+Shift+R)
- ✅ Changes apply immediately on next page load

### Server-Side Validation

Even if a client somehow has an outdated config, the **server validates** every tracking request:

```typescript
// In tracking.service.ts
if (trackEventDto.type === 'form_submission') {
  if (!client.widgets?.forms?.enabled) {
    throw new Error('Form tracking is not enabled for this client');
  }
}
```

This provides a safety net if cached scripts are somehow used.

## Testing the Behavior

### Test Scenario: Disable Form Tracking

1. Open the demo page: http://localhost:5000/demo
2. Submit a form - you'll see tracking events in console
3. Disable form tracking via API:
   ```bash
   curl -X PATCH http://localhost:5000/v1/clients/abc-123 \
     -H "Content-Type: application/json" \
     -d '{"widgets":{"forms":{"enabled":false}}}'
   ```
4. **Refresh the page** (F5)
5. Submit the form again - no tracking event will be sent
6. Console will show: `[YourCRM] Form tracking is DISABLED by configuration`

### Test Scenario: Enable Form Tracking

1. Enable form tracking via API:
   ```bash
   curl -X PATCH http://localhost:5000/v1/clients/abc-123 \
     -H "Content-Type: application/json" \
     -d '{"widgets":{"forms":{"enabled":true}}}'
   ```
2. **Refresh the page** (F5)
3. Submit the form - tracking events will be sent
4. Console will show: `[YourCRM] Form tracking is ENABLED`

## API Endpoints

### Get Current Config
```bash
GET http://localhost:5000/v1/clients/abc-123
```

### Update Config (Partial Update)
```bash
PATCH http://localhost:5000/v1/clients/abc-123
Content-Type: application/json

{
  "widgets": {
    "forms": {
      "enabled": false
    }
  }
}
```

### Get Loader Script (with embedded config)
```bash
GET http://localhost:5000/script/abc-123.js
```

The script includes the config inline:
```javascript
var config = {
  "clientId": "abc-123",
  "widgets": {
    "forms": {
      "enabled": false,  // ← This controls form tracking
      ...
    }
  }
}
```

## Best Practices

### For Administrators
- After changing config, inform users to refresh their page
- Changes are not retroactive for already-loaded pages
- Use the demo page to verify config changes work correctly

### For End Users
- Configuration is cached per page load
- Refreshing the page (F5) will apply any config changes
- No special action needed - normal browser refresh works

### For Production
- Consider showing a notification when config changes (via your admin dashboard)
- Document for clients that config changes require page refresh
- Use the server-side validation as a safety net

## Technical Details

### Why Not Real-Time Updates?

**Real-time updates via WebSocket were considered but rejected because:**

1. **Complexity**: Requires WebSocket infrastructure, reconnection logic, state management
2. **Overhead**: Every client would maintain a persistent connection
3. **Use Case**: Config changes are rare administrative actions, not user-driven
4. **Browser Compatibility**: Polling or WebSocket fallbacks add complexity
5. **Cost**: Additional server resources for minimal benefit

### Current Architecture Benefits

✅ **Simple**: Standard HTTP, no persistent connections  
✅ **Fast**: Config embedded in script, no additional API calls  
✅ **Reliable**: Browser refresh is a well-understood pattern  
✅ **Scalable**: No per-client connection state to manage  
✅ **CDN-Friendly**: Can be cached with short TTL in production  

### Future Enhancements

If real-time updates become a requirement, consider:

1. **Server-Sent Events (SSE)**: Simpler than WebSocket for one-way updates
2. **Short Polling**: Check for config updates every 30-60 seconds
3. **Broadcast Channel API**: Share updates across tabs (same origin only)
4. **Service Worker**: Intercept config requests and check for updates

For now, the refresh-based approach is sufficient for the use case.

## Example: Complete Config Update Flow

```bash
# 1. Check current config
curl http://localhost:5000/v1/clients/abc-123 | grep "forms"
# Output: "forms":{"enabled":true,...}

# 2. Disable form tracking
curl -X PATCH http://localhost:5000/v1/clients/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"widgets":{"forms":{"enabled":false}}}'

# 3. Verify script has new config
curl http://localhost:5000/script/abc-123.js | grep "forms" -A 3
# Output: "forms": { "enabled": false, ... }

# 4. User refreshes page → Gets new config → Form tracking disabled
```

## Summary

- ✅ Config changes take effect **on page refresh**
- ✅ No-cache headers ensure **no hard refresh needed**
- ✅ Server-side validation provides **safety net**
- ✅ Simple architecture, **no WebSocket complexity**
- ✅ Perfect for **administrative config changes**

This design provides the right balance of simplicity, reliability, and functionality for the use case.
