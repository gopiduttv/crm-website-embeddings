# JWT & Forms Management API Testing Guide

## Overview
This guide shows how to test the newly implemented JWT Authentication and Forms Management APIs.

## Prerequisites
- NestJS server running on `http://localhost:5000`
- A configured client in the system (e.g., `tooth-docs-dental`)

---

## 1. JWT Authentication APIs

### 1.1 Generate JWT Token

**Endpoint**: `POST /v1/auth/token`

**Description**: Generate a JWT token with practice details embedded

**Request**:
```bash
curl -X POST http://localhost:5000/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "abc123"
  }'
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "tokenType": "Bearer",
  "practiceDetails": {
    "practiceId": "tooth-docs-dental",
    "practiceName": "Tooth Docs Dental",
    "domain": "ads.toothdocsdental.com"
  }
}
```

**Embedded Token Payload**:
```json
{
  "practiceId": "tooth-docs-dental",
  "practiceName": "Tooth Docs Dental",
  "domain": "ads.toothdocsdental.com",
  "apiKey": "abc123",
  "permissions": ["tracking", "forms", "leads"],
  "plan": "basic",
  "isActive": true,
  "iat": 1234567890,
  "exp": 1234654290
}
```

### 1.2 Verify JWT Token

**Endpoint**: `GET /v1/auth/verify`

**Description**: Verify if a JWT token is valid and active

**Request**:
```bash
curl -X GET http://localhost:5000/v1/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "valid": true,
  "practiceId": "tooth-docs-dental",
  "practiceName": "Tooth Docs Dental",
  "domain": "ads.toothdocsdental.com",
  "expiresAt": "2024-01-02T12:00:00.000Z"
}
```

### 1.3 Refresh JWT Token

**Endpoint**: `POST /v1/auth/refresh`

**Description**: Get a new access token using a refresh token

**Request**:
```bash
curl -X POST http://localhost:5000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "tokenType": "Bearer"
}
```

---

## 2. Forms Management APIs

### 2.1 Create a Form

**Endpoint**: `POST /v1/forms`

**Description**: Create a new form configuration

**Request**:
```bash
curl -X POST http://localhost:5000/v1/forms \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "Contact Form",
    "pageUrl": "https://ads.toothdocsdental.com/contact",
    "formSelector": "#contact-form",
    "alternativeSelectors": ["form[name=\"contact\"]"],
    "isActive": true,
    "metadata": {
      "category": "lead-gen",
      "priority": "high"
    }
  }'
```

**Response**:
```json
{
  "formId": "uuid-generated",
  "clientId": "tooth-docs-dental",
  "formName": "Contact Form",
  "pageUrl": "https://ads.toothdocsdental.com/contact",
  "formSelector": "#contact-form",
  "alternativeSelectors": ["form[name=\"contact\"]"],
  "isActive": true,
  "metadata": {
    "category": "lead-gen",
    "priority": "high"
  },
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### 2.2 Get All Forms

**Endpoint**: `GET /v1/forms`

**Description**: Get all forms for the authenticated client

**Request**:
```bash
curl -X GET http://localhost:5000/v1/forms \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
[
  {
    "formId": "form-001",
    "clientId": "tooth-docs-dental",
    "formName": "Contact Form",
    "pageUrl": "https://ads.toothdocsdental.com/contact",
    "formSelector": "#contact-form",
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### 2.3 Get a Specific Form

**Endpoint**: `GET /v1/forms/:formId`

**Request**:
```bash
curl -X GET http://localhost:5000/v1/forms/form-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2.4 Update a Form

**Endpoint**: `PUT /v1/forms/:formId`

**Request**:
```bash
curl -X PUT http://localhost:5000/v1/forms/form-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "Updated Contact Form",
    "isActive": false
  }'
```

### 2.5 Delete a Form

**Endpoint**: `DELETE /v1/forms/:formId`

**Description**: Deletes a form and all associated fields and mappings

**Request**:
```bash
curl -X DELETE http://localhost:5000/v1/forms/form-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 3. Field Management APIs

### 3.1 Create a Field

**Endpoint**: `POST /v1/forms/:formId/fields`

**Request**:
```bash
curl -X POST http://localhost:5000/v1/forms/form-001/fields \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldSelector": "input[name=\"email\"]",
    "fieldName": "email",
    "fieldType": "email",
    "label": "Email Address",
    "isRequired": true,
    "validationRules": {
      "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    },
    "displayOrder": 1
  }'
```

**Response**:
```json
{
  "fieldId": "uuid-generated",
  "formId": "form-001",
  "fieldSelector": "input[name=\"email\"]",
  "fieldName": "email",
  "fieldType": "email",
  "label": "Email Address",
  "isRequired": true,
  "validationRules": {
    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  },
  "displayOrder": 1,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### 3.2 Get All Fields for a Form

**Endpoint**: `GET /v1/forms/:formId/fields`

**Request**:
```bash
curl -X GET http://localhost:5000/v1/forms/form-001/fields \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3.3 Get a Specific Field

**Endpoint**: `GET /v1/forms/fields/:fieldId`

**Request**:
```bash
curl -X GET http://localhost:5000/v1/forms/fields/field-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3.4 Update a Field

**Endpoint**: `PUT /v1/forms/fields/:fieldId`

**Request**:
```bash
curl -X PUT http://localhost:5000/v1/forms/fields/field-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Email Address (Required)",
    "isRequired": true
  }'
