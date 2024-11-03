import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import DatabaseModule from 'src/database/database.module';
import { UtilityModule } from 'src/util/utility.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [DatabaseModule, UtilityModule, RedisModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
