import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { APIResponseDTO } from 'src/core/response/response.schema';
import DatabaseService from 'src/database/database.service';
import { UtilityService } from 'src/util/utility.service';

@Injectable()
export class ActivityService {
  constructor(
    private readonly _db: DatabaseService,
    private readonly _util: UtilityService,
  ) {}

  async getPostsILiked(user: User): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId: user.id });

    const likedPosts = await this._db.likePost.findMany({
      where: {
        likedByUserId: user.id,
        deletedAt: null,
      },
      select: {
        postId: true,
      },
    });
    const likedPostIds = likedPosts.map((post) => post.postId);

    const findAllPostILiked = await this._db.post.findMany({
      where: {
        id: { in: likedPostIds },
        deletedAt: null,
        feedType: 'ONFEED',
        creator: { activeStatus: 'ACTIVE' },
      },
      select: {
        id: true,
        caption: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            bio: true,
            username: true,
            email: true,
            profile: {
              select: {
                id: true,
                driveId: true,
                path: true,
                meta: true,
                name: true,
                size: true,
                extension: true,
                type: true,
              },
            },
          },
        },
        media: {
          select: {
            id: true,
            driveId: true,
            path: true,
            meta: true,
            name: true,
            size: true,
            extension: true,
            type: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            poll: true,
            taggedUsers: true,
          },
        },
        poll: true,
        location: true,
        music: {
          select: {
            id: true,
            driveId: true,
            path: true,
            meta: true,
            name: true,
            size: true,
            extension: true,
            type: true,
          },
        },
      },
    });

    return {
      status: true,
      message: 'Liked posts found',
      data: findAllPostILiked,
    };
  }

  async getPostsICommentedOn(user: User): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId: user.id });

    // Find all post IDs where the user has commented
    const commentedPosts = await this._db.commentPost.findMany({
      where: {
        commentatorId: user.id,
        deletedAt: null,
      },
      select: {
        postId: true,
        parentCommentId: true,
        id: true,
      },
      distinct: ['postId'],
    });

    const commentedPostIds = commentedPosts.map((comment) => comment.postId);

    // Fetch posts where the user has commented
    const findAllPostsICommentedOn = await this._db.post.findMany({
      where: {
        id: { in: commentedPostIds },
        deletedAt: null,
        feedType: 'ONFEED',
        creator: { activeStatus: 'ACTIVE' },
      },
      select: {
        id: true,
        caption: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                id: true,
                driveId: true,
                path: true,
              },
            },
          },
        },
        media: {
          select: {
            id: true,
            driveId: true,
            path: true,
            name: true,
            type: true,
          },
        },
        location: true,
        music: {
          select: {
            id: true,
            driveId: true,
            path: true,
            meta: true,
            name: true,
            size: true,
            extension: true,
            type: true,
          },
        },
        comments: {
          where: {
            commentatorId: user.id,
            deletedAt: null,
          },
          select: {
            id: true,
            comment: true,
            createdAt: true,
            parentCommentId: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1, // Take the top-most parent comment
        },
      },
    });

    return {
      status: true,
      message: 'posts in which i have commented found',
      data: findAllPostsICommentedOn,
    };
  }
}
