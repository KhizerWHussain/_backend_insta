import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import DatabaseModule from 'src/database/database.module';
import { UtilityService } from 'src/util/utility.service';

@Module({
  imports: [DatabaseModule, UtilityService],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
