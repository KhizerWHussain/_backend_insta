import { DynamicModule, Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import DatabaseModule from 'src/database/database.module';
import { UtilityModule } from 'src/util/utility.module';

// @Module({
//   imports: [DatabaseModule, UtilityModule],
//   controllers: [SearchController],
//   providers: [SearchService],
//   exports: [],
// })

@Module({})
export class SearchModule {
  static register(): DynamicModule {
    return {
      global: true,
      imports: [DatabaseModule, UtilityModule],
      controllers: [SearchController],
      module: SearchModule,
      providers: [SearchService],
      exports: [SearchService],
    };
  }
}

// export class SearchModule { }
