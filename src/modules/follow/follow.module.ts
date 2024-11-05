import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import DatabaseModule from 'src/database/database.module';
import { UtilityModule } from 'src/util/utility.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DatabaseModule, UtilityModule, NotificationModule],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
