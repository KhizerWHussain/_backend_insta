import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './modules/user/user.module';
import { MediaModule } from './modules/media/media.module';
import AuthGuard from './modules/auth/auth.guard';
import DeviceModule from './modules/device/device.module';
import AuthModule from './modules/auth/auth.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ global: true }),
    DeviceModule,
    AuthModule,
    UserModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [AppService],
})
export class AppModule {}
