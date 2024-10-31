import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import UpdateMyProfileDto, {
  createNoteDto,
  SigninRequestDTO,
  SignupRequestDTO,
} from './dto/usermodule.dto';
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
import { UtilityService } from 'src/util/utility.service';

@Injectable()
export class UserService {
  constructor(
    private readonly _dbService: DatabaseService,
    private readonly _authService: AuthService,
    private readonly _util: UtilityService,
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

  async editProfile(
    user: User,
    payload: UpdateMyProfileDto,
  ): Promise<APIResponseDTO> {
    if (payload.profileMediaId) {
      var ProfileMedia = await this._util.checkMediaExistByMediaId(
        payload.profileMediaId,
        { type: 'IMAGE' },
      );
    }

    if (payload.noteMusicId) {
      var MusicMedia = await this._util.findFirstMedia(
        payload.noteMusicId,
        { type: 'AUDIO' },
        'notes does not exist',
      );
    }

    if (payload.noteImageId) {
      var NoteImage = await this._util.findFirstMedia(payload.noteImageId);
    }

    if (payload.username) {
      const userWithThisUsernameCount = await this._dbService.user.count({
        where: { username: payload.username, NOT: { id: user.id } },
      });
      if (userWithThisUsernameCount > 0) {
        throw new BadRequestException(
          'user with this username already exist, choose another',
        );
      }
    }

    const checkUser = await this._util.checkUserExistOrNot({ userId: user.id });

    await this._dbService.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: payload.fullName || checkUser.fullName,
          username: payload.username || checkUser.username,
          bio: payload.bio || checkUser.bio,
          gender: payload.gender || checkUser.gender,
          pronouns: payload.pronouns || checkUser.pronouns,
        },
      });

      if (
        payload.profileMediaId &&
        ProfileMedia &&
        ProfileMedia[0]?.creatorId === user.id
      ) {
        await prisma.media.update({
          where: { id: payload.profileMediaId },
          data: {
            creatorId: user.id,
          },
        });
      }

      await prisma.notes.upsert({
        where: { creatorId: user.id },
        create: {
          noteMusicId: MusicMedia?.id,
          noteImageMediaId: NoteImage?.id,
          creatorId: user.id,
        },
        update: {
          noteMusicId: MusicMedia?.id,
          noteImageMediaId: NoteImage?.id,
        },
      });

      if (payload.webLink) {
        await prisma.webLink.upsert({
          where: { creatorId: user.id },
          create: {
            title: payload.webLink.title,
            url: payload.webLink.url,
            creatorId: user.id,
          },
          update: {
            title: payload.webLink.title,
            url: payload.webLink.url,
          },
        });
      }
    });

    return {
      status: true,
      message: 'profile updated successfully',
      data: null,
    };
  }

  async getMainPostListingTimeline(user: User): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId: user.id });

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

  async getFollowersList(userId: number): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId });

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
    await this._util.checkUserExistOrNot({ userId });

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

  async deActivateUser(user: User): Promise<APIResponseDTO> {
    const findUser = await this._util.checkUserExistOrNot({ userId: user.id });

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

  async getOtherUser(user: User, findUserId: number): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: findUserId, deletedAt: null, activeStatus: 'ACTIVE' },
      select: {
        id: true,
        fullName: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
        bio: true,
        accountPrivacy: true,
        email: true,
        username: true,
        gender: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            driveId: true,
            name: true,
            path: true,
            meta: true,
            extension: true,
            size: true,
          },
        },
      },
    });

    if (!findUser) {
      throw new NotFoundException('user does not exist');
    }

    const isIFollowingUser = await this._dbService.userFollow.findFirst({
      where: {
        followerId: user.id,
        followingId: findUserId,
      },
    });

    const isUserFollowingMe = await this._dbService.userFollow.findFirst({
      where: {
        followerId: findUserId,
        followingId: user.id,
      },
    });

    if (user.id === findUserId) {
      throw new BadRequestException('cannot search for yourselve');
    }

    return {
      status: true,
      message: 'user data found',
      data: {
        ...findUser,
        iAmFollowingUser: !!isIFollowingUser, // True if current user is following the target user
        userIsFollowingMe: !!isUserFollowingMe, // True if target user is following the current user
      },
    };
  }

  async getPostOfOtherUser(
    user: User,
    otherUserId: number,
  ): Promise<APIResponseDTO> {
    const otherUser = await this._util.checkUserExistOrNot({
      userId: otherUserId,
      whereConditon: { activeStatus: 'ACTIVE' },
    });

    if (otherUser.id === user.id) {
      throw new BadRequestException('you cannot search for youself');
    }

    console.log('otherUser ==>', otherUser.fullName);

    if (otherUser.accountPrivacy === 'PRIVATE') {
      // Check if the otherUser is following the current user
      const isOtherUserFollowingMe = await this._dbService.userFollow.findFirst(
        {
          where: {
            followerId: otherUserId, // otherUser must follow the current user
            followingId: user.id,
          },
        },
      );

      // If the otherUser is not following the current user, deny access
      if (!isOtherUserFollowingMe) {
        return {
          status: false,
          message:
            'This user has a private account and is not following you. You cannot view their posts.',
          data: null,
        };
      }
    }

    // Get posts based on the post visibility settings
    const posts = await this._dbService.post.findMany({
      where: {
        creatorId: otherUserId,
        deletedAt: null,
        OR: [
          {
            audience: 'EVERYONE', // Posts visible to everyone
          },
          {
            audience: 'FRIENDS', // Posts visible to friends only if otherUser follows the current user
            creator: {
              followers: {
                some: {
                  followerId: user.id, // Check if otherUser is following the current user
                },
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                id: true,
                name: true,
                path: true,
                driveId: true,
                extension: true,
                size: true,
              },
            },
            email: true,
          },
        },
        media: {
          select: {
            id: true,
            name: true,
            path: true,
            driveId: true,
            extension: true,
            size: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    return {
      status: true,
      message: 'Posts of other user found',
      data: posts,
    };
  }

  async exploreTimeline(user: User): Promise<APIResponseDTO> {
    const { userWhomIFollowIds } = await this._util.findUsersWhomIAmFollowing({
      user,
    });
    const { findUsersIds } =
      await this._util.filterUsersWhoAreNotActive(userWhomIFollowIds);

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

  async blockUser(user: User, blockUserId: number): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId: blockUserId });

    const userAlreadyBlocked = await this._dbService.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: user.id, userBeingBlockedId: blockUserId },
          { blockerId: blockUserId, userBeingBlockedId: user.id },
        ],
        deletedAt: null,
      },
    });

    if (userAlreadyBlocked) {
      throw new BadRequestException('User already blocked.');
    }

    const followRequest = await this._dbService.followRequest.findFirst({
      where: { requesterId: blockUserId, receiverId: user.id },
      select: { id: true },
    });

    const result = await this._dbService.$transaction(async (prisma) => {
      if (followRequest) {
        await prisma.followRequest.update({
          where: { id: followRequest.id },
          data: { status: RequestStatus.DECLINED, deletedAt: new Date() },
        });
      }

      await prisma.userFollow.deleteMany({
        where: {
          OR: [
            { followerId: user.id, followingId: blockUserId },
            { followerId: blockUserId, followingId: user.id },
          ],
        },
      });

      const blockUser = await prisma.blockedUser.create({
        data: {
          blocker: { connect: { id: user.id } },
          userBeingBlocked: { connect: { id: blockUserId } },
        },
        include: {
          blocker: true,
          userBeingBlocked: true,
        },
      });

      return blockUser;
    });

    return {
      status: true,
      message: 'user has been blocked',
      data: result,
    };
  }

  async unblockUser(user: User, blockUserId: number): Promise<APIResponseDTO> {
    const blockExist = await this._dbService.blockedUser.findFirst({
      where: {
        blockerId: user.id,
        userBeingBlockedId: blockUserId,
        deletedAt: null,
      },
    });

    if (!blockExist) {
      throw new BadRequestException('User not blocked');
    }

    await this._dbService.blockedUser.delete({
      where: { id: blockExist.id },
    });
    return {
      status: true,
      message: 'User unblocked',
      data: null,
    };
  }

  async createNote(
    userId: number,
    payload: createNoteDto,
  ): Promise<APIResponseDTO> {
    const NoteMuic = await this._util.findFirstMedia(
      payload.noteMusicId,
      { type: 'AUDIO' },
      'notes does not exist',
    );
    const NoteImage = await this._util.findFirstMedia(payload.noteImageId);

    const note = await this._dbService.notes.upsert({
      where: { creatorId: userId },
      create: {
        noteMusic: { connect: { id: NoteMuic.id } },
        noteImageMedia: { connect: { id: NoteImage.id } },
        creator: { connect: { id: userId } },
      },
      update: {},
    });

    return {
      status: true,
      message: note
        ? 'Note already existed, no new note created.'
        : 'Note created successfully',
      data: note,
    };
  }

  async getNotesFeed(user: User): Promise<APIResponseDTO> {
    const { userWhomIFollowIds } = await this._util.findUsersWhomIAmFollowing({
      user,
    });

    const allIds: number[] = [user.id, ...userWhomIFollowIds];

    const findFeedNotes = await this._dbService.notes.findMany({
      where: {
        creatorId: {
          in: allIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            pronouns: true,
            profile: {
              select: {
                id: true,
                name: true,
                size: true,
                path: true,
              },
            },
          },
        },
        noteMusic: {
          select: {
            id: true,
            name: true,
            size: true,
            path: true,
          },
        },
        noteImageMedia: {
          select: {
            id: true,
            name: true,
            size: true,
            path: true,
          },
        },
      },
    });

    return {
      status: true,
      message: 'notes found',
      data: findFeedNotes,
    };
  }

  async getReelsOnFeed(user: User): Promise<APIResponseDTO> {
    const { userWhomIFollowIds } = await this._util.findUsersWhomIAmFollowing({
      user,
    });

    const allIds: number[] = [user.id, ...userWhomIFollowIds];

    const findAllReels = await this._dbService.reel.findMany({
      where: {
        creatorId: {
          in: allIds,
        },
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
                path: true,
                size: true,
              },
            },
          },
        },
        media: {
          select: {
            id: true,
            name: true,
            path: true,
            size: true,
          },
        },
        music: {
          select: {
            id: true,
            name: true,
            path: true,
            size: true,
            type: true,
          },
        },
      },
    });

    return {
      status: true,
      message: 'notes found',
      data: findAllReels,
    };
  }
}
