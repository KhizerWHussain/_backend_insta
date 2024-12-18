import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import DatabaseModule from 'src/database/database.module';
import { MediaModule } from '../media/media.module';
import { UtilityModule } from 'src/util/utility.module';
import { RedisModule } from 'src/redis/redis.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    DatabaseModule,
    MediaModule,
    UtilityModule,
    RedisModule,
    NotificationModule,
  ],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoryModule {}
