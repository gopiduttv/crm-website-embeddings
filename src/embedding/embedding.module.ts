import { Module } from '@nestjs/common';
import { ScriptController, AssetsController } from './embedding.controller';
import { EmbeddingService } from './embedding.service';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [TrackingModule], // Import to access ClientConfigService
  controllers: [ScriptController, AssetsController],
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
