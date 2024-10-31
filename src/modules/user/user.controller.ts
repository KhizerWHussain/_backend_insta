import { Body, Param, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiController,
  Authorized,
  CurrentUser,
  Get,
  Patch,
  Post,
  Put,
} from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import UpdateMyProfileDto, {
  SigninRequestDTO,
  SignupRequestDTO,
} from './dto/usermodule.dto';
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
    path: '/deActivate',
    description: 'deActivate the user',
    response: APIResponseDTO,
  })
  deActivateUser(@CurrentUser() user: User) {
    return this._userService.deActivateUser(user);
  }

  @Authorized()
  @Get({
    path: '/explore',
    description: 'user explore timeline',
    response: APIResponseDTO,
  })
  exploreTimeline(@CurrentUser() user: User) {
    return this._userService.exploreTimeline(user);
  }

  @Authorized()
  @Get({
    path: '/findUser/:findUserId',
    description: 'user explore timeline',
    response: APIResponseDTO,
  })
  getOtherUser(
    @CurrentUser() user: User,
    @Param('findUserId') findUserId: number,
  ) {
    return this._userService.getOtherUser(user, Number(findUserId));
  }

  @Authorized()
  @Get({
    path: '/otherUser/post/:userId',
    description: 'get posts of other user',
    response: APIResponseDTO,
  })
  getPostOfOtherUser(
    @CurrentUser() user: User,
    @Param('userId') userId: number,
  ) {
    return this._userService.getPostOfOtherUser(user, Number(userId));
  }

  @Authorized()
  @Post({
    path: '/block/:blockUserId',
    description: 'block a user',
    response: APIResponseDTO,
  })
  blockUser(
    @CurrentUser() user: User,
    @Param('blockUserId') blockUserId: number,
  ) {
    return this._userService.blockUser(user, Number(blockUserId));
  }

  @Authorized()
  @Post({
    path: '/unblock/:blockUserId',
    description: 'unblock block a user',
    response: APIResponseDTO,
  })
  unblockUser(
    @CurrentUser() user: User,
    @Param('blockUserId') blockUserId: number,
  ) {
    return this._userService.unblockUser(user, Number(blockUserId));
  }

  @Authorized()
  @Put({
    path: '/editProfile',
    description: 'edit my profile',
    response: APIResponseDTO,
  })
  updateProfile(
    @CurrentUser() user: User,
    @Body() payload: UpdateMyProfileDto,
  ) {
    return this._userService.editProfile(user, payload);
  }

  // @Post({
  //   path: '/logout',
  //   description: 'Logout',
  //   response: ForgetPasswordResponseDTO,
  // })
  // Logout(@Body() data: LogoutRequestDTO): Promise<LogoutResponseDTO> {
  //   return this._userService.logout(data);
  // }
}
