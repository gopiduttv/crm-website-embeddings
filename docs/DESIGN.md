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
│  │  ↓ Loads production-tracker.js                         │ │
│  │  ↓ Attaches form listeners                             │ │
│  │  ↓ Tracks lead-generating events                       │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ POST /v1/track (events)
                            │ GET /script/{clientId}.js
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CRM Web Tracker API                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   NestJS     │  │  Tracking    │  │  Lead Creation  │   │
│  │  App Server  │→ │  Service     │→ │    Service      │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│         ↓                                      ↓              │
│  ┌──────────────┐                     ┌─────────────────┐   │
│  │  PostgreSQL  │                     │   CRM API       │   │
│  │   Database   │                     │  (Salesforce)   │   │
│  └──────────────┘                     └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                         CDN                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  production-tracker.js (static, cached)                │ │
│  │  main-app.v1.js (legacy)                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
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
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM
- **Authentication**: JWT + API Keys
- **Cache**: Redis (optional, for rate limiting)

**Frontend (Client SDK)**:
- **Language**: Vanilla JavaScript (ES6+)
- **Build**: Webpack + Babel
- **Size**: < 50KB minified + gzipped

**Infrastructure**:
- **Hosting**: AWS / GCP / Azure
- **CDN**: CloudFlare / AWS CloudFront
- **Monitoring**: Datadog / New Relic
- **Logging**: ELK Stack / CloudWatch

---

## 2. Data Model

### 2.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────┐
│ Client (Site)                                       │
│ ─────────────────────────────────────────────────  │
│ PK: clientId (string, UUID)                         │
│     domain (string, unique)                         │
│     apiKey (string, hashed)                         │
│     isActive (boolean, default: true)               │
│     config (jsonb) - widget settings                │
│     createdAt (timestamp)                           │
│     updatedAt (timestamp)                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:N (One client has many forms)
                   │
┌──────────────────▼──────────────────────────────────┐
│ Form                                                │
│ ─────────────────────────────────────────────────  │
│ PK: formId (string, UUID)                           │
│ FK: clientId → Client.clientId (CASCADE)            │
│     formName (string)                               │
│     pageUrl (string)                                │
│     formSelector (string) - CSS selector            │
│     alternativeSelectors (jsonb array)              │
│     isActive (boolean, default: true)               │
│     metadata (jsonb) - form config                  │
│     createdAt (timestamp)                           │
│     updatedAt (timestamp)                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:N (One form has many fields)
                   │
┌──────────────────▼──────────────────────────────────┐
│ Field                                               │
│ ─────────────────────────────────────────────────  │
│ PK: fieldId (string, UUID)                          │
│ FK: formId → Form.formId (CASCADE)                  │
│     fieldSelector (string) - CSS selector           │
│     fieldName (string)                              │
│     fieldType (enum) - email, text, phone, etc.     │
│     label (string)                                  │
│     isRequired (boolean, default: false)            │
│     validationRules (jsonb) - regex, etc.           │
│     order (integer) - display order                 │
│     createdAt (timestamp)                           │
│     updatedAt (timestamp)                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:1 (One field has one CRM mapping)
                   │
┌──────────────────▼──────────────────────────────────┐
│ FieldMapping                                        │
│ ─────────────────────────────────────────────────  │
│ PK: mappingId (string, UUID)                        │
│ FK: fieldId → Field.fieldId (CASCADE)               │
│     targetEntity (string) - "Contact", "Lead", etc. │
│     targetField (string) - "Email", "FirstName"     │
│     transform (string) - "splitName", "lowercase"   │
│     isRequired (boolean)                            │
│     createdAt (timestamp)                           │
│     updatedAt (timestamp)                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Event (Tracked Lead Events)                         │
│ ─────────────────────────────────────────────────  │
│ PK: eventId (string, UUID)                          │
│ FK: clientId → Client.clientId (SET NULL)           │
│ FK: formId → Form.formId (SET NULL)                 │
│ FK: leadId → Lead.leadId (CASCADE)                  │
│     eventType (enum) - form_submission, etc.        │
│     sessionId (string)                              │
│     visitorId (string)                              │
│     payload (jsonb) - complete event data           │
│     metadata (jsonb) - page, user agent, etc.       │
│     timestamp (timestamp, indexed)                  │
│     createdAt (timestamp)                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Lead (Generated Leads)                              │
│ ─────────────────────────────────────────────────  │
│ PK: leadId (string, UUID)                           │
│ FK: clientId → Client.clientId (CASCADE)            │
│ FK: formId → Form.formId (SET NULL)                 │
│     email (string, indexed)                         │
│     name (string)                                   │
│     firstName (string)                              │
│     lastName (string)                               │
│     phone (string)                                  │
│     company (string)                                │
│     message (text)                                  │
│     status (enum) - submitted, partial, chat_inquiry│
│     quality (enum) - high, medium, low              │
│     source (string) - form_submission, etc.         │
│     sessionId (string, indexed)                     │
│     visitorId (string, indexed)                     │
│     metadata (jsonb) - utm params, referrer, etc.   │
│     submittedAt (timestamp)                         │
│     lastInteractionAt (timestamp)                   │
│     crmSyncedAt (timestamp, nullable)               │
│     crmId (string, nullable) - external CRM ID      │
│     createdAt (timestamp, indexed)                  │
│     updatedAt (timestamp)                           │
└─────────────────────────────────────────────────────┘
```

### 2.2 Database Schema (PostgreSQL)

```sql
-- Clients Table
CREATE TABLE clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clients_domain ON clients(domain);
CREATE INDEX idx_clients_api_key ON clients(api_key);

