# CRM Web Tracker - Documentation Index

This document serves as the main index for the CRM Web Tracker project documentation.

> **📁 Location**: All documentation is now located in the `/docs/` folder

---

## 📚 Documentation Structure

### 1. **[PRD.md](./PRD.md)** - Product Requirements Document
Complete product requirements including:
- Product vision and value proposition
- User personas and stories
- Core features and acceptance criteria
- Success metrics and KPIs
- Implementation phases and roadmap
- Open questions and decisions

**Audience**: Product managers, stakeholders, business team

---

### 2. **[DESIGN.md](./DESIGN.md)** - Technical Design Document
Technical architecture and implementation details:
- System architecture overview
- Database schema and data model
- Component design (NestJS services)
- API design and data flow
- Client-side SDK architecture
- Security, privacy, and performance optimization

**Audience**: Engineering team, architects, developers

---

### 3. **Supporting Documentation**

#### Implementation Docs
- **[EVENT_TRACKING_DOCUMENTATION.md](./EVENT_TRACKING_DOCUMENTATION.md)** - Detailed event tracking strategy
- **[LEAD_FOCUSED_IMPLEMENTATION.md](./LEAD_FOCUSED_IMPLEMENTATION.md)** - Lead-focused tracking implementation details
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Current implementation status

#### Testing & Guides
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing instructions
- **[API_DOCS.md](./API_DOCS.md)** - Complete API documentation
- **[FORM_TRACKING_INTERNALS.md](./FORM_TRACKING_INTERNALS.md)** - Form tracking internals

#### Archived Documentation
- **[archive/](./archive/)** - Historical and outdated documentation

---

## 🚀 Quick Start

