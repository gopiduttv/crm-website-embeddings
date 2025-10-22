import { Injectable, Logger } from '@nestjs/common';
import { TrackEventDto } from './dto/track-event.dto';
import { ClientConfigService } from './client-config.service';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly clientConfigService: ClientConfigService) { }

  /**
   * Pushes a validated tracking event to the message queue for asynchronous processing.
   * @param trackEventDto The validated event payload.
   */
  async queueEvent(trackEventDto: TrackEventDto): Promise<void> {
    // Validate API key
    const client = await this.clientConfigService.findByApiKey(trackEventDto.apiKey);
    if (!client || !client.isActive) {
      this.logger.warn(`Invalid or inactive API key: ${trackEventDto.apiKey}`);
      throw new Error('Invalid or inactive API key');
    }

    // Validate event type specific data
    if (trackEventDto.type === 'form_submission') {
      if (!trackEventDto.form) {
        throw new Error('Form data is required for form_submission events');
      }
      // Log a warning if forms are disabled but accept the event anyway
      // (client might have cached older config where forms were enabled)
      if (!client.widgets?.forms?.enabled) {
        this.logger.warn(
          `Form tracking is currently disabled for client ${client.clientId}, but accepting event from cached frontend`,
        );
      }
    }

    if (trackEventDto.type === 'pageview') {
      if (!trackEventDto.page) {
        throw new Error('Page data is required for pageview events');
      }
      // Log a warning if analytics are disabled but accept the event anyway
      if (!client.widgets?.analytics?.enabled) {
        this.logger.warn(
          `Analytics is currently disabled for client ${client.clientId}, but accepting event from cached frontend`,
        );
      }
    }

    this.logger.log(
      `Queueing event type '${trackEventDto.type}' for client '${client.clientId}'`,
    );

    if (trackEventDto.type === 'form_submission' && trackEventDto.form) {
      // Type guard: we know this is a FormSubmissionProperties because type is 'form_submission'
      const formData = trackEventDto.form as any;
      if (formData.fields) {
        this.logger.log(
          `Form submission: ${formData.formName || formData.formId} with ${Object.keys(formData.fields).length} fields`,
        );
      }
    }

    // Process the event (in production, this would push to a message queue)
    await this.processEvent(trackEventDto, client);

    //
    // --- MESSAGE QUEUE INTEGRATION LOGIC GOES HERE ---
    //
    // Example:
    //
    // const message = JSON.stringify(trackEventDto);
    // await this.sqsClient.sendMessage({
    //   QueueUrl: process.env.SQS_QUEUE_URL,
    //   MessageBody: message,
    // });
    //
    // The actual implementation will depend on your chosen queue (SQS, RabbitMQ, etc.)
    // and how you inject its client into this service.
    //
  }

  /**
   * Pushes a batch of validated tracking events to the message queue.
   * @param trackEventDtos An array of validated event payloads.
   */
  async queueEvents(trackEventDtos: TrackEventDto[]): Promise<void> {
    // Since all events in a batch share the same API key, we can validate it once.
    if (trackEventDtos.length === 0) {
      return;
    }
    const apiKey = trackEventDtos[0].apiKey;
    const client = await this.clientConfigService.findByApiKey(apiKey);
    if (!client || !client.isActive) {
      this.logger.warn(`Invalid or inactive API key for batch: ${apiKey}`);
      throw new Error('Invalid or inactive API key');
    }

    this.logger.log(
      `Queueing batch of ${trackEventDtos.length} events for client '${client.clientId}'`,
    );

    // Process each event in the batch
    for (const eventDto of trackEventDtos) {
      // We can skip individual API key validation since we did it for the batch.
      // You might add more specific per-event validation here if needed.
      await this.processEvent(eventDto, client);
    }
  }

  /**
   * Process the event (store in database, trigger webhooks, etc.)
   * In production, this would be handled by a separate worker service
   */
  private async processEvent(
    event: TrackEventDto,
    client: any,
  ): Promise<void> {
    // TODO: Store in database with proper indexing
    // Example structure:
    const enrichedEvent = {
      ...event,
      clientId: client.clientId,
      domain: client.domain,
      timestamp: new Date().toISOString(),
      processed: false,
    };

    this.logger.debug(`Event processed: ${JSON.stringify(enrichedEvent)}`);

    // Here you would:
    // 1. Store in database (PostgreSQL/MongoDB)
    // 2. Trigger webhooks if configured
    // 3. Update analytics aggregations
    // 4. Send to CRM system
    // 5. Process form submissions (send emails, create leads, etc.)
  }
}
