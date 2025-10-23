import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ClientConfig } from './interfaces/client-config.interface';
import { CreateClientConfigDto, UpdateClientConfigDto } from './dto/client-config.dto';

/**
 * Service to manage client configurations
 * In production, this would interact with a real database (PostgreSQL, MongoDB, etc.)
 */
@Injectable()
export class ClientConfigService {
  private readonly logger = new Logger(ClientConfigService.name);
  
  // In-memory storage (replace with actual database in production)
  private clientConfigs: Map<string, ClientConfig> = new Map();

  constructor() {
    // Seed with example data for development
    this.seedExampleData();
  }

  /**
   * Seed example client configurations for development
   */
  private seedExampleData(): void {
    const exampleConfig: ClientConfig = {
      clientId: 'abc-123',
      domain: 'example.com',
      isActive: true,
      apiKey: 'sk_live_abc123',
      widgets: {
        chat: {
          enabled: true,
          position: 'bottom-right',
          color: '#0066cc',
          greeting: 'Hi! How can we help you today?',
        },
        analytics: {
          enabled: false,  // Disabled for lead-focused approach
          trackPageViews: false,
          trackClicks: false,
        },
        forms: {
          enabled: true,
          autoCapture: true,
          captureSelector: 'form',
          excludeFields: ['password', 'credit_card', 'ssn', 'cvv'],
          
          // Field interaction tracking for partial leads
          trackInteractions: true,
          trackFields: ['email', 'phone', 'name', 'first_name', 'last_name', 'company'],
          
          // Event triggers (blur + beforeunload = 95% capture rate)
          triggers: {
            blur: true,
            beforeunload: true,
            change: true,
            visibilitychange: false,
          },
          
          // Batch capture configuration (NEW)
          batchCapture: {
            enabled: true,
            debounceMs: 5000,
            captureOnVisibilityChange: true,
            captureOnBeforeUnload: true,
            minFieldsForCapture: 1,
          },
          
          // Performance settings
          debounceMs: 2000,
          batchSize: 10,
          flushInterval: 5000,
        },
      },
      theme: {
        primaryColor: '#0066cc',
        fontFamily: 'Arial, sans-serif',
      },
      cdnUrl: process.env.CDN_URL || 'http://localhost:5000',
      apiUrl: process.env.API_URL || 'http://localhost:5000',
      appVersion: 'v1',
    };

    this.clientConfigs.set('abc-123', exampleConfig);
    this.logger.log('Seeded example client configuration: abc-123');

    const toothDocsConfig: ClientConfig = {
      clientId: 'tooth-docs-dental',
      domain: 'ads.toothdocsdental.com',
      isActive: true,
      apiKey: 'sk_live_toothdocs123',
      widgets: {
        chat: {
          enabled: true,
          position: 'bottom-right',
          color: '#1E90FF',
          greeting: 'Welcome to ToothDocs! How can we help you today?',
        },
        analytics: {
          enabled: false,
          trackPageViews: false,
          trackClicks: false,
        },
        forms: {
          enabled: true,
          autoCapture: true,
          captureSelector: 'form',
          excludeFields: ['password', 'credit_card', 'ssn', 'cvv'],
          
          // Field interaction tracking enabled
          trackInteractions: true,
          trackFields: ['email', 'phone', 'name', 'first_name', 'last_name', 'company', 'organization'],
          
          triggers: {
            blur: true,
            beforeunload: true,
            change: true,
            visibilitychange: false,
          },
          
          // Batch capture configuration
          batchCapture: {
            enabled: true,
            debounceMs: 5000,
            captureOnVisibilityChange: true,
            captureOnBeforeUnload: true,
            minFieldsForCapture: 1,
          },
          
          debounceMs: 2000,
          batchSize: 10,
          flushInterval: 5000,
        },
      },
      theme: {
        primaryColor: '#1E90FF',
        fontFamily: 'Roboto, sans-serif',
      },
      cdnUrl: process.env.CDN_URL || 'http://localhost:5000',
      apiUrl: process.env.API_URL || 'http://localhost:5000',
      appVersion: 'v1',
      debugMode: true,
    };

    this.clientConfigs.set('tooth-docs-dental', toothDocsConfig);
    this.logger.log('Seeded client configuration for: tooth-docs-dental');

    // Test client for demo purposes
    const testClientConfig: ClientConfig = {
      clientId: 'test-client',
      domain: 'localhost',
      isActive: true,
      apiKey: 'sk_test_demo123',
      widgets: {
        chat: {
          enabled: true,
          position: 'bottom-right',
          color: '#3A86FF',
          greeting: 'Hi! This is a test chat widget. How can we help?',
        },
        analytics: {
          enabled: false,
          trackPageViews: false,
          trackClicks: false,
        },
        forms: {
          enabled: true,
          autoCapture: true,
          captureSelector: 'form',
          excludeFields: ['password', 'credit_card', 'ssn', 'cvv'],
          
          // Field interaction tracking for partial leads
          trackInteractions: true,
          trackFields: ['email', 'phone', 'name', 'first_name', 'last_name', 'company', 'message'],
          
          // Event triggers
          triggers: {
            blur: false,
            beforeunload: false,
            change: true,
            visibilitychange: false,
          },
          
          // Batch capture configuration (enabled for demo)
          batchCapture: {
            enabled: true,
            debounceMs: 5000,  // Shorter for demo purposes
            captureOnVisibilityChange: true,
            captureOnBeforeUnload: true,
            minFieldsForCapture: 3,
          },
          
          // Performance settings
          debounceMs: 1000,
          batchSize: 10,
          flushInterval: 5000,
        },
      },
      theme: {
        primaryColor: '#3A86FF',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      cdnUrl: process.env.CDN_URL || 'http://localhost:5000',
      apiUrl: process.env.API_URL || 'http://localhost:5000',
      appVersion: 'v1',
      debugMode: true,
    };

    this.clientConfigs.set('test-client', testClientConfig);
    this.logger.log('Seeded test client configuration: test-client');
  }

  /**
   * Get client configuration by clientId
   */
  async getClientConfig(clientId: string): Promise<ClientConfig> {
    const config = this.clientConfigs.get(clientId);
    
    if (!config) {
      throw new NotFoundException(`Client configuration not found for clientId: ${clientId}`);
    }

    if (!config.isActive) {
      throw new NotFoundException(`Client account is inactive for clientId: ${clientId}`);
    }

    return config;
  }

  /**
   * Get all client configurations
   */
  async getAllClientConfigs(): Promise<ClientConfig[]> {
    return Array.from(this.clientConfigs.values());
  }

  /**
   * Create a new client configuration
   */
  async createClientConfig(dto: CreateClientConfigDto): Promise<ClientConfig> {
    if (this.clientConfigs.has(dto.clientId)) {
      throw new ConflictException(`Client configuration already exists for clientId: ${dto.clientId}`);
    }

    // Ensure all widget configs have required fields with defaults
    const config: ClientConfig = {
      clientId: dto.clientId,
      domain: dto.domain,
      apiKey: dto.apiKey,
      isActive: dto.isActive ?? true,
      cdnUrl: process.env.CDN_URL || 'http://localhost:5000',
      apiUrl: process.env.API_URL || 'http://localhost:5000',
      appVersion: 'v1',
      widgets: {
        chat: dto.widgets?.chat ? {
          enabled: dto.widgets.chat.enabled ?? false,
          position: dto.widgets.chat.position,
          color: dto.widgets.chat.color,
          greeting: dto.widgets.chat.greeting,
        } : undefined,
        analytics: dto.widgets?.analytics ? {
          enabled: dto.widgets.analytics.enabled ?? false,
          trackPageViews: dto.widgets.analytics.trackPageViews,
          trackClicks: dto.widgets.analytics.trackClicks,
        } : undefined,
        forms: dto.widgets?.forms ? {
          enabled: dto.widgets.forms.enabled ?? false,
          autoCapture: dto.widgets.forms.autoCapture,
          captureSelector: dto.widgets.forms.captureSelector,
          excludeFields: dto.widgets.forms.excludeFields,
        } : undefined,
      },
      theme: dto.theme,
    };

    this.clientConfigs.set(dto.clientId, config);
    this.logger.log(`Created client configuration for clientId: ${dto.clientId}`);

    return config;
  }

  /**
   * Deep merge helper - merges source into target, only overwriting defined values
   */
  private deepMerge<T extends Record<string, any>>(target: T | undefined, source: Partial<T> | undefined): T | undefined {
    if (!source) return target;
    if (!target) return source as T;

    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }
    
    return result as T;
  }