-- Forms Table
CREATE TABLE forms (
  form_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  form_name VARCHAR(255) NOT NULL,
  page_url TEXT NOT NULL,
  form_selector VARCHAR(500) NOT NULL,
  alternative_selectors JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_forms_client_id ON forms(client_id);
CREATE INDEX idx_forms_page_url ON forms(page_url);

-- Fields Table
CREATE TABLE fields (
  field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(form_id) ON DELETE CASCADE,
  field_selector VARCHAR(500) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  label VARCHAR(255),
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fields_form_id ON fields(form_id);

-- Field Mappings Table
CREATE TABLE field_mappings (
  mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  target_entity VARCHAR(100) NOT NULL,
  target_field VARCHAR(100) NOT NULL,
  transform VARCHAR(100),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(field_id)
);

-- Leads Table
CREATE TABLE leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  form_id UUID REFERENCES forms(form_id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  message TEXT,
  status VARCHAR(50) NOT NULL,
  quality VARCHAR(20) NOT NULL,
  source VARCHAR(100) NOT NULL,
  session_id VARCHAR(255),
  visitor_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  submitted_at TIMESTAMP,
  last_interaction_at TIMESTAMP,
  crm_synced_at TIMESTAMP,
  crm_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_client_id ON leads(client_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_quality ON leads(quality);
CREATE INDEX idx_leads_visitor_id ON leads(visitor_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);

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

**Directory Structure**:
```
src/
├── app.module.ts
├── main.ts
├── clients/
│   ├── clients.controller.ts
│   ├── clients.service.ts
│   ├── clients.module.ts
│   └── entities/
│       └── client.entity.ts
├── forms/
│   ├── forms.controller.ts
│   ├── forms.service.ts
│   ├── forms.module.ts
│   └── entities/
│       ├── form.entity.ts
│       ├── field.entity.ts
│       └── field-mapping.entity.ts
├── tracking/
│   ├── tracking.controller.ts
│   ├── tracking.service.ts
│   ├── tracking.module.ts
│   └── dto/
│       ├── form-submission.dto.ts
│       └── form-interaction.dto.ts
├── leads/
│   ├── leads.controller.ts
│   ├── leads.service.ts
│   ├── leads.module.ts
│   ├── lead-creation.service.ts
│   └── entities/
│       ├── lead.entity.ts
│       └── event.entity.ts
├── script/
│   ├── script.controller.ts
│   ├── script.service.ts
│   └── script.module.ts
└── common/
    ├── guards/
    │   └── api-key.guard.ts
    ├── decorators/
    │   └── api-key.decorator.ts
    └── filters/
        └── http-exception.filter.ts
```

### 3.2 Script Service (Dynamic Script Generation)

```typescript
// script.service.ts
@Injectable()
export class ScriptService {
  async generateScript(clientId: string): Promise<string> {
    // 1. Fetch client config + forms + fields
    const client = await this.clientsService.getClientConfig(clientId);
    
    if (!client || !client.isActive) {
      throw new NotFoundException('Client not found');
    }

    // 2. Read base tracker script
    const baseScript = await fs.readFile(
      './public/production-tracker.js',
      'utf-8'
    );

    // 3. Replace placeholders with client config
    const script = baseScript
      .replace('{{CLIENT_ID}}', client.clientId)
      .replace('{{SERVER_URL}}', process.env.SERVER_URL)
      .replace('{{API_KEY}}', client.apiKey)
      .replace('{{WIDGETS_CONFIG}}', JSON.stringify(client.config.widgets))
      .replace('{{THEME_CONFIG}}', JSON.stringify(client.config.theme))
      .replace('{{DEBUG_MODE}}', client.config.debug || false);

    // 4. Return script with cache headers
    return script;
  }
}
```

### 3.3 Tracking Service (Event Processing)

```typescript
// tracking.service.ts
@Injectable()
export class TrackingService {
  constructor(
    private leadCreationService: LeadCreationService,
    private eventsRepository: Repository<Event>,
  ) {}

  async trackEvent(dto: TrackEventDto): Promise<{ success: boolean }> {
    // 1. Validate API key
    const client = await this.validateApiKey(dto.apiKey);
    
    // 2. Route to appropriate handler
    switch (dto.type) {
      case 'form_submission':
        return this.handleFormSubmission(client, dto);
      case 'form_interaction':
        return this.handleFormInteraction(client, dto);
      case 'chat_message_sent':
        return this.handleChatMessage(client, dto);
      case 'tracker_initialized':
        return this.handleTrackerInit(client, dto);
      default:
        throw new BadRequestException('Unknown event type');
    }
  }

  private async handleFormSubmission(
    client: Client,
    dto: FormSubmissionDto,
  ): Promise<{ success: boolean }> {
    // 1. Create lead
    const lead = await this.leadCreationService.createFromFormSubmission({
      clientId: client.clientId,
      formId: dto.formId,
      fields: dto.fields,
      metadata: {
        page: dto.page,
        sessionId: dto.sessionId,
        visitorId: dto.visitorId,
      },
    });

    // 2. Store event
    await this.eventsRepository.save({
      eventId: dto.id,
      clientId: client.clientId,
      formId: dto.formId,
      leadId: lead.leadId,
      eventType: 'form_submission',
      sessionId: dto.sessionId,
      visitorId: dto.visitorId,
      payload: dto,
      metadata: dto.page,
      timestamp: new Date(dto.timestamp || Date.now()),
    });

    // 3. Trigger CRM sync (async)
    this.crmSyncQueue.add('sync-lead', { leadId: lead.leadId });

    return { success: true };
  }

  private async handleFormInteraction(
    client: Client,
    dto: FormInteractionDto,
  ): Promise<{ success: boolean }> {
    // Only create lead if email is present
    const hasEmail = dto.fieldName === 'email' || dto.fields?.email;
    
    if (!hasEmail) {
      // Store interaction but don't create lead
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

### 3.4 Lead Creation Service

```typescript
// lead-creation.service.ts
@Injectable()
export class LeadCreationService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
  ) {}

  async createFromFormSubmission(data: CreateLeadDto): Promise<Lead> {
    const lead = this.leadsRepository.create({
      clientId: data.clientId,
      formId: data.formId,
      email: data.fields.email,
      name: data.fields.name || data.fields.full_name,
      firstName: data.fields.first_name,
      lastName: data.fields.last_name,
      phone: data.fields.phone,
      company: data.fields.company,
      message: data.fields.message,
      status: LeadStatus.SUBMITTED,
      quality: LeadQuality.HIGH,
      source: 'form_submission',
      sessionId: data.metadata.sessionId,
      visitorId: data.metadata.visitorId,
      metadata: data.metadata,
      submittedAt: new Date(),
      lastInteractionAt: new Date(),
    });

    return this.leadsRepository.save(lead);
  }

  async createFromFormInteraction(data: CreateLeadDto): Promise<Lead> {
    const lead = this.leadsRepository.create({
      clientId: data.clientId,
      formId: data.formId,
      email: data.fields.email,
      name: data.fields.name,
      firstName: data.fields.first_name,
      lastName: data.fields.last_name,
      phone: data.fields.phone,
      company: data.fields.company,
      status: LeadStatus.PARTIAL,
      quality: LeadQuality.MEDIUM,
      source: 'form_interaction',
      sessionId: data.metadata.sessionId,
      visitorId: data.metadata.visitorId,
      metadata: data.metadata,
      lastInteractionAt: new Date(),
    });

    return this.leadsRepository.save(lead);
  }

  async findExistingLead(criteria: {
    clientId: string;
    email: string;
    visitorId: string;
  }): Promise<Lead | null> {
    return this.leadsRepository.findOne({
      where: {
        clientId: criteria.clientId,
        email: criteria.email,
        visitorId: criteria.visitorId,
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)), // Last 24h
      },
    });
  }

  async updateLead(
    leadId: string,
    updates: Partial<Lead>,
  ): Promise<Lead> {
    await this.leadsRepository.update(leadId, updates);
    return this.leadsRepository.findOne({ where: { leadId } });
  }
}
```

---

## 4. Data Flow

### 4.1 Script Loading Flow

```
1. Website loads: <script src="/script/abc-123.js">
        ↓
