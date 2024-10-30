import { BadRequestException, Injectable } from '@nestjs/common';
import { SigninRequestDTO, SignupRequestDTO } from './dto/usermodule.dto';
import DatabaseService from 'src/database/database.service';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { RequestStatus, User, UserType } from '@prisma/client';
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

      if (!findProfileMedia) {
        throw new BadRequestException('profile media does not exist');
      }

      if (findProfileMedia?.creatorId) {
        throw new BadRequestException(
          'this media is already associated with other user',
        );
      }

      if (findProfileMedia) {
        await prisma.media.update({
          where: { id: payload.profileMediaId },
          data: {
            // creator: { connect: { id: createdUser.id } },
            creatorId: createdUser.id,
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

  async getMainPostListingTimeline(user: User): Promise<APIResponseDTO> {
    await this.checkUserExistOrNot({ userId: user.id });

    const followingIds = await this._dbService.userFollow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });

    const userAndFollowingIds = [
      user.id,
      ...followingIds.map((f) => f.followingId),
    ];

    // Posts from followed users + own posts
    const timelinePosts = await this._dbService.post.findMany({
      where: {
        creatorId: { in: userAndFollowingIds },
        deletedAt: null,
        feedType: 'ONFEED',
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profile: {
              select: {
                id: true,
                name: true,
                driveId: true,
                path: true,
                extension: true,
                size: true,
                meta: true,
              },
            },
            email: true,
          },
        },
        poll: true,
        media: {
          select: {
            id: true,
            name: true,
            driveId: true,
            path: true,
            extension: true,
            size: true,
            meta: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      status: true,
      message: 'post listing timeline found',
      data: timelinePosts,
    };
  }

  async sendFollowRequest(
    user: User,
    recieverId: number,
  ): Promise<APIResponseDTO> {
    await this.checkUserExistOrNot({ userId: user.id });
    await this.checkUserExistOrNot({
      userId: recieverId,
      errorMessage: 'requested user donot exist',
    });

    if (user.id === recieverId) {
      throw new BadRequestException(
        'You cannot send a follow request to yourself',
      );
    }

    const existingRequest = await this._dbService.followRequest.findFirst({
      where: {
        requesterId: user.id,
        receiverId: recieverId,
        deletedAt: null,
        status: 'PENDING',
      },
    });
    if (existingRequest) {
      await this._dbService.followRequest.deleteMany({
        where: {
          requesterId: user.id,
          receiverId: recieverId,
          deletedAt: null,
          status: 'PENDING',
        },
      });
      return {
        status: true,
        message: 'follow request has been unsent',
        data: null,
      };
    }

    await this._dbService.followRequest.create({
      data: {
        requesterId: user.id,
        receiverId: recieverId,
      },
    });

    return {
      status: true,
      message: 'follow request has been sent',
      data: null,
    };
  }

  async acceptFollowRequest(
    user: User,
    requestId: number,
  ): Promise<APIResponseDTO> {
    const request = await this._dbService.followRequest.findUnique({
      where: { id: requestId, receiverId: user.id, deletedAt: null },
    });

    if (!request) {
      throw new BadRequestException('request donot exist');
    }

    this.checkUserExistOrNot({ userId: user.id });

    const result = await this._dbService.$transaction(async (prisma) => {
      await prisma.followRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: RequestStatus.ACCEPTED,
        },
      });
      await prisma.followRequest.delete({
        where: {
          id: requestId,
        },
      });
      const createFollower = await prisma.userFollow.create({
        data: {
          follower: { connect: { id: request.requesterId } },
          following: { connect: { id: user.id } },
        },
      });
      return createFollower;
    });

    return {
      status: true,
      message: 'Follow request accepted',
      data: result,
    };
  }

  async declineFollowRequest(
    user: User,
    requestId: number,
  ): Promise<APIResponseDTO> {
    const request = await this._dbService.followRequest.findUnique({
      where: { id: requestId, receiverId: user.id, deletedAt: null },
    });

    if (!request) {
      throw new BadRequestException('Follow request does not exist');
    }

    await this._dbService.$transaction(async (prisma) => {
      await prisma.followRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: RequestStatus.DECLINED,
        },
      });
      await prisma.followRequest.delete({
        where: {
          id: requestId,
        },
      });
    });

    return {
      status: true,
      message: 'Follow request declined',
      data: null,
    };
  }

  async unfollowUser(
    user: User,
    unfollowUserId: number,
  ): Promise<APIResponseDTO> {
    await this.checkUserExistOrNot({ userId: unfollowUserId });

    if (user.id === unfollowUserId) {
      throw new BadRequestException('you cannot unfollow yourself');
    }

    // Find the follow relationship between the users
    const followRelation = await this._dbService.userFollow.findFirst({
      where: {
        followerId: user.id, // The user who wants to unfollow
        followingId: unfollowUserId, // The user to be unfollowed
      },
    });

    if (!followRelation) {
      throw new BadRequestException('You are not following this user');
    }

    await this._dbService.$transaction(async (prisma) => {
      await prisma.userFollow.deleteMany({
        where: { id: followRelation.id },
      });
    });

    return {
      status: true,
      message: 'Unfollowed successfully',
      data: null,
    };
  }

  async getFollowersList(userId: number): Promise<APIResponseDTO> {
    await this.checkUserExistOrNot({ userId });

    const findYourFollowers = await this._dbService.userFollow.findMany({
      where: { followingId: userId, deletedAt: null },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            bio: true,
            profile: {
              select: {
                id: true,
                driveId: true,
                path: true,
                extension: true,
                size: true,
                name: true,
                meta: true,
              },
            },
          },
        },
      },
    });

    return {
      status: true,
      message: 'user followers list found',
      data: findYourFollowers,
    };
  }

  async getFollowingUsersList(userId: number): Promise<APIResponseDTO> {
    await this.checkUserExistOrNot({ userId });

    const findUserWhomYouAreFollowing =
      await this._dbService.userFollow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              fullName: true,
              bio: true,
              profile: {
                select: {
                  id: true,
                  driveId: true,
                  path: true,
                  extension: true,
                  size: true,
                  name: true,
                  meta: true,
                },
              },
            },
          },
        },
      });

    return {
      status: true,
      message: 'followed by users list found',
      data: findUserWhomYouAreFollowing,
    };
  }

  async checkUserExistOrNot({
    userId,
    errorMessage,
    whereConditon,
  }: UserExistOrNotTypes) {
    const findUser = await this._dbService.user.findUnique({
      where: { id: userId, deletedAt: null, ...whereConditon },
    });

    if (!findUser) {
      throw new BadRequestException(errorMessage || 'user donot exist');
    }

    return findUser;
  }

  async findUsersWhomIAmFollowing({ user }: findUserWhomIFollowProp) {
    const findUsersWhomIAmFollowing = await this._dbService.user.findMany({
      where: {
        // following: {
        //   some: { id: user.id },
        // },
        following: {
          some: {
            followerId: user.id,
          },
        },
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            stories: true,
          },
        },
        stories: true,
        profile: {
          select: {
            id: true,
            driveId: true,
            path: true,
            extension: true,
            size: true,
            name: true,
            meta: true,
          },
        },
      },
    });
    const userWhomIFollowIds = findUsersWhomIAmFollowing.map((user) => user.id);

    return {
      userWhomIFollowIds,
      findUsersWhomIAmFollowing,
    };
  }

  async deActivateUser(user: User): Promise<APIResponseDTO> {
    const findUser = await this.checkUserExistOrNot({ userId: user.id });

    if (findUser.activeStatus !== 'ACTIVE') {
      await this._dbService.user.update({
        where: { id: findUser.id },
        data: {
          activeStatus: 'ACTIVE',
        },
      });
      return {
        status: true,
        message: 'activated successfully',
        data: null,
      };
    }

    await this._dbService.user.update({
      where: { id: findUser.id },
      data: {
        activeStatus: 'DEACTIVATED',
      },
    });

    return {
      status: true,
      message: 'deactivated successfully',
      data: null,
    };
  }

  async exploreTimeline(user: User): Promise<APIResponseDTO> {
    const { userWhomIFollowIds } = await this.findUsersWhomIAmFollowing({
      user,
    });
    const { findUsersIds } =
      await this.filterUsersWhoAreNotActive(userWhomIFollowIds);

    const timelinePosts = await this._dbService.post.findMany({
      where: {
        creatorId: { in: findUsersIds },
        deletedAt: null,
        feedType: 'ONFEED',
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profile: {
              select: {
                id: true,
                name: true,
                driveId: true,
                path: true,
                extension: true,
                size: true,
                meta: true,
              },
            },
            email: true,
          },
        },
        poll: true,
        media: {
          select: {
            id: true,
            name: true,
            driveId: true,
            path: true,
            extension: true,
            size: true,
            meta: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const timelineReels = await this._dbService.reel.findMany({
      where: {
        creatorId: { in: findUsersIds },
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profile: {
              select: {
                id: true,
                name: true,
                driveId: true,
                path: true,
                extension: true,
                size: true,
                meta: true,
              },
            },
            email: true,
          },
        },
        music: {
          select: {
            id: true,
            name: true,
            driveId: true,
            path: true,
            extension: true,
            size: true,
            meta: true,
            type: true,
          },
        },
        media: {
          select: {
            id: true,
            name: true,
            driveId: true,
            path: true,
            extension: true,
            size: true,
            meta: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const combinedTimeline = [
      ...timelinePosts.map((post) => ({
        ...post,
        type: 'POST',
      })),
      ...timelineReels.map((reel) => ({
        ...reel,
        type: 'REEL',
      })),
    ];

    // combinedTimeline.sort((a, b) => {
    //   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    // });

    return {
      status: true,
      message: 'explore timeline found',
      data: combinedTimeline,
    };
  }

  private async filterUsersWhoAreNotActive(userIds: number[]) {
    const findUsers = await this._dbService.user.findMany({
      where: {
        id: { in: userIds },
        activeStatus: 'ACTIVE',
        deletedAt: null,
      },
    });
    const findUsersIds = findUsers.map((user) => user.id);

    return {
      findUsersIds,
      findUsers,
    };
  }
}

interface UserExistOrNotTypes {
  userId: number;
  errorMessage?: string;
  whereConditon?: any;
}

interface findUserWhomIFollowProp {
  user: User;
}
