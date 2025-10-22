import { Module } from '@nestjs/common';
import { TrackingController, ClientConfigController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { ClientConfigService } from './client-config.service';

@Module({
  controllers: [TrackingController, ClientConfigController],
  providers: [TrackingService, ClientConfigService],
  exports: [TrackingService, ClientConfigService],
})
export class TrackingModule {}

