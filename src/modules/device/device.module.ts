import { Module } from '@nestjs/common';
import DeviceController from './device.controller';
import DeviceService from './device.service';
import DatabaseModule from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  exports: [DeviceService],
  providers: [DeviceService],
  controllers: [DeviceController],
})
export default class DeviceModule {}
