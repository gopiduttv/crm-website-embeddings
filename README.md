# CRM Web Tracker - Website Service

**Lead-Focused Tracking System v2.0**

A lightweight, easy-to-integrate CRM tracking solution that captures complete and partial leads through form submissions and field interactions.

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test
```

### Integration

Add the tracking script to your website:

```html
<script src="https://api.yourcrm.com/script/YOUR-CLIENT-ID.js"></script>
```

That's it! The tracker will automatically:
- ✅ Capture complete form submissions
- ✅ Track partial leads from abandoned forms
- ✅ Monitor chat interactions
- ✅ Batch and queue events efficiently

---

## 📚 Documentation

All documentation is located in the **[`docs/`](./docs/)** folder:

### Core Documentation

- **[PRD.md](./docs/PRD.md)** - Product Requirements Document
  - Product vision and features
  - User stories and acceptance criteria
  - Roadmap and success metrics

- **[DESIGN.md](./docs/DESIGN.md)** - Technical Design Document
  - System architecture
  - Database schema
  - API design and data flow

- **[API_DOCS.md](./docs/API_DOCS.md)** - API Reference
  - Complete endpoint documentation
  - Request/response examples
  - Authentication

### Implementation Guides

- **[EVENT_TRACKING_DOCUMENTATION.md](./docs/EVENT_TRACKING_DOCUMENTATION.md)** - Event tracking details
- **[LEAD_FOCUSED_IMPLEMENTATION.md](./docs/LEAD_FOCUSED_IMPLEMENTATION.md)** - Lead tracking implementation
- **[FORM_TRACKING_INTERNALS.md](./docs/FORM_TRACKING_INTERNALS.md)** - Form tracking internals

### Testing & Guides

- **[TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** - Testing instructions
- **[IMPLEMENTATION_SUMMARY.md](./docs/IMPLEMENTATION_SUMMARY.md)** - Current implementation status

### Documentation Index

- **[instructions.md](./docs/instructions.md)** - Complete documentation index with quick reference

---

## 🎯 Key Features

### Lead-Focused Tracking

| Event Type | Purpose | Lead Created | Quality |
|------------|---------|--------------|---------|
| `form_submission` | Complete form data | ✅ Always | High |
| `form_interaction` | Partial form data | 🟡 If email present | Medium |
| `chat_message_sent` | Chat conversations | ✅ If email collected | High |

**What We DON'T Track** (no lead value):
- ❌ Page views
- ❌ Generic clicks
- ❌ Link clicks

### Event Triggers

- **`blur`** - Captures completed field values (primary trigger)
- **`beforeunload`** - Captures abandoned fields when tab closes (critical for partial leads)
- **`change`** - Captures dropdown/checkbox/radio selections immediately
- **`submit`** - Captures complete form submissions

### Privacy-First

- Automatic PII redaction (password, SSN, credit card, CVV, PIN)
- GDPR compliance
- Configurable data retention
- Cookie consent integration

---

## 🏗️ Architecture

```
┌─────────────────┐
│ Client Website  │
│  (form + chat)  │
└────────┬────────┘
         │ POST /v1/track
         ↓
┌─────────────────┐
│   NestJS API    │
│  - Tracking     │
│  - Lead Creation│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │
│  - Clients      │
│  - Forms/Fields │
│  - Leads/Events │
└─────────────────┘
```

---

## 📦 Project Structure

```
website-service/
├── docs/                      # 📚 Documentation
│   ├── PRD.md                # Product requirements
│   ├── DESIGN.md             # Technical design
│   ├── API_DOCS.md           # API reference
│   ├── EVENT_TRACKING_DOCUMENTATION.md
│   ├── TESTING_GUIDE.md
│   └── archive/              # Historical docs
├── src/
│   ├── app.module.ts
│   ├── clients/              # Client management
│   ├── forms/                # Form configuration
│   ├── tracking/             # Event tracking
│   ├── leads/                # Lead creation
│   └── script/               # Script generation
├── public/
│   ├── production-tracker.js # Client-side SDK
│   └── client-example.html   # Integration example
├── test/                      # E2E tests
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=crm_tracker

# API
SERVER_URL=http://localhost:5000
```

### Widget Configuration

```javascript
{
  widgets: {
    forms: {
      enabled: true,
      trackInteractions: true,
      trackFields: ['email', 'phone', 'name', 'company'],
      triggers: {
        blur: true,           // ✅ Primary
        beforeunload: true,   // ✅ Critical
        change: true          // ✅ For dropdowns
      },
      batchSize: 10,
      flushInterval: 5000
    },
    chat: {
      enabled: true,
      position: 'bottom-right',
      collectContactInfo: true
    }
  }
}
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```


### What's Working ✅
- Lead-focused event tracking
- Form field interaction tracking
- Event batching and queue management
- Chat widget with lead capture
- Privacy-first field redaction

### What's Next 🔄
- Dashboard for site management
- Form management UI
- Field mapping interface
- Live form preview/testing

