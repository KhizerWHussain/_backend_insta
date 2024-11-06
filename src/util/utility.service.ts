import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as moment from 'moment';
import DatabaseService from 'src/database/database.service';

@Injectable()
export class UtilityService {
  constructor(private readonly _dbService: DatabaseService) {}

  async createExpiryTime({ time = 24, lap = 'hour' }: expiryTimeProp = {}) {
    // return moment().add(time, lap).milliseconds(); // 24 hours from now
    return moment.duration(time, lap).asSeconds();
  }

  async checkPostExistOrNot(postId: number, customError?: string) {
    const findPost = await this._dbService.post.findUnique({
      where: { id: postId, deletedAt: null, feedType: 'ONFEED' },
    });
    if (!findPost) {
      throw new NotFoundException(customError || 'post does not exist');
    }
    return findPost;
  }

  async CheckCommentOnPostExistOrNot(commentId: number, postId: number) {
    const commentFound = await this._dbService.commentPost.findUnique({
      where: { id: commentId, postId, deletedAt: null },
      include: { replies: true, _count: true },
    });
    if (!commentFound) {
      throw new NotFoundException('Comment not found.');
    }
    return commentFound;
  }

  async checkUserExistOrNot({
    userId,
    errorMessage,
    whereConditon,
  }: UserExistOrNotTypes) {
    const findUser = await this._dbService.user.findUnique({
      where: { id: userId, deletedAt: null, ...whereConditon },
      include: {
        profile: true,
        webLink: true,
      },
    });
    if (!findUser) {
      throw new BadRequestException(errorMessage || 'user does not exist');
    }
    return findUser;
  }

