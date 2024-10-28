import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import DatabaseModule from 'src/database/database.module';
import { UserModule } from '../user/user.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [DatabaseModule, UserModule, MediaModule],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoryModule {}
