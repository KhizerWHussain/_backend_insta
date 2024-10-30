import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { UtilityService } from 'src/util/utility.service';
import DatabaseModule from 'src/database/database.module';

@Module({
  imports: [UtilityService, DatabaseModule],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
