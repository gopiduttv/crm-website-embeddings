import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Form, Field, FieldMapping } from './interfaces/forms.interface';
import { CreateFormDto, UpdateFormDto, CreateFieldDto, UpdateFieldDto, CreateFieldMappingDto, UpdateFieldMappingDto } from './dto/forms.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  // In-memory storage (replace with database in production)
  private forms: Map<string, Form> = new Map();
  private fields: Map<string, Field> = new Map();
  private fieldMappings: Map<string, FieldMapping> = new Map();

  constructor() {
    this.seedExampleData();
  }

  // ==================== FORM CRUD ====================

  async createForm(clientId: string, dto: CreateFormDto): Promise<Form> {
    const formId = uuidv4();
    
    const form: Form = {
      formId,
      clientId,
      formName: dto.formName,
      pageUrl: dto.pageUrl,
      formSelector: dto.formSelector,
      alternativeSelectors: dto.alternativeSelectors || [],
      isActive: dto.isActive ?? true,
      metadata: dto.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.forms.set(formId, form);
    this.logger.log(`Created form: ${formId} for client: ${clientId}`);
    
    return form;
  }

  async getFormsByClient(clientId: string): Promise<Form[]> {
    const clientForms = Array.from(this.forms.values())
      .filter(form => form.clientId === clientId);
    
    return clientForms;
  }

  async getForm(formId: string): Promise<Form> {
    const form = this.forms.get(formId);
    
    if (!form) {
      throw new NotFoundException(`Form not found: ${formId}`);
    }
    
    return form;
  }

  async updateForm(formId: string, dto: UpdateFormDto): Promise<Form> {
    const form = await this.getForm(formId);
    
    const updatedForm: Form = {
      ...form,
      ...dto,
      updatedAt: new Date(),
    };

    this.forms.set(formId, updatedForm);
    this.logger.log(`Updated form: ${formId}`);
    
    return updatedForm;
  }

  async deleteForm(formId: string): Promise<void> {
    const form = await this.getForm(formId);
    
    // Delete all fields associated with this form
    const formFields = Array.from(this.fields.values())
      .filter(field => field.formId === formId);
    
    for (const field of formFields) {
      await this.deleteField(field.fieldId);
    }

    this.forms.delete(formId);
    this.logger.log(`Deleted form: ${formId} and ${formFields.length} associated fields`);
  }

  // ==================== FIELD CRUD ====================

  async createField(formId: string, dto: CreateFieldDto): Promise<Field> {
    // Verify form exists
    await this.getForm(formId);
    
    const fieldId = uuidv4();
    
    const field: Field = {
      fieldId,
      formId,
      fieldSelector: dto.fieldSelector,
      fieldName: dto.fieldName,
      fieldType: dto.fieldType,
      label: dto.label,
      isRequired: dto.isRequired ?? false,
      validationRules: dto.validationRules || {},
      displayOrder: dto.displayOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.fields.set(fieldId, field);
    this.logger.log(`Created field: ${fieldId} for form: ${formId}`);
    
    return field;
  }

  async getFieldsByForm(formId: string): Promise<Field[]> {
    // Verify form exists
    await this.getForm(formId);
    
    const formFields = Array.from(this.fields.values())
      .filter(field => field.formId === formId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
    return formFields;
  }

  async getField(fieldId: string): Promise<Field> {
    const field = this.fields.get(fieldId);
    
    if (!field) {
      throw new NotFoundException(`Field not found: ${fieldId}`);
    }
    
    return field;
  }

  async updateField(fieldId: string, dto: UpdateFieldDto): Promise<Field> {
    const field = await this.getField(fieldId);
    
    const updatedField: Field = {
      ...field,
      ...dto,
      updatedAt: new Date(),
    };

    this.fields.set(fieldId, updatedField);
    this.logger.log(`Updated field: ${fieldId}`);
    
    return updatedField;
  }

  async deleteField(fieldId: string): Promise<void> {
    const field = await this.getField(fieldId);
    
    // Delete field mapping if exists
    const mapping = Array.from(this.fieldMappings.values())
      .find(m => m.fieldId === fieldId);
    
    if (mapping) {
      this.fieldMappings.delete(mapping.mappingId);
      this.logger.log(`Deleted field mapping for field: ${fieldId}`);
    }

    this.fields.delete(fieldId);
    this.logger.log(`Deleted field: ${fieldId}`);
  }

  // ==================== FIELD MAPPING CRUD ====================

  async createFieldMapping(fieldId: string, dto: CreateFieldMappingDto): Promise<FieldMapping> {
    // Verify field exists
    await this.getField(fieldId);
    
    // Check if mapping already exists for this field
    const existingMapping = Array.from(this.fieldMappings.values())
      .find(m => m.fieldId === fieldId);
    
    if (existingMapping) {
      throw new ConflictException(`Field mapping already exists for field: ${fieldId}`);
    }
    
    const mappingId = uuidv4();
    
    const mapping: FieldMapping = {
      mappingId,
      fieldId,
      targetEntity: dto.targetEntity,
      targetField: dto.targetField,
      transform: dto.transform || 'none',
      isRequired: dto.isRequired ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.fieldMappings.set(mappingId, mapping);
    this.logger.log(`Created field mapping: ${mappingId} for field: ${fieldId}`);
    
    return mapping;
  }

  async getFieldMapping(fieldId: string): Promise<FieldMapping | null> {
    // Verify field exists
    await this.getField(fieldId);
    
    const mapping = Array.from(this.fieldMappings.values())
      .find(m => m.fieldId === fieldId);
    
    return mapping || null;
  }

  async updateFieldMapping(mappingId: string, dto: UpdateFieldMappingDto): Promise<FieldMapping> {
    const mapping = this.fieldMappings.get(mappingId);
    
    if (!mapping) {
      throw new NotFoundException(`Field mapping not found: ${mappingId}`);
    }
    
    const updatedMapping: FieldMapping = {
      ...mapping,
      ...dto,
      updatedAt: new Date(),
    };

    this.fieldMappings.set(mappingId, updatedMapping);
    this.logger.log(`Updated field mapping: ${mappingId}`);
    
    return updatedMapping;
  }

  async deleteFieldMapping(mappingId: string): Promise<void> {
    const mapping = this.fieldMappings.get(mappingId);
    
    if (!mapping) {
      throw new NotFoundException(`Field mapping not found: ${mappingId}`);
    }

    this.fieldMappings.delete(mappingId);
    this.logger.log(`Deleted field mapping: ${mappingId}`);
  }

  // ==================== SEED DATA ====================

  private seedExampleData(): void {
    // Create example form for tooth-docs-dental
    const form1: Form = {
      formId: 'form-001',
      clientId: 'tooth-docs-dental',
      formName: 'Contact Form',
      pageUrl: 'https://ads.toothdocsdental.com/contact',
      formSelector: '#contact-form',
      alternativeSelectors: ['form[name="contact"]'],
      isActive: true,
      metadata: { category: 'lead-gen' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.forms.set(form1.formId, form1);

    // Create fields for form1
    const field1: Field = {
      fieldId: 'field-001',
      formId: 'form-001',
      fieldSelector: 'input[name="email"]',
      fieldName: 'email',
      fieldType: 'email',
      label: 'Email Address',
      isRequired: true,
      validationRules: { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fields.set(field1.fieldId, field1);

    const field2: Field = {
      fieldId: 'field-002',
      formId: 'form-001',
      fieldSelector: 'input[name="name"]',
      fieldName: 'name',
      fieldType: 'text',
      label: 'Full Name',
      isRequired: true,
      validationRules: {},
      displayOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fields.set(field2.fieldId, field2);

    const field3: Field = {
      fieldId: 'field-003',
      formId: 'form-001',
      fieldSelector: 'input[name="phone"]',
      fieldName: 'phone',
      fieldType: 'tel',
      label: 'Phone Number',
      isRequired: false,
      validationRules: {},
      displayOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fields.set(field3.fieldId, field3);

    // Create field mappings
    const mapping1: FieldMapping = {
      mappingId: 'mapping-001',
      fieldId: 'field-001',
      targetEntity: 'contact',
      targetField: 'email',
      transform: 'lowercase',
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fieldMappings.set(mapping1.mappingId, mapping1);

    const mapping2: FieldMapping = {
      mappingId: 'mapping-002',
      fieldId: 'field-002',
      targetEntity: 'contact',
      targetField: 'full_name',
      transform: 'trim',
      isRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fieldMappings.set(mapping2.mappingId, mapping2);

    this.logger.log('Seeded example forms, fields, and mappings');
  }
}
