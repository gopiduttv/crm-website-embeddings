import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ClientConfigService } from '../tracking/client-config.service';
import { ClientConfig } from '../tracking/interfaces/client-config.interface';

/**
 * Service for handling script embedding and generation
 * Separated from tracking logic for better organization
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly clientConfigService: ClientConfigService) {}

  /**
   * Generates a dynamic JavaScript loader script for a specific client.
   * This is the bootloader pattern described in the README.
   * 
   * @param clientId The unique client identifier
   * @returns The personalized JavaScript loader code
   */
  async generateLoaderScript(clientId: string): Promise<string> {
    // Fetch client configuration
    const config = await this.clientConfigService.getClientConfig(clientId);

    // Generate the loader script with embedded configuration
    return this.createLoaderScriptContent(config);
  }

  /**
   * Creates the actual JavaScript loader content with client configuration
   * This implements the bootloader pattern with embedded configuration
   */
  private createLoaderScriptContent(config: ClientConfig): string {
    // Determine the API URL for the main app script
    const apiUrl = config.apiUrl || 'http://localhost:5000';
    const mainAppUrl = `${apiUrl}/main-app.v1.js`;

    // Generate the bootloader script with embedded configuration
    return `/**
 * YourCRM Bootloader Script
 * Client: ${config.clientId}
 * Generated: ${new Date().toISOString()}
 */
(function() {
  'use strict';

  // 1. Create the command queue placeholder
  window.YourCRM = window.YourCRM || function() {
    (window.YourCRM.q = window.YourCRM.q || []).push(arguments);
  };

  // 2. Inject the client's specific configuration (embedded - no API call needed!)
  window.YourCRM('init', {
    clientId: '${config.clientId}',
    apiKey: '${config.apiKey}',
    apiUrl: '${apiUrl}',
    widgets: ${JSON.stringify(config.widgets || {}, null, 2).split('\n').join('\n    ')},
    theme: ${JSON.stringify(config.theme || {}, null, 2).split('\n').join('\n    ')},
    debugMode: ${config.debugMode || false}
  });

  // 3. Load the main application script
  var script = document.createElement('script');
  script.src = '${mainAppUrl}';
  script.async = true;
  script.onerror = function() {
    console.error('[YourCRM] Failed to load tracking script from ${mainAppUrl}');
  };
  document.head.appendChild(script);
})();
`;
  }

  /**
   * Generates the simple HTML embed snippet for a client
   * This is what the client copies into their website
   */
  async generateEmbedSnippet(clientId: string): Promise<string> {
    // Verify client exists
    const config = await this.clientConfigService.getClientConfig(clientId);
    
    // Use the actual API URL from config
    const apiUrl = config.apiUrl || 'http://localhost:5000';
    const scriptUrl = `${apiUrl}/script/${clientId}.js`;
    
    return `<script src="${scriptUrl}" async defer></script>`;
  }
}
