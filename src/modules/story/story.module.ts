import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import DatabaseModule from 'src/database/database.module';
import { MediaModule } from '../media/media.module';
import { UtilityModule } from 'src/util/utility.module';

@Module({
  imports: [DatabaseModule, MediaModule, UtilityModule],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoryModule {}
