# Not Implemented Features - CRM Web Tracker

**Last Updated**: October 22, 2025  
**Current Status**: In-memory implementation with mock data

---

## Overview

The current implementation has a **fully functional architecture** with in-memory data storage. The DESIGN.md document describes a production-ready system with MariaDB + MongoDB, but the following components need to be implemented to match that design.

---

## ✅ What IS Implemented

- ✅ **NestJS application structure** with modular architecture
- ✅ **TrackingModule** and **EmbeddingModule** separation
- ✅ **Bootloader pattern** with dynamic config (main-app.v1.js)
- ✅ **Batch event tracking API** (POST /v1/track/events)
- ✅ **Config endpoint** (GET /v1/config/:apiKey)
- ✅ **In-memory ClientConfigService** with CRUD operations
- ✅ **Script generation and serving** (loader scripts, embed snippets)
- ✅ **Event tracking DTOs** and validation
- ✅ **Swagger API documentation**
- ✅ **CORS configuration** for cross-origin tracking
- ✅ **Static file serving** for demo pages

---

## ❌ What is NOT Implemented (Database Layer)

### 1. MariaDB Database & TypeORM Integration

**Status**: 🔴 Not Implemented  
**Complexity**: Medium (2-3 days)

**What's Missing**:

1. **TypeORM Setup**:
   ```bash
   npm install @nestjs/typeorm typeorm mysql2
   ```

2. **Database Configuration** (`src/config/database.config.ts`):
   - TypeORM configuration module
   - Connection pooling settings
   - Environment variables for credentials

3. **TypeORM Entities** (need to create):
   - `src/tracking/entities/client.entity.ts`
   - `src/tracking/entities/form.entity.ts`
   - `src/tracking/entities/field.entity.ts`
   - `src/tracking/entities/field-mapping.entity.ts`

4. **Database Migration**:
   - Initial migration with MariaDB schema
   - Seed data for development

5. **Update Services**:
   - Replace in-memory Map in `ClientConfigService` with TypeORM repository
   - Implement proper CRUD operations with database queries

**References**: 
- DESIGN.md Section 2.3 (MariaDB Schema)
- DESIGN.md Section 9.2 (MariaDB Optimization)

---

### 2. MongoDB Database & Mongoose Integration

**Status**: 🔴 Not Implemented  
**Complexity**: Medium (2-3 days)

**What's Missing**:

1. **Mongoose Setup**:
   ```bash
   npm install @nestjs/mongoose mongoose
   ```

2. **MongoDB Configuration**:
   - Mongoose module configuration
   - Connection string from environment
   - Connection pooling settings

3. **Mongoose Schemas** (need to create):
   - `src/tracking/schemas/event.schema.ts`
   - `src/tracking/schemas/lead.schema.ts`
   - `src/tracking/schemas/session.schema.ts`

4. **Indexes Creation**:
   - Compound indexes for performance
   - TTL indexes for 90-day event expiry
   - Unique indexes for sessionId

5. **Update Services**:
   - Implement `LeadCreationService` with MongoDB
   - Update `TrackingService` to store events in MongoDB
   - Implement session tracking with MongoDB

**References**:
- DESIGN.md Section 2.4 (MongoDB Schema)
- DESIGN.md Section 3.3 (Tracking Service with MongoDB)
- DESIGN.md Section 3.4 (Lead Creation Service)

---

### 3. Redis Caching Layer

**Status**: 🔴 Not Implemented  
**Complexity**: Low (1 day)

**What's Missing**:

1. **Redis Setup**:
   ```bash
   npm install @nestjs/cache-manager cache-manager cache-manager-redis-store redis
   ```

2. **Cache Module Configuration**:
   - Redis connection configuration
   - Cache TTL settings (5 minutes for config)
   - Cache invalidation strategy

3. **Update ClientConfigService**:
   - Add Redis caching decorator
   - Cache config lookups by apiKey
   - Implement cache invalidation on updates

**Benefits**:
- Reduce MariaDB load by 90%+
- Config lookup: <10ms (vs 50ms without cache)

**References**:
- DESIGN.md Section 9.2 (Redis Caching Layer)

---

### 4. Message Queue (RabbitMQ/SQS)

**Status**: 🔴 Not Implemented  
**Complexity**: Medium (2-3 days)

**What's Missing**:

1. **Queue Setup**:
   ```bash
   npm install @nestjs/bull bull
   # or for SQS
   npm install @nestjs/aws-sdk aws-sdk
   ```