  async checkMultipleUsersExistOrNot(userIds: number[], whereCondtion?: any) {
    const users = await this._dbService.user.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
        ...whereCondtion,
      },
    });
    if (users.length !== userIds.length) {
      throw new NotFoundException('one or more users does not exist');
    }
    return users;
  }

  async filterUsersWhoAreNotActive(userIds: number[]) {
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

  async findUsersWhomIAmFollowing({ user }: findUserWhomIFollowProp) {
    const findUsersWhomIAmFollowing = await this._dbService.user.findMany({
      where: {
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

  async getBlockedUsers(userId: number) {
    const usersYouBlocked = await this._dbService.blockedUser.findMany({
      where: {
        blockerId: userId,
        deletedAt: null,
        userBeingBlocked: { activeStatus: 'ACTIVE' },
      },
      select: {
        id: true,
        userBeingBlocked: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            profile: {
              select: {
                path: true,
                id: true,
              },
            },
          },
        },
      },
    });

    const formattedUsers = usersYouBlocked.map(
      (block) => block.userBeingBlocked,
    );

    return formattedUsers;
  }

  async getMyBlockedUserIds(userId: number): Promise<number[]> {
    const blockUsers = await this.getBlockedUsers(userId);
    const ids = blockUsers.map((user) => user.id);
    return ids;
  }

  async getUserWhoBlockedMe(userId: number) {
    const usersWhoBlockedYou = await this._dbService.blockedUser.findMany({
      where: {
        userBeingBlockedId: userId,
        deletedAt: null,
        blocker: { activeStatus: 'ACTIVE' },
      },
      select: {
        id: true,
        blocker: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profile: {
              select: {
                id: true,
                path: true,
              },
            },
          },
        },
      },
    });

    const formattedUsers = usersWhoBlockedYou.map((block) => block.blocker);

    return formattedUsers;
  }

  async getUserWhoBlockMeIds(userId: number): Promise<number[]> {
    const blockedMeUsers = await this.getUserWhoBlockedMe(userId);
    const ids = blockedMeUsers.map((user) => user.id);
    return ids;
  }

  async findBlockOnBothSides(myId: number, userId: number) {
    const blockOnBothSides = await this._dbService.blockedUser.findFirst({
      where: {
        OR: [
          { userBeingBlockedId: myId, blockerId: userId },
          { userBeingBlockedId: userId, blockerId: myId },
        ],
        deletedAt: null,
      },
    });
    return blockOnBothSides;
  }

  async checkMediaExistByMediaId(
    mediaId: number,
    whereCondition?: any,
    errorMessage?: string,
  ) {
    const mediaExist = await this._dbService.media.findMany({
      where: {
        id: mediaId,
        deletedAt: null,
        ...whereCondition,
      },
    });
    if (!mediaExist.length) {
      throw new BadRequestException(errorMessage || 'media does not exist');
    }
    return mediaExist;
  }

  async findFirstMedia(
    mediaId: number,
    whereCondition?: any,
    errorMessage?: string,
  ) {
    const mediaExist = await this._dbService.media.findFirst({
      where: {
        id: mediaId,
        deletedAt: null,
        ...whereCondition,
      },
    });
    if (!mediaExist) {
      throw new BadRequestException(errorMessage || 'media does not exist');
    }
    return mediaExist;
  }

  async findUserNote(
    userId: number,
    { throwErrorIfNotFound = false } = {},
  ): Promise<any> {
    const note = await this._dbService.notes.findFirst({
      where: { creatorId: userId, deletedAt: null },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        creatorId: true,
        noteImageMedia: {
          select: {
            id: true,
            name: true,
            size: true,
            path: true,
          },
        },
        noteMusic: {
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
    if (!note && throwErrorIfNotFound === true) {
      throw new NotFoundException('user note not found');
    }
    return note;
  }

  async deletePost(postId: number, { whereCondition }) {
    await this._dbService.post.delete({
      where: { id: postId, ...whereCondition },
    });
  }

  async deleteFirst(
    model: any, // The Prisma model to query (e.g., this._db.user)
    whereCondition: object,
  ) {
    const entry = await model.findFirst({
      where: whereCondition,
    });
    if (entry) {
      const deletedEntry = await model.delete({
        where: { id: entry.id },
      });
      return true;
    }
    return false;
  }

  async deleteLast(
    model: any, // The Prisma model to query (e.g., this._db.user)
    whereCondition: object, // The condition to find the entry
  ) {
    const entry = await model.findFirst({
      where: whereCondition,
      orderBy: { id: 'desc' }, // Order by 'id' in descending order to get the last entry
    });

    // If an entry is found, delete it
    if (entry) {
      await model.delete({
        where: { id: entry.id },
      });
      return true;
    }

    return false;
  }

  async findUserFcm(userId: number): Promise<string> {
    const userDevice = await this._dbService.device.findFirst({
      where: { userId: userId, deletedAt: null, fcmToken: { not: null } },
      select: {
        fcmToken: true,
      },
    });
    if (!userDevice) {
      return null;
    }
    return userDevice.fcmToken;
  }

  async findUsersFcm(userId: number[]) {
    const userDevices = await this._dbService.device.findMany({
      where: { userId: { in: userId }, deletedAt: null },
      select: {
        fcmToken: true,
      },
    });
    if (userId.length !== userDevices.length) {
      // throw new NotFoundException('one or more user does not have fcm Token');
      console.error('one or more user does not have fcm Token');
    }
    const devicesWithFcmTokens = userDevices
      .filter((device) => device.fcmToken)
      .map((device) => device.fcmToken);

    return devicesWithFcmTokens;
  }

  async extractHashtags(text: string, regex?: any): Promise<string[]> {
    const hashtagRegex = regex || /#[\w]+/g;
    const hashtags = text.match(hashtagRegex) || [];

    // Normalize Hashtags (remove # and convert to lowercase)
    const normalizedHashtags = hashtags.map((tag: string) =>
      tag.slice(1).toLowerCase(),
    );

    return normalizedHashtags;
  }

  async findChatById(chatId: number, whereCondition?: any) {
    const chat = await this._dbService.chat.findUnique({
      where: { id: chatId, deletedAt: null, ...whereCondition },
    });
    if (!chat) {
      throw new NotFoundException('chat does not exist');
    }
    return chat;
  }

  async getPostTaggedUsersIds(postId: number, userIds: number[]) {
    const taggedPosts = await this._dbService.taggedPost.findMany({
      where: { postId: postId, taggedUserId: { in: userIds } },
      select: { id: true },
    });
    const taggedPostIds = taggedPosts.map((tagPost) => tagPost.id);
    return taggedPostIds;
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

interface expiryTimeProp {
  time?: number;
  // lap?: 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';
  lap?: moment.unitOfTime.DurationConstructor;
}
