import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import AuthGuard from './modules/auth/auth.guard';

@Module({
  imports: [
    EventEmitterModule.forRoot({global: true}),
  ],
  controllers: [AppController],
  providers: [AppService,     { provide: APP_GUARD, useClass: AuthGuard },],
  exports: [],
})
export class AppModule {}
