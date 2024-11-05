import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import DatabaseModule from 'src/database/database.module';
import { UtilityModule } from 'src/util/utility.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DatabaseModule, UtilityModule, NotificationModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
