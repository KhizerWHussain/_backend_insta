import { Body } from '@nestjs/common';
import { ReelService } from './reel.service';
import { CreateReelDto } from './dto/reel.dto';
import { ApiController, CurrentUser, Post } from 'src/core/decorators';
import { User } from '@prisma/client';

@ApiController({
  path: '/reel',
  tag: 'reel',
  version: '1',
})
export class ReelController {
  constructor(private readonly reelService: ReelService) {}

  @Post({
    path: '/create',
  })
  create(@CurrentUser() user: User, @Body() payload: CreateReelDto) {
    return this.reelService.create(user, payload);
  }
}
