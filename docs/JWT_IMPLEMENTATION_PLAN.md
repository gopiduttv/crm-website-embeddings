# JWT Token Implementation Plan - Practice Details Embedded

**Status**: 🔴 Not Implemented  
**Priority**: High  
**Estimated Time**: 2-3 days

---

## Overview

Currently, the application uses **simple API key validation** without JWT tokens. This document outlines how to implement JWT tokens with embedded practice (client) details for secure tracking.

---

## Current Implementation (Simple API Key)

### What Exists Now:
```typescript
// Current: Plain API key stored in config
{
  clientId: "tooth-docs-dental",
  apiKey: "sk_live_toothdocs123",  // ❌ Plain text, no practice details
  domain: "ads.toothdocsdental.com",
  // ... other config
}

// Current: Simple validation
const client = await this.clientConfigService.findByApiKey(apiKey);
if (!client || !client.isActive) {
  throw new Error('Invalid API key');
}
```

### Problems:
- ❌ No practice details embedded in token
- ❌ No expiration mechanism
- ❌ No signed verification
- ❌ API key lookup required on every request (database hit)
- ❌ No refresh token capability

---

## Proposed JWT Implementation

### Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Practice Onboarding / Login                              │
│    POST /v1/auth/register-practice                          │
│    POST /v1/auth/login                                      │
│    ↓                                                         │
│    Generate JWT with practice details:                      │
│    {                                                         │
│      practiceId: "tooth-docs-dental",                       │
│      practiceName: "ToothDocs Dental",                      │
│      domain: "toothdocsdental.com",                         │
│      permissions: ["track_events", "view_leads"],           │
│      plan: "premium",                                       │
│      iat: 1234567890,                                       │
│      exp: 1234654290  // 24h expiry                         │
│    }                                                         │
│    ↓                                                         │
│    Return: { accessToken: "eyJhbGc...", refreshToken: "..." }│
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Client-Side Tracking (main-app.v1.js)                   │
│    Store JWT in memory/localStorage                         │
│    Send JWT with every tracking request:                    │
│    ↓                                                         │
│    POST /v1/track/events                                    │
│    Headers: { Authorization: "Bearer eyJhbGc..." }          │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Server-Side Verification (Guard)                         │
│    JwtAuthGuard extracts and verifies token:                │
│    ↓                                                         │
│    1. Verify signature                                      │
│    2. Check expiration                                      │
│    3. Extract practice details from payload                 │
│    4. Attach to request: req.practice = { ... }             │
│    ↓                                                         │
│    Controller receives verified practice details            │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd /home/gopiduttv/crm-web-tracker/website-service

npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

### Step 2: Create JWT Module Configuration

**File**: `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
      signOptions: {
        expiresIn: '24h', // Access token expires in 24 hours
      },
    }),
    TrackingModule, // Import to access ClientConfigService
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

### Step 3: Create Auth Service

**File**: `src/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientConfigService } from '../tracking/client-config.service';