2. API: GET /script/abc-123.js
        ↓
3. ScriptController.getScript(clientId)
        ↓
4. ScriptService.generateScript(clientId)
        ↓
5. Query DB: SELECT * FROM clients WHERE client_id = 'abc-123'
             SELECT * FROM forms WHERE client_id = 'abc-123'
             SELECT * FROM fields WHERE form_id IN (...)
        ↓
6. Read base script: public/production-tracker.js
        ↓
7. Replace placeholders:
   - {{CLIENT_ID}} → 'abc-123'
   - {{API_KEY}} → 'sk_live_abc123'
   - {{WIDGETS_CONFIG}} → JSON config
        ↓
8. Return script with headers:
   - Content-Type: application/javascript
   - Cache-Control: public, max-age=3600
   - ETag: hash(clientId + version)
        ↓
9. Browser executes script → Tracker initializes
```

### 4.2 Form Submission Flow

```
User submits form
        ↓
Tracker intercepts submit event
        ↓
Extract form data + redact sensitive fields
        ↓
Batch event (or send immediately if beforeunload)
        ↓
POST /v1/track
{
  "type": "form_submission",
  "formId": "form_001",
  "fields": { "email": "...", "name": "..." }
}
        ↓
TrackingController.trackEvent(dto)
        ↓
