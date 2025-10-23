# CRM Web Tracker - Product Requirements Document (PRD)

**Last Updated**: October 22, 2025  
**Version**: 2.0  
**Status**: Phase 1 Complete, Phase 2 In Progress

---

## 1. Product Overview

### Vision
A lightweight, easy-to-integrate CRM tracking solution that enables businesses to manually configure website forms, map fields to CRM properties, and automatically track lead-generating events—capturing complete and partial leads without complex integrations.

### Core Value Proposition
- **Zero Configuration Setup**: Single script tag integration with bootloader pattern
- **Lead-Focused Tracking**: Only tracks events that generate leads (forms, interactions, chat)
- **Partial Lead Capture**: Captures abandoned forms with email for follow-up
- **Manual Form Configuration**: Simple interface to define forms and their fields
- **Flexible Field Mapping**: Configure how form fields map to CRM properties
- **Real-time Lead Capture**: Automatic capture of complete and partial leads
- **Privacy-First**: Automatic redaction of sensitive fields (password, SSN, credit card)
- **High Performance**: Batch processing with 10k+ events/sec throughput
- **Scalable Architecture**: Hybrid database design optimized for both config and event data

### Problem Statement
Businesses lose 70-80% of potential leads from form abandonment. Current solutions either:
1. Require complex integrations with each form
2. Don't capture partial/abandoned form data
3. Track too much noise (page views, clicks) without actionable lead data

### Solution
A lead-focused tracking system that captures:
- **Complete leads** from form submissions
- **Partial leads** from abandoned forms (if email is captured)
- **Conversational leads** from chat interactions
- Nothing else (no page views, no generic clicks)

---

## 2. User Personas

### Primary User: Marketing/Sales Operations Manager
**Profile**: Sarah, 35, manages lead generation for a dental practice network

**Goals**:
- Capture every potential lead from website forms
- Recover leads from abandoned forms
- Track lead quality and sources
- Easy integration without developer dependency

**Pain Points**:
- Manual form integration is time-consuming
- Complex CRM APIs require developers
- Loses leads when users abandon forms
- Can't track partial lead information

**Needs**:
- Easy form setup (< 10 minutes)
- Simple field mapping interface
- Reliable lead tracking (>99% accuracy)
- Partial lead recovery with follow-up tools

**Success Metrics**:
- 30% increase in captured leads
- 50+ partial leads recovered per month
- < 5 minutes to add a new form

---

### Secondary User: Web Developer
**Profile**: Mike, 28, maintains company websites

**Goals**:
- Integrate tracking without modifying existing forms
- Simple installation process
- Minimal performance impact
- Easy to debug and test

**Pain Points**:
- Complex integrations break when forms change
- Heavy scripts slow down page load
- Tracking scripts conflict with other tools
- Difficult to test without production data

**Needs**:
- Simple installation (single script tag)
- CSS selector-based configuration
- Minimal overhead (< 100ms load time)
- Clear documentation and debugging tools

**Success Metrics**:
- < 5 minutes integration time
- < 100ms script load time
- Zero conflicts with existing scripts

---

## 3. Core Features

### 3.1 Site Management

**Feature**: Users can add and manage their sites in the CRM system

**User Stories**:
- As a marketing manager, I want to add my website to the system so I can start tracking leads
- As a marketing manager, I want to manage multiple sites from one dashboard
- As a developer, I want clear integration instructions so I can set up tracking quickly

**Acceptance Criteria**:
- [ ] User can register a new site with domain/URL
- [ ] System generates unique `clientId` and `apiKey` for each site
- [ ] User receives integration code snippet (script tag)
- [ ] Support for multiple sites per account
- [ ] Site status management (active/inactive)
- [ ] Clear copy/paste integration instructions

**User Flow**:
1. User clicks "Add New Site"
2. Enters domain (e.g., "example.com")
3. System validates domain format
4. System generates `clientId` and `apiKey`
5. User sees script tag: `<script src="https://api.yourcrm.com/script/{clientId}.js"></script>`
6. User copies script tag to website's `<head>` section
7. System detects first page load within 60 seconds
8. User sees "Site Active" confirmation

**Out of Scope**:
- Automated site verification
- Custom subdomain setup
- White-label script URLs

---

### 3.2 Manual Form Configuration

**Feature**: Users manually add and configure forms for each site

