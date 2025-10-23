import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormDto, UpdateFormDto, CreateFieldDto, UpdateFieldDto, CreateFieldMappingDto, UpdateFieldMappingDto } from './dto/forms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Forms Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/forms')
export class FormsController {
  private readonly logger = new Logger(FormsController.name);

  constructor(private readonly formsService: FormsService) {}

  // ==================== FORM ENDPOINTS ====================

  @Post()
  @ApiOperation({ summary: 'Create a new form', description: 'Creates a new form configuration for the authenticated client' })
  @ApiResponse({ status: 201, description: 'Form created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async createForm(@Request() req, @Body() dto: CreateFormDto) {
    const clientId = req.user.practiceId; // From JWT payload
    this.logger.log(`Creating form for client: ${clientId}`);
    
    return this.formsService.createForm(clientId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all forms', description: 'Retrieves all forms for the authenticated client' })
  @ApiResponse({ status: 200, description: 'Forms retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getForms(@Request() req) {
    const clientId = req.user.practiceId;
    this.logger.log(`Fetching forms for client: ${clientId}`);
    
    return this.formsService.getFormsByClient(clientId);
  }

  @Get(':formId')
  @ApiOperation({ summary: 'Get a specific form', description: 'Retrieves details of a specific form' })
  @ApiParam({ name: 'formId', description: 'Form ID', example: 'form-001' })
  @ApiResponse({ status: 200, description: 'Form retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getForm(@Param('formId') formId: string) {
    this.logger.log(`Fetching form: ${formId}`);
    return this.formsService.getForm(formId);
  }

  @Put(':formId')
  @ApiOperation({ summary: 'Update a form', description: 'Updates an existing form configuration' })
  @ApiParam({ name: 'formId', description: 'Form ID', example: 'form-001' })
  @ApiResponse({ status: 200, description: 'Form updated successfully' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async updateForm(@Param('formId') formId: string, @Body() dto: UpdateFormDto) {
    this.logger.log(`Updating form: ${formId}`);
    return this.formsService.updateForm(formId, dto);
  }

  @Delete(':formId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a form', description: 'Deletes a form and all associated fields and mappings' })
  @ApiParam({ name: 'formId', description: 'Form ID', example: 'form-001' })
  @ApiResponse({ status: 204, description: 'Form deleted successfully' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async deleteForm(@Param('formId') formId: string) {
    this.logger.log(`Deleting form: ${formId}`);
    await this.formsService.deleteForm(formId);
  }

  // ==================== FIELD ENDPOINTS ====================

  @Post(':formId/fields')
  @ApiOperation({ summary: 'Create a field', description: 'Creates a new field for a specific form' })
  @ApiParam({ name: 'formId', description: 'Form ID', example: 'form-001' })
  @ApiResponse({ status: 201, description: 'Field created successfully' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async createField(@Param('formId') formId: string, @Body() dto: CreateFieldDto) {
    this.logger.log(`Creating field for form: ${formId}`);
    return this.formsService.createField(formId, dto);
  }

  @Get(':formId/fields')
  @ApiOperation({ summary: 'Get form fields', description: 'Retrieves all fields for a specific form' })
  @ApiParam({ name: 'formId', description: 'Form ID', example: 'form-001' })
  @ApiResponse({ status: 200, description: 'Fields retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getFields(@Param('formId') formId: string) {
    this.logger.log(`Fetching fields for form: ${formId}`);
    return this.formsService.getFieldsByForm(formId);
  }

  @Get('fields/:fieldId')
  @ApiOperation({ summary: 'Get a specific field', description: 'Retrieves details of a specific field' })
  @ApiParam({ name: 'fieldId', description: 'Field ID', example: 'field-001' })
  @ApiResponse({ status: 200, description: 'Field retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getField(@Param('fieldId') fieldId: string) {
    this.logger.log(`Fetching field: ${fieldId}`);
    return this.formsService.getField(fieldId);
  }

  @Put('fields/:fieldId')
  @ApiOperation({ summary: 'Update a field', description: 'Updates an existing field' })
  @ApiParam({ name: 'fieldId', description: 'Field ID', example: 'field-001' })
  @ApiResponse({ status: 200, description: 'Field updated successfully' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async updateField(@Param('fieldId') fieldId: string, @Body() dto: UpdateFieldDto) {
    this.logger.log(`Updating field: ${fieldId}`);
    return this.formsService.updateField(fieldId, dto);
  }

  @Delete('fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a field', description: 'Deletes a field and its mapping' })
  @ApiParam({ name: 'fieldId', description: 'Field ID', example: 'field-001' })
  @ApiResponse({ status: 204, description: 'Field deleted successfully' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async deleteField(@Param('fieldId') fieldId: string) {
    this.logger.log(`Deleting field: ${fieldId}`);
    await this.formsService.deleteField(fieldId);
  }

  // ==================== FIELD MAPPING ENDPOINTS ====================

  @Post('fields/:fieldId/mapping')
  @ApiOperation({ summary: 'Create field mapping', description: 'Creates a mapping for how a field maps to the CRM' })
  @ApiParam({ name: 'fieldId', description: 'Field ID', example: 'field-001' })
  @ApiResponse({ status: 201, description: 'Field mapping created successfully' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @ApiResponse({ status: 409, description: 'Field mapping already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async createFieldMapping(@Param('fieldId') fieldId: string, @Body() dto: CreateFieldMappingDto) {
    this.logger.log(`Creating field mapping for field: ${fieldId}`);
    return this.formsService.createFieldMapping(fieldId, dto);
  }

  @Get('fields/:fieldId/mapping')
  @ApiOperation({ summary: 'Get field mapping', description: 'Retrieves the mapping configuration for a field' })
  @ApiParam({ name: 'fieldId', description: 'Field ID', example: 'field-001' })
  @ApiResponse({ status: 200, description: 'Field mapping retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Field not found or no mapping exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getFieldMapping(@Param('fieldId') fieldId: string) {
    this.logger.log(`Fetching field mapping for field: ${fieldId}`);
    return this.formsService.getFieldMapping(fieldId);
  }

  @Put('mappings/:mappingId')
  @ApiOperation({ summary: 'Update field mapping', description: 'Updates an existing field mapping' })
  @ApiParam({ name: 'mappingId', description: 'Mapping ID', example: 'mapping-001' })
  @ApiResponse({ status: 200, description: 'Field mapping updated successfully' })
  @ApiResponse({ status: 404, description: 'Field mapping not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async updateFieldMapping(@Param('mappingId') mappingId: string, @Body() dto: UpdateFieldMappingDto) {
    this.logger.log(`Updating field mapping: ${mappingId}`);
    return this.formsService.updateFieldMapping(mappingId, dto);
  }

  @Delete('mappings/:mappingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete field mapping', description: 'Deletes a field mapping' })
  @ApiParam({ name: 'mappingId', description: 'Mapping ID', example: 'mapping-001' })
  @ApiResponse({ status: 204, description: 'Field mapping deleted successfully' })
  @ApiResponse({ status: 404, description: 'Field mapping not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async deleteFieldMapping(@Param('mappingId') mappingId: string) {
    this.logger.log(`Deleting field mapping: ${mappingId}`);
    await this.formsService.deleteFieldMapping(mappingId);
  }
}
