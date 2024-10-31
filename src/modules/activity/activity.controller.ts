import { ActivityService } from './activity.service';
import {
  ApiController,
  Authorized,
  CurrentUser,
  Get,
} from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { User } from '@prisma/client';

@ApiController({
  path: '/activity',
  tag: 'activity',
  version: '1',
})
export class ActivityController {
  constructor(private readonly _activityService: ActivityService) {}

  @Authorized()
  @Get({
    path: '/myLikes/all',
    description: 'get post which i have liked',
    response: APIResponseDTO,
  })
  getPostsILiked(@CurrentUser() user: User) {
    return this._activityService.getPostsILiked(user);
  }

  @Authorized()
  @Get({
    path: '/myComments/all',
    description: 'get posts which i have commented on',
    response: APIResponseDTO,
  })
  getPostsICommentedOn(@CurrentUser() user: User) {
    return this._activityService.getPostsICommentedOn(user);
  }
}
