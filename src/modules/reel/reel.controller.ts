import { Body, Param } from '@nestjs/common';
import { ReelService } from './reel.service';
import { CreateReelDto } from './dto/reel.dto';
import {
  ApiController,
  Authorized,
  CurrentUser,
  Delete,
  Get,
  Post,
} from 'src/core/decorators';
import { User } from '@prisma/client';
import { APIResponseDTO } from 'src/core/response/response.schema';

@ApiController({
  path: '/reel',
  tag: 'reel',
  version: '1',
})
export class ReelController {
  constructor(private readonly reelService: ReelService) {}

  @Authorized()
  @Post({
    path: '/create',
    description: 'create reel by user',
    response: APIResponseDTO,
  })
  create(@CurrentUser() user: User, @Body() payload: CreateReelDto) {
    return this.reelService.create(user, payload);
  }

  @Authorized()
  @Delete({
    path: '/delete/:reelId',
    description: 'delete my reel by user',
    response: APIResponseDTO,
  })
  delete(@CurrentUser() user: User, @Param('reelId') reelId: number) {
    return this.reelService.deleteMyReel(user, Number(reelId));
  }

  @Authorized()
  @Get({
    path: '/detail/:reelId',
    description: 'get single reel details',
    response: APIResponseDTO,
  })
  detail(@CurrentUser() user: User, @Param('reelId') reelId: number) {
    return this.reelService.singleReelDetail(user, Number(reelId));
  }
}