Validate API key
        ↓
TrackingService.handleFormSubmission(client, dto)
        ↓
LeadCreationService.createFromFormSubmission(data)
        ↓
INSERT INTO leads (...) RETURNING lead_id
        ↓
INSERT INTO events (lead_id, ...)
        ↓
Queue CRM sync job (async)
        ↓
Return { success: true }
        ↓
Tracker receives response → Logs success
```

### 4.3 Partial Lead Capture Flow

```
User fills email field
        ↓
Blur event fires
        ↓
Tracker captures field value
        ↓
POST /v1/track
{
  "type": "form_interaction",
  "trigger": "blur",
  "fieldName": "email",
  "fieldValue": "user@example.com"
}
        ↓
TrackingService.handleFormInteraction(client, dto)
        ↓
Check: Has email? ✅ Yes
        ↓
LeadCreationService.findExistingLead({ email, visitorId })
        ↓
If exists → Update lead
If not exists → Create partial lead (status: 'partial', quality: 'medium')
        ↓
INSERT INTO events (...)
        ↓
Return { success: true }
        ↓
User closes tab (beforeunload)
        ↓
Tracker sends all in-progress fields via sendBeacon
```

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

// Event Tracking
POST   /v1/track                      // Track event (public)
GET    /v1/events                     // List events (authenticated)

// Lead Management
GET    /v1/leads                      // List leads
GET    /v1/leads/:leadId              // Get lead details
PUT    /v1/leads/:leadId              // Update lead
DELETE /v1/leads/:leadId              // Delete lead

// Script Generation
GET    /script/:clientId.js           // Get tracking script (public, cached)
```

### 5.2 API Authentication

**Public Endpoints** (no auth):
- `GET /script/:clientId.js`

**API Key Auth** (X-API-Key header):
- `POST /v1/track`

**JWT Auth** (Authorization: Bearer token):
- All client/form/field/lead management endpoints

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

## 6. Client-Side SDK

### 6.1 Architecture

