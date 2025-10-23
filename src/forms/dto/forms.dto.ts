import { IsString, IsBoolean, IsOptional, IsArray, IsObject, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ==================== FORM DTOs ====================

export class CreateFormDto {
  @ApiProperty({ 
    description: 'Name of the form', 
    example: 'Contact Form' 
  })
  @IsString()
  @IsNotEmpty()
  formName: string;

  @ApiProperty({ 
    description: 'URL where the form is located', 
    example: 'https://example.com/contact' 
  })
  @IsString()
  @IsNotEmpty()
  pageUrl: string;

  @ApiProperty({ 
    description: 'CSS selector for the form', 
    example: '#contact-form' 
  })
  @IsString()
  @IsNotEmpty()
  formSelector: string;

  @ApiPropertyOptional({ 
    description: 'Alternative CSS selectors', 
    example: ['form[name="contact"]', '.contact-form'] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternativeSelectors?: string[];

  @ApiPropertyOptional({ 
    description: 'Is the form active', 
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'Additional metadata', 
    example: { category: 'lead-gen', priority: 'high' } 
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateFormDto extends PartialType(CreateFormDto) {}

// ==================== FIELD DTOs ====================

export class CreateFieldDto {
  @ApiProperty({ 
    description: 'CSS selector for the field', 
    example: 'input[name="email"]' 
  })
  @IsString()
  @IsNotEmpty()
  fieldSelector: string;

  @ApiProperty({ 
    description: 'Name of the field', 
    example: 'email' 
  })
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @ApiProperty({ 
    description: 'Type of the field', 
    example: 'email',
    enum: ['text', 'email', 'tel', 'number', 'textarea', 'select', 'checkbox', 'radio']
  })
  @IsString()
  @IsNotEmpty()
  fieldType: string;

  @ApiPropertyOptional({ 
    description: 'Label for the field', 
    example: 'Email Address' 
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ 
    description: 'Is the field required', 
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ 
    description: 'Validation rules', 
    example: { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' } 
  })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Display order', 
    default: 0 
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdateFieldDto extends PartialType(CreateFieldDto) {}

// ==================== FIELD MAPPING DTOs ====================

export class CreateFieldMappingDto {
  @ApiProperty({ 
    description: 'Target CRM entity', 
    example: 'contact',
    enum: ['contact', 'lead', 'opportunity']
  })
  @IsString()
  @IsNotEmpty()
  targetEntity: string;

  @ApiProperty({ 
    description: 'Target field in CRM', 
    example: 'email' 
  })
  @IsString()
  @IsNotEmpty()
  targetField: string;

  @ApiPropertyOptional({ 
    description: 'Transformation to apply', 
    example: 'lowercase',
    enum: ['lowercase', 'uppercase', 'trim', 'split_name', 'format_phone', 'none']
  })
  @IsOptional()
  @IsString()
  transform?: string;

  @ApiPropertyOptional({ 
    description: 'Is the mapping required', 
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateFieldMappingDto extends PartialType(CreateFieldMappingDto) {}
