import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import UserController from './user.controller';
import DatabaseModule from 'src/database/database.module';
import AuthModule from '../auth/auth.module';
import { StoryService } from '../story/story.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [DatabaseModule, AuthModule, MediaModule],
  controllers: [UserController],
  providers: [UserService, StoryService],
  exports: [UserService],
})
export class UserModule {}
