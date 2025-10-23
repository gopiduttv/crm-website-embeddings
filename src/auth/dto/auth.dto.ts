import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateTokenDto {
  @ApiPropertyOptional({ 
    description: 'Practice/Client identifier (optional - can be looked up via API key)', 
    example: 'tooth-docs-dental' 
  })
  @IsString()
  @IsOptional()
  practiceId?: string;

  @ApiProperty({ 
    description: 'API key for verification', 
    example: 'abc123' 
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}

export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'Refresh token', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
