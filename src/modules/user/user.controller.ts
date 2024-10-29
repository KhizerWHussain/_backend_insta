import { Body, Param, Delete, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiController,
  Authorized,
  CurrentUser,
  Get,
  Patch,
  Post,
} from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { SigninRequestDTO, SignupRequestDTO } from './dto/usermodule.dto';
import { User } from '@prisma/client';

@ApiController({
  path: '/user',
  tag: 'user',
  version: '1',
})
export default class UserController {
  constructor(private readonly _userService: UserService) {}

  @Post({
    path: '/signup',
    description: 'Create user',
    response: APIResponseDTO,
  })
  create(@Body() payload: SignupRequestDTO) {
    return this._userService.userSignup(payload);
  }

  @Post({
    path: '/signin',
    description: 'log in user',
    response: APIResponseDTO,
  })
  login(@Body() payload: SigninRequestDTO) {
    return this._userService.userSignin(payload);
  }

  @Authorized()
  @Get({
    path: '/getMyData',
    description: 'Get current user details',
    response: APIResponseDTO,
  })
  getMe(
    @CurrentUser() user: User,
    @Headers() headers: any,
  ): Promise<APIResponseDTO> {
    return this._userService.getCurrentUserData(user, headers);
  }

  @Authorized()
  @Patch({
    path: '/updateProfilePrivacy',
    description: 'updating (toggle) user profile privacy',
    response: APIResponseDTO,
  })
  updateProfilePrivacy(@CurrentUser() user: User): Promise<APIResponseDTO> {
    return this._userService.updateUserProfilePolicy(user);
  }

  @Authorized()
  @Get({
    path: '/main/timeline',
    description: 'get instagram post timeline',
    response: APIResponseDTO,
  })
  getMainPostListingTimeline(
    @CurrentUser() user: User,
  ): Promise<APIResponseDTO> {
    return this._userService.getMainPostListingTimeline(user);
  }

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
    return this._userService.sendFollowRequest(user, recieverId);
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
    return this._userService.acceptFollowRequest(user, Number(requestId));
  }

  @Authorized()
  @Get({
    path: '/getFollowersList/:userId',
    description: 'get followers list of user (anyone)',
    response: APIResponseDTO,
  })
  getFollowersList(@Param('userId') userId: number) {
    return this._userService.getFollowersList(Number(userId));
  }

  @Authorized()
  @Get({
    path: '/getUsersWhomIFollow/:userId',
    description: 'get followers list of user (anyone)',
    response: APIResponseDTO,
  })
  getUsersWhomIFollow(@Param('userId') userId: number) {
    return this._userService.getFollowingUsersList(Number(userId));
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
    return this._userService.declineFollowRequest(user, Number(requestId));
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
    return this._userService.unfollowUser(user, Number(userToUnfollowId));
  }

  @Authorized()
  @Patch({
    path: '/deActivate',
    description: 'deActivate the user',
    response: APIResponseDTO,
  })
  deActivateUser(@CurrentUser() user: User) {
    return this._userService.deActivateUser(user);
  }
}
