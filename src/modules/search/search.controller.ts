import { Controller, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Authorized, CurrentUser, Get } from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { User } from '@prisma/client';
import { basicSearchDto } from './dto/search.dto';

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
    return this._search.basicSearch(user, query);
  }
}
