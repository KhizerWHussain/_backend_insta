import { Module } from '@nestjs/common';
import { ReelService } from './reel.service';
import { ReelController } from './reel.controller';
import DatabaseModule from 'src/database/database.module';
@Module({
  imports: [DatabaseModule],
  controllers: [ReelController],
  providers: [ReelService],
  exports: [ReelService],
})
export class ReelModule {}
