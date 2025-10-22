import { IsString, IsBoolean, IsOptional, IsEnum, IsObject, ValidateNested, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ChatWidgetConfigDto {
  @ApiPropertyOptional({ description: 'Enable or disable chat widget' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: ['bottom-right', 'bottom-left'] })
  @IsOptional()
  @IsEnum(['bottom-right', 'bottom-left'])
  position?: 'bottom-right' | 'bottom-left';

  @ApiPropertyOptional({ description: 'Primary color for the widget' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Greeting message' })
  @IsOptional()
  @IsString()
  greeting?: string;
}

class AnalyticsConfigDto {
  @ApiPropertyOptional({ description: 'Enable or disable analytics' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trackPageViews?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trackClicks?: boolean;
}

class TriggersConfigDto {
  @ApiPropertyOptional({ description: 'Track on blur event (field completed)', default: true })
  @IsOptional()
  @IsBoolean()
  blur?: boolean;

  @ApiPropertyOptional({ description: 'Track on beforeunload event (tab close)', default: true })
  @IsOptional()
  @IsBoolean()
  beforeunload?: boolean;

  @ApiPropertyOptional({ description: 'Track on change event (select/checkbox/radio)', default: true })
  @IsOptional()
  @IsBoolean()
  change?: boolean;

  @ApiPropertyOptional({ description: 'Track on visibilitychange event (tab hidden)', default: false })
  @IsOptional()
  @IsBoolean()
  visibilitychange?: boolean;
}

class FormsConfigDto {
  @ApiPropertyOptional({ description: 'Enable or disable form tracking' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Automatically capture all form submissions', default: true })
  @IsOptional()
  @IsBoolean()
  autoCapture?: boolean;

  @ApiPropertyOptional({ description: 'CSS selector for forms to track', default: 'form' })
  @IsOptional()
  @IsString()
  captureSelector?: string;

  @ApiPropertyOptional({ 
    description: 'Field names to exclude/redact from tracking', 
    type: [String],
    example: ['password', 'credit_card', 'ssn', 'cvv']
  })
  @IsOptional()
  @IsArray()
  excludeFields?: string[];

  @ApiPropertyOptional({ description: 'Enable field interaction tracking for partial leads', default: false })
  @IsOptional()
  @IsBoolean()
  trackInteractions?: boolean;

  @ApiPropertyOptional({ 
    description: 'Field names to track for lead generation',
    type: [String],
    example: ['email', 'phone', 'name', 'first_name', 'last_name', 'company']
  })
  @IsOptional()
  @IsArray()
  trackFields?: string[];

  @ApiPropertyOptional({ type: TriggersConfigDto, description: 'Event triggers configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TriggersConfigDto)
  triggers?: TriggersConfigDto;

  @ApiPropertyOptional({ description: 'Debounce time for visibilitychange in milliseconds', default: 2000 })
  @IsOptional()
  @IsNumber()
  debounceMs?: number;

  @ApiPropertyOptional({ description: 'Number of events to batch before sending', default: 10 })
  @IsOptional()
  @IsNumber()
  batchSize?: number;

  @ApiPropertyOptional({ description: 'Auto-flush interval in milliseconds', default: 5000 })
  @IsOptional()
  @IsNumber()
  flushInterval?: number;
}

class WidgetsConfigDto {
  @ApiPropertyOptional({ type: ChatWidgetConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChatWidgetConfigDto)
  chat?: ChatWidgetConfigDto;

  @ApiPropertyOptional({ type: AnalyticsConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalyticsConfigDto)
  analytics?: AnalyticsConfigDto;

  @ApiPropertyOptional({ type: FormsConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormsConfigDto)
  forms?: FormsConfigDto;
}

class ThemeConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fontFamily?: string;
}

/**
 * DTO for creating or updating client configuration
 */
export class CreateClientConfigDto {
  @ApiProperty({ description: 'Unique client identifier', example: 'abc-123' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'Client domain', example: 'example.com' })
  @IsString()
  domain: string;

  @ApiProperty({ description: 'API key for the client', example: 'sk_live_abc123' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: 'Is the client account active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: WidgetsConfigDto })
  @ValidateNested()
  @Type(() => WidgetsConfigDto)
  widgets: WidgetsConfigDto;

  @ApiPropertyOptional({ type: ThemeConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  theme?: ThemeConfigDto;
}

/**
 * DTO for updating client configuration
 */
export class UpdateClientConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: WidgetsConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetsConfigDto)
  widgets?: WidgetsConfigDto;

  @ApiPropertyOptional({ type: ThemeConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  theme?: ThemeConfigDto;
}
