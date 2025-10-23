# Quick Reference: User Flow with JWT Authentication

## 🎯 Simple Version

```
┌──────────────────────────────────────────────────────────────────┐
│                      VISITOR FLOW                                │
└──────────────────────────────────────────────────────────────────┘

1. 👤 Visitor lands on practice website
   └─ Tracking script auto-loads

2. 📜 Script initializes
   └─ GET /v1/config/{apiKey}  (gets tracking config)

3. 🔑 Script generates JWT token
   └─ POST /v1/auth/token { "apiKey": "sk_live_xxx" }
   └─ Receives JWT with practice details embedded
   └─ Stores in sessionStorage

4. 📊 Track visitor activity
   └─ POST /v1/track/events
   └─ Header: Authorization: Bearer {JWT}
   └─ Server knows which practice (from JWT payload)

5. 📝 Visitor submits form
   └─ POST /v1/leads (future)
   └─ Header: Authorization: Bearer {JWT}
   └─ Lead created for correct practice

┌──────────────────────────────────────────────────────────────────┐
│                    PRACTICE STAFF FLOW                           │
└──────────────────────────────────────────────────────────────────┘

1. 🔐 Staff logs into dashboard
   └─ Enters API key
   └─ POST /v1/auth/token { "apiKey": "sk_live_xxx" }
   └─ Receives JWT
   └─ Stores in localStorage

2. 📋 View/Manage Forms
   └─ GET /v1/forms
   └─ POST /v1/forms
   └─ All requests include: Authorization: Bearer {JWT}

3. 👥 View Leads
   └─ GET /v1/leads (future)
   └─ Header: Authorization: Bearer {JWT}

4. 📊 View Analytics
   └─ GET /v1/analytics (future)
   └─ Header: Authorization: Bearer {JWT}
```

## 🔐 Authentication Methods Comparison

| Method | When to Use | Security | Lifespan |
|--------|-------------|----------|----------|
| **API Key Only** (old) | Legacy systems | ⚠️ Medium | ♾️ Forever |
| **JWT Token** (new) | All new code | ✅ High | ⏰ 24 hours |
| **Refresh Token** | Extend session | ✅ High | 📅 7 days |

## 🎭 Two Ways to Authenticate

### Option 1: Just API Key (gets JWT)
```bash
curl -X POST /v1/auth/token \
  -d '{"apiKey": "sk_live_abc123"}'

# Returns JWT for "abc-123" practice
```

### Option 2: Practice ID + API Key (explicit)
```bash
curl -X POST /v1/auth/token \
  -d '{
    "practiceId": "tooth-docs-dental",
    "apiKey": "sk_live_toothdocs123"
  }'

# Returns JWT for "tooth-docs-dental" practice
```

## 🔄 Token Lifecycle

```
Generate Token → Use for 24h → Refresh → Use for 24h → Refresh → ...
    ↓              ↓              ↓           ↓             ↓
  Day 0         Day 1          Day 1       Day 2         Day 2
                             (23h 55m)                 (23h 55m)

After 7 days: Refresh token expires → User must re-authenticate
```

## 📦 What's in the JWT?

```json
{
  "practiceId": "tooth-docs-dental",    ← WHO is making the request
  "practiceName": "ToothDocs Dental",   ← Practice name
  "domain": "ads.toothdocsdental.com",  ← Practice domain
  "apiKey": "sk_live_toothdocs123",     ← For backward compat
  "permissions": [                       ← WHAT they can do
    "track_events",
    "view_leads",
    "manage_forms"
  ],
  "plan": "premium",                     ← Subscription level
  "isActive": true,                      ← Practice status
  "iat": 1729612345,                     ← Issued at (timestamp)
  "exp": 1729698745                      ← Expires at (timestamp)
}
```

## 🛡️ Security Features

| Feature | How It Works | Benefit |
|---------|--------------|---------|
| **Expiration** | Token invalid after 24h | Limits damage if stolen |
| **Signature** | Signed with secret key | Cannot be tampered with |
| **Practice Status** | Checked on validation | Inactive practices blocked |
| **Permissions** | Embedded in token | Fast authorization checks |
| **Multi-tenant** | practiceId in payload | Automatic data isolation |

## 🚀 Quick Start Examples

### For Client-Side Tracking
```javascript
// Initialize tracker
const tracker = new CRMTracker('sk_live_abc123');
await tracker.init(); // Generates JWT automatically

// Track events (JWT included automatically)
tracker.trackPageView();
tracker.trackFormInteraction('#contact-form');
```

### For Dashboard/API
```javascript
// Login
const api = new DashboardAPI();
await api.login('sk_live_abc123'); // Gets JWT

// Use authenticated endpoints
const forms = await api.getForms();        // JWT auto-included
const leads = await api.getLeads();        // JWT auto-included
await api.createForm(formData);            // JWT auto-included
```

## 🔧 Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| JWT Auth Service | ✅ Complete | Generate, verify, refresh |
| JWT Auth Controller | ✅ Complete | 3 endpoints working |
| Forms Management | ✅ Complete | 14 endpoints with JWT |
| Tracking with JWT | ⏳ Pending | Need to update script |
| Leads APIs | ⏳ Pending | Not yet implemented |
| Analytics APIs | ⏳ Pending | Not yet implemented |
| Dashboard UI | ⏳ Pending | Not yet implemented |

## 📊 API Endpoint Summary

### Public Endpoints (No Auth Required)
- `GET /script/{clientId}.js` - Load tracking script
- `GET /v1/config/{apiKey}` - Get client config

### Auth Endpoints
- `POST /v1/auth/token` - Generate JWT
- `POST /v1/auth/refresh` - Refresh JWT
- `GET /v1/auth/verify` - Verify JWT

### Protected Endpoints (JWT Required)
- `GET /v1/forms` - List forms
- `POST /v1/forms` - Create form
- `PUT /v1/forms/:id` - Update form
- `DELETE /v1/forms/:id` - Delete form
- ... (11 more form endpoints)

### Hybrid Endpoints (JWT or API Key)
- `POST /v1/track/events` - Track events (needs update)
- `GET /v1/clients` - List clients (needs update)

## 💡 Key Takeaways

1. **JWT = Practice Identity**
   - Every JWT knows which practice it belongs to
   - No need to pass practiceId in every request
   - Server automatically filters data by practice

2. **Two Authentication Layers**
   - API Key: Long-lived, used to generate JWT
   - JWT Token: Short-lived, used for actual requests
   - API key is like a password, JWT is like a session

3. **Backward Compatible**
   - Old code with API keys still works
   - New code should use JWT
   - Can migrate gradually

4. **Security by Default**
   - Tokens expire automatically
   - Practice status checked on every request
   - Multi-tenant isolation enforced
   - Permissions ready for future use

5. **Next Steps**
   - Update tracking script to use JWT
   - Build dashboard UI
   - Implement lead management APIs
   - Add analytics endpoints

---

**Need more details?** See: `docs/USER_FLOW_WITH_AUTH.md`

**Ready to test?** See: `docs/API_TESTING_GUIDE.md`

**Want to understand implementation?** See: `docs/IMPLEMENTATION_COMPLETE.md`
