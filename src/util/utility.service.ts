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
}

interface UserExistOrNotTypes {
  userId: number;
  errorMessage?: string;
  whereConditon?: any;
}

interface findUserWhomIFollowProp {
  user: User;
}
