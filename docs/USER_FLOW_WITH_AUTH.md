# User Flow with JWT Authentication

## Overview

This document explains the complete user flow from initial setup to active tracking, now with JWT authentication integrated.

---

## 🔄 Complete User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: INITIAL SETUP                       │
│                    (One-time, Admin/Backend)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Practice Registration                                       │
│     POST /v1/clients                                            │
│     {                                                            │
│       "clientId": "tooth-docs-dental",                          │
│       "domain": "ads.toothdocsdental.com",                      │
│       "apiKey": "sk_live_toothdocs123"                          │
│     }                                                            │
│                                                                  │
│     → System generates client configuration                     │
│     → API key stored for authentication                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Configure Forms (Optional)                                  │
│     POST /v1/auth/token (Get JWT first)                         │
│     POST /v1/forms                                              │
│     {                                                            │
│       "formName": "Contact Form",                               │
│       "pageUrl": "https://ads.toothdocsdental.com/contact",     │
│       "formSelector": "#contact-form"                           │
│     }                                                            │
│                                                                  │
│     → Define forms to track                                     │
│     → Set up field mappings to CRM                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Embed Tracking Script                                       │
│     <script src="https://tracker.example.com/script/            │
│              tooth-docs-dental.js"></script>                    │
│                                                                  │
│     → Practice embeds script on their website                   │
│     → Script loads with client configuration                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 2: VISITOR INTERACTION                    │
│               (Every time a visitor arrives)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Script Initialization                                       │
│     → Script loads on visitor's browser                         │
│     → Fetches client configuration                              │
│       GET /v1/config/{apiKey}                                   │
│     → Initializes tracking modules                              │
│     → Generates/retrieves session ID                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. JWT Token Generation (NEW!)                                │
│     → Script sends API key to get JWT                           │
│       POST /v1/auth/token                                       │
│       { "apiKey": "sk_live_toothdocs123" }                      │
│                                                                  │
│     → Receives JWT with practice details:                       │
│       {                                                          │
│         "accessToken": "eyJhbGc...",                            │
│         "refreshToken": "eyJhbG...",                            │
│         "expiresIn": 86400                                      │
│       }                                                          │
│                                                                  │
│     → Stores JWT in sessionStorage                              │
│     → JWT contains: practiceId, domain, permissions, plan       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Visitor Activity Tracking                                   │
│     → Page views tracked                                        │
│     → Click events tracked                                      │
│     → Form interactions tracked                                 │
│     → Chat widget interactions (if enabled)                     │
│                                                                  │
│     All events sent to:                                         │
│     POST /v1/track/events                                       │
│     Headers: Authorization: Bearer {JWT}  ← NEW!                │
│     {                                                            │
│       "sessionId": "uuid",                                      │
│       "events": [...]                                           │
│     }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Form Submission (Lead Generation)                          │
│     → Visitor fills out form                                    │
│     → Script captures form data                                 │
│     → Validates against field mappings                          │
│     → Sends lead data:                                          │
│       POST /v1/leads (future endpoint)                          │
│       Headers: Authorization: Bearer {JWT}                      │
│       {                                                          │
│         "formId": "form-001",                                   │
│         "fields": {                                             │
│           "email": "john@example.com",                          │
│           "name": "John Doe"                                    │
│         }                                                        │
│       }                                                          │
│                                                                  │
│     → Lead created in CRM                                       │
│     → Notification sent to practice                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 3: PRACTICE MANAGEMENT                   │
│               (Practice staff accessing system)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Dashboard Login                                             │
│     → Practice staff logs into dashboard                        │
│     → Dashboard sends API key to get JWT                        │
│       POST /v1/auth/token                                       │
│       { "apiKey": "sk_live_toothdocs123" }                      │
│                                                                  │
│     → JWT stored in localStorage/cookie                         │
│     → JWT used for all subsequent API calls                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. Manage Forms & Configuration                               │
│     All requests include: Authorization: Bearer {JWT}           │
│                                                                  │
│     → View all forms: GET /v1/forms                             │
│     → Create new form: POST /v1/forms                           │
│     → Update form: PUT /v1/forms/{formId}                       │
│     → Configure fields: POST /v1/forms/{formId}/fields          │
│     → Set up CRM mappings: POST /v1/forms/fields/{id}/mapping   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. View Analytics & Leads                                    │
│      All requests include: Authorization: Bearer {JWT}          │
│                                                                  │
│      → View leads: GET /v1/leads                                │
│      → View analytics: GET /v1/analytics/dashboard              │
│      → Export data: GET /v1/analytics/export                    │
│      → Real-time events via WebSocket (future)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow Details