### For Product Managers
1. Read [PRD.md](./PRD.md) for product requirements and roadmap
2. Check implementation status in [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

### For Developers
1. Read [DESIGN.md](./DESIGN.md) for technical architecture
2. Review [API_DOCS.md](./API_DOCS.md) for API specifications
3. Check [EVENT_TRACKING_DOCUMENTATION.md](./EVENT_TRACKING_DOCUMENTATION.md) for event tracking details

### For QA/Testing
1. Follow [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing procedures
2. Review [API_DOCS.md](./API_DOCS.md) for endpoint testing

---

## 📋 Quick Reference

### Current Status
- **Phase**: Phase 1 Complete ✅, Phase 2 In Progress 🔄
- **Version**: 2.0
- **Last Updated**: October 22, 2025

### What's Working
- ✅ Lead-focused event tracking (form_submission, form_interaction, chat_message_sent)
- ✅ Form field interaction tracking (blur, beforeunload, change)
- ✅ Event batching and queue management
- ✅ Chat widget with lead capture
- ✅ Privacy-first field redaction

### What's Next (Phase 2)
- 🔄 Dashboard for site management
- 🔄 Add/Edit/Delete forms interface
- 🔄 Manual field definition interface
- 🔄 Form selector validation
- 🔄 Live form preview/testing

---

## 🎯 Core Features Summary

### Lead Tracking Strategy

| Event Type | Purpose | Lead Created | Quality | Priority |
|------------|---------|--------------|---------|----------|
| `form_submission` | Complete form data | ✅ Always | High | 🔴 Critical |
| `form_interaction` | Partial form data (blur, beforeunload, change) | 🟡 If email present | Medium | 🔴 Critical |
| `chat_message_sent` | Chat conversations | ✅ If email collected | High | 🟡 Medium |
| `tracker_initialized` | System validation | ❌ Never | N/A | 🟢 Low |

**Events NOT Tracked** (no lead value):
- ❌ Page views
- ❌ Generic clicks
- ❌ Link clicks

---

## 🔗 External Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Form Data API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [GDPR Compliance Guide](https://gdpr.eu/)

# CRM Web Tracker - Legacy Documentation (Historical)

> **⚠️ NOTICE**: This document contains the original combined PRD and design documentation.  
> **For current documentation, see**:
> - **[PRD.md](./PRD.md)** - Product Requirements Document
> - **[DESIGN.md](./DESIGN.md)** - Technical Design Document

---

<details>
<summary>Click to expand legacy documentation</summary>

## 1. Product Overview

### Vision
A lightweight, easy-to-integrate CRM tracking solution that enables businesses to manually configure website forms, map fields to CRM properties, and automatically track lead-generating events—capturing complete and partial leads without complex integrations.

### Core Value Proposition
- **Zero Configuration Setup**: Single script tag integration
- **Lead-Focused Tracking**: Only tracks events that generate leads (forms, interactions, chat)
- **Partial Lead Capture**: Captures abandoned forms with email for follow-up
- **Manual Form Configuration**: Simple interface to define forms and their fields
- **Flexible Field Mapping**: Configure how form fields map to CRM properties
- **Real-time Lead Capture**: Automatic capture of complete and partial leads
- **Privacy-First**: Automatic redaction of sensitive fields (password, SSN, credit card)

---

## 2. User Personas

### Primary User: Marketing/Sales Operations Manager
- **Goal**: Capture leads from website forms into CRM automatically, including partial/abandoned forms
- **Pain Points**: Manual form integration, complex CRM APIs, missed leads from form abandonment
- **Needs**: Easy form setup, simple field mapping, reliable tracking, partial lead recovery

### Secondary User: Web Developer
- **Goal**: Integrate tracking without modifying existing forms
- **Pain Points**: Complex integrations, form changes breaking integrations
- **Needs**: Simple installation, CSS selector-based configuration, minimal overhead

---

## 3. Core Features

### 3.1 Site Management
**Feature**: Users can add their sites to the CRM system

**Acceptance Criteria**:
- [ ] User can register a new site with domain/URL
- [ ] System generates unique `clientId` and `apiKey` for each site
- [ ] User receives integration code snippet (script tag)
- [ ] Support for multiple sites per account
- [ ] Site status management (active/inactive)

**User Flow**:
1. User clicks "Add New Site"
2. Enters domain (e.g., "example.com")
3. System validates domain and creates configuration
4. User receives script tag: `<script src="https://api.yourcrm.com/script/{clientId}.js"></script>`
5. User copies and pastes into their website's `<head>` tag

---

### 3.2 Manual Form Configuration
**Feature**: Users can manually add and configure forms for each site

**Acceptance Criteria**:
- [ ] User can add a new form by providing page URL and form identifier (CSS selector)
- [ ] User defines form fields manually (name, type, label)
- [ ] Support for identifying forms by: CSS selector, form ID, form name, or form action URL
- [ ] User can add multiple forms per site
- [ ] Form list view with edit/delete capabilities
- [ ] Form validation (ensure form exists on page)

**User Flow**:
1. User navigates to "Forms" section for their site
2. Clicks "Add New Form"
3. Enters form details:
   - **Page URL**: `https://example.com/contact`
   - **Form Identifier**: CSS selector `#contact-form` or form name
   - **Form Name**: "Contact Us Form"
4. System validates the form exists on the page (optional live preview)
5. User proceeds to add fields

**Form Configuration Structure**:
```json
{
  "formId": "form_001",
  "formName": "Contact Us",
  "pageUrl": "https://example.com/contact",
  "formSelector": "#contact-form",
  "alternativeSelectors": [
    "form[name='contact']",
    "form[action='/submit-contact']"
  ],
  "clientId": "abc-123",
  "isActive": true,
  "createdAt": "2025-10-21T10:00:00.000Z",
  "updatedAt": "2025-10-21T10:00:00.000Z",
  "fields": [
    {
      "fieldId": "field_001",
      "formId": "form_001",
      "fieldSelector": "input[name='email']",
      "fieldName": "email",
      "fieldType": "email",
      "label": "Your Email",
      "isRequired": true
    },
    {
      "fieldId": "field_002",
      "formId": "form_001",
      "fieldSelector": "input[name='full_name']",
      "fieldName": "full_name",
      "fieldType": "text",
      "label": "Full Name",
      "isRequired": true
    },
    {
      "fieldId": "field_003",
      "formId": "form_001",
      "fieldSelector": "textarea[name='message']",
      "fieldName": "message",
      "fieldType": "textarea",
      "label": "Message",
      "isRequired": false
    }
  ]
}
```
    │       ├── Field 2 (formId: "form_001")

**Data Relationships**:
```
Client (Site)
├── clientId: "abc-123"
├── domain: "example.com"
├── apiKey: "sk_live_abc123"
└── Forms []
    ├── Form 1
    │   ├── formId: "form_001"
    │   ├── clientId: "abc-123" (Foreign Key)
    │   └── Fields []
    │       ├── Field 1 (formId: "form_001")
    │       ├── Field 2 (formId: "form_001")
    │       └── Field 3 (formId: "form_001")
    └── Form 2
        ├── formId: "form_002"
        ├── clientId: "abc-123" (Foreign Key)
        └── Fields []
```

---

### 3.3 Field Definition
**Feature**: Users manually define fields for each form

**Acceptance Criteria**:
- [ ] Add fields one by one with field selector (CSS selector or name attribute)
- [ ] Specify field properties: name, type, label, required status
- [ ] Support common field types: text, email, phone, textarea, select, checkbox, radio
- [ ] Field reordering capability
- [ ] Bulk import fields (CSV or JSON)
- [ ] Field validation rules (regex patterns)

**Field Definition Interface**:
```
Form: "Contact Us" (https://example.com/contact)

┌─────────────────────────────────────────────────────────────┐
│ Add Field                                                    │
├─────────────────────────────────────────────────────────────┤
│ Field Selector:  [input[name='email']        ]             │
│ Field Name:      [email                      ]             │
│ Field Type:      [Email ▼                    ]             │
│ Label:           [Your Email                 ]             │
│ Required:        [✓] Required                              │
│                                                              │
│ [Cancel]  [Add Field]                                       │
└─────────────────────────────────────────────────────────────┘

Current Fields:
1. email (input[name='email']) → Email field [Edit] [Delete]
2. full_name (input[name='full_name']) → Text field [Edit] [Delete]
3. message (textarea[name='message']) → Textarea [Edit] [Delete]

[Add Another Field]
```

---

### 3.4 Field Mapping Configuration
**Feature**: Configure how form fields map to CRM properties

**Acceptance Criteria**:
- [ ] Visual interface showing all discovered forms
- [ ] Drag-and-drop or dropdown mapping interface
- [ ] Support for standard CRM fields (contact, lead, opportunity)
- [ ] Support for custom fields
- [ ] Field transformation rules (e.g., split full name into first/last)
- [ ] Default mapping suggestions based on field intent
- [ ] Save and version mapping configurations

**Mapping Interface**:
```
Form: "Contact Us" (https://example.com/contact)

┌─────────────────────────┬──────────────────────┐
│ Website Form Field      │ Maps to CRM Field    │
├─────────────────────────┼──────────────────────┤
│ email                   │ → Contact.Email      │
│ full_name               │ → Contact.FullName   │
│ phone                   │ → Contact.Phone      │
│ company                 │ → Contact.Company    │
│ message                 │ → Lead.Notes         │
│ [Ignore checkbox]       │ → (Not mapped)       │
└─────────────────────────┴──────────────────────┘

[Auto-Map] [Save Mapping] [Reset]
```

**Field Mapping Configuration**:
```json
{
  "formId": "contact-form",
  "mappings": [
    {
      "sourceField": "email",
      "targetEntity": "Contact",
      "targetField": "Email",
      "transform": null,
      "required": true
    },
    {
      "sourceField": "full_name",
      "targetEntity": "Contact",
      "targetField": "FullName",
      "transform": "splitName",
      "required": true
    },
    {
      "sourceField": "message",
      "targetEntity": "Lead",
      "targetField": "Description",
      "required": false
    }
  ]
}
```

---

### 3.5 Lead-Focused Event Tracking
**Feature**: Real-time capture of lead-generating events only

**Tracking Strategy**:
The system focuses exclusively on events that generate leads, eliminating noise from generic analytics.

**Events Tracked**:

| Event Type | Purpose | Lead Created | Priority |
|------------|---------|--------------|----------|
| `form_submission` | Complete form data | ✅ Always (high quality) | 🔴 Critical |
| `form_interaction` | Partial form data (blur, beforeunload, change) | 🟡 If email present | 🔴 Critical |
| `chat_message_sent` | Chat conversations | ✅ If email collected | 🟡 Medium |
| `tracker_initialized` | System validation | ❌ Never | 🟢 Low |

**Events NOT Tracked** (no lead value):
- ❌ Page views
- ❌ Generic clicks
- ❌ Link clicks

**Acceptance Criteria**:
- [x] Automatic tracking of all mapped forms
- [x] Form field interaction tracking (blur, beforeunload, change events)
- [x] Capture partial leads from abandoned forms
- [x] Send data to CRM in real-time
- [x] Event batching and queue management
- [x] Redact sensitive fields (password, credit card, SSN, CVV, PIN)
- [ ] Deduplicate submissions
- [x] Associate events with user session/visitor ID
- [x] Lead quality scoring (high/medium/low)

**Form Submission Payload**:
```json
{
  "type": "form_submission",
  "formId": "contact-form",
  "timestamp": "2025-10-21T10:30:45.123Z",
  "sessionId": "sess_xyz789",
  "visitorId": "visitor_abc123",
  "fields": {
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+1-555-0123",
    "company": "Acme Corp",
    "message": "Interested in your services"
  },
  "page": {
    "url": "https://example.com/contact",
    "path": "/contact",
    "title": "Contact Us",
    "referrer": "https://google.com"
  }
}
```

**Form Interaction Payload** (Partial Lead):
```json
{
  "type": "form_interaction",
  "formId": "contact-form",
  "trigger": "blur",
  "fieldName": "email",
  "fieldValue": "john@example.com",
  "fieldType": "email",
  "timestamp": "2025-10-21T10:28:00.123Z",
  "formProgress": {
    "completedFields": ["email", "name"],
    "totalFields": 5,
    "percentComplete": 40
  }
}
```

**Lead Creation Logic**:
- **Form Submission**: Always creates lead (status: `submitted`, quality: `high`)
- **Form Interaction**: Creates lead only if email is present (status: `partial`, quality: `medium`)
- **Chat Message**: Creates lead if email collected (status: `chat_inquiry`, quality: `high`)

---

## 4. Additional Features

### 4.1 Form Testing & Validation
- Live form preview (load page and highlight form)
- Test form submission (simulate without actually submitting)
- Field detection helper (click to select field on page)
- Validation warnings (form/field not found)

### 4.2 Lead Analytics & Tracking
- Form abandonment tracking (with email capture)
- Form completion rates
- Lead quality distribution (high/medium/low)
- Submission success/failure rates
- Partial vs complete lead ratios

### 4.3 Chat Widget
- [x] Live chat integration
- [x] Contact info collection (email + name)
- [x] Lead capture from conversations
- [ ] Chatbot support
- [ ] Proactive engagement rules

### 4.4 Privacy & Compliance
- GDPR compliance
- Cookie consent management
- Data retention policies
- PII redaction
- Right to deletion

---

## 5. Technical Architecture

### 5.1 Data Model & Relationships

**Entity Relationship Diagram**:
```
┌─────────────────────────────────────────────────────┐
│ Client (Site)                                       │
│ ─────────────────────────────────────────────────  │
│ PK: clientId (string)                               │
│     domain (string)                                 │
│     apiKey (string)                                 │
│     isActive (boolean)                              │
│     createdAt (datetime)                            │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:N (One client has many forms)
                   │
┌──────────────────▼──────────────────────────────────┐
│ Form                                                │
│ ─────────────────────────────────────────────────  │
│ PK: formId (string)                                 │
│ FK: clientId (string) → Client.clientId             │
│     formName (string)                               │
│     pageUrl (string)                                │
│     formSelector (string)                           │
│     alternativeSelectors (array)                    │
│     isActive (boolean)                              │
│     createdAt (datetime)                            │
│     updatedAt (datetime)                            │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:N (One form has many fields)
                   │
┌──────────────────▼──────────────────────────────────┐
│ Field                                               │
│ ─────────────────────────────────────────────────  │
│ PK: fieldId (string)                                │
│ FK: formId (string) → Form.formId                   │
│     fieldSelector (string)                          │
│     fieldName (string)                              │
│     fieldType (string)                              │
│     label (string)                                  │
│     isRequired (boolean)                            │
│     createdAt (datetime)                            │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:1 (One field maps to one CRM field)
                   │
┌──────────────────▼──────────────────────────────────┐
│ FieldMapping                                        │
│ ─────────────────────────────────────────────────  │
│ PK: mappingId (string)                              │
│ FK: fieldId (string) → Field.fieldId                │
│     targetEntity (string) - e.g., "Contact", "Lead" │
│     targetField (string) - e.g., "Email"            │
│     transform (string) - e.g., "splitName"          │
│     isRequired (boolean)                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Event (Tracked Submissions)                         │
│ ─────────────────────────────────────────────────  │
│ PK: eventId (string)                                │
│ FK: clientId (string) → Client.clientId             │
│ FK: formId (string) → Form.formId                   │
│     eventType (string) - "form_submission"          │
│     sessionId (string)                              │
│     payload (JSON)                                  │
│     metadata (JSON)                                 │
│     timestamp (datetime)                            │
└─────────────────────────────────────────────────────┘
```

**Key Relationships**:
1. **Client → Forms**: One-to-Many
   - A client (site) can have multiple forms
   - Each form belongs to exactly one client
   - Foreign Key: `Form.clientId → Client.clientId`
   - On Delete: CASCADE (deleting a client deletes all its forms)

2. **Form → Fields**: One-to-Many
   - A form can have multiple fields
   - Each field belongs to exactly one form
   - Foreign Key: `Field.formId → Form.formId`
   - On Delete: CASCADE (deleting a form deletes all its fields)

3. **Field → FieldMapping**: One-to-One
   - Each field can have one CRM mapping (optional)
   - Foreign Key: `FieldMapping.fieldId → Field.fieldId`
   - On Delete: CASCADE (deleting a field deletes its mapping)

4. **Client/Form → Events**: One-to-Many
   - Events reference both client and form for easier querying
   - Foreign Keys: `Event.clientId`, `Event.formId`
   - On Delete: SET NULL (keep events even if client/form deleted)

**Sample Query Flows**:
```typescript
// Get all forms for a client
SELECT * FROM forms WHERE clientId = 'abc-123';

// Get all fields for a form with their mappings
SELECT f.*, fm.targetEntity, fm.targetField 
FROM fields f 
LEFT JOIN field_mappings fm ON f.fieldId = fm.fieldId 
WHERE f.formId = 'form_001';

// Get all tracked submissions for a client
SELECT * FROM events 
WHERE clientId = 'abc-123' 
AND eventType = 'form_submission'
ORDER BY timestamp DESC;
```

---

### 5.2 Integration Pattern
**Inline Bootloader (Command Queue)**

```html
<!-- Client Integration -->
<script src="https://api.yourcrm.com/script/{clientId}.js" async defer></script>
```

### 5.3 Components
1. **Application Server** (NestJS)
   - Client configuration management
   - Script generation (reads Client + Forms by clientId)
   - Event tracking API (validates clientId + formId)
   - Form management API (CRUD operations)

2. **Database** (See Data Model in 5.1)
   - **Clients Table**: Site configurations
   - **Forms Table**: Form definitions (linked to clientId)
   - **Fields Table**: Field definitions (linked to formId)
   - **Field Mappings Table**: CRM mappings (linked to fieldId)
   - **Events Table**: Tracked events (linked to clientId + formId)

3. **CDN**
   - Static asset delivery
   - Global distribution
   - Caching strategy

4. **Client-Side SDK** (`main-app.v1.js`)
   - Event tracking
   - Form interception (matches forms by selector)
   - Widget rendering
   - API communication (includes clientId + formId in requests)

### 5.4 Data Flow

**Script Loading & Configuration**:
```
1. Website loads: <script src="/script/abc-123.js">
                              ↓
2. Server queries: SELECT * FROM clients WHERE clientId = 'abc-123'
                   SELECT * FROM forms WHERE clientId = 'abc-123'
                   SELECT fields.*, field_mappings.* 
                   FROM fields 
                   JOIN forms ON fields.formId = forms.formId
                   WHERE forms.clientId = 'abc-123'
                              ↓
3. Server generates script with embedded config:
   {
     clientId: 'abc-123',
     apiKey: 'sk_live_abc123',
     widgets: {
       forms: {
         enabled: true,
         trackInteractions: true,
         trackFields: ['email', 'phone', 'name', ...],
         triggers: { blur: true, beforeunload: true, change: true }
       },
       chat: { enabled: true, collectContactInfo: true }
     },
     forms: [...]
   }
                              ↓
4. Client browser receives script → Loads production-tracker.js
                              ↓
5. Tracker SDK initializes → Attaches form listeners (submit, blur, beforeunload)
```

**Complete Form Submission Flow**:
```
1. User fills and submits form on website
                ↓
2. Tracker SDK intercepts submit event
                ↓
3. SDK matches form using selector → Finds formId: 'form_001'
                ↓
4. SDK extracts field values + redacts sensitive fields
                ↓
5. SDK sends to API: POST /v1/track
   {
     type: 'form_submission',
     formId: 'form_001',
     fields: { email: '...', name: '...' }
   }
                ↓
6. Server validates & stores event
                ↓
7. Server creates lead (status: 'submitted', quality: 'high')
                ↓
8. Server processes mappings → Sends to CRM
```

**Partial Lead Capture Flow** (Form Abandonment):
```
1. User fills email field → Moves to next field (blur event)
                ↓
2. Tracker SDK captures: form_interaction (email field)
                ↓
3. User fills name field → Closes tab (beforeunload event)
                ↓
4. Tracker SDK captures all in-progress fields via beforeunload
                ↓
5. SDK batches and sends: POST /v1/track
   {
     type: 'form_interaction',
     trigger: 'beforeunload',
     fields: { email: '...', name: '...' }
   }
                ↓
6. Server checks: Has email? ✅ Yes
                ↓
7. Server creates partial lead (status: 'partial', quality: 'medium')
                ↓
8. Marketing can follow up: "We noticed you started a form..."
```

---

## 6. Success Metrics

### Business Metrics
- **Lead Capture Rate**: % increase in captured leads (including partial)
- **Partial Lead Recovery**: % of abandoned forms captured with email
- **Integration Time**: < 5 minutes from signup to first tracked event
- **Form Configuration Time**: < 10 minutes to configure a form with mappings
- **Lead Quality Distribution**: Ratio of high/medium/low quality leads

### Technical Metrics
- **Script Load Time**: < 100ms
- **Tracking Accuracy**: > 99.5% of submissions captured
- **Partial Lead Capture**: > 90% of abandoned forms with email captured
- **API Latency**: < 200ms p95
- **Uptime**: 99.9% availability
- **Event Batching Efficiency**: < 5s flush interval

### User Satisfaction
- **Time to Value**: User captures first lead within 10 minutes
- **Setup Completion Rate**: > 80% complete integration
- **Support Tickets**: < 5% of users require support
- **Partial Lead Follow-up Rate**: % of partial leads contacted

---

## 7. Implementation Phases

### Phase 1: MVP (Completed ✅)
- [x] Basic script integration
- [x] Client configuration management
- [x] Lead-focused tracking strategy
- [x] Form submission tracking (complete leads)
- [x] Form interaction tracking (partial leads - blur, beforeunload, change)
- [x] Chat widget with lead capture
- [x] Event batching and queue management
- [x] Session and visitor tracking
- [x] Privacy-first field redaction
- [x] Manual field mapping (code-based)

### Phase 2: Form Management UI (Current)
- [ ] Dashboard for site management
- [ ] Add/Edit/Delete forms interface
- [ ] Manual field definition interface
- [ ] Form selector validation
- [ ] Live form preview/testing

### Phase 3: Field Mapping
- [ ] Dashboard for site management
- [ ] Visual form discovery interface
- [ ] Drag-and-drop field mapping
- [ ] Mapping suggestions/auto-map

### Phase 4: Advanced Features
- [ ] Field transformations
- [ ] Custom CRM integrations
- [ ] Lead analytics dashboard (quality distribution, sources)
- [ ] Partial lead follow-up automation
- [ ] Lead deduplication across sessions
- [ ] Lead scoring algorithm refinement

### Phase 5: Enterprise
- [ ] Multi-tenant support
- [ ] Role-based access control
- [ ] Advanced compliance features
- [ ] Webhook integrations

---

## 8. API Reference (Quick)

### Client Management
```bash
# Create site
POST /v1/clients
{ "domain": "example.com", "clientId": "abc-123" }

# Get configuration
GET /v1/clients/abc-123
```

### Form Management
```bash
# Add form (must belong to a client)
POST /v1/clients/abc-123/forms
{
  "formName": "Contact Us",
  "pageUrl": "https://example.com/contact",
  "formSelector": "#contact-form"
}

# Alternative: Add form with clientId in body
POST /v1/forms
{
  "clientId": "abc-123",
  "formName": "Contact Us",
  "pageUrl": "https://example.com/contact",
  "formSelector": "#contact-form"
}

# Get all forms for a specific site
GET /v1/clients/abc-123/forms

# Get single form
GET /v1/forms/form_001

# Update form
PUT /v1/forms/form_001
{ "formName": "Updated Contact Form", "isActive": false }

# Delete form
DELETE /v1/forms/form_001

# Add field to form
POST /v1/forms/form_001/fields
{
  "fieldSelector": "input[name='email']",
  "fieldName": "email",
  "fieldType": "email",
  "label": "Your Email",
  "isRequired": true
}

# Get all fields for a form
GET /v1/forms/form_001/fields

# Update field
PUT /v1/forms/form_001/fields/field_001
{ "label": "Email Address", "isRequired": false }

# Delete field
DELETE /v1/forms/form_001/fields/field_001
```

### Event Tracking (Lead-Focused)
```bash
# Track complete form submission
POST /v1/track
{
  "type": "form_submission",
  "formId": "contact-form",
  "fields": { "email": "...", "name": "..." },
  "page": { "url": "...", "referrer": "..." }
}
# → Creates lead (status: submitted, quality: high)

# Track partial form (abandoned with email)
POST /v1/track
{
  "type": "form_interaction",
  "trigger": "beforeunload",
  "fields": { "email": "...", "name": "..." },
  "formProgress": { "percentComplete": 40 }
}
# → Creates lead (status: partial, quality: medium)

# Track chat message (with email)
POST /v1/track
{
  "type": "chat_message_sent",
  "message": "...",
  "userInfo": { "email": "...", "name": "..." }
}
# → Creates lead (status: chat_inquiry, quality: high)
```

---

## 9. Open Questions & Decisions

### Questions to Resolve:
1. **CRM Integration**: Which CRM systems to support first? (Salesforce, HubSpot, Zoho?)
2. **Pricing Model**: Per site, per submission, or per feature?
3. **Data Residency**: Where to store tracked data? GDPR compliance?
4. **Form Changes**: How to notify users when forms change on their website?
5. **Field Selector Helper**: Build browser extension or iframe-based tool for easy field selection?

### Design Decisions:
- Manual form configuration vs assisted discovery (browser extension)?
- Support multiple selectors per field for resilience?
- Real-time vs batch processing for submissions?
- Self-hosted vs cloud-only deployment?

---

## 10. Resources & References

### Documentation
- `API_DOCS.md` - Complete API documentation
- `IMPLEMENTATION_SUMMARY.md` - Current implementation status
- `TESTING_GUIDE.md` - Testing instructions

### External References
- [NestJS Documentation](https://docs.nestjs.com)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Form Data API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

---

## 11. Next Steps

### Immediate (This Sprint)
1. ✅ Implement lead-focused event tracking (form_submission, form_interaction, chat_message_sent)
2. ✅ Add form field interaction tracking (blur, beforeunload, change)
3. ✅ Implement event batching and queue management
4. Design database schema with relationships:
   - Clients (1) → (N) Forms
   - Forms (1) → (N) Fields
   - Forms (1) → (N) Field Mappings
   - Events (N) → (1) Clients/Forms (lead tracking)
5. Build lead creation service (server-side)
6. Build form CRUD APIs (nested under /clients/:clientId/forms)
7. Implement field definition APIs (nested under /forms/:formId/fields)

### Short-term (Next 2-4 weeks)
1. Build admin dashboard UI
2. Create lead management interface (view/filter by status, quality)
3. Build form management interface
4. Build field definition interface with CSS selector helper
5. Implement field mapping UI
6. Add form testing/preview capability
7. Build partial lead follow-up tools
8. Add lead quality analytics dashboard

### Long-term (3+ months)
1. Browser extension for visual field selection
2. Form change detection and alerts
3. Advanced lead analytics dashboard (conversion funnels, attribution)
4. Multi-CRM integrations with lead sync
5. Bulk import/export capabilities
6. Automated lead scoring and prioritization
7. A/B testing for form variations
8. Lead nurturing workflows for partial leads

---

**Document Version**: 2.0 (Legacy)  
**Last Updated**: October 22, 2025  
**Status**: Archived - See [PRD.md](./PRD.md) and [DESIGN.md](./DESIGN.md) for current documentation

</details>


