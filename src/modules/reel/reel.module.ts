import { Module } from '@nestjs/common';
import { ReelService } from './reel.service';
import { ReelController } from './reel.controller';

@Module({
  controllers: [ReelController],
  providers: [ReelService],
})
export class ReelModule {}
