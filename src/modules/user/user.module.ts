import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import UserController from './user.controller';
import DatabaseModule from 'src/database/database.module';
import AuthModule from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { UtilityService } from 'src/util/utility.service';
import { StoryService } from '../story/story.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MediaModule,
    UtilityService,
    StoryService,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
