import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { UserModule } from './modules/user/user.module';
import { MediaModule } from './modules/media/media.module';
import { PostModule } from './modules/post/post.module';
import { StoryModule } from './modules/story/story.module';
import { ReelModule } from './modules/reel/reel.module';
import { FollowModule } from './modules/follow/follow.module';
import { ActivityModule } from './modules/activity/activity.module';
import AuthGuard from './modules/auth/auth.guard';
import DeviceModule from './modules/device/device.module';
import AuthModule from './modules/auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ global: true }),
    RedisModule,
    DeviceModule,
    AuthModule,
    UserModule,
    MediaModule,
    PostModule,
    StoryModule,
    ReelModule,
    FollowModule,
    ActivityModule,
    NotificationModule,
    SearchModule,
    RouterModule.register([
      {
        path: './modules/search/search.module.ts',
        module: SearchModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [AppService],
})
export class AppModule {}