```

### 3.5 Delete a Field

**Endpoint**: `DELETE /v1/forms/fields/:fieldId`

**Request**:
```bash
curl -X DELETE http://localhost:5000/v1/forms/fields/field-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4. Field Mapping APIs

### 4.1 Create Field Mapping

**Endpoint**: `POST /v1/forms/fields/:fieldId/mapping`

**Description**: Map a form field to a CRM entity/field

**Request**:
```bash
curl -X POST http://localhost:5000/v1/forms/fields/field-001/mapping \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetEntity": "contact",
    "targetField": "email",
    "transform": "lowercase",
    "isRequired": true
  }'
```

**Response**:
```json
{
  "mappingId": "uuid-generated",
  "fieldId": "field-001",
  "targetEntity": "contact",
  "targetField": "email",
  "transform": "lowercase",
  "isRequired": true,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Transform Options**: `none`, `lowercase`, `uppercase`, `trim`, `email-normalize`, `phone-normalize`

### 4.2 Get Field Mapping

**Endpoint**: `GET /v1/forms/fields/:fieldId/mapping`

**Request**:
```bash
curl -X GET http://localhost:5000/v1/forms/fields/field-001/mapping \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4.3 Update Field Mapping

**Endpoint**: `PUT /v1/forms/mappings/:mappingId`

**Request**:
```bash
curl -X PUT http://localhost:5000/v1/forms/mappings/mapping-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transform": "email-normalize",
    "isRequired": false
  }'
```

### 4.4 Delete Field Mapping

**Endpoint**: `DELETE /v1/forms/mappings/:mappingId`

**Request**:
```bash
curl -X DELETE http://localhost:5000/v1/forms/mappings/mapping-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 5. Seeded Example Data

The system comes with pre-seeded example data:

**Form**:
- ID: `form-001`
- Client: `tooth-docs-dental`
- Name: `Contact Form`
- Page URL: `https://ads.toothdocsdental.com/contact`

**Fields**:
- `field-001`: email (required)
- `field-002`: name (required)
- `field-003`: phone (optional)

**Field Mappings**:
- `mapping-001`: email → contact.email (lowercase)
- `mapping-002`: name → contact.full_name (trim)

---

## 6. Integration Testing Flow

### Complete Workflow Example:

```bash
# 1. Generate JWT Token
TOKEN=$(curl -s -X POST http://localhost:5000/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "abc123"}' | jq -r '.accessToken')

# 2. Verify Token
curl -X GET http://localhost:5000/v1/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# 3. Get All Forms
curl -X GET http://localhost:5000/v1/forms \
  -H "Authorization: Bearer $TOKEN"

# 4. Create a New Form
FORM_ID=$(curl -s -X POST http://localhost:5000/v1/forms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "Newsletter Signup",
    "pageUrl": "https://ads.toothdocsdental.com/newsletter",
    "formSelector": "#newsletter-form"
  }' | jq -r '.formId')

# 5. Create Fields for the Form
FIELD_ID=$(curl -s -X POST http://localhost:5000/v1/forms/$FORM_ID/fields \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldSelector": "input[name=\"email\"]",
    "fieldName": "email",
    "fieldType": "email",
    "label": "Email",
    "isRequired": true
  }' | jq -r '.fieldId')

# 6. Create Field Mapping
curl -X POST http://localhost:5000/v1/forms/fields/$FIELD_ID/mapping \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetEntity": "subscriber",
    "targetField": "email",
    "transform": "lowercase"
  }'

# 7. Get All Fields for the Form
curl -X GET http://localhost:5000/v1/forms/$FORM_ID/fields \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Error Handling

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Solution**: Ensure you're passing a valid JWT token in the Authorization header

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Form not found: form-xyz"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Field mapping already exists for field: field-001"
}
```

---

## 8. Swagger Documentation

Once the server is running, access the interactive API documentation at:

**URL**: `http://localhost:5000/api`

This provides:
- Interactive API testing interface
- Complete endpoint documentation
- Request/response examples
- Schema definitions

---

## 9. Next Steps

After testing these APIs, you can:

1. **Update Tracking APIs** to optionally use JWT authentication
2. **Modify Client-Side Script** (main-app.v1.js) to fetch and use JWT tokens
3. **Implement Database Layer** (MariaDB for forms, MongoDB for events)
4. **Add Lead Management APIs** to capture and store form submissions
5. **Implement Analytics APIs** for reporting and insights

---

## Notes

- All endpoints (except `/v1/auth/token`) require JWT authentication
- JWT tokens expire after 24 hours (configurable via JWT_EXPIRATION)
- Refresh tokens expire after 7 days (configurable via JWT_REFRESH_EXPIRATION)
- Practice details are embedded in the JWT payload for security
- The system validates if a practice is active on every request
- In-memory storage is used (data resets on server restart)
- Backwards compatibility is maintained via the `validateByApiKey()` method