  /**
   * Update an existing client configuration (PATCH - partial update)
   */
  async updateClientConfig(clientId: string, dto: UpdateClientConfigDto): Promise<ClientConfig> {
    const existingConfig = this.clientConfigs.get(clientId);

    if (!existingConfig) {
      throw new NotFoundException(`Client configuration not found for clientId: ${clientId}`);
    }

    // Deep merge configuration - preserve all existing fields
    const updatedConfig: ClientConfig = {
      // Preserve core fields - these should never be lost
      clientId: existingConfig.clientId,
      domain: dto.domain !== undefined ? dto.domain : existingConfig.domain,
      isActive: dto.isActive !== undefined ? dto.isActive : existingConfig.isActive,
      apiKey: dto.apiKey !== undefined ? dto.apiKey : existingConfig.apiKey,
      cdnUrl: existingConfig.cdnUrl,
      apiUrl: existingConfig.apiUrl,
      appVersion: existingConfig.appVersion,
      // Deep merge widgets - each widget is merged individually using helper
      widgets: {
        chat: this.deepMerge(existingConfig.widgets?.chat, dto.widgets?.chat),
        analytics: this.deepMerge(existingConfig.widgets?.analytics, dto.widgets?.analytics),
        forms: this.deepMerge(existingConfig.widgets?.forms, dto.widgets?.forms),
      },
      // Deep merge theme
      theme: this.deepMerge(existingConfig.theme, dto.theme),
    };

    this.clientConfigs.set(clientId, updatedConfig);
    this.logger.log(`Updated client configuration for clientId: ${clientId}`);
    this.logger.debug(`Updated fields: ${JSON.stringify(dto, null, 2)}`);
    this.logger.debug(`Final configuration: ${JSON.stringify(updatedConfig, null, 2)}`);
    return updatedConfig;
  }

  /**
   * Delete a client configuration
   */
  async deleteClientConfig(clientId: string): Promise<void> {
    if (!this.clientConfigs.has(clientId)) {
      throw new NotFoundException(`Client configuration not found for clientId: ${clientId}`);
    }

    this.clientConfigs.delete(clientId);
    this.logger.log(`Deleted client configuration for clientId: ${clientId}`);
  }

  /**
   * Check if a client exists and is active
   */
  async isClientActive(clientId: string): Promise<boolean> {
    const config = this.clientConfigs.get(clientId);
    return config ? config.isActive : false;
  }

  /**
   * Find client configuration by API key
   */
  async findByApiKey(apiKey: string): Promise<ClientConfig | null> {
    for (const config of this.clientConfigs.values()) {
      if (config.apiKey === apiKey) {
        return config;
      }
    }
    return null;
  }
}
