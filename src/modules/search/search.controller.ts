import { Controller, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Authorized, CurrentUser, Get } from 'src/core/decorators';
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
  async basic(
    @CurrentUser() user: User,
    @Query() query: basicSearchDto,
  ): Promise<APIResponseDTO> {
    return await this._search.basic(user, query);
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
    return await this._search.findPostsByLocation(user, query);
  }
}
