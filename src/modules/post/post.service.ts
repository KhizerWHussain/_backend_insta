import { User } from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { APIResponseDTO } from 'src/core/response/response.schema';
import DatabaseService from 'src/database/database.service';

@Injectable()
export class PostService {
  constructor(private _dbService: DatabaseService) {}

  async create(user: User, payload: CreatePostDto): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const mediaExists = await this._dbService.media.findMany({
      where: { id: { in: payload.mediaIds } },
    });

    if (!mediaExists.length || payload.mediaIds.length == 0) {
      throw new BadRequestException('media donot exist');
    }

    if (payload.caption && payload.poll) {
      throw new BadRequestException(
        'Cannot include both caption and poll in a post',
      );
    }

    const createdPost = await this._dbService.$transaction(async (prisma) => {
      const post = await prisma.post.create({
        data: {
          media: payload.mediaIds !== null && {
            connect: payload.mediaIds.map((mediaId: number) => ({
              id: mediaId,
            })),
          },
          creator: { connect: { id: user.id } },
          caption: payload.poll ? null : payload.caption || null,
          audience: payload.audience || 'EVERYONE',
          location: payload.location || null,
        },
      });

      if (payload.poll) {
        await prisma.poll.create({
          data: {
            question: payload.poll.question,
            options: payload.poll.options,
            post: { connect: { id: post.id } },
            pollCreator: { connect: { id: user.id } },
          },
        });
      }

      return post;
    });

    return {
      status: true,
      message: 'Post created successfully',
      data: createdPost,
    };
  }

  async deletePost(user: User, postId: number): Promise<APIResponseDTO> {
    const findPostFirst = await this._dbService.post.findUnique({
      where: { id: postId, creatorId: user.id },
    });

    if (!findPostFirst) {
      throw new BadRequestException('post not found or is not your');
    }

    const postDeletionSuccessfull = await this.deletingPostRelatedData(postId);

    if (postDeletionSuccessfull) {
      await this._dbService.post.delete({
        where: { id: postId, deletedAt: null, creatorId: user.id },
      });
    }

    return {
      status: true,
      message: 'post deleted successfully',
      data: null,
    };
  }

  async findAll(user: User): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const findAllPosts = await this._dbService.post.findMany({
      where: { creatorId: user.id, deletedAt: null, feedType: 'ONFEED' },
      select: {
        id: true,
        _count: {
          select: {
            poll: true,
            savedPosts: true,
          },
        },
        location: true,
        createdAt: true,
        updatedAt: true,
        caption: true,
        media: {
          select: {
            driveId: true,
            id: true,
            type: true,
            meta: true,
            extension: true,
            path: true,
            postId: true,
          },
        },
        likedByCreator: true,
        poll: true,
      },
    });

    return {
      status: true,
      message: 'posts found',
      data: findAllPosts,
    };
  }

  async updatePost(
    user: User,
    postId: number,
    payload: UpdatePostDto,
  ): Promise<APIResponseDTO> {
    const findPost = await this._dbService.post.findUnique({
      where: { id: postId, creatorId: user.id, deletedAt: null },
      include: {
        media: true,
      },
    });

    if (!findPost) {
      throw new BadRequestException('post donot exist or is not yours');
    }

    const existingMediaIds = findPost.media.map((media) => media.id);
    const newMediaIds = payload.mediaIds.length ? payload.mediaIds : [];
    const mediaIdsToRemove = existingMediaIds.filter(
      (id) => !newMediaIds.includes(id),
    );
    const mediaIdsToAdd = newMediaIds.filter(
      (id) => !existingMediaIds.includes(id),
    );

    await this._dbService.$transaction(async (prisma) => {
      if (mediaIdsToRemove.length > 0) {
        await prisma.media.deleteMany({
          where: { id: { in: mediaIdsToRemove }, postId },
        });
      }

      if (mediaIdsToAdd.length > 0) {
        await prisma.post.update({
          where: { id: postId },
          data: {
            media: {
              connect: mediaIdsToAdd.map((mediaId) => ({ id: mediaId })),
            },
          },
        });
      }

      await prisma.post.update({
        where: { id: findPost.id },
        data: {
          audience: payload.audience || findPost.audience,
          caption: payload.caption || findPost.caption,
          feedType: payload.feedType || findPost.feedType,
          likedByCreator: false,
          location: payload.location || findPost.location,
          updatedAt: new Date(),
        },
      });
    });

    return {
      status: true,
      message: 'post has been updated successfully',
      data: findPost,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  // update(id: number, updatePostDto: UpdatePostDto) {
  //   return `This action updates a #${id} post`;
  // }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }

  private async deletingPostRelatedData(postId: number) {
    return await this._dbService.$transaction(async (prisma) => {
      await prisma.media.deleteMany({
        where: { postId: postId, deletedAt: null },
      });

      await prisma.poll.deleteMany({
        where: { postId: postId },
      });

      await prisma.savedPost.deleteMany({
        where: { postId: postId },
      });

      return true;
    });
  }
}
