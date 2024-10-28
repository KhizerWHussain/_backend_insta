import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/story.dto';
import {
  ApiController,
  Authorized,
  CurrentUser,
  Get,
  Post,
} from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { Body } from '@nestjs/common';
import { User } from '@prisma/client';

@ApiController({
  path: '/story',
  tag: 'story',
  version: '1',
})
export class StoryController {
  constructor(private readonly _storyService: StoryService) {}

  @Authorized()
  @Post({
    path: '/create',
    description: 'create story by user',
    response: APIResponseDTO,
  })
  create(@CurrentUser() user: User, @Body() payload: CreateStoryDto) {
    return this._storyService.createStory(user, payload);
  }

  @Authorized()
  @Get({
    path: '/myStories',
    description: 'get all my stories',
    response: APIResponseDTO,
  })
  getMyStories(@CurrentUser() user: User) {
    return this._storyService.getMyStories(user);
  }
}
