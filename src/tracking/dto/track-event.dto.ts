import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  ValidateNested,
  IsUrl,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum EventType {
  PAGEVIEW = 'pageview',
  FORM_SUBMISSION = 'form_submission',
  FORM_INTERACTION = 'form_interaction',
  BUTTON_CLICK = 'button_click',
  LINK_CLICK = 'link_click',
  CHAT_OPENED = 'chat_opened',
  CHAT_CLOSED = 'chat_closed',
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  WIDGET_SHOWN = 'widget_shown',
  TRACKER_INITIALIZED = 'tracker_initialized',
  IDENTIFY = 'identify',
  CUSTOM = 'custom',
}

class IdentifyTraits {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}

class PageProperties {
  @ApiProperty({ description: 'Title of the page' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Path of the URL', example: '/pricing' })
  @IsString()
  path: string;

  @ApiPropertyOptional({ description: 'URL search query', example: '?utm_source=google' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'URL hash', example: '#section-2' })
  @IsOptional()
  @IsString()
  hash?: string;

  @ApiPropertyOptional({ description: 'Referrer of the page view' })
  @IsOptional()
  @IsString()
  referrer?: string;
}

class FormSubmissionProperties {
  @ApiPropertyOptional({ description: 'Unique identifier for the form', example: 'contact-form' })
  @IsOptional()
  formId?: string;

  @ApiPropertyOptional({ description: 'Name of the form', example: 'Contact Us Form' })
  @IsOptional()
  formName?: string;

  @ApiPropertyOptional({ description: 'The form action URL' })
  @IsOptional()
  formAction?: string;

  @ApiPropertyOptional({ description: 'Form field values', example: { name: 'John Doe', email: 'john@example.com' } })
  @IsOptional()
  @IsObject()
  fields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Timestamp when form was submitted', example: '2025-10-16T10:30:00.000Z' })
  @IsOptional()
  submittedAt?: string;
}

class FormInteractionProperties {
  @ApiPropertyOptional({ description: 'Unique identifier for the form', example: 'contact-form' })
  @IsOptional()
  formId?: string;

  @ApiPropertyOptional({ 
    description: 'Trigger type for the interaction', 
    enum: ['blur', 'beforeunload', 'change', 'visibilitychange'],
    example: 'blur' 
  })
  @IsOptional()
  @IsString()
  trigger?: string;

  @ApiPropertyOptional({ description: 'Name of the field that was interacted with' })
  @IsOptional()
  @IsString()
  fieldName?: string;

  @ApiPropertyOptional({ description: 'Type of the field', example: 'email' })
  @IsOptional()
  @IsString()
  fieldType?: string;

  @ApiPropertyOptional({ description: 'Value of the field (full value for lead fields)' })
  @IsOptional()
  @IsString()
  fieldValue?: string;

  @ApiPropertyOptional({ 
    description: 'Multiple fields captured at once (beforeunload scenario)',
    example: { email: 'user@example.com', name: 'John Doe' }
  })
  @IsOptional()
  @IsObject()
  fields?: Record<string, string>;

  @ApiPropertyOptional({ 
    description: 'Form completion progress',
    example: { completedFields: ['email', 'name'], totalFields: 5, percentComplete: 40 }
  })
  @IsOptional()
  @IsObject()
  formProgress?: {
    completedFields: string[];
    totalFields: number;
    percentComplete: number;
  };
}

export class TrackEventDto {
  @ApiProperty({ enum: EventType, description: 'Type of the event' })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({ description: 'API key for the website' })
  @IsString()
  apiKey: string;

  // Context properties (flattened)
  @ApiProperty({ description: 'Timestamp of the event' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Full URL where the event occurred' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Referring URL' })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiProperty({ description: 'User agent of the client' })
  @IsString()
  userAgent: string;

  @ApiProperty({ description: 'Screen resolution of the client' })
  @IsString()
  screenResolution: string;

  @ApiProperty({ description: 'Session ID for the user' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Unique visitor ID' })
  @IsString()
  visitorId: string;

  @ApiProperty({ description: 'Duration of the session in milliseconds' })
  @IsNumber()
  duration: number;

  // Event-specific properties
  @ApiPropertyOptional({ type: PageProperties, description: 'Page properties for pageview events' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PageProperties)
  page?: PageProperties;

  @ApiPropertyOptional({
    description: 'Form properties for form_submission or form_interaction events. Structure depends on event type.',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type((o) => {
    if (o && o.object) {
      const event = o.object as TrackEventDto;
      if (event.type === 'form_submission') {
        return FormSubmissionProperties;
      } else if (event.type === 'form_interaction') {
        return FormInteractionProperties;
      }
    }
    // Return a generic class or undefined if the type cannot be determined.
    // Using Object might be too permissive, but it's a fallback.
    return Object;
  })
  form?: FormSubmissionProperties | FormInteractionProperties;

  @ApiPropertyOptional({ description: 'Widget-related data' })
  @IsOptional()
  @IsObject()
  widget?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Initialization config data' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Element-related data for clicks' })
  @IsOptional()
  @IsObject()
  element?: Record<string, any>;

  // Optional generic properties for custom events
  @ApiPropertyOptional({ description: 'Name of the custom event' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: IdentifyTraits, description: 'User traits for identify events' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => IdentifyTraits)
  traits?: IdentifyTraits;

  @ApiPropertyOptional({ description: 'Custom properties for the event' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}

export class TrackEventsDto {
  @ApiProperty({
    description: 'An array of tracking events',
    type: [TrackEventDto],
  })
  @ValidateNested({ each: true })
  @Type(() => TrackEventDto)
  events: TrackEventDto[];
}
