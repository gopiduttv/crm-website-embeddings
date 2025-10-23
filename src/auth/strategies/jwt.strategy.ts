import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PracticeTokenPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
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
