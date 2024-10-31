import { FollowService } from './follow.service';
import {
  ApiController,
  Authorized,
  CurrentUser,
  Get,
  Patch,
  Post,
} from 'src/core/decorators';
import { Param } from '@nestjs/common';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { User } from '@prisma/client';

@ApiController({
  path: '/follow',
  tag: 'follow',
  version: '1',
})
export class FollowController {
  constructor(private readonly _followService: FollowService) {}

  @Authorized()
  @Post({
    path: '/follow/request/:recieverId',
    description: 'send follow request',
    response: APIResponseDTO,
  })
  sendFollowRequest(
    @CurrentUser() user: User,
    @Param('recieverId') recieverId: number,
  ) {
    return this._followService.sendFollowRequest(user, recieverId);
  }

  @Authorized()
  @Post({
    path: '/follow/:userId',
    description: 'follow user account',
    response: APIResponseDTO,
  })
  followAccount(@CurrentUser() user: User, @Param('userId') userId: number) {
    return this._followService.followAccount(user, Number(userId));
  }

  @Authorized()
  @Patch({
    path: '/acceptRequst/:requestId',
    description: 'accept friend request',
  })
  acceptFollowRequest(
    @CurrentUser() user: User,
    @Param('requestId') requestId: number,
  ) {
    return this._followService.acceptFollowRequest(user, Number(requestId));
  }

  @Authorized()
  @Patch({
    path: '/declineRequest/:requestId',
    description: 'decline user follow request',
    response: APIResponseDTO,
  })
  declineFollowRequest(
    @CurrentUser() user: User,
    @Param('requestId') requestId: number,
  ) {
    return this._followService.declineFollowRequest(user, Number(requestId));
  }

  @Authorized()
  @Patch({
    path: '/unfollowUser/:userToUnfollowId',
    description: 'unfollow already followed user',
    response: APIResponseDTO,
  })
  unfollowUser(
    @CurrentUser() user: User,
    @Param('userToUnfollowId') userToUnfollowId: number,
  ) {
    return this._followService.unfollowUser(user, Number(userToUnfollowId));
  }
}
