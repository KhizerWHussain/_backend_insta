import { Module } from '@nestjs/common';
import { ReelService } from './reel.service';
import { ReelController } from './reel.controller';
import DatabaseModule from 'src/database/database.module';
import { UtilityModule } from 'src/util/utility.module';
import { NotificationModule } from '../notification/notification.module';
@Module({
  imports: [DatabaseModule, UtilityModule, NotificationModule],
  controllers: [ReelController],
  providers: [ReelService],
  exports: [ReelService],
})
export class ReelModule {}
