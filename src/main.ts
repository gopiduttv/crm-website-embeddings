import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for tracking requests from any origin
  app.enableCors({
    origin: true, // Allow all origins (for tracking purposes)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // Enable global validation pipe to automatically validate incoming payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('CRM Web Tracker API')
    .setDescription(
      'Scalable CRM widget platform with dynamic script loading.\n\n' +
      '## Features\n' +
      '- Dynamic loader script generation with client configuration\n' +
      '- Event tracking (pageviews, custom events, user identification)\n' +
      '- Client configuration management\n' +
      '- Script embedding and static assets serving\n' +
      '- RESTful API design\n\n' +
      '## Getting Started\n' +
      '1. Create a client configuration using POST /v1/clients\n' +
      '2. Get the embed snippet from GET /script/:clientId/embed\n' +
      '3. Add the snippet to your website\n' +
      '4. Track events using POST /v1/track/events'
    )
    .setVersion('1.0')
    .addTag('tracking', 'Event tracking endpoints')
    .addTag('embedding', 'Script generation and embedding endpoints')
    .addTag('clients', 'Client configuration management')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(5000);
}
bootstrap();

