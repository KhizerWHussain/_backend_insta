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
    description: 'updating user profile privacy',
    response: APIResponseDTO,
  })
  updateProfilePrivacy(@CurrentUser() user: User): Promise<APIResponseDTO> {
    return this._userService.updateUserProfilePolicy(user);
  }

  // @Get()
  // findAll() {
  //   return this._userService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this._userService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this._userService.update(+id, updateUserDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this._userService.remove(+id);
  }
}
