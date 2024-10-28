import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import DatabaseService from 'src/database/database.service';

@Injectable()
export default class CronService {
  constructor(private readonly _dbService: DatabaseService) {}

  @Cron(CronExpression.EVERY_HOUR, { name: 'test' })
  HandleTestMessage() {
    Logger.log('===> Generated from test cron <===', '[CRON]');
  }

  @Cron(CronExpression.EVERY_2ND_HOUR_FROM_1AM_THROUGH_11PM, {
    name: 'delete_stories',
  })
  async handleRemoveStoriesAfterADay() {}
}
