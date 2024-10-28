import { Module } from '@nestjs/common';
import DatabaseService from './database.service';

@Module({
  imports: [],
  controllers: [],
  exports: [DatabaseService],
  providers: [DatabaseService],
})
export default class DatabaseModule {}