2. **Queue Configuration**:
   - RabbitMQ or AWS SQS connection
   - Queue definitions (event-processing, crm-sync)
   - Worker configuration

3. **Queue Producers**:
   - `TrackingController.queueEvents()` should publish to queue
   - CRM sync job publishing

4. **Queue Consumers (Workers)**:
   - Event processing worker
   - Lead creation worker
   - CRM sync worker

5. **Error Handling**:
   - Dead letter queue (DLQ) for failed events
   - Retry logic with exponential backoff

**Current Limitation**:
- Events are processed synchronously (blocks API response)
- No retry mechanism for failures
- Cannot scale event processing independently

**References**:
- DESIGN.md Section 3.3 (Batch Event Processing)
- DESIGN.md Section 9.3 (Event Batching & Queue Management)

---

## ❌ What is NOT Implemented (API Endpoints)

### 5. Form Management APIs

**Status**: 🔴 Not Implemented  
**Complexity**: Medium (3-4 days)

**Missing Endpoints**:

```typescript
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
POST   /v1/fields/:fieldId/mapping    // Create CRM mapping
GET    /v1/fields/:fieldId/mapping    // Get mapping
PUT    /v1/mappings/:mappingId        // Update mapping
DELETE /v1/mappings/:mappingId        // Delete mapping
```

**What's Needed**:
- Controllers for form/field/mapping CRUD
- Services with MariaDB integration
- DTOs for request/response validation
- Swagger documentation

**References**:
- DESIGN.md Section 5.1 (REST API Endpoints)
- PRD.md Section 3.2-3.4 (Form Configuration Features)

---

### 6. Lead Management APIs

**Status**: 🔴 Not Implemented  
**Complexity**: Medium (2-3 days)

**Missing Endpoints**:

```typescript
GET    /v1/leads                      // List leads (with filters)
GET    /v1/leads/:leadId              // Get lead details
PUT    /v1/leads/:leadId              // Update lead
DELETE /v1/leads/:leadId              // Delete lead
POST   /v1/leads/:leadId/sync         // Trigger manual CRM sync
```

**What's Needed**:
- LeadsController with CRUD operations
- LeadsService with MongoDB queries
- Filtering, sorting, pagination support
- Lead quality scoring logic

**References**:
- DESIGN.md Section 5.1 (REST API Endpoints)
- PRD.md Section 3.5 (Lead-Focused Event Tracking)

---

### 7. Analytics & Dashboard APIs

**Status**: 🔴 Not Implemented  
**Complexity**: High (5-7 days)

**Missing Endpoints**:

```typescript
GET    /v1/analytics/leads            // Lead analytics
GET    /v1/analytics/forms            // Form conversion rates
GET    /v1/analytics/sources          // Traffic source attribution
GET    /v1/dashboard/stats            // Dashboard statistics
```

**What's Needed**:
- Aggregation queries on MongoDB
- Time-series data processing
- Lead quality metrics
- Conversion funnel tracking

---

## ❌ What is NOT Implemented (Features)

### 8. CRM Integration

**Status**: 🔴 Not Implemented  
**Complexity**: High (7-10 days)

**What's Missing**:

1. **CRM Connectors**:
   - Salesforce API integration
   - HubSpot API integration
   - Zoho CRM integration
   - Generic webhook support

2. **CRM Sync Service**:
   - Map form fields to CRM fields
   - Field transformation logic
   - Sync status tracking
   - Error handling and retry

3. **Sync Queue Worker**:
   - Process sync jobs asynchronously
   - Handle rate limits
   - Track sync failures

**References**:
- PRD.md Section 3.4 (Field Mapping Configuration)
- DESIGN.md Section 3.4 (Lead Creation Service - CRM sync)

---

### 9. Authentication & Authorization

**Status**: 🔴 Not Implemented  
**Complexity**: Medium (3-4 days)

**What's Missing**:

1. **JWT Authentication**:
   - Login/register endpoints
   - Token generation and validation
   - Refresh token logic
   - **Practice details embedded in JWT payload**
   - Token-based authentication for tracking endpoints

2. **API Key Management**:
   - API key generation for clients
   - Key rotation mechanism
   - Rate limiting per key

3. **Authorization Guards**:
   - Role-based access control (RBAC)
   - Client isolation (users can only see their data)
   - Admin vs user permissions

**Current Implementation**:
- ❌ Simple API key validation (plain text lookup)
- ❌ No JWT tokens generated
- ❌ No practice details embedded in tokens
- ❌ No token expiration or refresh mechanism

**See Detailed Plan**: `JWT_IMPLEMENTATION_PLAN.md` for complete implementation guide