**User Stories**:
- As a marketing manager, I want to define which forms to track so I capture the right leads
- As a marketing manager, I want to configure multiple forms per site (contact, demo, quote)
- As a developer, I want to use CSS selectors to identify forms accurately

**Acceptance Criteria**:
- [ ] User can add a new form by providing page URL and form identifier (CSS selector)
- [ ] User defines form fields manually (name, type, label)
- [ ] Support for identifying forms by: CSS selector, form ID, form name, or form action URL
- [ ] User can add multiple forms per site
- [ ] Form list view with edit/delete capabilities
- [ ] Form validation (ensure form exists on page)
- [ ] Alternative selectors for fallback

**User Flow**:
1. User navigates to "Forms" section for their site
2. Clicks "Add New Form"
3. Enters form details:
   - **Page URL**: `https://example.com/contact`
   - **Form Identifier**: CSS selector `#contact-form` or form name
   - **Form Name**: "Contact Us Form"
4. System validates the form exists on the page (optional live preview)
5. User proceeds to add fields (Section 3.3)

**Out of Scope**:
- Automatic form discovery
- Visual form builder
- Form design modifications

---

### 3.3 Field Definition

**Feature**: Users manually define fields for each form

**User Stories**:
- As a marketing manager, I want to specify which fields to track so I capture relevant lead data
- As a marketing manager, I want to mark required fields so I know lead data quality
- As a developer, I want to use CSS selectors or field names to identify fields

**Acceptance Criteria**:
- [ ] Add fields one by one with field selector (CSS selector or name attribute)
- [ ] Specify field properties: name, type, label, required status
- [ ] Support common field types: text, email, phone, textarea, select, checkbox, radio
- [ ] Field reordering capability
- [ ] Bulk import fields (CSV or JSON)
- [ ] Field validation rules (regex patterns)
- [ ] Visual field selector helper (point-and-click)

**Field Types Supported**:
- `text` - Single-line text input
- `email` - Email address (validated)
- `phone` - Phone number
- `textarea` - Multi-line text
- `select` - Dropdown menu
- `checkbox` - Boolean/multiple choice
- `radio` - Single choice from options
- `number` - Numeric input
- `date` - Date picker
- `url` - Website URL

**Out of Scope**:
- File upload fields
- Rich text editors
- Custom field types

---

### 3.4 Field Mapping Configuration

**Feature**: Configure how form fields map to CRM properties

**User Stories**:
- As a marketing manager, I want to map form fields to CRM fields so leads appear correctly in my CRM
- As a marketing manager, I want suggested mappings so I don't have to configure everything manually
- As a sales ops manager, I want to map to custom CRM fields for our specific workflow

**Acceptance Criteria**:
- [ ] Visual interface showing all configured form fields
- [ ] Drag-and-drop or dropdown mapping interface
- [ ] Support for standard CRM fields (Contact, Lead, Opportunity)
- [ ] Support for custom fields
- [ ] Field transformation rules (e.g., split full name into first/last)
- [ ] Default mapping suggestions based on field names
- [ ] Save and version mapping configurations
- [ ] Test mapping with sample data

**Standard CRM Entities**:
- **Contact**: Email, Name, Phone, Company, Address
- **Lead**: Email, Name, Phone, Source, Status, Notes
- **Opportunity**: Contact, Company, Value, Stage

**Transformations**:
- Split name: `John Doe` → `firstName: John`, `lastName: Doe`
- Format phone: `5551234567` → `+1-555-123-4567`
- Lowercase email: `USER@EXAMPLE.COM` → `user@example.com`
- Trim whitespace
- Custom regex transformations

**Out of Scope**:
- Complex multi-field transformations
- Conditional mapping logic
- Real-time CRM sync (batch only)

---

### 3.5 Lead-Focused Event Tracking

**Feature**: Real-time capture of lead-generating events only

**User Stories**:
- As a marketing manager, I want to capture complete form submissions as high-quality leads
- As a marketing manager, I want to capture abandoned forms with email as partial leads for follow-up
- As a sales manager, I want to see lead quality scores to prioritize follow-up

**Tracking Strategy**:
The system focuses exclusively on events that generate leads, eliminating noise from generic analytics.

**Events Tracked**:

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
- ❌ Scroll depth
- ❌ Time on page

