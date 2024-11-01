import { Module } from '@nestjs/common';
import DatabaseModule from '../../database/database.module';
import AuthService from './auth.service';
import AuthGuard from './auth.guard';
import DeviceModule from '../device/device.module';
import { RedisModule } from 'src/redis/redis.module';
import { UtilityModule } from 'src/util/utility.module';

@Module({
  imports: [DatabaseModule, DeviceModule, RedisModule, UtilityModule],
  exports: [AuthService],
  providers: [AuthService, AuthGuard],
  controllers: [],
})
export default class AuthModule {}
