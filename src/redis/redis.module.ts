import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
// import { CacheInterceptor } from '@nestjs/cache-manager';
// import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [],
  providers: [
    RedisService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
  exports: [RedisService],
  controllers: [],
})
export class RedisModule {}
