# CRM Web Tracker - Technical Design Document

**Last Updated**: October 22, 2025  
**Version**: 2.0  
**Status**: Phase 1 Complete

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model](#2-data-model)
3. [System Components](#3-system-components)
4. [Data Flow](#4-data-flow)
5. [API Design](#5-api-design)
6. [Client-Side SDK](#6-client-side-sdk)
7. [Event Tracking System](#7-event-tracking-system)
8. [Security & Privacy](#8-security--privacy)
9. [Performance Optimization](#9-performance-optimization)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Website                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  <script src="/script/{clientId}.js">                  │ │
│  │  ↓ Loads main-app.v1.js (bootloader)                   │ │
│  │  ↓ Fetches config from /v1/config/:apiKey              │ │
│  │  ↓ Attaches form listeners dynamically                 │ │
│  │  ↓ Tracks lead-generating events                       │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ GET /v1/config/:apiKey
                            │ POST /v1/track/events (batch)
                            │ GET /script/{clientId}.js
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CRM Web Tracker API (NestJS)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Embedding Module                        │   │
│  │  - Script generation (bootloader)                    │   │
│  │  - Loader scripts with config injection             │   │
│  │  - Static assets (demo, example pages)              │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              Tracking Module                         │   │
│  │  - Event ingestion & validation                      │   │
│  │  - Batch event processing                            │   │
│  │  - Lead creation & enrichment                        │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │          Client Config Service (Shared)              │   │
│  │  - Configuration management                          │   │
│  │  - API key validation                                │   │
│  │  - Feature flags                                     │   │
│  └───────────┬─────────────────┬────────────────────────┘   │
└──────────────┼─────────────────┼─────────────────────────────┘
               │                 │
               ▼                 ▼
     ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐
     │   MariaDB    │   │   MongoDB    │   │   CRM API       │
     │              │   │              │   │  (Salesforce)   │
     │ • Clients    │   │ • Events     │   │                 │
     │ • Forms      │   │ • Leads      │   │ • Contact sync  │
     │ • Fields     │   │ • Sessions   │   │ • Lead creation │
     │ • Mappings   │   │ • Analytics  │   │                 │
     └──────────────┘   └──────────────┘   └─────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Message Queue  │
                   │  (RabbitMQ/SQS) │
                   │                 │
                   │ • Event batches │
                   │ • Lead webhooks │
                   │ • CRM sync jobs │
                   └─────────────────┘
```

### 1.2 Design Principles

1. **Lead-Focused**: Only track events that generate leads
2. **Privacy-First**: Automatic PII redaction, GDPR compliance
3. **Performance**: < 100ms script load, < 50KB bundle size
4. **Resilient**: Event batching, retry logic, offline support
5. **Extensible**: Plugin architecture for CRM integrations

### 1.3 Technology Stack

**Backend**:
- **Framework**: NestJS (TypeScript)
- **Relational Database**: MariaDB 10.11+ (for client configs, forms, fields)
- **Document Database**: MongoDB 6.0+ (for events, tracking data)
- **ORM**: TypeORM (MariaDB) + Mongoose (MongoDB)
- **Authentication**: JWT + API Keys
- **Cache**: Redis (optional, for rate limiting)
- **Message Queue**: RabbitMQ / AWS SQS (for event processing)

**Module Architecture**:
- **Tracking Module**: Event tracking, batch processing, lead capture
- **Embedding Module**: Script generation, loader scripts, static assets
- **Client Config Module**: Configuration management (shared service)

**Frontend (Client SDK)**:
- **Language**: Vanilla JavaScript (ES6+)
- **Build**: None (pure ES6, no bundler needed)
- **Size**: < 30KB minified + gzipped
- **Pattern**: Bootloader (fetches config dynamically)

**Infrastructure**:
- **Hosting**: AWS / GCP / Azure
- **CDN**: CloudFlare / AWS CloudFront
- **Monitoring**: Datadog / New Relic
- **Logging**: ELK Stack / CloudWatch

---

## 2. Data Model

### 2.1 Entity Relationship Diagram

**MariaDB (Configuration Data)**
```
┌─────────────────────────────────────────────────────┐
│ Client (Site) - MariaDB                             │
│ ─────────────────────────────────────────────────  │
│ PK: clientId (CHAR(36))                             │
│     domain (VARCHAR(255), unique)                   │
│     apiKey (VARCHAR(255))                           │
│     isActive (BOOLEAN, default: true)               │
│     config (JSON) - widget settings                 │
│     createdAt (TIMESTAMP)                           │
│     updatedAt (TIMESTAMP)                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:N (One client has many forms)
                   │
┌──────────────────▼──────────────────────────────────┐
│ Form - MariaDB                                      │
│ ─────────────────────────────────────────────────  │
│ PK: formId (CHAR(36))                               │
│ FK: clientId → Client.clientId (CASCADE)            │
│     formName (VARCHAR(255))                         │
│     pageUrl (TEXT)                                  │
│     formSelector (VARCHAR(500))                     │
│     alternativeSelectors (JSON array)               │
│     isActive (BOOLEAN, default: true)               │
│     metadata (JSON)                                 │
│     createdAt (TIMESTAMP)                           │
│     updatedAt (TIMESTAMP)                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:N (One form has many fields)
                   │
┌──────────────────▼──────────────────────────────────┐
│ Field - MariaDB                                     │
│ ─────────────────────────────────────────────────  │
│ PK: fieldId (CHAR(36))                              │
│ FK: formId → Form.formId (CASCADE)                  │
│     fieldSelector (VARCHAR(500))                    │
│     fieldName (VARCHAR(255))                        │
│     fieldType (VARCHAR(50))                         │
│     label (VARCHAR(255))                            │
│     isRequired (BOOLEAN, default: false)            │
│     validationRules (JSON)                          │
│     displayOrder (INT, default: 0)                  │
│     createdAt (TIMESTAMP)                           │
│     updatedAt (TIMESTAMP)                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:1 (One field has one CRM mapping)
                   │
┌──────────────────▼──────────────────────────────────┐
│ FieldMapping - MariaDB                              │
│ ─────────────────────────────────────────────────  │
│ PK: mappingId (CHAR(36))                            │
│ FK: fieldId → Field.fieldId (CASCADE)               │
│     targetEntity (VARCHAR(100))                     │
│     targetField (VARCHAR(100))                      │
│     transform (VARCHAR(100))                        │
│     isRequired (BOOLEAN)                            │
│     createdAt (TIMESTAMP)                           │
│     updatedAt (TIMESTAMP)                           │
└─────────────────────────────────────────────────────┘
```

**MongoDB (Event & Lead Data)**
```
┌─────────────────────────────────────────────────────┐
│ Event Collection - MongoDB                          │
│ ─────────────────────────────────────────────────  │
│ _id: ObjectId                                       │
│ eventId: UUID                                       │
│ clientId: UUID (references MariaDB)                 │
│ formId: UUID (optional, references MariaDB)         │
│ eventType: String (form_submission, pageview, etc.) │
│ payload: Object (flexible schema)                   │
│   - form: Object (form submission data)             │
│   - page: Object (page context)                     │
│ sessionId: String                                   │
│ visitorId: String                                   │
│ userAgent: String                                   │
│ ipAddress: String (anonymized)                      │
│ geo: Object (country, region, city)                 │
│ timestamp: ISODate                                  │
│ createdAt: ISODate                                  │
│                                                     │
│ Indexes:                                            │
│  - { clientId: 1, timestamp: -1 }                   │
│  - { eventType: 1, timestamp: -1 }                  │
│  - { sessionId: 1 }                                 │
│  - { visitorId: 1 }                                 │
│  - { "payload.form.fields.email": 1 }               │
│  - TTL: 90 days on createdAt                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Lead Collection - MongoDB                           │
│ ─────────────────────────────────────────────────  │
│ _id: ObjectId                                       │
│ leadId: UUID                                        │
│ clientId: UUID (references MariaDB)                 │
│ formId: UUID (optional, references MariaDB)         │
│ email: String (indexed)                             │
│ name: String                                        │
│ firstName: String                                   │
│ lastName: String                                    │
│ phone: String                                       │
│ company: String                                     │
│ message: String                                     │
│ status: String (submitted, partial, chat_inquiry)   │
│ quality: String (high, medium, low)                 │
│ source: String (form_submission, chat, etc.)        │
│ sessionId: String                                   │
│ visitorId: String                                   │
│ utmSource: String                                   │
│ utmMedium: String                                   │
│ utmCampaign: String                                 │
│ referrer: String                                    │
│ crmSynced: Boolean                                  │
│ crmSyncedAt: ISODate (nullable)                     │
│ crmId: String (nullable)                            │
│ submittedAt: ISODate                                │
│ lastInteractionAt: ISODate                          │
│ createdAt: ISODate                                  │
│ updatedAt: ISODate                                  │
│                                                     │
│ Indexes:                                            │
│  - { clientId: 1, createdAt: -1 }                   │
│  - { email: 1 }                                     │
│  - { status: 1, createdAt: -1 }                     │
│  - { quality: 1 }                                   │
│  - { visitorId: 1 }                                 │
│  - { crmSynced: 1, crmSyncedAt: 1 }                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Session Collection - MongoDB                        │
│ ─────────────────────────────────────────────────  │
│ _id: ObjectId                                       │
│ sessionId: UUID (unique)                            │
│ clientId: UUID (references MariaDB)                 │
│ visitorId: UUID                                     │
│ startedAt: ISODate                                  │
│ endedAt: ISODate                                    │
│ duration: Number (seconds)                          │
│ pageViews: Array[Object]                            │
│ eventCount: Number                                  │
│ formSubmissions: Number                             │
│ utmParams: Object                                   │
│ referrer: String                                    │
│ landingPage: String                                 │
│ device: String                                      │
│ browser: String                                     │
│ os: String                                          │
│ geo: Object                                         │
│ createdAt: ISODate                                  │
│ updatedAt: ISODate                                  │
│                                                     │
│ Indexes:                                            │
│  - { clientId: 1, startedAt: -1 }                   │
│  - { visitorId: 1 }                                 │
│  - { sessionId: 1 } (unique)                        │
│  - TTL: 90 days on createdAt                        │
└─────────────────────────────────────────────────────┘
```

### 2.2 Database Architecture

**MariaDB**: Relational data (client configs, forms, fields, mappings)
**MongoDB**: Unstructured data (events, leads, sessions, analytics)

This hybrid approach provides:
- ✅ ACID compliance for critical configuration data
- ✅ Flexible schema for event data (varies by client)
- ✅ High write throughput for tracking events
- ✅ Efficient querying for both structured and unstructured data

### 2.3 MariaDB Schema (Configuration Data)

```sql
-- Clients Table
CREATE TABLE clients (
  client_id CHAR(36) PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSON DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clients_domain (domain),
  INDEX idx_clients_api_key (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Forms Table
CREATE TABLE forms (
  form_id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  form_name VARCHAR(255) NOT NULL,
  page_url TEXT NOT NULL,
  form_selector VARCHAR(500) NOT NULL,
  alternative_selectors JSON DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  metadata JSON DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
  INDEX idx_forms_client_id (client_id),
  INDEX idx_forms_page_url (page_url(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fields Table
CREATE TABLE fields (
  field_id CHAR(36) PRIMARY KEY,
  form_id CHAR(36) NOT NULL,
  field_selector VARCHAR(500) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  label VARCHAR(255),
  is_required BOOLEAN DEFAULT false,
  validation_rules JSON DEFAULT '{}',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(form_id) ON DELETE CASCADE,
  INDEX idx_fields_form_id (form_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Field Mappings Table
CREATE TABLE field_mappings (
  mapping_id CHAR(36) PRIMARY KEY,
  field_id CHAR(36) NOT NULL,
  target_entity VARCHAR(100) NOT NULL,
  target_field VARCHAR(100) NOT NULL,
  transform VARCHAR(100),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (field_id) REFERENCES fields(field_id) ON DELETE CASCADE,
  UNIQUE KEY unique_field_mapping (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.4 MongoDB Schema (Event & Lead Data)

```javascript
// Events Collection - High-volume tracking data
{
  _id: ObjectId("..."),
  eventId: "uuid-v4",
  clientId: "client-uuid",
  formId: "form-uuid",  // Optional
  eventType: "form_submission" | "pageview" | "identify" | "custom",
  
  // Event payload
  payload: {
    form: {
      formId: "contact-form",
      formName: "Contact Us",
      fields: {
        email: "user@example.com",
        name: "John Doe",
        message: "I'm interested..."
      }
    },
    page: {
      url: "https://example.com/contact",
      path: "/contact",
      title: "Contact Us",
      referrer: "https://google.com"
    }
  },
  
  // Session & visitor tracking
  sessionId: "session-uuid",
  visitorId: "visitor-uuid",
  
  // Request metadata
  userAgent: "Mozilla/5.0...",
  ipAddress: "192.168.1.1",  // Anonymized
  geo: {
    country: "US",
    region: "CA",
    city: "San Francisco"
  },
  
  // Timestamps
  timestamp: ISODate("2025-10-22T10:30:00Z"),
  createdAt: ISODate("2025-10-22T10:30:00Z")
}

// Indexes for Events
db.events.createIndex({ clientId: 1, timestamp: -1 });
db.events.createIndex({ eventType: 1, timestamp: -1 });
db.events.createIndex({ sessionId: 1 });
db.events.createIndex({ visitorId: 1 });
db.events.createIndex({ "payload.form.fields.email": 1 });
db.events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Leads Collection - Processed lead data
{
  _id: ObjectId("..."),
  leadId: "lead-uuid",
  clientId: "client-uuid",
  formId: "form-uuid",
  
  // Lead information
  email: "user@example.com",
  name: "John Doe",
  firstName: "John",
  lastName: "Doe",
  phone: "+1-555-0123",
  company: "Acme Corp",
  message: "I'm interested in your services",
  
  // Lead metadata
  status: "submitted" | "partial" | "chat_inquiry",
  quality: "high" | "medium" | "low",
  source: "form_submission" | "chat" | "abandoned_form",
  
  // Tracking data
  sessionId: "session-uuid",
  visitorId: "visitor-uuid",
  
  // Enrichment data
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "spring-2025",
  referrer: "https://google.com",
  landingPage: "https://example.com",
  
  // CRM sync status
  crmSynced: false,
  crmSyncedAt: null,
  crmId: null,
  crmErrors: [],
  
  // Timestamps
  submittedAt: ISODate("2025-10-22T10:30:00Z"),
  lastInteractionAt: ISODate("2025-10-22T10:35:00Z"),
  createdAt: ISODate("2025-10-22T10:30:00Z"),
  updatedAt: ISODate("2025-10-22T10:30:00Z")
}

// Indexes for Leads
db.leads.createIndex({ clientId: 1, createdAt: -1 });
db.leads.createIndex({ email: 1 });
db.leads.createIndex({ status: 1, createdAt: -1 });
db.leads.createIndex({ quality: 1 });
db.leads.createIndex({ visitorId: 1 });
db.leads.createIndex({ crmSynced: 1, crmSyncedAt: 1 });
db.leads.createIndex({ sessionId: 1 });

// Sessions Collection - User session tracking
{
  _id: ObjectId("..."),
  sessionId: "session-uuid",
  clientId: "client-uuid",
  visitorId: "visitor-uuid",
  
  // Session data
  startedAt: ISODate("2025-10-22T10:00:00Z"),
  endedAt: ISODate("2025-10-22T10:45:00Z"),
  duration: 2700, // seconds
  
  // Page views
  pageViews: [
    { url: "/", timestamp: ISODate("...") },
    { url: "/products", timestamp: ISODate("...") },
    { url: "/contact", timestamp: ISODate("...") }
  ],
  
  // Events in session
  eventCount: 15,
  formSubmissions: 1,
  
  // Attribution
  utmParams: {
    source: "google",
    medium: "cpc",
    campaign: "spring-2025"
  },
  referrer: "https://google.com",
  landingPage: "https://example.com",
  
  // Device & location
  userAgent: "Mozilla/5.0...",
  device: "desktop",
  browser: "Chrome",
  os: "Windows",
  geo: {
    country: "US",
    region: "CA",
    city: "San Francisco"
  },
  
  createdAt: ISODate("2025-10-22T10:00:00Z"),
  updatedAt: ISODate("2025-10-22T10:45:00Z")
}

// Indexes for Sessions
db.sessions.createIndex({ clientId: 1, startedAt: -1 });
db.sessions.createIndex({ visitorId: 1 });
db.sessions.createIndex({ sessionId: 1 }, { unique: true });
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

-- Events Table
CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(client_id) ON DELETE SET NULL,
  form_id UUID REFERENCES forms(form_id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(lead_id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  session_id VARCHAR(255),
  visitor_id VARCHAR(255),
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_form_id ON events(form_id);
CREATE INDEX idx_events_lead_id ON events(lead_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_visitor_id ON events(visitor_id);
```

### 2.3 Key Relationships

**1. Client → Forms (1:N)**
- A client can have multiple forms
- Deleting a client cascades to all forms
- Foreign Key: `forms.client_id → clients.client_id`

**2. Form → Fields (1:N)**
- A form can have multiple fields
- Deleting a form cascades to all fields
- Foreign Key: `fields.form_id → forms.form_id`

**3. Field → FieldMapping (1:1)**
- Each field can have one CRM mapping (optional)
- Deleting a field cascades to its mapping
- Foreign Key: `field_mappings.field_id → fields.field_id`

**4. Client → Leads (1:N)**
- A client can have many leads
- Deleting a client cascades to all leads
- Foreign Key: `leads.client_id → clients.client_id`

**5. Lead → Events (1:N)**
- A lead can have multiple events (submission + interactions)
- Deleting a lead cascades to its events
- Foreign Key: `events.lead_id → leads.lead_id`

### 2.4 Data Access Patterns

```typescript
// Get client configuration (for script generation)
SELECT c.*, 
       json_agg(DISTINCT f.*) as forms,
       json_agg(DISTINCT fi.*) as fields
FROM clients c
LEFT JOIN forms f ON c.client_id = f.client_id
LEFT JOIN fields fi ON f.form_id = fi.form_id
WHERE c.client_id = $1 AND c.is_active = true;

// Get leads for dashboard
SELECT l.*, f.form_name, c.domain
FROM leads l
JOIN clients c ON l.client_id = c.client_id
LEFT JOIN forms f ON l.form_id = f.form_id
WHERE c.client_id = $1
ORDER BY l.created_at DESC
LIMIT 100;

// Check for duplicate lead (deduplication)
SELECT * FROM leads
WHERE client_id = $1 
  AND email = $2 
  AND visitor_id = $3
  AND created_at > NOW() - INTERVAL '24 hours';
```

---

## 3. System Components

### 3.1 Application Server (NestJS)

**Module Architecture**:

The application is organized into two primary functional modules:

1. **Tracking Module**: Handles event ingestion, batch processing, and lead creation
2. **Embedding Module**: Manages script generation, loader scripts, and static asset serving

**Directory Structure**:
```
src/
├── app.module.ts              # Root module - imports TrackingModule & EmbeddingModule
├── main.ts                    # Application bootstrap with Swagger docs
├── tracking/                  # Tracking Module - Event processing & lead management
│   ├── tracking.controller.ts      # POST /v1/track/events (batch event ingestion)
│   ├── tracking.service.ts         # Event routing, validation, batch processing
│   ├── tracking.module.ts          # Module definition, exports services
│   ├── client-config.controller.ts # GET /v1/config/:apiKey, CRUD for clients
│   ├── client-config.service.ts    # Client configuration management (MariaDB)
│   ├── lead-creation.service.ts    # Lead processing from form submissions
│   ├── dto/
│   │   ├── track-events.dto.ts     # Batch event payload
│   │   ├── form-submission.dto.ts  # Form submission event
│   │   └── form-interaction.dto.ts # Form interaction event
│   ├── entities/                   # TypeORM entities for MariaDB
│   │   ├── client.entity.ts        # Client configuration
│   │   ├── form.entity.ts          # Form definitions
│   │   ├── field.entity.ts         # Field definitions
│   │   └── field-mapping.entity.ts # CRM field mappings
│   └── schemas/                    # Mongoose schemas for MongoDB
│       ├── event.schema.ts         # Event documents
│       ├── lead.schema.ts          # Lead documents
│       └── session.schema.ts       # Session documents
├── embedding/                 # Embedding Module - Script generation & serving
│   ├── embedding.controller.ts     # Script & Assets controllers
│   │   ├── ScriptController:       # GET /script/:clientId.js, /script/:clientId/embed
│   │   └── AssetsController:       # GET /main-app.:version.js, /demo, /example
│   ├── embedding.service.ts        # Script generation with bootloader pattern
│   ├── embedding.module.ts         # Module definition, imports TrackingModule
│   └── dto/
│       └── embed-config.dto.ts     # Embed snippet configuration
└── common/
    ├── guards/
    │   └── api-key.guard.ts
    ├── decorators/
    │   └── api-key.decorator.ts
    └── filters/
        └── http-exception.filter.ts
```

**Module Separation Rationale**:

- **Tracking Module**: Focuses on high-throughput event ingestion, batch processing, and lead creation. Uses MongoDB for storing events/leads (write-heavy) and MariaDB for client config lookup (read-heavy).

- **Embedding Module**: Handles script generation and serving, which is primarily read-heavy with occasional updates. Depends on TrackingModule's ClientConfigService for config data.

- **Data Layer**: TrackingModule uses TypeORM for MariaDB (clients, forms, fields) and Mongoose for MongoDB (events, leads, sessions), providing optimal performance for different data access patterns.

### 3.2 Embedding Service (Dynamic Script Generation with Bootloader Pattern)

The Embedding Module uses a **bootloader pattern** where the client-side script dynamically fetches its configuration from the server, eliminating the need for server-side script generation with placeholders.

**Architecture**:

1. **Loader Script**: Minimal script that bootstraps the tracker
2. **Main Script**: Full tracking implementation fetched after loader runs
3. **Dynamic Config**: Configuration fetched via API at runtime

```typescript
// embedding.service.ts
@Injectable()
export class EmbeddingService {
  constructor(
    private clientConfigService: ClientConfigService, // From TrackingModule
  ) {}

  /**
   * Generate loader script snippet for embedding
   * This is a small script that loads the main tracker
   */
  async generateLoaderScript(clientId: string): Promise<string> {
    const client = await this.clientConfigService.findOne(clientId);
    
    if (!client || !client.isActive) {
      throw new NotFoundException('Client not found');
    }

    return this.createLoaderScriptContent(client);
  }

  /**
   * Create the loader script content
   * This script:
   * 1. Fetches config from /v1/config/:apiKey
   * 2. Loads main-app.v1.js
   * 3. Initializes tracker with config
   */
  private createLoaderScriptContent(config: ClientConfig): string {
    const { apiKey, apiUrl } = config;
    
    return `
(function() {
  window.WebsiteTrackerConfig = {
    apiKey: '${apiKey}',
    apiUrl: '${apiUrl}',
    version: 'v1'
  };
  
  var script = document.createElement('script');
  script.src = '${apiUrl}/main-app.v1.js';
  script.async = true;
  document.head.appendChild(script);
})();
`.trim();
  }

  /**
   * Generate HTML embed snippet
   */
  async generateEmbedSnippet(clientId: string): Promise<string> {
    const loaderScript = await this.generateLoaderScript(clientId);
    
    return `<!-- Website Tracker by CRM Web Tracker -->
<script>
${loaderScript}
</script>`;
  }
}
```

**Bootloader Flow**:

```
1. Client Page Loads
   ↓
2. Loader Script Executes (inline)
   - Sets window.WebsiteTrackerConfig with apiKey & apiUrl
   - Injects main-app.v1.js script tag
   ↓
3. Main Script Loads (main-app.v1.js)
   - Reads config from window.WebsiteTrackerConfig
   - Fetches full config from GET /v1/config/:apiKey
   ↓
4. Tracker Initializes
   - Sets up event listeners
   - Configures tracking features (forms, chat, sessions)
   - Begins sending events to POST /v1/track/events
```

**Benefits**:

- **No server-side rendering**: Main script is static and cacheable
- **Dynamic configuration**: Config changes apply immediately without script regeneration
- **Faster delivery**: CDN can cache main-app.v1.js globally
- **Version control**: Easy to roll out script updates by changing version
- **Simplified architecture**: No need for per-client script generation

### 3.3 Tracking Service (Batch Event Processing with MongoDB)

The Tracking Service handles high-volume event ingestion using a **batch processing pattern** with MongoDB for optimal write performance.

**Batch Event Processing**:

```typescript
// tracking.service.ts
@Injectable()
export class TrackingService {
  constructor(
    private leadCreationService: LeadCreationService,
    @InjectModel('Event') private eventModel: Model<EventDocument>,
    @InjectModel('Session') private sessionModel: Model<SessionDocument>,
    private clientConfigService: ClientConfigService,
    private queueService: QueueService,
  ) {}

  /**
   * Handle batch event submission from client
   * POST /v1/track/events
   */
  async queueEvents(dto: TrackEventsDto): Promise<{ success: boolean; queued: number }> {
    // 1. Validate API key (cached lookup in MariaDB)
    const client = await this.clientConfigService.validateApiKey(dto.apiKey);
    
    if (!client || !client.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    // 2. Queue events for async processing
    const events = dto.events.map(event => ({
      ...event,
      clientId: client.clientId,
      receivedAt: new Date(),
    }));

    // 3. Add to processing queue (RabbitMQ/SQS)
    await this.queueService.addBatch('event-processing', events);

    return { 
      success: true, 
      queued: events.length 
    };
  }

  /**
   * Process individual event (called by queue worker)
   */
  async processEvent(event: QueuedEvent): Promise<void> {
    try {
      // Route to appropriate handler based on event type
      switch (event.type) {
        case 'form_submission':
          await this.handleFormSubmission(event);
          break;
        case 'form_interaction':
          await this.handleFormInteraction(event);
          break;
        case 'page_view':
          await this.handlePageView(event);
          break;
        case 'session_start':
          await this.handleSessionStart(event);
          break;
        case 'chat_message':
          await this.handleChatMessage(event);
          break;
        default:
          await this.handleGenericEvent(event);
      }
    } catch (error) {
      // Log error and optionally move to DLQ
      console.error(`Failed to process event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle form submission - Create lead and store event
   */
  private async handleFormSubmission(event: FormSubmissionEvent): Promise<void> {
    // 1. Create lead in MongoDB
    const lead = await this.leadCreationService.createFromFormSubmission({
      clientId: event.clientId,
      formId: event.payload.formId,
      fields: event.payload.fields,
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      metadata: event.metadata,
    });

    // 2. Store event in MongoDB with lead reference
    await this.eventModel.create({
      eventId: event.id,
      clientId: event.clientId,
      formId: event.payload.formId,
      leadId: lead.leadId,
      eventType: 'form_submission',
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      payload: event.payload,
      metadata: event.metadata,
      timestamp: new Date(event.timestamp),
      createdAt: new Date(),
    });

    // 3. Trigger CRM sync (async via queue)
    await this.queueService.add('crm-sync', { 
      leadId: lead.leadId,
      clientId: event.clientId 
    });

    // 4. Update session with form submission flag
    await this.sessionModel.updateOne(
      { sessionId: event.sessionId },
      { 
        $inc: { formSubmissions: 1, eventCount: 1 },
        $set: { endedAt: new Date() }
      }
    );
  }

  /**
   * Handle form interaction - Store event, create partial lead if email present
   */
  private async handleFormInteraction(event: FormInteractionEvent): Promise<void> {
    const hasEmail = event.payload.fields?.email || event.payload.fieldName === 'email';
    
    // Store event in MongoDB
    await this.eventModel.create({
      eventId: event.id,
      clientId: event.clientId,
      formId: event.payload.formId,
      eventType: 'form_interaction',
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      payload: event.payload,
      metadata: event.metadata,
      timestamp: new Date(event.timestamp),
      createdAt: new Date(),
    });

    // Create partial lead if email is present
    if (hasEmail) {
      await this.leadCreationService.createFromFormInteraction({
        clientId: event.clientId,
        formId: event.payload.formId,
        fields: event.payload.fields,
        sessionId: event.sessionId,
        visitorId: event.visitorId,
        metadata: event.metadata,
      });
    }
  }

  /**
   * Handle page view - Update session
   */
  private async handlePageView(event: PageViewEvent): Promise<void> {
    // Store event
    await this.eventModel.create({
      eventId: event.id,
      clientId: event.clientId,
      eventType: 'page_view',
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      payload: event.payload,
      metadata: event.metadata,
      timestamp: new Date(event.timestamp),
      createdAt: new Date(),
    });

    // Update session with page view
    await this.sessionModel.updateOne(
      { sessionId: event.sessionId },
      { 
        $push: { 
          pageViews: {
            url: event.payload.url,
            title: event.payload.title,
            timestamp: new Date(event.timestamp)
          }
        },
        $inc: { eventCount: 1 },
        $set: { 
          endedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: false }
    });
  }

  /**
   * Handle generic event - Just store
   */
  private async handleGenericEvent(event: GenericEvent): Promise<void> {
    await this.eventModel.create({
      eventId: event.id,
      clientId: event.clientId,
      eventType: event.type,
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      payload: event.payload,
      metadata: event.metadata,
      timestamp: new Date(event.timestamp),
      createdAt: new Date(),
    });
  }
}
```

**Performance Characteristics**:

- **Batch API**: Client sends up to 50 events per request
- **Async Processing**: Events queued immediately, processed by workers
- **MongoDB Writes**: Bulk inserts for high throughput (10k+ events/sec)
- **MariaDB Reads**: Cached client config lookups (Redis)
- **Session Updates**: Atomic operations with $inc and $push
- **TTL Indexes**: Events expire after 90 days automatically
      await this.eventsRepository.save({
        eventId: generateUUID(),
        clientId: client.clientId,
        formId: dto.formId,
        leadId: null,
        eventType: 'form_interaction',
        sessionId: dto.sessionId,
        visitorId: dto.visitorId,
        payload: dto,
        metadata: { trigger: dto.trigger },
        timestamp: new Date(),
      });
      return { success: true };
    }

    // Check for existing lead (deduplication)
    let lead = await this.leadCreationService.findExistingLead({
      clientId: client.clientId,
      email: dto.fields.email || dto.fieldValue,
      visitorId: dto.visitorId,
    });

    if (lead) {
      // Update existing lead
      await this.leadCreationService.updateLead(lead.leadId, {
        lastInteractionAt: new Date(),
        metadata: { ...lead.metadata, formProgress: dto.formProgress },
      });
    } else {
      // Create new partial lead
      lead = await this.leadCreationService.createFromFormInteraction({
        clientId: client.clientId,
        formId: dto.formId,
        fields: dto.fields || { [dto.fieldName]: dto.fieldValue },
        metadata: {
          sessionId: dto.sessionId,
          visitorId: dto.visitorId,
          trigger: dto.trigger,
          formProgress: dto.formProgress,
        },
      });
    }

    // Store event
    await this.eventsRepository.save({
      eventId: generateUUID(),
      clientId: client.clientId,
      formId: dto.formId,
      leadId: lead.leadId,
      eventType: 'form_interaction',
      sessionId: dto.sessionId,
      visitorId: dto.visitorId,
      payload: dto,
      metadata: { trigger: dto.trigger },
      timestamp: new Date(),
    });

    return { success: true };
  }
}
```

### 3.4 Lead Creation Service (MongoDB)

The Lead Creation Service manages lead documents in MongoDB, handling both complete form submissions and partial leads from form interactions.

```typescript
// lead-creation.service.ts
@Injectable()
export class LeadCreationService {
  constructor(
    @InjectModel('Lead') private leadModel: Model<LeadDocument>,
    @InjectModel('Event') private eventModel: Model<EventDocument>,
    private clientConfigService: ClientConfigService,
  ) {}

  /**
   * Create lead from complete form submission
   * High-quality lead with all required fields
   */
  async createFromFormSubmission(data: CreateLeadDto): Promise<Lead> {
    // Check for duplicate lead (same email, client, within 24h)
    const existingLead = await this.findExistingLead({
      clientId: data.clientId,
      email: data.fields.email,
      timeWindow: 24 * 60 * 60 * 1000, // 24 hours
    });

    if (existingLead) {
      // Update existing lead instead of creating duplicate
      return this.updateLead(existingLead.leadId, {
        ...data.fields,
        status: 'submitted',
        quality: 'high',
        submittedAt: new Date(),
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create new lead document in MongoDB
    const lead = await this.leadModel.create({
      leadId: generateUUID(),
      clientId: data.clientId,
      formId: data.formId,
      
      // Lead fields
      email: data.fields.email,
      name: data.fields.name || data.fields.full_name,
      firstName: data.fields.first_name || this.extractFirstName(data.fields.name),
      lastName: data.fields.last_name || this.extractLastName(data.fields.name),
      phone: data.fields.phone,
      company: data.fields.company,
      message: data.fields.message,
      
      // Lead metadata
      status: 'submitted',
      quality: 'high',
      source: 'form_submission',
      
      // Tracking
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      
      // Enrichment
      utmSource: data.metadata.utmSource,
      utmMedium: data.metadata.utmMedium,
      utmCampaign: data.metadata.utmCampaign,
      referrer: data.metadata.referrer,
      landingPage: data.metadata.landingPage,
      
      // CRM sync status
      crmSynced: false,
      crmSyncedAt: null,
      crmId: null,
      crmErrors: [],
      
      // Timestamps
      submittedAt: new Date(),
      lastInteractionAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return lead;
  }

  /**
   * Create partial lead from form interaction
   * Medium-quality lead with incomplete data
   */
  async createFromFormInteraction(data: CreateLeadDto): Promise<Lead> {
    const email = data.fields.email;
    
    if (!email) {
      throw new BadRequestException('Email required for lead creation');
    }

    // Check for existing lead to update
    const existingLead = await this.findExistingLead({
      clientId: data.clientId,
      email,
      timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 days for partial leads
    });

    if (existingLead) {
      // Merge new fields into existing lead
      return this.updateLead(existingLead.leadId, {
        ...data.fields,
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create new partial lead
    const lead = await this.leadModel.create({
      leadId: generateUUID(),
      clientId: data.clientId,
      formId: data.formId,
      
      // Partial lead fields (may be incomplete)
      email: data.fields.email,
      name: data.fields.name,
      firstName: data.fields.first_name,
      lastName: data.fields.last_name,
      phone: data.fields.phone,
      company: data.fields.company,
      
      // Lead metadata
      status: 'partial',
      quality: 'medium',
      source: 'form_interaction',
      
      // Tracking
      sessionId: data.sessionId,
      visitorId: data.visitorId,
      
      // Enrichment
      utmSource: data.metadata.utmSource,
      utmMedium: data.metadata.utmMedium,
      utmCampaign: data.metadata.utmCampaign,
      referrer: data.metadata.referrer,
      landingPage: data.metadata.landingPage,
      
      // CRM sync status
      crmSynced: false,
      crmSyncedAt: null,
      crmId: null,
      crmErrors: [],
      
      // Timestamps
      lastInteractionAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return lead;
  }

  /**
   * Find existing lead to prevent duplicates
   */
  async findExistingLead(criteria: {
    clientId: string;
    email: string;
    timeWindow: number; // milliseconds
  }): Promise<Lead | null> {
    const cutoffDate = new Date(Date.now() - criteria.timeWindow);
    
    return this.leadModel.findOne({
      clientId: criteria.clientId,
      email: criteria.email,
      createdAt: { $gte: cutoffDate },
    }).exec();
  }

  /**
   * Update existing lead with new data
   */
  async updateLead(
    leadId: string,
    updates: Partial<Lead>,
  ): Promise<Lead> {
    return this.leadModel.findOneAndUpdate(
      { leadId },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      },
      { new: true } // Return updated document
    ).exec();
  }

  /**
   * Get lead by ID
   */
  async findOne(leadId: string): Promise<Lead> {
    return this.leadModel.findOne({ leadId }).exec();
  }

  /**
   * Get leads for client with pagination
   */
  async findByClient(
    clientId: string,
    options: { skip?: number; limit?: number; status?: string }
  ): Promise<{ leads: Lead[]; total: number }> {
    const query: any = { clientId };
    
    if (options.status) {
      query.status = options.status;
    }

    const [leads, total] = await Promise.all([
      this.leadModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50)
        .exec(),
      this.leadModel.countDocuments(query).exec(),
    ]);

    return { leads, total };
  }

  /**
   * Extract first name from full name
   */
  private extractFirstName(fullName: string): string {
    return fullName?.split(' ')[0] || '';
  }

  /**
   * Extract last name from full name
   */
  private extractLastName(fullName: string): string {
    const parts = fullName?.split(' ') || [];
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }
}
```

**Lead Deduplication Strategy**:

- **Form Submissions**: Check for duplicates within 24 hours (same email + client)
- **Form Interactions**: Check for duplicates within 7 days (longer window for partial leads)
- **Update vs Create**: If duplicate found, merge new data instead of creating new lead
- **Email as Key**: Email is the primary deduplication field

**Lead Quality Scoring**:

- **High**: Complete form submission with all required fields
- **Medium**: Partial lead from form interaction with email
- **Low**: Chat inquiry or minimal information (future enhancement)

---

## 4. Data Flow

### 4.1 Bootloader Script Loading Flow (Dynamic Config Pattern)

```
1. Website loads with embed snippet:
   <script>
     window.WebsiteTrackerConfig = { apiKey: 'xxx', apiUrl: 'https://api...' };
     // Load main script
   </script>
        ↓
2. Browser requests main tracker script:
   GET /main-app.v1.js
        ↓
3. AssetsController serves static file (CDN-cached)
   - Content-Type: application/javascript
   - Cache-Control: public, max-age=31536000 (1 year)
   - ETag: version-hash
        ↓
4. main-app.v1.js executes:
   - Reads window.WebsiteTrackerConfig (apiKey, apiUrl)
   - Fetches dynamic config: GET /v1/config/:apiKey
        ↓
5. ClientConfigController.getConfig(apiKey)
        ↓
6. Query MariaDB (cached with Redis):
   SELECT * FROM clients WHERE api_key = 'xxx'
   SELECT * FROM forms WHERE client_id = 'abc-123'
   SELECT * FROM fields WHERE form_id IN (...)
        ↓
7. Return JSON config:
   {
     "clientId": "abc-123",
     "domain": "example.com",
     "forms": [...],
     "features": { "formTracking": true, "chat": false },
     "theme": { "primaryColor": "#007bff" }
   }
        ↓
8. Tracker initializes with config:
   - Set up form listeners
   - Initialize session tracking
   - Configure event batching
   - Start sending events to POST /v1/track/events
```

**Key Benefits**:
- Main script is fully cacheable (static file)
- Config changes take effect immediately (no script regeneration)
- Reduced server load (no per-client script generation)
- Better CDN utilization

### 4.2 Form Submission Flow (Batch Processing with MongoDB)

```
User submits form on client website
        ↓
Tracker intercepts submit event (preventDefault)
        ↓
Extract form data:
  - Field names & values
  - Form ID from data-attributes
  - Redact sensitive fields (password, credit card)
        ↓
Add to event queue (batch):
{
  "id": "evt_123",
  "type": "form_submission",
  "timestamp": 1698765432000,
  "payload": {
    "formId": "form_001",
    "fields": { "email": "user@example.com", "name": "John" }
  }
}
        ↓
Queue flushes (50 events or 5 seconds):
POST /v1/track/events
{
  "apiKey": "sk_live_xxx",
  "events": [ {...}, {...}, ... ]
}
        ↓
TrackingController.queueEvents(dto)
        ↓
Validate API key (MariaDB query, Redis-cached)
        ↓
Add events to processing queue (RabbitMQ/SQS):
  - Returns 200 OK immediately
  - Events processed asynchronously
        ↓
Queue Worker picks up event:
TrackingService.processEvent(event)
        ↓
Route to handler:
TrackingService.handleFormSubmission(event)
        ↓
1. Create lead in MongoDB:
   LeadCreationService.createFromFormSubmission({
     clientId, formId, fields, sessionId, visitorId
   })
        ↓
2. Store event in MongoDB:
   db.events.insertOne({
     eventId, clientId, formId, leadId, eventType: 'form_submission',
     payload, timestamp, createdAt
   })
        ↓
3. Update session in MongoDB:
   db.sessions.updateOne(
     { sessionId },
     { $inc: { formSubmissions: 1 }, $set: { endedAt: now } }
   )
        ↓
4. Queue CRM sync job:
   queueService.add('crm-sync', { leadId, clientId })
        ↓
5. Processing complete (async, no waiting)
        ↓
Client receives immediate response: { success: true, queued: 3 }
```

**Database Operations**:
- **MariaDB**: Client config lookup (cached with Redis, 1-2ms)
- **MongoDB**: Event insert (bulk write, 5-10ms per batch)
- **MongoDB**: Lead upsert with deduplication (10-15ms)
- **MongoDB**: Session update (atomic operation, 5ms)

**Performance Characteristics**:
- API response time: < 100ms (queue + return)
- Event processing time: 50-200ms per event (async)
- Throughput: 10,000+ events/sec with horizontal scaling
- Batch size: Up to 50 events per request

### 4.3 Partial Lead Capture Flow (MongoDB)

```
User fills email field on form
        ↓
Blur event fires on email input
        ↓
Tracker captures field value:
{
  "type": "form_interaction",
  "trigger": "blur",
  "payload": {
    "formId": "form_001",
    "fieldName": "email",
    "fields": { "email": "user@example.com" }
  }
}
        ↓
Event added to batch queue
        ↓
Batch sent: POST /v1/track/events
        ↓
Queue worker processes event:
TrackingService.handleFormInteraction(event)
        ↓
Check: Has email? ✅ Yes
        ↓
LeadCreationService.findExistingLead({
  clientId, email, timeWindow: 7 days
})
        ↓
If exists:
  → Update MongoDB lead:
    db.leads.updateOne(
      { leadId },
      { $set: { ...newFields, lastInteractionAt: now, updatedAt: now } }
    )
        ↓
If not exists:
  → Create partial lead in MongoDB:
    db.leads.insertOne({
      leadId, clientId, formId,
      email: "user@example.com",
      status: "partial",
      quality: "medium",
      source: "form_interaction",
      sessionId, visitorId,
      createdAt: now
    })
        ↓
Store interaction event:
db.events.insertOne({
  eventId, clientId, formId,
  eventType: "form_interaction",
  payload: { fieldName: "email", fieldValue: "..." },
  timestamp, createdAt
})
        ↓
User continues filling form (name, phone)
  → Each field triggers updates to same lead document
        ↓
User closes tab (beforeunload event)
        ↓
Tracker sends final batch via sendBeacon:
  - All pending field values
  - Session end event
  - Page view events
```

**Partial Lead Strategy**:
- **Deduplication Window**: 7 days (longer than complete submissions)
- **Update Pattern**: Merge new fields into existing lead document
- **Quality Score**: Starts at "medium", upgraded to "high" on submission
- **CRM Sync**: Only synced after complete submission or significant interaction

---

## 5. API Design

### 5.1 REST API Endpoints

```typescript
// Client Management
POST   /v1/clients                    // Create client
GET    /v1/clients/:clientId          // Get client config
PUT    /v1/clients/:clientId          // Update client
DELETE /v1/clients/:clientId          // Delete client

// Form Management
POST   /v1/clients/:clientId/forms    // Create form
GET    /v1/clients/:clientId/forms    // List forms
GET    /v1/forms/:formId              // Get form details
PUT    /v1/forms/:formId              // Update form
DELETE /v1/forms/:formId              // Delete form

// Field Management
POST   /v1/forms/:formId/fields       // Create field
GET    /v1/forms/:formId/fields       // List fields
PUT    /v1/fields/:fieldId            // Update field
DELETE /v1/fields/:fieldId            // Delete field

// Field Mapping
POST   /v1/fields/:fieldId/mapping    // Create mapping
GET    /v1/fields/:fieldId/mapping    // Get mapping
PUT    /v1/mappings/:mappingId        // Update mapping
DELETE /v1/mappings/:mappingId        // Delete mapping

// Event Tracking (Public - API Key Auth)
POST   /v1/track/events               // Batch event tracking (apiKey in body)
GET    /v1/config/:apiKey             // Get client config (public, cached)

// Lead Management (Authenticated - JWT)
GET    /v1/leads                      // List leads (with filters)
GET    /v1/leads/:leadId              // Get lead details
PUT    /v1/leads/:leadId              // Update lead
DELETE /v1/leads/:leadId              // Delete lead
POST   /v1/leads/:leadId/sync         // Trigger manual CRM sync

// Script Embedding (Public - No Auth)
GET    /script/:clientId.js           // Get loader script (cacheable)
GET    /script/:clientId/embed        // Get embed snippet HTML
GET    /main-app.:version.js          // Get main tracker script (static, CDN-cached)

// Demo & Testing (Public - No Auth)
GET    /demo                          // Interactive demo page
GET    /example                       // Example implementation
GET    /config-test                   // Config testing tool
```

### 5.2 API Authentication

**Public Endpoints** (no authentication required):
- `GET /script/:clientId.js` - Loader script generation
- `GET /script/:clientId/embed` - Embed snippet HTML
- `GET /main-app.v1.js` - Main tracker script (static)
- `GET /demo`, `/example`, `/config-test` - Testing tools
- `GET /v1/config/:apiKey` - Client configuration (apiKey validation only)

**API Key Auth** (apiKey in request body):
- `POST /v1/track/events` - Batch event tracking
  - Validates apiKey against MariaDB clients table
  - Cached in Redis for performance

**JWT Auth** (Authorization: Bearer token):
- All client/form/field/lead management endpoints
- Dashboard and analytics endpoints
- CRM integration configuration

**Rate Limiting by API Key**:
```typescript
// Per API key limits
- Event tracking: 10,000 events/minute
- Config endpoint: 1,000 requests/minute (cached)
- Management APIs: 100 requests/minute
```

### 5.3 Rate Limiting

```typescript
// rate-limiter.guard.ts
@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(private redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    
    const key = `rate_limit:${apiKey}:${Date.now() / 60000 | 0}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 minute TTL
    }
    
    // Allow 1000 requests per minute per API key
    return count <= 1000;
  }
}
```

---

## 6. Client-Side SDK (Bootloader Pattern)

### 6.1 Architecture Overview

The client-side tracker uses a **two-stage loading pattern** with dynamic configuration:

**Stage 1: Loader Script** (embedded in page)
- Minimal code that sets up config and loads main script
- Inlined in page HTML for instant execution
- No external dependencies

**Stage 2: Main Tracker Script** (main-app.v1.js)
- Full tracking implementation
- Fetches dynamic config from server
- Cached globally by CDN

### 6.2 Implementation Structure

```javascript
// main-app.v1.js structure

(function() {
  'use strict';

  // ========================================
  // 1. CONFIGURATION BOOTSTRAP
  // ========================================
  const config = window.WebsiteTrackerConfig; // Set by loader script
  let serverConfig = null; // Fetched from /v1/config/:apiKey

  // Fetch dynamic configuration
  async function fetchConfig(apiKey, apiUrl) {
    const response = await fetch(`${apiUrl}/v1/config/${apiKey}`);
    return await response.json();
  }

  // ========================================
  // 2. UTILITIES
  // ========================================
  const Utils = {
    log: function(...args) {
      if (serverConfig?.debug) console.log('[WebsiteTracker]', ...args);
    },
    generateUUID: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    },
    debounce: function(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },
  };

  // ========================================
  // 3. SESSION MANAGEMENT
  // ========================================
  const Session = {
    sessionId: null,
    visitorId: null,
    
    init: function() {
      this.visitorId = this.getOrCreateVisitorId();
      this.sessionId = this.getOrCreateSessionId();
      Utils.log('Session initialized:', { sessionId: this.sessionId, visitorId: this.visitorId });
    },
    
    getOrCreateVisitorId: function() {
      let id = localStorage.getItem('ws_visitor_id');
      if (!id) {
        id = Utils.generateUUID();
        localStorage.setItem('ws_visitor_id', id);
      }
      return id;
    },
    
    getOrCreateSessionId: function() {
      let id = sessionStorage.getItem('ws_session_id');
      if (!id) {
        id = Utils.generateUUID();
        sessionStorage.setItem('ws_session_id', id);
      }
      return id;
    },
  };

  // ========================================
  // 4. EVENT QUEUE & BATCHING
  // ========================================
  const EventQueue = {
    queue: [],
    maxBatchSize: 50,
    flushInterval: 5000,
    flushTimer: null,
    
    add: function(event) {
      this.queue.push({
        id: Utils.generateUUID(),
        timestamp: Date.now(),
        sessionId: Session.sessionId,
        visitorId: Session.visitorId,
        ...event,
      });
      
      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      }
    },
    
    flush: function() {
      if (this.queue.length === 0) return;
      
      const events = this.queue.splice(0, this.maxBatchSize);
      API.sendBatch(config.apiKey, config.apiUrl, events);
    },
    
    startAutoFlush: function() {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    },
  };

  // ========================================
  // 5. FORM TRACKER
  // ========================================
  const FormTracker = {
    trackedForms: new Map(),
    sensitiveFields: ['password', 'ssn', 'credit_card', 'cvv', 'card-number'],
    
    init: function(apiKey, apiUrl) {
      this.apiKey = apiKey;
      this.apiUrl = apiUrl;
      this.attachFormListeners();
      this.attachFieldListeners();
      this.attachBeforeUnload();
      Utils.log('FormTracker initialized');
    },
    
    attachFormListeners: function() {
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => this.handleFormSubmit(form, e));
      });
    },
    
    attachFieldListeners: function() {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (input.type === 'email' || input.name?.toLowerCase().includes('email')) {
          input.addEventListener('blur', Utils.debounce(() => {
            this.handleFieldBlur(input, this.apiKey, this.apiUrl);
          }, 500));
        }
      });
    },
    
    handleFormSubmit: function(form, event) {
      const formData = this.extractFormData(form);
      const redactedData = this.redactSensitiveFields(formData);
      
      EventQueue.add({
        type: 'form_submission',
        payload: {
          formId: form.id || form.dataset.trackingId || 'unknown',
          fields: redactedData,
          url: window.location.href,
        },
      });
      
      // Flush immediately on submit
      EventQueue.flush();
    },
    
    handleFieldBlur: function(field, apiKey, apiUrl) {
      if (field.value && field.type === 'email') {
        EventQueue.add({
          type: 'form_interaction',
          payload: {
            formId: field.form?.id || 'unknown',
            fieldName: field.name || field.id,
            fields: { email: field.value },
            trigger: 'blur',
          },
        });
      }
    },
    
    handleBeforeUnload: function() {
      window.addEventListener('beforeunload', () => {
        if (EventQueue.queue.length > 0) {
          const events = EventQueue.queue.splice(0);
          navigator.sendBeacon(
            `${this.apiUrl}/v1/track/events`,
            JSON.stringify({ apiKey: this.apiKey, events })
          );
        }
      });
    },
    
    extractFormData: function(form) {
      const data = {};
      new FormData(form).forEach((value, key) => {
        data[key] = value;
      });
      return data;
    },
    
    redactSensitiveFields: function(data) {
      const redacted = { ...data };
      this.sensitiveFields.forEach(field => {
        if (redacted[field]) redacted[field] = '[REDACTED]';
      });
      return redacted;
    },
  };

  // ========================================
  // 6. API CLIENT
  // ========================================
  const API = {
    sendBatch: async function(apiKey, apiUrl, events) {
      try {
        const response = await fetch(`${apiUrl}/v1/track/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, events }),
        });
        
        if (!response.ok) {
          Utils.log('Failed to send events:', response.status);
        }
      } catch (error) {
        Utils.log('Error sending events:', error);
      }
    },
  };

  // ========================================
  // 7. INITIALIZATION
  // ========================================
  async function init() {
    // 1. Fetch server configuration
    serverConfig = await fetchConfig(config.apiKey, config.apiUrl);
    Utils.log('Config loaded:', serverConfig);
    
    // 2. Initialize session tracking
    Session.init();
    
    // 3. Initialize form tracking (if enabled)
    if (serverConfig.features?.formTracking) {
      FormTracker.init(config.apiKey, config.apiUrl);
    }
    
    // 4. Start batch flushing
    EventQueue.startAutoFlush();
    
    // 5. Track initialization event
    EventQueue.add({
      type: 'tracker_initialized',
      payload: {
        version: '1.0.0',
        url: window.location.href,
        referrer: document.referrer,
      },
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

### 6.2 Event Batching Strategy

```javascript
const EventQueue = {
  queue: [],
  batchSize: 10,
  flushInterval: 5000,
  timer: null,

  add: function(event) {
    this.queue.push(event);
    
    // Flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  },

  flush: function() {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.queue.length);
    
    // Use sendBeacon for reliability (especially on beforeunload)
    const data = JSON.stringify({ events });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${CONFIG.serverUrl}/v1/track/batch`, data);
    } else {
      // Fallback to fetch with keepalive
      fetch(`${CONFIG.serverUrl}/v1/track/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true,
      }).catch(err => console.error('[Tracker] Failed to send events:', err));
    }
  },

  startAutoFlush: function() {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  },
};
```

### 6.3 Session & Visitor Tracking

```javascript
const Session = {
  SESSION_KEY: '_crm_session_id',
  VISITOR_KEY: '_crm_visitor_id',
  SESSION_DURATION: 30 * 60 * 1000, // 30 minutes

  getSessionId: function() {
    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  },

  getVisitorId: function() {
    let visitorId = localStorage.getItem(this.VISITOR_KEY);
    if (!visitorId) {
      visitorId = this.generateId();
      localStorage.setItem(this.VISITOR_KEY, visitorId);
    }
    return visitorId;
  },

  generateId: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
};
```

---

## 7. Event Tracking System

### 7.1 Event Types & Payloads

**Form Submission Event**:
```json
{
  "type": "form_submission",
  "formId": "contact-form",
  "timestamp": "2025-10-22T10:30:45.123Z",
  "sessionId": "sess_abc123",
  "visitorId": "visitor_xyz789",
  "fields": {
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1-555-0123",
    "company": "Acme Corp",
    "message": "Interested in services"
  },
  "page": {
    "url": "https://example.com/contact",
    "path": "/contact",
    "title": "Contact Us",
    "referrer": "https://google.com"
  },
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "language": "en-US",
    "timezone": "America/New_York"
  }
}
```

**Form Interaction Event** (Partial Lead):
```json
{
  "type": "form_interaction",
  "formId": "contact-form",
  "trigger": "blur",
  "fieldName": "email",
  "fieldValue": "user@example.com",
  "fieldType": "email",
  "timestamp": "2025-10-22T10:28:00.123Z",
  "sessionId": "sess_abc123",
  "visitorId": "visitor_xyz789",
  "formProgress": {
    "completedFields": ["email", "name"],
    "totalFields": 5,
    "percentComplete": 40
  }
}
```

### 7.2 Privacy & Field Redaction

```javascript
const FormTracker = {
  sensitiveFields: [
    'password', 'confirm_password', 'passwd', 'pwd',
    'ssn', 'social_security', 'social_security_number',
    'credit_card', 'card_number', 'cc_number', 'cvv', 'cvc',
    'pin', 'security_code',
  ],

  redactSensitiveFields: function(data) {
    const redacted = {};
    for (const [key, value] of Object.entries(data)) {
      const fieldNameLower = key.toLowerCase();
      const isSensitive = this.sensitiveFields.some(sf => 
        fieldNameLower.includes(sf)
      );
      redacted[key] = isSensitive ? '[REDACTED]' : value;
    }
    return redacted;
  },

  shouldTrackField: function(fieldName, fieldType) {
    // Only track lead-generating fields
    const trackFields = [
      'email', 'phone', 'name', 'first_name', 'last_name',
      'company', 'organization', 'message', 'comments',
    ];
    
    const fieldNameLower = fieldName.toLowerCase();
    return trackFields.some(tf => fieldNameLower.includes(tf));
  },
};
```

---

## 8. Security & Privacy

### 8.1 API Key Security

```typescript
// api-key.guard.ts
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private clientsService: ClientsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Hash API key for lookup (stored hashed in DB)
    const hashedKey = this.hashApiKey(apiKey);
    const client = await this.clientsService.findByApiKey(hashedKey);

    if (!client || !client.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.client = client;
    return true;
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}
```

### 8.2 PII Redaction

Server-side validation to ensure sensitive data is never stored:

```typescript
// redaction.service.ts
@Injectable()
export class RedactionService {
  private readonly sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g,           // SSN pattern
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,  // Credit card
    /\b[A-Z]{2}\d{6,8}\b/g,              // Passport
  ];

  redactPayload(payload: any): any {
    const redacted = JSON.parse(JSON.stringify(payload));
    this.recursiveRedact(redacted);
    return redacted;
  }

  private recursiveRedact(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Check for sensitive patterns
        for (const pattern of this.sensitivePatterns) {
          if (pattern.test(obj[key])) {
            obj[key] = '[REDACTED]';
            break;
          }
        }
      } else if (typeof obj[key] === 'object') {
        this.recursiveRedact(obj[key]);
      }
    }
  }
}
```

### 8.3 GDPR Compliance

**Data Retention Policy**:
```typescript
// Automated cleanup job (runs daily)
@Cron('0 0 * * *')
async cleanupOldData() {
  const retentionDays = 90; // Configurable per client
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Delete old events
  await this.eventsRepository
    .createQueryBuilder()
    .delete()
    .where('created_at < :cutoffDate', { cutoffDate })
    .execute();

  // Delete leads without CRM sync (orphaned)
  await this.leadsRepository
    .createQueryBuilder()
    .delete()
    .where('created_at < :cutoffDate', { cutoffDate })
    .andWhere('crm_synced_at IS NULL')
    .execute();
}
```

**Right to Deletion**:
```typescript
// DELETE /v1/leads/:leadId/gdpr-delete
async gdprDelete(leadId: string): Promise<void> {
  // 1. Delete lead
  await this.leadsRepository.delete(leadId);
  
  // 2. Delete associated events (CASCADE)
  // (handled by database constraint)
  
  // 3. Notify CRM to delete (if synced)
  const lead = await this.leadsRepository.findOne({ where: { leadId } });
  if (lead.crmId) {
    await this.crmService.deleteLead(lead.crmId);
  }
}
```

---

## 9. Performance Optimization

### 9.1 Script Loading (Bootloader Pattern)

**CDN Caching for Main Script**:
```typescript
// embedding.controller.ts - AssetsController
@Get('/main-app.:version.js')
@Header('Content-Type', 'application/javascript')
@Header('Cache-Control', 'public, max-age=31536000, immutable') // 1 year - immutable
@Header('X-Content-Type-Options', 'nosniff')
async getMainScript(@Param('version') version: string, @Res() res: Response) {
  const script = await fs.readFile(`./public/main-app.${version}.js`, 'utf-8');
  const etag = createHash('md5').update(script).digest('hex');
  
  res.setHeader('ETag', etag);
  res.send(script);
}
```

**Config Endpoint Caching**:
```typescript
// client-config.controller.ts
@Get('/v1/config/:apiKey')
@Header('Cache-Control', 'public, max-age=300') // 5 minutes
@UseInterceptors(CacheInterceptor) // Redis cache
async getConfig(@Param('apiKey') apiKey: string) {
  // Cached lookup - typical response time: 1-2ms
  return this.clientConfigService.getConfigByApiKey(apiKey);
}
```

**Script Minification & Compression**:
- Terser for JavaScript minification
- Gzip/Brotli compression at CDN level
- Target: <30KB gzipped for main script

### 9.2 Database Optimization (Hybrid Architecture)

**MariaDB Optimization** (Configuration Data - Read-Heavy):

```sql
-- MariaDB indexes for fast lookups
CREATE INDEX idx_clients_api_key ON clients(api_key);
CREATE INDEX idx_clients_domain ON clients(domain);
CREATE INDEX idx_forms_client ON forms(client_id, is_active);
CREATE INDEX idx_fields_form ON fields(form_id);
CREATE INDEX idx_field_mappings_field ON field_mappings(field_id);

-- Query cache configuration
SET GLOBAL query_cache_type = 1;
SET GLOBAL query_cache_size = 268435456; -- 256MB
SET GLOBAL query_cache_limit = 1048576; -- 1MB max result

-- Connection pooling
[mysqld]
max_connections = 200
max_connect_errors = 10000
wait_timeout = 28800
```

**Redis Caching Layer**:
```typescript
// Cache client configs for 5 minutes
@Injectable()
export class ClientConfigService {
  constructor(
    @InjectRepository(Client) private clientRepo: Repository<Client>,
    @Inject('REDIS') private redis: Redis,
  ) {}

  async getConfigByApiKey(apiKey: string): Promise<ClientConfig> {
    // Check cache first
    const cacheKey = `config:${apiKey}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query MariaDB
    const config = await this.clientRepo.findOne({
      where: { apiKey, isActive: true },
      relations: ['forms', 'forms.fields', 'forms.fields.mapping'],
    });
    
    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(config));
    
    return config;
  }
}
```

**MongoDB Optimization** (Events/Leads - Write-Heavy):

```javascript
// MongoDB indexes for high-throughput writes
db.events.createIndex({ clientId: 1, timestamp: -1 });
db.events.createIndex({ sessionId: 1 });
db.events.createIndex({ visitorId: 1 });
db.events.createIndex({ eventType: 1, timestamp: -1 });
db.events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90-day TTL

db.leads.createIndex({ clientId: 1, createdAt: -1 });
db.leads.createIndex({ email: 1 });
db.leads.createIndex({ status: 1, crmSynced: 1 });

db.sessions.createIndex({ sessionId: 1 }, { unique: true });
db.sessions.createIndex({ clientId: 1, startedAt: -1 });

// Write concern for performance
db.adminCommand({
  setDefaultRWConcern: 1,
  defaultWriteConcern: { w: 1, j: false } // Faster writes, ack without journal
});

// Connection pooling
mongoose.connect(mongoUri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
});
```

**Bulk Write Operations**:
```typescript
// Batch insert events for better performance
await this.eventModel.insertMany(events, {
  ordered: false, // Continue on error
  writeConcern: { w: 1 },
});
```

### 9.3 Event Batching & Queue Management

**Client-Side Batching**:
- Max batch size: 50 events
- Flush interval: 5 seconds
- Immediate flush on form_submission events
- `sendBeacon` for beforeunload events

**Server-Side Queue**:
```typescript
// RabbitMQ/SQS configuration
const queueConfig = {
  prefetch: 100, // Process up to 100 events concurrently
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  deadLetterQueue: 'event-processing-dlq',
};

// Worker scaling based on queue depth
// 1 worker per 1000 events in queue
// Max 20 workers per instance
```

### 9.4 Performance Targets

**Response Times**:
- API event ingestion: < 100ms (p95)
- Config endpoint: < 50ms (p95, cached)
- Event processing: < 200ms per event (async)

**Throughput**:
- 10,000+ events/second with 3 API servers
- 50,000+ concurrent sessions
- 1M+ events/day per client (typical)

**Database Performance**:
- MariaDB: < 10ms for config lookups (cached)
- MongoDB: < 50ms for event inserts (bulk)
- MongoDB: < 100ms for lead upserts

---

## 10. Deployment Architecture

### 10.1 Infrastructure Diagram (Hybrid Database Architecture)

```
                          ┌─────────────────────┐
                          │   CloudFlare CDN    │
                          │  main-app.v1.js     │
                          │  (1-year cache)     │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Load Balancer     │
                          │   (ALB/NLB)         │
                          └──────────┬──────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
      ┌──────────▼──────┐ ┌─────────▼────────┐ ┌───────▼────────┐
      │  API Server 1   │ │   API Server 2   │ │  API Server 3  │
      │    (NestJS)     │ │     (NestJS)     │ │    (NestJS)    │
      │  - Tracking     │ │   - Tracking     │ │  - Tracking    │
      │  - Embedding    │ │   - Embedding    │ │  - Embedding   │
      └────┬────────┬───┘ └────┬────────┬────┘ └───┬────────┬───┘
           │        │          │        │          │        │
           │        └──────────┼────────┘──────────┘        │
           │                   │                             │
           │                   │                             │
    ┌──────▼──────────┐ ┌──────▼─────────────┐    ┌────────▼────────┐
    │   MariaDB 10.11 │ │   MongoDB 6.0+     │    │  Redis Cluster  │
    │   (Primary)     │ │   (Replica Set)    │    │  - Config Cache │
    │   - Clients     │ │   - Events         │    │  - Rate Limits  │
    │   - Forms       │ │   - Leads          │    │  - Sessions     │
    │   - Fields      │ │   - Sessions       │    └─────────────────┘
    │   - Mappings    │ │   (Write-Heavy)    │
    └────┬────────────┘ └────────────────────┘
         │                        │
    ┌────▼────────────┐  ┌────────▼───────────────┐
    │  MariaDB Read   │  │  MongoDB Secondaries   │
    │  Replicas (2)   │  │  (Read Scaling)        │
    │  (Analytics)    │  └────────────────────────┘
    └─────────────────┘

                 ┌───────────────────────────┐
                 │   Message Queue           │
                 │   (RabbitMQ/AWS SQS)      │
                 │   - Event Processing      │
                 │   - CRM Sync              │
                 └───────────┬───────────────┘
                             │
                 ┌───────────▼───────────────┐
                 │   Worker Nodes (2-10)     │
                 │   - Event Processing      │
                 │   - Lead Creation         │
                 │   - CRM Sync              │
                 └───────────────────────────┘
```

### 10.2 Scaling Strategy

**Horizontal Scaling**:

*API Servers*:
- Stateless NestJS instances behind load balancer
- Auto-scaling based on CPU/memory (target: 70% utilization)
- Min: 2 instances, Max: 10 instances
- Each instance: 2 CPU, 4GB RAM

*MongoDB*:
- Replica set with 3 members (1 primary, 2 secondaries)
- Shard by clientId for >100M documents
- Each node: 4 CPU, 16GB RAM, SSD storage

*Workers*:
- Queue-based workers for async processing
- Scale based on queue depth (1 worker per 1000 messages)
- Min: 2 workers, Max: 20 workers

**Vertical Scaling**:

*MariaDB*:
- Start: db.t3.medium (2 vCPU, 4GB RAM)
- Growth: db.t3.large (2 vCPU, 8GB RAM)
- Scale: db.r6g.xlarge (4 vCPU, 32GB RAM)
- Read replicas: 2 for analytics queries

*MongoDB*:
- Start: 4GB RAM, 2 CPU, 100GB SSD per node
- Growth: 16GB RAM, 4 CPU, 500GB SSD
- Scale: 32GB RAM, 8 CPU, 1TB SSD

*Redis*:
- Start: cache.t3.micro (0.5GB RAM)
- Growth: cache.t3.medium (3.2GB RAM)
- Scale: cache.r6g.large (13.07GB RAM)

### 10.3 High Availability & Disaster Recovery

**Database Backups**:

*MariaDB*:
- Automated daily backups (7-day retention)
- Point-in-time recovery (PITR) enabled
- Cross-region backup replication

*MongoDB*:
- Continuous backup with point-in-time recovery
- Snapshot every 6 hours
- 30-day retention policy
- Cross-region backup storage

**Failover Strategy**:
- MariaDB: Auto-failover to read replica (<30 seconds)
- MongoDB: Automatic primary election (<10 seconds)
- Redis: Multi-AZ with automatic failover

### 10.4 Monitoring & Observability

**Application Metrics** (Prometheus + Grafana):
- API latency (p50, p95, p99, p99.9)
- Request rate (requests/second)
- Error rate (5xx errors)
- Event throughput (events/second)
- Queue depth (messages waiting)

**Database Metrics**:
- MariaDB: Query latency, connection pool, cache hit rate
- MongoDB: Write latency, replication lag, oplog size
- Redis: Memory usage, cache hit rate, evictions

**Alerting Thresholds**:
- API p95 latency > 500ms
- Error rate > 1%
- MariaDB connections > 80%
- MongoDB replication lag > 10 seconds
- Queue depth > 10,000 messages

**Logging** (ELK/CloudWatch):
- Structured JSON logs
- Request/response logging with trace IDs
- Error tracking with stack traces
- Event processing audit trail

### 10.5 Cost Optimization

**Infrastructure Costs** (Estimated Monthly):
- API Servers (3x t3.medium): $75
- MariaDB (db.t3.medium + 2 replicas): $150
- MongoDB Atlas (M30 replica set): $300
- Redis (cache.t3.medium): $50
- Load Balancer: $20
- CloudFront CDN: $10-50 (based on traffic)
- SQS/RabbitMQ: $20-100
- **Total: ~$625-775/month** (small-medium scale)

**Optimization Strategies**:
- Use reserved instances for steady-state workload (save 40%)
- Implement TTL indexes to auto-delete old events (save storage)
- CDN caching reduces origin requests by 90%+
- Connection pooling reduces database load
- Event batching reduces API calls by 50x
- Lead creation rate
- CRM sync lag

**Alerting**:
- API latency > 500ms (p95)
- Error rate > 1%
- Database connections > 80%
- Lead creation fails

---

**Document Version**: 2.0  
**Last Updated**: October 22, 2025  
**Next Review**: November 15, 2025
