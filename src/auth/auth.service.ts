import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientConfigService } from '../tracking/client-config.service';
import { PracticeTokenPayload, TokenResponse } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private clientConfigService: ClientConfigService,
  ) {}

  /**
   * Generate JWT token with embedded practice details
   * @param practiceIdOrApiKey - Either practiceId or apiKey to lookup the practice
   * @param apiKey - Optional API key for validation (if practiceId is provided)
   */
  async generateToken(practiceIdOrApiKey: string, apiKey?: string): Promise<TokenResponse> {
    let practiceConfig;
    let practiceId: string;

    // Try to lookup by API key first
    if (!apiKey) {
      // If no separate apiKey provided, assume practiceIdOrApiKey is the API key
      practiceConfig = await this.clientConfigService.findByApiKey(practiceIdOrApiKey);
      
      if (!practiceConfig || !practiceConfig.isActive) {
        throw new UnauthorizedException('Practice not found or inactive');
      }
      
      practiceId = practiceConfig.clientId;
    } else {
      // If apiKey is provided separately, get config by practiceId and validate
      practiceConfig = await this.clientConfigService.getClientConfig(practiceIdOrApiKey);
      
      if (!practiceConfig || practiceConfig.apiKey !== apiKey || !practiceConfig.isActive) {
        throw new UnauthorizedException('Invalid practice ID or API key');
      }
      
      practiceId = practiceIdOrApiKey;
    }

    // Create payload with practice details
    const payload: PracticeTokenPayload = {
      practiceId: practiceId,
      practiceName: practiceConfig.domain, // Using domain as name for now
      domain: practiceConfig.domain,
      apiKey: practiceConfig.apiKey, // Include for backwards compatibility
      permissions: ['track_events', 'view_leads', 'manage_forms'],
      plan: 'premium', // Add to ClientConfig later if needed
      isActive: practiceConfig.isActive,
    };

    // Sign access token (24h expiry)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    // Sign refresh token (7 days expiry)
    const refreshToken = this.jwtService.sign(
      { practiceId: practiceId },
      { expiresIn: '7d' }
    );

    this.logger.log(`Generated JWT token for practice: ${practiceId}`);

    return { 
      accessToken, 
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
    };
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
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = 
        await this.generateToken(payload.practiceId);
      
      return { accessToken, refreshToken: newRefreshToken, expiresIn };
    } catch (error) {
      this.logger.warn(`Refresh token failed: ${error.message}`);
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
