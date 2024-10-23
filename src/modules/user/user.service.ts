import { BadRequestException, Injectable } from '@nestjs/common';
import { SignupRequestDTO } from './dto/usermodule.dto';
import DatabaseService from 'src/database/database.service';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { UserType } from '@prisma/client';
import { createFullName } from 'src/util/customFunc';
import { HashPassword } from 'src/helpers/util.helper';

@Injectable()
export class UserService {
  constructor(private _dbService: DatabaseService) {}

  async userSignup(payload: SignupRequestDTO): Promise<APIResponseDTO> {
    const UserExistWithThisEmail = await this._dbService.user.findUnique({
      where: { email: payload.email, deletedAt: null },
    });

    if (UserExistWithThisEmail) {
      throw new BadRequestException('user with this email already exist');
    }

    const UserExistWithThisUsername = await this._dbService.user.findUnique({
      where: { username: payload.username },
    });

    if (UserExistWithThisUsername) {
      throw new BadRequestException('username already exist');
    }

    let profileMedia: any = null;
    if (payload?.profileMediaId) {
      profileMedia = await this._dbService.media.findUnique({
        where: { id: payload.profileMediaId },
      });
      if (!profileMedia) {
        throw new BadRequestException('profile media donot exist');
      }
    }

    // await this._dbService.$transaction(async (prisma) => {
    //   const createdUser = await prisma.user.create({
    //     data: {
    //       firstName: payload.firstName,
    //       lastName: payload.lastName,
    //       gender: payload.gender || null,
    //       email: payload.email,
    //       password: await HashPassword({ plainText: payload.password }),
    //       type: UserType.USER,
    //       username: payload.username,
    //       bio: payload.bio || null,
    //       fullName:
    //         payload.fullName ||
    //         createFullName({
    //           firstName: payload.firstName,
    //           lastName: payload.lastName,
    //         }),
    //     },
    //   });

    //   console.log('createdUser =>', createdUser);
    // });

    return {
      status: true,
      message: 'User has been created successfully',
      data: null,
    };
  }

  async findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // async update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
