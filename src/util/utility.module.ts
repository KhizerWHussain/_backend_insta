import { Module } from '@nestjs/common';
import { UtilityService } from './utility.service';
import DatabaseModule from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}
