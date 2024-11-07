import { Controller, Param, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Authorized, CurrentUser, Delete, Get } from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { User } from '@prisma/client';
import {
  basicSearchDto,
  keywordSearchDto,
  postSearchByLocationDto,
} from './dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly _search: SearchService) {}

  @Authorized()
  @Get({
    path: '/basic',
    description: 'basic search for accounts (users)',
    response: APIResponseDTO,
  })
  async basic(@CurrentUser() user: User, @Query() query: basicSearchDto) {
    return await this._search.accounts(user, query);
  }

  @Authorized()
  @Get({
    path: '/keyword_search',
    description: 'keyword search when user click on searched_keyword',
    response: APIResponseDTO,
  })
  async searchBasedOnKeyword(
    @CurrentUser() user: User,
    @Query() query: keywordSearchDto,
  ) {
    return await this._search.onKeyword(user, query);
  }

  @Authorized()
  @Get({
    path: '/post',
    description: 'get post searched by location string',
    response: APIResponseDTO,
  })
  async postsSearchByLocation(
    @CurrentUser() user: User,
    @Query() query: postSearchByLocationDto,
  ) {
    return await this._search.postByLocation(user, query);
  }

  @Authorized()
  @Get({
    path: '/getMine',
    description: 'get my recently searched content',
    response: APIResponseDTO,
  })
  async getRecentSearched(@CurrentUser() user: User) {
    return await this._search.getRecent(user);
  }

  @Authorized()
  @Delete({
    path: '/delete/recent/:searchedId',
    description: 'delete single recent search',
    response: APIResponseDTO,
  })
  async deleteSingleSearch(
    @CurrentUser() user: User,
    @Param('searchedId') searchedId: number,
  ) {
    return await this._search.deleteOne(Number(user.id), Number(searchedId));
  }

  @Authorized()
  @Delete({
    path: '/delete/all',
    description: 'delete all recent searches',
  })
  async deleteAllRecentSearched(@CurrentUser() user: User) {
    return await this._search.deleteAll(Number(user.id));
  }
}
