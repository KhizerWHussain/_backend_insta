import { BadRequestException, Injectable } from '@nestjs/common';
import { SigninRequestDTO, SignupRequestDTO } from './dto/usermodule.dto';
import DatabaseService from 'src/database/database.service';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { User, UserType } from '@prisma/client';
import { createFullName } from 'src/util/customFunc';
import {
  ComparePassword,
  ExcludeFields,
  HashPassword,
} from 'src/helpers/util.helper';
import AuthService from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    private _dbService: DatabaseService,
    private _authService: AuthService,
  ) {}

  async userSignup(payload: SignupRequestDTO): Promise<APIResponseDTO> {
    // const UserExistWithThisEmail = await this._dbService.user.findUnique({
    //   where: {
    //     email: payload.email,
    //     username: payload.username,
    //     deletedAt: null,
    //   },
    // });

    // if (UserExistWithThisEmail) {
    //   throw new BadRequestException('user with this email already exist');
    // }

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

    const hashedPassword = await HashPassword({ plainText: payload.password });

    const newUser = await this._dbService.$transaction(async (prisma) => {
      const createdUser = await prisma.user.create({
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          gender: payload.gender || null,
          email: payload.email,
          password: hashedPassword,
          type: UserType.USER,
          username: payload.username,
          bio: payload.bio || null,
          fullName:
            payload.fullName ||
            createFullName({
              firstName: payload.firstName,
              lastName: payload.lastName,
            }),
        },
      });

      const findProfileMedia = await prisma.media.findUnique({
        where: { id: payload.profileMediaId, type: 'IMAGE', deletedAt: null },
      });

      if (findProfileMedia) {
        await prisma.media.update({
          where: { id: payload.profileMediaId },
          data: {
            creator: { connect: { id: createdUser.id } },
          },
        });
      }

      return createdUser;
    });

    const token = await this._authService.CreateSession(newUser.id);

    return {
      status: true,
      message: 'User has been created successfully',
      data: token,
    };
  }

  async userSignin(payload: SigninRequestDTO): Promise<APIResponseDTO> {
    const { userNameOrEmail, password } = payload;
    const findUserByUsernameOrEmail = await this._dbService.user.findFirst({
      where: {
        OR: [
          { username: { equals: userNameOrEmail, mode: 'insensitive' } },
          { email: { equals: userNameOrEmail, mode: 'insensitive' } },
        ],
      },
      select: {
        password: true,
        id: true,
      },
    });

    if (!findUserByUsernameOrEmail) {
      throw new BadRequestException('user not found');
    }

    const isPasswordMatched = await ComparePassword({
      hash: findUserByUsernameOrEmail.password,
      plainText: password,
    });

    if (!isPasswordMatched) {
      throw new BadRequestException('invalid credentials');
    }

    const token = await this._authService.CreateSession(
      findUserByUsernameOrEmail.id,
    );

    return {
      status: true,
      message: 'successfully logged in',
      data: token,
    };
  }

  async getCurrentUserData(user: User, headers: any): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
        profile: true,
      },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const userDataWithoutTheseFields = ExcludeFields(findUser, ['password']);

    return {
      status: true,
      message: 'my data found',
      data: userDataWithoutTheseFields,
    };
  }

  async updateUserProfilePolicy(user: User): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    await this._dbService.user.update({
      where: { id: findUser.id },
      data: {
        accountPrivacy:
          findUser.accountPrivacy === 'PRIVATE'
            ? 'PUBLIC'
            : findUser.accountPrivacy === 'PUBLIC'
              ? 'PRIVATE'
              : 'PUBLIC',
        updatedAt: new Date(),
      },
    });

    const userAfterUpdation = await this._dbService.user.findUnique({
      where: { id: findUser.id },
      select: {
        accountPrivacy: true,
      },
    });

    return {
      status: true,
      message: `user account policy is ${userAfterUpdation.accountPrivacy}`,
      data: userAfterUpdation,
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
