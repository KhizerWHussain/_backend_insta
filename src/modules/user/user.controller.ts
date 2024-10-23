import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiController, Post } from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { SignupRequestDTO } from './dto/usermodule.dto';

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

  @Get()
  findAll() {
    return this._userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._userService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this._userService.update(+id, updateUserDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this._userService.remove(+id);
  }
}
