import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GenerateTokenDto, RefreshTokenDto } from './dto/auth.dto';

@ApiTags('authentication')
@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Generate JWT token for a practice
   */
  @Post('token')
  @ApiOperation({ 
    summary: 'Generate JWT token for practice',
    description: 'Exchange API key (and optional practice ID) for JWT access token with embedded practice details'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Token generated successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 86400
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async generateToken(@Body() dto: GenerateTokenDto) {
    // If practiceId is provided, validate both practiceId and apiKey
    // Otherwise, lookup practice by apiKey alone
    if (dto.practiceId) {
      return await this.authService.generateToken(dto.practiceId, dto.apiKey);
    } else {
      return await this.authService.generateToken(dto.apiKey);
    }
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Get a new access token using a refresh token'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Token refreshed successfully' 
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return await this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * Verify token and get practice details
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Verify JWT token and get practice details',
    description: 'Validate the JWT token and return the embedded practice information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token is valid',
    schema: {
      example: {
        valid: true,
        practice: {
          practiceId: 'tooth-docs-dental',
          practiceName: 'ToothDocs Dental',
          domain: 'ads.toothdocsdental.com',
          permissions: ['track_events', 'view_leads', 'manage_forms'],
          plan: 'premium',
          isActive: true
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyToken(@Request() req) {
    // Practice details are available in req.user (attached by JwtStrategy)
    return {
      valid: true,
      practice: req.user,
    };
  }
}
