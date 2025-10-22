import {
  Controller,
  Get,
  Param,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EmbeddingService } from './embedding.service';

/**
 * Script generation endpoints for embedding tracking on client websites
 */
@ApiTags('embedding')
@Controller('script')
export class ScriptController {
  constructor(private readonly embeddingService: EmbeddingService) {}

  /**
   * Dynamic loader script generation endpoint
   * Returns personalized JavaScript with client configuration
   */
  @Get(':clientId.js')
  @Header('Content-Type', 'application/javascript')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({ summary: 'Get dynamic loader script for a client' })
  @ApiParam({ name: 'clientId', description: 'Client identifier', example: 'abc-123' })
  @ApiResponse({ status: 200, description: 'JavaScript loader script', type: String })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getLoaderScript(@Param('clientId') clientId: string): Promise<string> {
    // Remove .js extension if present
    const cleanClientId = clientId.replace(/\.js$/, '');
    return this.embeddingService.generateLoaderScript(cleanClientId);
  }

  /**
   * Get HTML embed snippet for a client
   */
  @Get(':clientId/embed')
  @ApiOperation({ summary: 'Get HTML embed snippet for a client' })
  @ApiParam({ name: 'clientId', description: 'Client identifier', example: 'abc-123' })
  @ApiResponse({ status: 200, description: 'HTML embed snippet' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getEmbedSnippet(@Param('clientId') clientId: string): Promise<{ snippet: string }> {
    const snippet = await this.embeddingService.generateEmbedSnippet(clientId);
    return { snippet };
  }
}

/**
 * Static assets controller for serving the main application and demo pages
 */
@ApiTags('embedding')
@Controller()
export class AssetsController {
  /**
   * Serve the main application script
   */
  @Get('main-app.:version.js')
  @Header('Content-Type', 'application/javascript')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Get main application script' })
  @ApiParam({ name: 'version', description: 'Version identifier', example: 'v1' })
  @ApiResponse({ status: 200, description: 'JavaScript main application', type: String })
  async getMainApp(@Param('version') version: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', `main-app.${version}.js`);
    
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Main app version ${version} not found`);
    }
  }

  /**
   * Serve the demo HTML page
   */
  @Get('demo')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Get demo page to test tracking' })
  @ApiResponse({ status: 200, description: 'Demo HTML page', type: String })
  async getDemoPage(): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'demo.html');
    
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error('Demo page not found');
    }
  }

  /**
   * Serve the client integration example page
   */
  @Get('example')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Get client integration example page' })
  @ApiResponse({ status: 200, description: 'Client integration example page', type: String })
  async getExamplePage(): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'client-example.html');
    
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error('Example page not found');
    }
  }

  /**
   * Serve the configuration test page
   */
  @Get('config-test')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Get configuration test page' })
  @ApiResponse({ status: 200, description: 'Configuration test page', type: String })
  async getConfigTestPage(): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'config-test.html');
    
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error('Config test page not found');
    }
  }
}