**Acceptance Criteria**:
- [x] Automatic tracking of all configured forms
- [x] Form field interaction tracking (blur, beforeunload, change events)
- [x] Capture partial leads from abandoned forms
- [x] Send data to CRM in real-time (< 5s latency)
- [x] Event batching and queue management
- [x] Redact sensitive fields (password, credit card, SSN, CVV, PIN)
- [ ] Deduplicate submissions (same visitor + form within 24h)
- [x] Associate events with user session/visitor ID
- [x] Lead quality scoring (high/medium/low)

**Lead Creation Logic**:

| Event | Condition | Lead Status | Quality | Follow-up |
|-------|-----------|-------------|---------|-----------|
| Form Submission | Any submission | `submitted` | `high` | Immediate contact |
| Form Interaction (blur) | Email field filled | `partial` | `medium` | Follow-up email: "We noticed you started..." |
| Form Interaction (beforeunload) | Email in any field | `partial` | `medium` | Follow-up email: "Finish your request..." |
| Chat Message | Email collected | `chat_inquiry` | `high` | Live chat response |

**Privacy & Compliance**:
- Automatically redact sensitive fields:
  - `password`, `confirm_password`
  - `ssn`, `social_security`
  - `credit_card`, `card_number`, `cvv`, `cvc`
  - `pin`, `security_code`
- GDPR-compliant data storage
- Right to deletion support
- Cookie consent integration

---

## 4. Additional Features

### 4.1 Form Testing & Validation
**Priority**: Medium  
**Timeline**: Phase 2

- Live form preview (load page and highlight form)
- Test form submission (simulate without actually submitting)
- Field detection helper (click to select field on page)
- Validation warnings (form/field not found)
- Test event generation before going live

### 4.2 Lead Analytics & Tracking
**Priority**: High  
**Timeline**: Phase 3

- Form abandonment rates (with email capture)
- Form completion rates by form/page
- Lead quality distribution (high/medium/low)
- Submission success/failure rates
- Partial vs complete lead ratios
- Lead source attribution
- Conversion funnel visualization

### 4.3 Chat Widget
**Priority**: Medium  
**Timeline**: Phase 1 (✅ Complete)

- [x] Live chat integration
- [x] Contact info collection (email + name)
- [x] Lead capture from conversations
- [ ] Chatbot support (Phase 4)
- [ ] Proactive engagement rules (Phase 4)
- [ ] Chat transcript export

### 4.4 Privacy & Compliance
**Priority**: High  
**Timeline**: Phase 5

- GDPR compliance (data retention, right to deletion)
- Cookie consent management
- Data retention policies (configurable)
- PII redaction (automatic)
- Right to deletion API
- Data export API (JSON/CSV)

---

## 5. Success Metrics

### Business Metrics (KPIs)
- **Lead Capture Rate**: 30% increase in captured leads (target)
- **Partial Lead Recovery**: 50+ partial leads recovered per month
- **Lead Quality Distribution**: 60% high, 30% medium, 10% low
- **Integration Time**: < 5 minutes from signup to first tracked event
- **Form Configuration Time**: < 10 minutes per form
- **Partial Lead Conversion**: 15% of partial leads convert to customers

### Technical Metrics
- **Script Load Time**: < 100ms (p95)
- **Tracking Accuracy**: > 99.5% of submissions captured
- **Partial Lead Capture**: > 90% of abandoned forms with email captured
- **API Latency**: < 200ms (p95)
- **Uptime**: 99.9% availability (< 8.76 hours downtime/year)
- **Event Batching Efficiency**: < 5s flush interval
- **Script Size**: < 50KB (minified + gzipped)

### User Satisfaction
- **Time to Value**: User captures first lead within 10 minutes
- **Setup Completion Rate**: > 80% complete integration
- **Support Tickets**: < 5% of users require support
- **NPS Score**: > 50
- **Partial Lead Follow-up Rate**: > 70% of partial leads contacted within 24h

---

## 6. Implementation Phases

### Phase 1: MVP ✅ (COMPLETED - October 2025)
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

**Deliverables**:
- `production-tracker.js` v2.0
- Event tracking API (`POST /v1/track`)
- Client configuration API

---

### Phase 2: Form Management UI 🔄 (IN PROGRESS)
**Timeline**: November 2025  
**Team**: 2 developers, 1 designer