export interface PracticeTokenPayload {
  practiceId: string;
  practiceName: string;
  domain: string;
  apiKey: string;
  permissions: string[];
  plan: string;
  isActive: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private clientConfigService: ClientConfigService,
  ) {}

  /**
   * Generate JWT token with embedded practice details
   */
  async generateToken(practiceId: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Fetch practice details from database
    const practice = await this.clientConfigService.getClientConfig(practiceId);

    if (!practice || !practice.isActive) {
      throw new UnauthorizedException('Practice not found or inactive');
    }

    // Create payload with practice details
    const payload: PracticeTokenPayload = {
      practiceId: practice.clientId,
      practiceName: practice.domain, // Or add a 'name' field to ClientConfig
      domain: practice.domain,
      apiKey: practice.apiKey, // Include for backwards compatibility
      permissions: ['track_events', 'view_leads', 'manage_forms'],
      plan: 'premium', // Add to ClientConfig if needed
      isActive: practice.isActive,
    };

    // Sign access token (24h expiry)
    const accessToken = this.jwtService.sign(payload);

    // Sign refresh token (7 days expiry)
    const refreshToken = this.jwtService.sign(
      { practiceId: practice.clientId },
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode token
   */
  async verifyToken(token: string): Promise<PracticeTokenPayload> {
    try {
      const payload = this.jwtService.verify<PracticeTokenPayload>(token);
      
      // Additional check: verify practice is still active
      const practice = await this.clientConfigService.getClientConfig(payload.practiceId);
      if (!practice.isActive) {
        throw new UnauthorizedException('Practice account is inactive');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      return await this.generateToken(payload.practiceId);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate practice by API key (backwards compatibility)
   */
  async validateByApiKey(apiKey: string): Promise<PracticeTokenPayload | null> {
    const practice = await this.clientConfigService.findByApiKey(apiKey);
    
    if (!practice || !practice.isActive) {
      return null;
    }

    return {
      practiceId: practice.clientId,
      practiceName: practice.domain,
      domain: practice.domain,
      apiKey: practice.apiKey,
      permissions: ['track_events', 'view_leads'],
      plan: 'premium',
      isActive: practice.isActive,
    };
  }
}
```

### Step 4: Create JWT Strategy

**File**: `src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PracticeTokenPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    });
  }

  /**
   * Validate JWT payload
   * This is called automatically after token is verified
   */
  async validate(payload: PracticeTokenPayload) {
    if (!payload.practiceId || !payload.isActive) {
      throw new UnauthorizedException('Invalid practice token');
    }

    // Return practice details - will be attached to req.user
    return payload;
  }
}
```

### Step 5: Create Auth Controller

**File**: `src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('authentication')
@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Generate JWT token for a practice
   */
  @Post('token')
  @ApiOperation({ summary: 'Generate JWT token for practice' })
  @ApiResponse({ status: 201, description: 'Token generated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async generateToken(@Body() body: { practiceId: string; apiKey: string }) {
    // Verify API key first
    const practice = await this.authService.validateByApiKey(body.apiKey);
    
    if (!practice || practice.practiceId !== body.practiceId) {
      throw new Error('Invalid practice credentials');
    }

    return await this.authService.generateToken(body.practiceId);
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return await this.authService.refreshToken(body.refreshToken);
  }

  /**
   * Verify token and get practice details
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify JWT token and get practice details' })
  async verifyToken(@Request() req) {
    // Practice details are available in req.user (attached by JwtStrategy)
    return {
      valid: true,
      practice: req.user,
    };
  }
}
```

### Step 6: Create JWT Auth Guard

**File**: `src/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired JWT token');
    }
    return user;
  }
}
```

### Step 7: Update Tracking Controller to Use JWT

**File**: `src/tracking/tracking.controller.ts` (update)

```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('tracking')
@Controller('v1/track')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Track events with JWT authentication
   */
  @Post('events')
  @UseGuards(JwtAuthGuard) // ✅ Require JWT token
  @ApiBearerAuth() // ✅ Show in Swagger that Bearer token is needed
  @ApiOperation({ summary: 'Track batch events (JWT auth)' })
  async trackEvents(@Request() req, @Body() dto: TrackEventsDto) {
    // Practice details are available in req.user
    const practice = req.user;

    // Log practice info
    console.log('Tracking events for practice:', practice.practiceId, practice.practiceName);

    // Validate that events are for this practice
    if (dto.apiKey !== practice.apiKey) {
      throw new Error('API key mismatch');
    }

    // Process events
    return await this.trackingService.queueEvents(dto);
  }
}
```

### Step 8: Update Client-Side Script (main-app.v1.js)

```javascript
// 1. Fetch JWT token on initialization
async function init() {
  const config = window.WebsiteTrackerConfig;
  
  // Exchange API key for JWT token
  const tokenResponse = await fetch(`${config.apiUrl}/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      practiceId: config.clientId,
      apiKey: config.apiKey,
    }),
  });
  
  const { accessToken, refreshToken } = await tokenResponse.json();
  
  // Store tokens
  sessionStorage.setItem('crm_access_token', accessToken);
  sessionStorage.setItem('crm_refresh_token', refreshToken);
  
  // Continue initialization...
}

// 2. Send events with JWT token
const API = {
  sendBatch: async function(apiKey, apiUrl, events) {
    const accessToken = sessionStorage.getItem('crm_access_token');
    
    try {
      const response = await fetch(`${apiUrl}/v1/track/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // ✅ Send JWT
        },
        body: JSON.stringify({ apiKey, events }),
      });
      
      if (response.status === 401) {
        // Token expired - refresh it
        await this.refreshToken(apiUrl);
        // Retry request
        return await this.sendBatch(apiKey, apiUrl, events);
      }
    } catch (error) {
      console.error('Error sending events:', error);
    }
  },
  
  refreshToken: async function(apiUrl) {
    const refreshToken = sessionStorage.getItem('crm_refresh_token');
    const response = await fetch(`${apiUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const { accessToken } = await response.json();
    sessionStorage.setItem('crm_access_token', accessToken);
  },
};
```

---

## Environment Variables

Add to `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d
```

---

## Testing the Implementation

### 1. Generate Token:
```bash
curl -X POST http://localhost:5000/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "practiceId": "tooth-docs-dental",
    "apiKey": "sk_live_toothdocs123"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Verify Token:
```bash
curl -X GET http://localhost:5000/v1/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Response:
```json
{
  "valid": true,
  "practice": {
    "practiceId": "tooth-docs-dental",
    "practiceName": "ToothDocs Dental",
    "domain": "ads.toothdocsdental.com",
    "permissions": ["track_events", "view_leads"],
    "plan": "premium",
    "isActive": true
  }
}
```

### 3. Track Events with JWT:
```bash
curl -X POST http://localhost:5000/v1/track/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "apiKey": "sk_live_toothdocs123",
    "events": [
      {
        "id": "evt_123",
        "type": "form_submission",
        "timestamp": 1234567890,
        "payload": {
          "formId": "contact-form",
          "fields": { "email": "test@example.com" }
        }
      }
    ]
  }'
```

---

## Benefits of JWT Implementation

### ✅ **Practice Details Embedded**:
- No database lookup needed on every request
- Practice info available immediately in req.user
- Faster request processing

### ✅ **Security**:
- Signed tokens prevent tampering
- Expiration mechanism (24h)
- Refresh tokens for long sessions

### ✅ **Scalability**:
- Stateless authentication
- No session storage needed
- Easy to scale horizontally

### ✅ **Backwards Compatible**:
- Can support both JWT and API key auth
- Gradual migration path

---

## Migration Strategy

### Phase 1: Add JWT Alongside API Key
- Keep existing API key validation
- Add JWT as optional auth method
- Update documentation

### Phase 2: Update Client Scripts
- Update main-app.v1.js to fetch JWT
- Test in staging environment
- Roll out to production gradually

### Phase 3: Deprecate API Key Auth
- Mark API key endpoints as deprecated
- Give clients 90 days to migrate
- Eventually remove old auth method

---

## Summary

**Current State**: ❌ Simple API key validation, no practice details in token  
**Proposed State**: ✅ JWT with embedded practice details, secure verification  
**Implementation Time**: 2-3 days  
**Complexity**: Medium

Would you like me to implement this JWT authentication system for you?
