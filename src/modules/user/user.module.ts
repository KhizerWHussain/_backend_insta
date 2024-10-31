import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import UserController from './user.controller';
import DatabaseModule from 'src/database/database.module';
import AuthModule from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { StoryModule } from '../story/story.module';
import { UtilityModule } from 'src/util/utility.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MediaModule,
    StoryModule,
    UtilityModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
