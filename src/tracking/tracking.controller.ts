import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { ClientConfigService } from './client-config.service';
import { TrackEventsDto } from './dto/track-event.dto';
import {
  CreateClientConfigDto,
  UpdateClientConfigDto,
} from './dto/client-config.dto';

/**
 * Event tracking endpoints
 */
@ApiTags('tracking')
@Controller('v1')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly clientConfigService: ClientConfigService,
  ) {}

  /**
   * Track events from client websites
   */
  @Post('track/events')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Track website events in batches' })
  @ApiResponse({ status: 202, description: 'Events queued for processing' })
  trackEvents(@Body() trackEventsDto: TrackEventsDto) {
    console.log(
      `Received batch of ${trackEventsDto.events.length} tracking events.`,
    );
    // The ValidationPipe has already validated the payload.
    // The response is sent immediately.
    // The service handles the asynchronous processing of each event.
    this.trackingService.queueEvents(trackEventsDto.events);

    return { status: 'ok', message: 'Events queued for processing.' };
  }

  /**
   * Get client configuration by API key (for dynamic config updates)
   */
  @Get('config/:apiKey')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({ summary: 'Get client configuration by API key' })
  @ApiParam({ name: 'apiKey', description: 'Client API key', example: 'sk_live_abc123' })
  @ApiResponse({ status: 200, description: 'Client configuration' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getConfigByApiKey(@Param('apiKey') apiKey: string) {
    return this.clientConfigService.findByApiKey(apiKey);
  }
}

/**
 * Client configuration management endpoints
 */
@ApiTags('clients')
@Controller('v1/clients')
export class ClientConfigController {
  constructor(
    private readonly clientConfigService: ClientConfigService,
  ) {}

  /**
   * Get all client configurations
   */
  @Get()
  @ApiOperation({ summary: 'Get all client configurations' })
  @ApiResponse({ status: 200, description: 'List of client configurations' })
  async getAllClients() {
    return this.clientConfigService.getAllClientConfigs();
  }

  /**
   * Get a specific client configuration
   */
  @Get(':clientId')
  @ApiOperation({ summary: 'Get client configuration by ID' })
  @ApiParam({ name: 'clientId', description: 'Client identifier', example: 'abc-123' })
  @ApiResponse({ status: 200, description: 'Client configuration' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClient(@Param('clientId') clientId: string) {
    return this.clientConfigService.getClientConfig(clientId);
  }

  /**
   * Create a new client configuration
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new client configuration' })
  @ApiResponse({ status: 201, description: 'Client configuration created' })
  @ApiResponse({ status: 409, description: 'Client already exists' })
  async createClient(@Body() dto: CreateClientConfigDto) {
    return this.clientConfigService.createClientConfig(dto);
  }

  /**
   * Partially update an existing client configuration
   */
  @Patch(':clientId')
  @ApiOperation({ summary: 'Partially update client configuration (PATCH)' })
  @ApiParam({ name: 'clientId', description: 'Client identifier', example: 'abc-123' })
  @ApiResponse({ status: 200, description: 'Client configuration updated' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async updateClient(
    @Param('clientId') clientId: string,
    @Body() dto: UpdateClientConfigDto,
  ) {
    return this.clientConfigService.updateClientConfig(clientId, dto);
  }

  /**
   * Delete a client configuration
   */
  @Delete(':clientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete client configuration' })
  @ApiParam({ name: 'clientId', description: 'Client identifier', example: 'abc-123' })
  @ApiResponse({ status: 204, description: 'Client configuration deleted' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async deleteClient(@Param('clientId') clientId: string) {
    await this.clientConfigService.deleteClientConfig(clientId);
  }
}
