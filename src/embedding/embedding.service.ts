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
   */
  private createLoaderScriptContent(config: ClientConfig): string {
    // Read the production script template
    const fs = require('fs');
    const path = require('path');
    try {
      const templatePath = path.join(__dirname, '..', '..', 'public', 'production-tracker.js');
      if (!fs.existsSync(templatePath)) {
        this.logger.warn('production-tracker.js template not found, using basic script fallback.');
        // The basic script is gone, so we must throw an error if the template is missing.
        throw new Error('Production script template not found.');
      }

      let scriptContent = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      scriptContent = scriptContent
        .replace("'{{CLIENT_ID}}'", `'${config.clientId}'`)
        .replace("'{{SERVER_URL}}'", `'${config.apiUrl}'`)
        .replace("'{{API_KEY}}'", `'${config.apiKey}'`)
        // Replace the entire quoted string with the raw JSON object
        .replace("'{{WIDGETS_CONFIG}}'", JSON.stringify(config.widgets || {}))
        .replace("'{{THEME_CONFIG}}'", JSON.stringify(config.theme || {}))
        // Replace the entire quoted string with the raw boolean
        .replace("'{{DEBUG_MODE}}'", String(config.debugMode || false));

      return scriptContent;
    } catch (error) {
      this.logger.error('Failed to create loader script from template', error);
      // If the template fails, we no longer have a fallback.
      // This is a critical error.
      throw new InternalServerErrorException('Failed to generate tracking script.');
    }
  }

  /**
   * Generates the simple HTML embed snippet for a client
   * This is what the client copies into their website
   */
  async generateEmbedSnippet(clientId: string): Promise<string> {
    // Verify client exists
    await this.clientConfigService.getClientConfig(clientId);

    // Return the embed snippet
    const scriptUrl = `https://api.yourcrm.com/script/${clientId}.js`;
    return `<script src="${scriptUrl}" async defer></script>`;
  }
}
