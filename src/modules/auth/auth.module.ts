import { Module } from '@nestjs/common';
import DatabaseModule from '../../database/database.module';
import AuthService from './auth.service';
import AuthGuard from './auth.guard';
import DeviceModule from '../device/device.module';

@Module({
  imports: [DatabaseModule, DeviceModule],
  exports: [AuthService],
  providers: [AuthService, AuthGuard],
  controllers: [],
})
export default class AuthModule {}