- [ ] Dashboard for site management
- [ ] Add/Edit/Delete forms interface
- [ ] Manual field definition interface
- [ ] Form selector validation
- [ ] Live form preview/testing
- [ ] Field selector helper tool

**User Stories**:
- As a marketing manager, I can add forms through a UI instead of code
- As a marketing manager, I can test forms before going live
- As a developer, I can validate CSS selectors work correctly

---

### Phase 3: Field Mapping & CRM Integration
**Timeline**: December 2025  
**Team**: 2 developers

- [ ] Visual field mapping interface
- [ ] Drag-and-drop field mapping
- [ ] Mapping suggestions/auto-map
- [ ] CRM integration (Salesforce, HubSpot)
- [ ] Real-time CRM sync
- [ ] Webhook support

**User Stories**:
- As a marketing manager, I can map fields visually without technical knowledge
- As a sales ops manager, I can sync leads to Salesforce automatically

---

### Phase 4: Advanced Features
**Timeline**: Q1 2026  
**Team**: 3 developers, 1 designer

- [ ] Field transformations
- [ ] Custom CRM integrations
- [ ] Lead analytics dashboard
- [ ] Partial lead follow-up automation
- [ ] Lead deduplication across sessions
- [ ] Lead scoring algorithm refinement
- [ ] A/B testing for forms

**User Stories**:
- As a marketing manager, I can see lead quality analytics
- As a sales manager, I can prioritize leads by scoring
- As a marketing manager, I can A/B test form variations

---

### Phase 5: Enterprise
**Timeline**: Q2 2026  
**Team**: 4 developers

- [ ] Multi-tenant support
- [ ] Role-based access control (RBAC)
- [ ] Advanced compliance features
- [ ] Webhook integrations
- [ ] SSO/SAML authentication
- [ ] Custom reporting
- [ ] API rate limiting by tier

**User Stories**:
- As an enterprise admin, I can manage team permissions
- As a compliance officer, I can ensure GDPR compliance

---

## 7. Open Questions & Decisions

### Questions to Resolve

1. **CRM Integration Priority**
   - Which CRM systems to support first? (Salesforce, HubSpot, Zoho?)
   - Real-time vs batch sync?
   - **Decision needed by**: November 15, 2025

2. **Pricing Model**
   - Per site, per submission, or per feature?
   - Tiered pricing vs flat rate?
   - Free tier limits?
   - **Decision needed by**: December 1, 2025

3. **Data Residency**
   - Where to store tracked data? (US, EU, multi-region)
   - GDPR compliance requirements?
   - Data retention default (90 days, 1 year, forever)?
   - **Decision needed by**: November 30, 2025

4. **Form Changes**
   - How to notify users when forms change on their website?
   - Automatic re-detection vs manual update?
   - **Decision needed by**: Phase 3 planning

5. **Field Selector Helper**
   - Build browser extension or iframe-based tool?
   - Chrome extension vs cross-browser?
   - **Decision needed by**: Phase 2 planning

### Design Decisions Made

✅ **Lead-Focused Tracking**: Only track events that generate leads (no page views, clicks)  
✅ **Manual Form Configuration**: Users define forms manually (vs automatic discovery)  
✅ **Event Batching**: Batch events for performance (5s flush interval)  
✅ **Privacy-First**: Automatically redact sensitive fields  
✅ **Real-time Capture**: Use `beforeunload` to capture abandoned forms  

### Design Decisions Pending

🟡 **Multiple Selectors per Field**: Support fallback selectors for resilience?  
🟡 **Real-time vs Batch Processing**: For CRM sync, use real-time or batch?  
🟡 **Self-hosted vs Cloud-only**: Support on-premise deployment?  
🟡 **Lead Deduplication**: Deduplicate by email only or email + sessionId?  

---

## 8. Risks & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Form structure changes break tracking | High | Medium | Support multiple selectors, form validation alerts |
| Script conflicts with other tools | High | Low | Namespace isolation, defensive coding |
| GDPR compliance issues | Critical | Low | Legal review, automatic PII redaction |
| Script load performance | Medium | Medium | CDN, < 50KB minified, async loading |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption rate | High | Medium | Simple onboarding, clear value prop, free tier |
| Competition from established players | High | High | Focus on partial lead capture (differentiator) |
| Users prefer automatic form discovery | Medium | Medium | Build browser extension in Phase 4 |

---

## 9. Dependencies & Constraints

### Technical Dependencies