```javascript
// production-tracker.js structure

(function() {
  'use strict';

  // ========================================
  // 1. CONFIGURATION
  // ========================================
  const CONFIG = {
    clientId: '{{CLIENT_ID}}',
    serverUrl: '{{SERVER_URL}}',
    apiKey: '{{API_KEY}}',
    widgets: '{{WIDGETS_CONFIG}}',
  };

  // ========================================
  // 2. UTILITIES
  // ========================================
  const Utils = {
    log: function(...args) { /* ... */ },
    generateUUID: function() { /* ... */ },
    debounce: function(func, wait) { /* ... */ },
  };

  // ========================================
  // 3. SESSION MANAGEMENT
  // ========================================
  const Session = {
    getSessionId: function() { /* ... */ },
    getVisitorId: function() { /* ... */ },
  };

  // ========================================
  // 4. EVENT QUEUE & BATCHING
  // ========================================
  const EventQueue = {
    queue: [],
    batchSize: 10,
    flushInterval: 5000,
    add: function(event) { /* ... */ },
    flush: function() { /* ... */ },
  };

  // ========================================
  // 5. FORM TRACKER
  // ========================================
  const FormTracker = {
    trackedForms: new Map(),
    sensitiveFields: ['password', 'ssn', 'credit_card', 'cvv'],
    
    init: function() {
      this.attachFormListeners();
      this.attachFieldListeners();
      this.attachBeforeUnload();
    },
    
    attachFormListeners: function() { /* ... */ },
    attachFieldListeners: function() { /* ... */ },
    handleFormSubmit: function(form, event) { /* ... */ },
    handleFieldBlur: function(field, event) { /* ... */ },
    handleBeforeUnload: function() { /* ... */ },
    redactSensitiveFields: function(data) { /* ... */ },
  };

  // ========================================
  // 6. CHAT WIDGET (Optional)
  // ========================================
  const ChatWidget = {
    init: function() { /* ... */ },
    open: function() { /* ... */ },
    close: function() { /* ... */ },
    sendMessage: function(message) { /* ... */ },
  };

  // ========================================
  // 7. API CLIENT
  // ========================================
  const API = {
    trackEvent: function(eventData) {
      return fetch(`${CONFIG.serverUrl}/v1/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': CONFIG.apiKey,
        },
        body: JSON.stringify(eventData),
      });
    },
  };

  // ========================================
  // 8. INITIALIZATION
  // ========================================
  function init() {
    Session.init();
    FormTracker.init();
    if (CONFIG.widgets.chat.enabled) {
      ChatWidget.init();
    }
    EventQueue.startAutoFlush();
    
    // Track initialization
    EventQueue.add({
      type: 'tracker_initialized',
      clientId: CONFIG.clientId,
      version: '2.0.0',
      timestamp: new Date().toISOString(),
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

### 9.1 Script Loading

**CDN Caching**:
```typescript
// script.controller.ts
@Get('/script/:clientId.js')
@Header('Content-Type', 'application/javascript')
@Header('Cache-Control', 'public, max-age=3600') // 1 hour
@Header('X-Content-Type-Options', 'nosniff')
async getScript(
  @Param('clientId') clientId: string,
  @Res() res: Response,
) {
  const script = await this.scriptService.generateScript(clientId);
  const etag = this.generateETag(clientId);
  
  res.setHeader('ETag', etag);
  res.send(script);
}
```

**Script Minification**:
```javascript
// webpack.config.js
module.exports = {
  entry: './src/tracker/production-tracker.js',
  output: {
    filename: 'production-tracker.min.js',
    path: path.resolve(__dirname, 'dist/public'),
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
          },
        },
      }),
    ],
  },
};
```

### 9.2 Database Optimization

**Indexes**:
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_leads_client_created 
  ON leads(client_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_events_visitor_timestamp 
  ON events(visitor_id, timestamp DESC);

-- Partial index for active leads only
CREATE INDEX CONCURRENTLY idx_leads_active 
  ON leads(client_id, status) 
  WHERE crm_synced_at IS NULL;
```

**Query Optimization**:
```typescript
// Use connection pooling
{
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  extra: {
    max: 20,          // Max connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
}
```

### 9.3 Event Batching

- Batch size: 10 events
- Flush interval: 5 seconds
- Use `sendBeacon` for reliability on page unload
- Fallback to `fetch` with `keepalive: true`

---

## 10. Deployment Architecture

### 10.1 Infrastructure Diagram

```
                     ┌─────────────────────┐
                     │   CloudFlare CDN    │
                     │  (Static Scripts)   │
                     └──────────┬──────────┘
                                │
                                │
                     ┌──────────▼──────────┐
                     │   Load Balancer     │
                     └──────────┬──────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
     ┌──────────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
     │  API Server 1   │ │ API Server 2│ │ API Server 3│
     │   (NestJS)      │ │  (NestJS)   │ │  (NestJS)   │
     └──────────┬──────┘ └─────┬──────┘ └─────┬──────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                     ┌──────────▼──────────┐
                     │   PostgreSQL RDS    │
                     │   (Primary + Replica)│
                     └─────────────────────┘
                                │
                     ┌──────────▼──────────┐
                     │   Redis (Optional)  │
                     │  (Rate Limiting)    │
                     └─────────────────────┘
```

### 10.2 Scaling Strategy

**Horizontal Scaling**:
- Stateless API servers (scale with load balancer)
- Database read replicas for analytics queries
- Redis for distributed rate limiting

**Vertical Scaling**:
- Database: Start with db.t3.medium, scale to db.r5.large
- API servers: t3.medium → t3.large → t3.xlarge

### 10.3 Monitoring & Observability

**Metrics to Track**:
- API latency (p50, p95, p99)
- Script load time
- Event throughput (events/second)
- Database query performance
- Error rates
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