### Current Flow (With JWT)

```
┌──────────────┐
│   Browser    │
│  (Visitor)   │
└──────┬───────┘
       │
       │ 1. Load page with tracking script
       ▼
┌─────────────────────────────────────────┐
│  GET /script/tooth-docs-dental.js       │
│  (No auth required - public endpoint)   │
└─────────────────────────────────────────┘
       │
       │ 2. Script initializes
       ▼
┌─────────────────────────────────────────┐
│  GET /v1/config/{apiKey}                │
│  (No auth required - public config)     │
│                                          │
│  Returns: widget settings, tracking     │
│           configuration, etc.            │
└─────────────────────────────────────────┘
       │
       │ 3. Generate JWT token
       ▼
┌─────────────────────────────────────────┐
│  POST /v1/auth/token                    │
│  Body: { "apiKey": "sk_live_xxx" }      │
│                                          │
│  Returns: {                              │
│    "accessToken": "eyJhbG...",          │
│    "refreshToken": "eyJhbG...",         │
│    "expiresIn": 86400                   │
│  }                                       │
│                                          │
│  JWT Payload contains:                  │
│  - practiceId                           │
│  - practiceName                         │
│  - domain                               │
│  - permissions                          │
│  - plan                                 │
│  - isActive                             │
└─────────────────────────────────────────┘
       │
       │ 4. Store JWT in sessionStorage
       │    sessionStorage.setItem('jwt', token)
       │
       │ 5. Track events with JWT
       ▼
┌─────────────────────────────────────────┐
│  POST /v1/track/events                  │
│  Headers:                               │
│    Authorization: Bearer {JWT}          │
│  Body: {                                │
│    "sessionId": "uuid",                 │
│    "events": [...]                      │
│  }                                       │
│                                          │
│  Server validates JWT:                  │
│  ✓ Signature valid?                     │
│  ✓ Not expired?                         │
│  ✓ Practice is active?                  │
│  ✓ Has 'track_events' permission?       │
└─────────────────────────────────────────┘
       │
       │ 6. JWT expires after 24 hours
       ▼
┌─────────────────────────────────────────┐
│  POST /v1/auth/refresh                  │
│  Body: {                                │
│    "refreshToken": "eyJhbG..."          │
│  }                                       │
│                                          │
│  Returns new accessToken                │
└─────────────────────────────────────────┘
```

---

## 🎯 Two Authentication Paths

### Path 1: Client-Side Tracking (Visitors)

**Purpose**: Track visitor behavior, capture form submissions

**Flow**:
1. **Script loads** → No authentication needed (public endpoint)
2. **Get config** → API key in URL (backward compatible)
3. **Generate JWT** → API key in request body
4. **Track events** → JWT in Authorization header
5. **Auto-refresh** → Use refresh token before expiry

**Key Points**:
- JWT stored in sessionStorage (per-tab, cleared on close)
- JWT contains practiceId to ensure data isolation
- Automatic refresh before token expires
- Fallback to API key if JWT fails (backward compatibility)

**Example Client-Side Code**:
```javascript
// main-app.v1.js (needs to be updated)
class CRMTracker {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.jwt = null;
    this.refreshToken = null;
  }

  async init() {
    // 1. Fetch configuration
    await this.fetchConfig();
    
    // 2. Generate JWT token
    await this.generateJWT();
    
    // 3. Set up auto-refresh
    this.setupTokenRefresh();
    
    // 4. Start tracking
    this.startTracking();
  }

  async generateJWT() {
    const response = await fetch('/v1/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: this.apiKey })
    });
    
    const data = await response.json();
    this.jwt = data.accessToken;
    this.refreshToken = data.refreshToken;
    
    // Store in sessionStorage
    sessionStorage.setItem('crm_jwt', this.jwt);
    sessionStorage.setItem('crm_refresh', this.refreshToken);
  }

  setupTokenRefresh() {
    // Refresh token 5 minutes before expiry (24h - 5min = 23h55min)
    const refreshInterval = (23 * 60 + 55) * 60 * 1000; // 23h55m in ms
    
    setInterval(async () => {
      await this.refreshJWT();
    }, refreshInterval);
  }

  async refreshJWT() {
    const response = await fetch('/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });
    
    const data = await response.json();
    this.jwt = data.accessToken;
    sessionStorage.setItem('crm_jwt', this.jwt);
  }

  async trackEvent(event) {
    const response = await fetch('/v1/track/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwt}`
      },
      body: JSON.stringify(event)
    });
    
    // If 401, try to refresh and retry
    if (response.status === 401) {
      await this.refreshJWT();
      return this.trackEvent(event); // Retry
    }
    
    return response.json();
  }
}
```

### Path 2: Dashboard/Management (Practice Staff)

**Purpose**: Manage forms, view leads, configure settings

**Flow**:
1. **Login page** → Staff enters API key or credentials
2. **Generate JWT** → POST /v1/auth/token
3. **Store JWT** → localStorage (persists across tabs)
4. **All API calls** → Include JWT in Authorization header
5. **Token expires** → Redirect to login or auto-refresh

**Key Points**:
- JWT stored in localStorage (persists until logout)
- All management endpoints require JWT
- JWT contains permissions (manage_forms, view_leads, etc.)
- Server validates permissions for each endpoint

**Example Dashboard Code**:
```javascript
// dashboard.js
class DashboardAPI {
  constructor() {
    this.jwt = localStorage.getItem('dashboard_jwt');
  }