**Backend Framework**:
- NestJS 10+ (TypeScript application framework)
- Modular architecture (TrackingModule, EmbeddingModule)

**Databases** (Hybrid Architecture):
- **MariaDB 10.11+**: Configuration data (clients, forms, fields, mappings)
  - TypeORM for ORM
  - ACID compliance for config integrity
  - Read-heavy workload with Redis caching
  
- **MongoDB 6.0+**: Event and lead data (events, leads, sessions)
  - Mongoose for ODM
  - High-throughput writes (10k+ events/sec)
  - TTL indexes for automatic data expiry (90 days)

**Caching & Queuing**:
- Redis 6+ (config caching, rate limiting, session storage)
- RabbitMQ or AWS SQS (async event processing, CRM sync)

**Hosting & CDN**:
- CDN for script delivery (CloudFront, CloudFlare)
- Load balancer for API servers (ALB/NLB)
- Container orchestration (Docker, Kubernetes optional)

**Browser Support**:
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- ES6+ JavaScript features
- Fetch API with keepalive
- SendBeacon API for reliable event tracking

### External Dependencies
- CRM APIs (Salesforce, HubSpot, Zoho) for lead sync
- Email service for partial lead follow-up notifications (SendGrid, AWS SES)
- Analytics service for dashboard metrics (optional)

### Performance Constraints
- **Script loading**: < 100ms (main-app.v1.js, CDN-cached)
- **Script size**: < 30KB (minified + gzipped)
- **API response time**: < 100ms p95 (event ingestion)
- **Event processing**: < 200ms per event (async via queue)
- **Config endpoint**: < 50ms p95 (Redis-cached)
- **Database operations**:
  - MariaDB config lookup: < 10ms (cached)
  - MongoDB event insert: < 50ms (bulk)
  - MongoDB lead upsert: < 100ms

### Compliance & Privacy Constraints
- **GDPR compliance** required (EU data protection)
- **CCPA compliance** for California users
- **No cookies without consent** (uses localStorage/sessionStorage only)
- **Automatic PII redaction** (passwords, credit cards, SSN)
- **Data retention**: 90 days for events (configurable)
- **Right to deletion**: API endpoint for data removal

### Scalability Constraints
- **Target capacity**: 100k+ events/hour per instance
- **Max batch size**: 50 events per request
- **Rate limits**: 10,000 events/min per API key
- **Database limits**: 
  - MariaDB: <10k clients (config data is small)
  - MongoDB: >1B events (sharding by clientId if needed)

### Architecture Constraints
- **Stateless API servers** (horizontal scaling)
- **Bootloader pattern** (no per-client script generation)
- **Event sourcing** (all events stored before processing)
- **Async processing** (queue-based workers for lead creation)
- **Idempotent operations** (handle duplicate events gracefully)

---

## 10. Resources & References

### Documentation
- `DESIGN.md` - Technical design document (hybrid MariaDB/MongoDB architecture)
- `SCRIPT_STRUCTURE_UPDATE.md` - Bootloader pattern implementation guide
- `API_DOCS.md` - Complete API documentation
- `EVENT_TRACKING_DOCUMENTATION.md` - Event tracking details
- `TESTING_GUIDE.md` - Testing instructions
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview

### Technical References
- [NestJS Documentation](https://docs.nestjs.com) - Backend framework
- [TypeORM Documentation](https://typeorm.io/) - MariaDB ORM
- [Mongoose Documentation](https://mongoosejs.com/) - MongoDB ODM
- [MariaDB Documentation](https://mariadb.com/kb/en/documentation/) - Relational database
- [MongoDB Documentation](https://www.mongodb.com/docs/) - Document database

### Client-Side References
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Form Data API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [SendBeacon API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)

### Compliance References
- [GDPR Compliance Guide](https://gdpr.eu/)
- [CCPA Overview](https://oag.ca.gov/privacy/ccpa)

### Repository
- GitHub: [gopiduttv/crm-website-embeddings](https://github.com/gopiduttv/crm-website-embeddings)

---

## 11. Approval & Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Manager | TBD | - | Pending |
| Engineering Lead | TBD | - | Pending |
| Design Lead | TBD | - | Pending |
| Marketing Lead | TBD | - | Pending |

---

**Next Review**: November 15, 2025  
**Document Owner**: Product Team  
**Last Updated**: October 22, 2025
