import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/story.dto';
import {
  ApiController,
  Authorized,
  CurrentUser,
  Delete,
  Get,
  Patch,
  Post,
} from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { Body, Param } from '@nestjs/common';
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

  @Authorized()
  @Get({
    path: '/feed/getAll',
    description:
      'get main fees stories of user (mystories & following user stories)',
    response: APIResponseDTO,
  })
  getMainFeedStories(@CurrentUser() user: User) {
    return this._storyService.getStoriesOnFeed(user);
  }

  @Authorized()
  @Delete({
    path: '/delete/:storyId',
    description: 'delete my story',
    response: APIResponseDTO,
  })
  deleteMyStory(@CurrentUser() user: User, @Param('storyId') storyId: number) {
    return this._storyService.deleteStoryById(Number(storyId), user.id);
  }

  @Authorized()
  @Patch({
    path: '/view/:storyId',
    description: 'view the story',
    response: APIResponseDTO,
  })
  viewStory(@CurrentUser() user: User, @Param('storyId') storyId: number) {
    return this._storyService.viewStory(user, Number(storyId));
  }

  @Authorized()
  @Get({
    path: '/detail/:storyId',
    description: 'detail of story',
    response: APIResponseDTO,
  })
  storyDetail(@CurrentUser() user: User, @Param('storyId') storyId: number) {
    return this._storyService.storyDetail(user, Number(storyId));
  }

  @Authorized()
  @Post({
    path: '/like/:storyId',
    description: 'detail of story',
    response: APIResponseDTO,
  })
  likeStory(@CurrentUser() user: User, @Param('storyId') storyId: number) {
    return this._storyService.likeStory(user, Number(storyId));
  }
}
