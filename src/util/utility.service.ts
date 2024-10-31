import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import DatabaseService from 'src/database/database.service';

@Injectable()
export class UtilityService {
  constructor(private readonly _dbService: DatabaseService) {}

  async checkPostExistOrNot(postId: number) {
    const findPost = await this._dbService.post.findUnique({
      where: { id: postId, deletedAt: null, feedType: 'ONFEED' },
    });
    if (!findPost) {
      throw new NotFoundException('post does not exist');
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
        profileMusic: true,
      },
    });
    if (!findUser) {
      throw new BadRequestException(errorMessage || 'user does not exist');
    }
    return findUser;
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
}

interface UserExistOrNotTypes {
  userId: number;
  errorMessage?: string;
  whereConditon?: any;
}

interface findUserWhomIFollowProp {
  user: User;
}