**References**:
- DESIGN.md Section 5.2 (API Authentication)
- DESIGN.md Section 8 (Security & Privacy)
- JWT_IMPLEMENTATION_PLAN.md (Complete implementation steps)

---

### 10. Advanced Tracking Features

**Status**: 🔴 Not Implemented  
**Complexity**: Medium (4-5 days)

**What's Missing**:

1. **Session Tracking**:
   - Session creation and updates
   - Page view tracking within sessions
   - Session timeout handling
   - Session analytics

2. **Visitor Tracking**:
   - Cross-device visitor identification
   - Visitor journey tracking
   - Attribution modeling

3. **Chat Widget** (if planned):
   - Chat UI component
   - Message handling
   - Chat-to-lead conversion

**References**:
- DESIGN.md Section 6 (Client-Side SDK)
- PRD.md Section 4 (Additional Features)

---

### 11. Data Privacy & Compliance

**Status**: 🟡 Partially Implemented  
**Complexity**: Medium (3-4 days)

**What's Implemented**:
- ✅ Basic field redaction in client-side script

**What's Missing**:

1. **GDPR Compliance**:
   - Consent management
   - Right to deletion API
   - Data export API
   - Cookie consent integration

2. **Data Anonymization**:
   - IP address anonymization
   - PII detection and redaction
   - Data retention policies (90-day TTL is designed but not enforced)

3. **Audit Logging**:
   - Track all data access
   - Log data modifications
   - Compliance reporting

**References**:
- DESIGN.md Section 8 (Security & Privacy)
- PRD.md Section 9 (Constraints - Compliance)

---

## 📊 Implementation Priority Recommendation

### Phase 1: Core Database Implementation (1-2 weeks)
1. ✅ **MariaDB + TypeORM** (clients, forms, fields, mappings)
2. ✅ **MongoDB + Mongoose** (events, leads, sessions)
3. ✅ **Update ClientConfigService** to use database
4. ✅ **Update TrackingService** to store events in MongoDB

### Phase 2: Queue & Async Processing (1 week)
5. ✅ **RabbitMQ/SQS integration**
6. ✅ **Event processing workers**
7. ✅ **Lead creation service with MongoDB**

### Phase 3: Management APIs (1-2 weeks)
8. ✅ **Form/Field/Mapping CRUD APIs**
9. ✅ **Lead management APIs**
10. ✅ **Authentication & authorization**

### Phase 4: Advanced Features (2-3 weeks)
11. ✅ **Redis caching layer**
12. ✅ **CRM integrations** (Salesforce, HubSpot)
13. ✅ **Session tracking & analytics**
14. ✅ **GDPR compliance features**

---

## 🎯 Quick Start Guide (For Database Implementation)

### Step 1: Install Dependencies
```bash
cd /home/gopiduttv/crm-web-tracker/website-service

# MariaDB + TypeORM
npm install @nestjs/typeorm typeorm mysql2

# MongoDB + Mongoose
npm install @nestjs/mongoose mongoose

# Redis (optional for now)
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store redis

# Queue (optional for now)
npm install @nestjs/bull bull
```

### Step 2: Environment Variables
Create `.env` file:
```env
# MariaDB
DB_TYPE=mariadb
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=yourpassword
DB_DATABASE=crm_tracker

# MongoDB
MONGODB_URI=mongodb://localhost:27017/crm_tracker

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=5000
API_URL=http://localhost:5000
CDN_URL=http://localhost:5000
```

### Step 3: Create Entities & Schemas
Follow the schemas defined in DESIGN.md Section 2.3 and 2.4

### Step 4: Update AppModule
Import TypeORM and Mongoose modules in `src/app.module.ts`

### Step 5: Run Migrations
```bash
npm run typeorm migration:generate -- src/migrations/InitialSchema
npm run typeorm migration:run
```

---

## 📝 Notes

- **Current State**: The application is fully functional with in-memory storage, perfect for development and testing
- **Production Ready**: To go to production, you MUST implement the database layer (Phase 1 minimum)
- **Scalability**: Queue implementation (Phase 2) is essential for handling high traffic
- **Compliance**: GDPR features (Phase 4) are required before serving EU customers

---

## 🔗 References

- **DESIGN.md**: Complete technical architecture
- **PRD.md**: Product requirements and features
- **SCRIPT_STRUCTURE_UPDATE.md**: Bootloader pattern documentation
- **GitHub**: [gopiduttv/crm-website-embeddings](https://github.com/gopiduttv/crm-website-embeddings)