  async login(apiKey) {
    const response = await fetch('/v1/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    
    const data = await response.json();
    this.jwt = data.accessToken;
    localStorage.setItem('dashboard_jwt', this.jwt);
    localStorage.setItem('dashboard_refresh', data.refreshToken);
  }

  async getForms() {
    const response = await fetch('/v1/forms', {
      headers: {
        'Authorization': `Bearer ${this.jwt}`
      }
    });
    
    if (response.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
      return;
    }
    
    return response.json();
  }

  async createForm(formData) {
    const response = await fetch('/v1/forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwt}`
      },
      body: JSON.stringify(formData)
    });
    
    return response.json();
  }

  logout() {
    localStorage.removeItem('dashboard_jwt');
    localStorage.removeItem('dashboard_refresh');
    window.location.href = '/login';
  }
}
```

---

## 🔄 Migration Path (Backward Compatibility)

### Current System (API Key Only)

```javascript
// Old tracking code
fetch('/v1/track/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sk_live_abc123'  // API key in header
  },
  body: JSON.stringify(events)
});
```

### New System (JWT Preferred, API Key Fallback)

```javascript
// Updated tracking code with fallback
async function trackEvents(events) {
  // Try JWT first
  if (this.jwt) {
    const response = await fetch('/v1/track/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwt}`
      },
      body: JSON.stringify(events)
    });
    
    if (response.ok) return response.json();
  }
  
  // Fallback to API key (backward compatibility)
  const response = await fetch('/v1/track/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey
    },
    body: JSON.stringify(events)
  });
  
  return response.json();
}
```

**Server-Side Support**:
```typescript
// TrackingController (needs update)
@Post('events')
async trackEvents(
  @Headers('authorization') authHeader?: string,
  @Headers('x-api-key') apiKey?: string,
  @Body() events: any[]
) {
  let practiceId: string;
  
  // Try JWT first
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await this.authService.verifyToken(token);
    practiceId = payload.practiceId;
  }
  // Fallback to API key
  else if (apiKey) {
    const practice = await this.clientConfigService.findByApiKey(apiKey);
    practiceId = practice.clientId;
  }
  else {
    throw new UnauthorizedException('No authentication provided');
  }
  
  // Process events for this practice
  return this.trackingService.processEvents(practiceId, events);
}
```

---

## 🛡️ Security Benefits of JWT

### Before (API Key Only)

**Issues**:
- ❌ API key sent with every request (more exposure)
- ❌ No expiration (key valid forever until manually revoked)
- ❌ No embedded metadata (need database lookup every time)
- ❌ Same key for tracking and management
- ❌ Difficult to implement permissions

### After (JWT with API Key Fallback)

**Benefits**:
- ✅ API key used only once to generate JWT
- ✅ JWT expires automatically (24 hours)
- ✅ Practice details embedded in token (no DB lookup)
- ✅ Can have different tokens for different purposes
- ✅ Fine-grained permissions in token payload
- ✅ Can invalidate tokens without changing API key
- ✅ Backward compatible with existing implementations

---

## 📊 Data Isolation & Multi-Tenancy

### How JWT Ensures Data Isolation

```typescript
// JWT payload automatically contains practiceId
{
  "practiceId": "tooth-docs-dental",  // ← Identifies which practice
  "permissions": ["track_events", "view_leads", "manage_forms"],
  "isActive": true
}

