import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LazyModuleLoader } from '@nestjs/core';
// import { SearchModule } from './modules/search/search.module';
// import { SearchService } from './modules/search/search.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    // private readonly lazyLoader: LazyModuleLoader,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Get()
  // async getLazyReport(): Promise<string> {
  //   console.time();
  //   const moduleRef = await this.lazyLoader.load(() => SearchModule);
  //   const searchService = moduleRef.get(SearchService);
  //   console.timeEnd();
  //   return searchService.basicSearch();
  // }
}
