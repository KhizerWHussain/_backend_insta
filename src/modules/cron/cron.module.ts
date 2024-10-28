import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import CronService from './cron.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CronService],
  controllers: [],
  exports: [CronService],
})
export default class CronModule {}