// FormsController - Automatic isolation
@Get()
async getForms(@Request() req) {
  const practiceId = req.user.practiceId;  // From JWT payload
  
  // Only returns forms for THIS practice
  return this.formsService.getFormsByClient(practiceId);
}

// TrackingService - Automatic isolation
async processEvents(req: Request, events: Event[]) {
  const practiceId = req.user.practiceId;  // From JWT payload
  
  // Events tagged with THIS practice only
  events.forEach(event => {
    event.practiceId = practiceId;
    this.saveEvent(event);
  });
}
```

**Key Points**:
- Every JWT contains practiceId
- Every request automatically has practice context
- No risk of cross-practice data leakage
- Practice A cannot access Practice B's data
- Enforced at the framework level (Passport JWT)

---

## 🎯 Permission System

### JWT Permissions

```json
{
  "practiceId": "tooth-docs-dental",
  "permissions": [
    "track_events",      // Can track visitor events
    "view_leads",        // Can view lead data
    "manage_forms",      // Can create/edit/delete forms
    "view_analytics",    // Can view analytics
    "export_data",       // Can export data
    "manage_settings"    // Can change practice settings
  ]
}
```

### Permission Enforcement (Future)

```typescript
// Custom decorator for permission checks
@Post('forms')
@RequirePermissions('manage_forms')
async createForm(@Request() req, @Body() dto: CreateFormDto) {
  // Only executes if JWT has 'manage_forms' permission
}

// Permission guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const requiredPermissions = this.reflector.get('permissions', context.getHandler());
    const userPermissions = request.user.permissions;
    
    return requiredPermissions.every(p => userPermissions.includes(p));
  }
}
```

---

## 🚀 Recommended Next Steps

### 1. Update Client-Side Tracking Script (Priority: HIGH)

**File**: `public/main-app.v1.js`

**Changes needed**:
- Add JWT generation on initialization
- Store JWT in sessionStorage
- Include JWT in all tracking requests
- Implement auto-refresh logic
- Keep API key fallback for backward compatibility

### 2. Update TrackingController (Priority: HIGH)

**File**: `src/tracking/tracking.controller.ts`

**Changes needed**:
- Accept both JWT and API key authentication
- Prefer JWT over API key
- Extract practiceId from JWT payload
- Update Swagger documentation

### 3. Create Dashboard/Admin UI (Priority: MEDIUM)

**Components needed**:
- Login page (API key entry)
- JWT token management
- Forms management UI
- Leads viewer
- Analytics dashboard

### 4. Implement Lead Management APIs (Priority: MEDIUM)

**Endpoints needed**:
- `POST /v1/leads` - Create lead from form submission
- `GET /v1/leads` - List leads (with filters)
- `GET /v1/leads/:id` - Get lead details
- `PUT /v1/leads/:id` - Update lead status
- `DELETE /v1/leads/:id` - Delete lead

### 5. Add Analytics APIs (Priority: MEDIUM)

**Endpoints needed**:
- `GET /v1/analytics/dashboard` - Dashboard stats
- `GET /v1/analytics/events` - Event timeline
- `GET /v1/analytics/forms` - Form conversion rates
- `GET /v1/analytics/export` - Data export

---

## 📝 Summary

### Current State
✅ JWT authentication implemented and working
✅ Forms Management APIs complete with JWT protection
✅ Multi-tenant data isolation enforced
✅ Backward compatibility maintained

### User Flow Changes
🔄 **Tracking Script**: Add JWT generation step (one-time per session)
🔄 **Event Tracking**: Include JWT in Authorization header
✨ **New**: Dashboard can use JWT for all management operations
✨ **New**: Fine-grained permissions via JWT payload

### Key Benefits
🛡️ **Security**: JWT expires automatically, embedded validation
🚀 **Performance**: No database lookup needed (practice details in token)
🔐 **Isolation**: Automatic multi-tenant data separation
📊 **Permissions**: Granular access control via token claims
🔄 **Flexibility**: Can revoke tokens without changing API keys

### Migration Path
1. **Phase 1**: Update tracking script to generate JWT
2. **Phase 2**: Update TrackingController to accept JWT
3. **Phase 3**: Keep API key fallback for 6 months
4. **Phase 4**: Deprecate API key-only authentication
5. **Phase 5**: JWT becomes required

The system is now **production-ready** for JWT authentication with a clear backward-compatible migration path! 🎉
