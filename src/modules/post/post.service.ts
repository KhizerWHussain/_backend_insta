import { User } from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreatePostDto,
  createSavedPostFolderDto,
  savedPostDTO,
  UpdatePostDto,
  UpdatePostFeedTypeDto,
} from './dto/post.dto';
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

    if (payload?.userIds && payload?.userIds?.length) {
      const findMultipleUsers = await this._dbService.user.findMany({
        where: { id: { in: payload.userIds } },
      });
      if (findMultipleUsers.length !== payload.userIds.length) {
        throw new BadRequestException(
          'one or more users do not exist to be tagged',
        );
      }
      const searchTaggedUserIsNotPostCreator = payload.userIds.includes(
        user.id,
      );
      if (searchTaggedUserIsNotPostCreator) {
        throw new BadRequestException('you cannot tagg yourself in a post');
      }
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

      if (payload?.userIds && payload?.userIds?.length) {
        const taggedData = payload.userIds.map((userId) => ({
          taggedUserId: userId,
          postId: post.id,
        }));

        await prisma.taggedPost.createMany({
          data: taggedData,
          skipDuplicates: true, // Optional: avoids error if a tag already exists for the same user-post pair
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
        // taggedUsers: {
        //   select: {
        //     createdAt: true,
        //     id: true,
        //     taggedUser: {
        //       select: {
        //         fullName: true,
        //         id: true,
        //         username: true,
        //         profile: {
        //           select: {
        //             id: true,
        //             driveId: true,
        //             extension: true,
        //             size: true,
        //             path: true,
        //             meta: true,
        //             name: true,
        //           },
        //         },
        //       },
        //     },
        //   },
        // },
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

  async updatePostFeedType(
    user: User,
    payload: UpdatePostFeedTypeDto,
  ): Promise<APIResponseDTO> {
    const { feedType, postId } = payload;

    const findPost = await this._dbService.post.findUnique({
      where: { id: postId, creatorId: user.id, deletedAt: null },
    });

    if (!findPost) {
      throw new BadRequestException('post donot exist or is not yours');
    }

    await this._dbService.$transaction(async (prisma) => {
      await prisma.post.update({
        where: { id: findPost.id },
        data: {
          feedType: feedType,
          updatedAt: new Date(),
        },
      });
    });

    return {
      status: true,
      message: 'post feedType updated successfull',
      data: null,
    };
  }

  async getAllMyArchivedPosts(user: User): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const findArchivedPosts = await this._dbService.post.findMany({
      where: { creatorId: user.id, feedType: 'ARCHIVED', deletedAt: null },
      select: {
        id: true,
        caption: true,
        likedByCreator: true,
        updatedAt: true,
        location: true,
        media: {
          select: {
            extension: true,
            driveId: true,
            path: true,
            id: true,
            name: true,
            meta: true,
            size: true,
          },
          where: { deletedAt: null },
        },
        _count: {
          select: {
            poll: true,
            media: true,
          },
        },
        createdAt: true,
      },
    });

    if (!findArchivedPosts.length) {
      return {
        status: true,
        message: 'no archived post found',
        data: null,
      };
    }
    return {
      status: true,
      message: 'archived posts found successfully',
      data: findArchivedPosts,
    };
  }

  async savedPost(user: User, payload: savedPostDTO): Promise<APIResponseDTO> {
    const { postId } = payload;

    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('User donot exist');
    }

    const findPostToSave = await this._dbService.post.findUnique({
      where: { id: postId, deletedAt: null, feedType: 'ONFEED' },
    });

    if (!findPostToSave) {
      throw new BadRequestException('Post donot exist');
    }

    if (postId && payload?.savedPostFolderId) {
      const postcheck = await this.checkIfPostAlreadySavedUnsavedIt(
        user.id,
        postId,
        payload.savedPostFolderId,
      );
      if (postcheck) {
        return {
          status: true,
          message: 'post unsaved',
          data: null,
        };
      }
    }

    if (payload?.savedPostFolderId) {
      const findSavedPostFolder =
        await this._dbService.savedPostFolder.findUnique({
          where: {
            id: payload.savedPostFolderId,
            deletedAt: null,
            creatorId: user.id,
          },
          select: { id: true },
        });

      if (!findSavedPostFolder) {
        throw new BadRequestException('folder donot exist');
      }

      await this._dbService.savedPost.create({
        data: {
          post: { connect: { id: postId } },
          savedByUser: { connect: { id: user.id } },
          folder: { connect: { id: findSavedPostFolder.id } },
        },
      });
    } else {
      // Create a new saved folder and save the post to it (if folder donot exist)
      this.createNewSavedFolderAndSavePost(user.id, postId);
    }

    return {
      status: true,
      message: 'post has been saved',
      data: null,
    };
  }

  async getAllMySavedPosts(
    user: User,
    folderId: number,
  ): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const findSavedPostFolder =
      await this._dbService.savedPostFolder.findUnique({
        where: { id: folderId, deletedAt: null },
      });

    if (!findSavedPostFolder) {
      throw new BadRequestException('folder donot exist');
    }

    const findSavedPostInSingleFolder =
      await this._dbService.savedPost.findMany({
        where: { savedByUserId: user.id, folderId: folderId },
        include: {
          post: {
            select: {
              id: true,
              _count: true,
              likedByCreator: true,
              location: true,
              caption: true,
              media: {
                select: {
                  id: true,
                  driveId: true,
                  name: true,
                  size: true,
                  path: true,
                  extension: true,
                  meta: true,
                },
              },
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

    return {
      status: true,
      message: 'saved posts found',
      data: findSavedPostInSingleFolder,
    };
  }

  async getAllSavedPostsFolders(user: User): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const findSavedPostsFolders =
      await this._dbService.savedPostFolder.findMany({
        where: { creatorId: user.id, deletedAt: null },
        include: {
          savedPosts: {
            select: {
              id: true,
              createdAt: true,
              post: {
                select: {
                  id: true,
                  caption: true,
                  media: {
                    select: {
                      id: true,
                      driveId: true,
                      name: true,
                      size: true,
                      path: true,
                      extension: true,
                      meta: true,
                    },
                  },
                  createdAt: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 4,
            where: { deletedAt: null },
          },
        },
      });

    return {
      status: true,
      message: 'saved posts folder found',
      data: findSavedPostsFolders,
    };
  }

  async createSavedPostFolder(
    user: User,
    payload: createSavedPostFolderDto,
  ): Promise<APIResponseDTO> {
    const { name } = payload;

    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    await this._dbService.savedPostFolder.create({
      data: {
        name: name.trim(),
        user: { connect: { id: user.id } },
      },
    });

    return {
      status: true,
      message: 'folder created successfully',
      data: null,
    };
  }

  async likeUnlikePost(user: User, postId: number): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const findPostToLike = await this._dbService.post.findUnique({
      where: { id: postId, deletedAt: null },
    });

    if (!findPostToLike) {
      throw new BadRequestException('post donot exist');
    }

    const postAlreadyLiked = await this._dbService.likePost.findFirst({
      where: { postId: postId, likeByUser: { id: user.id }, deletedAt: null },
    });

    if (postAlreadyLiked) {
      await this._dbService.likePost.deleteMany({
        where: { postId, likedByUserId: user.id },
      });
      if (postAlreadyLiked.likedByUserId == user.id) {
        await this._dbService.post.update({
          where: { id: postId, deletedAt: null, creatorId: user.id },
          data: {
            likedByCreator: false,
          },
        });
      }
      return {
        status: true,
        message: 'post unliked',
        data: null,
      };
    }

    await this._dbService.likePost.create({
      data: {
        likeByUser: { connect: { id: user.id } },
        post: { connect: { id: postId } },
      },
    });

    if (findPostToLike?.creatorId === user.id) {
      await this._dbService.post.update({
        where: { id: postId, deletedAt: null, creatorId: user.id },
        data: {
          likedByCreator: true,
        },
      });
    }

    return {
      status: true,
      message: 'post liked',
      data: null,
    };
  }

  async getLikesOfPost(user: User, postId: number): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const post = await this._dbService.post.findUnique({
      where: { id: postId, deletedAt: null },
    });

    if (!post) {
      throw new BadRequestException('post donot exist');
    }

    const getLikesOfPost = await this._dbService.likePost.findMany({
      where: { postId, deletedAt: null },
      select: {
        id: true,
        createdAt: true,
        likeByUser: {
          select: {
            username: true,
            id: true,
            fullName: true,
            email: true,
            profile: {
              select: {
                id: true,
                driveId: true,
                name: true,
                path: true,
                size: true,
                extension: true,
                meta: true,
              },
            },
          },
        },
      },
    });

    return {
      status: true,
      message: 'post likes found',
      data: getLikesOfPost,
    };
  }

  async getTaggedPosts(user: User): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const taggedPosts = await this._dbService.post.findMany({
      where: {
        taggedUsers: {
          some: {
            taggedUserId: user.id,
          },
        },
        deletedAt: null,
        feedType: 'ONFEED',
      },
      include: {
        media: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                id: true,
                driveId: true,
                extension: true,
                path: true,
                meta: true,
                name: true,
              },
            },
            username: true,
          },
        },
      },
    });

    return {
      status: true,
      message: 'found posts which you are taggedOn',
      data: taggedPosts,
    };
  }

  async getTaggedUserOfSinglePost(
    user: User,
    postId: number,
  ): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const findPost = await this._dbService.post.findUnique({
      where: { id: postId, deletedAt: null },
    });

    if (!findPost) {
      throw new BadRequestException('post donot exist');
    }

    const findUserTaggedOnSinglePost =
      await this._dbService.taggedPost.findMany({
        where: { postId, deletedAt: null },
        select: {
          taggedUser: {
            select: {
              id: true,
              fullName: true,
              bio: true,
              username: true,
              email: true,
              profile: {
                select: {
                  id: true,
                  driveId: true,
                  extension: true,
                  path: true,
                  meta: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    return {
      status: true,
      message: 'found users tagged on the post',
      data: findUserTaggedOnSinglePost,
    };
  }

  async getPostDetails(user: User, postId: number): Promise<APIResponseDTO> {
    const findUser = await this._dbService.user.findUnique({
      where: { id: user.id, deletedAt: null },
    });

    if (!findUser) {
      throw new BadRequestException('user donot exist');
    }

    const findPost = await this._dbService.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: {
        id: true,
        _count: {
          select: {
            likes: true,
          },
        },
        caption: true,
        createdAt: true,
        updatedAt: true,
        location: true,
        poll: true,
        likedByCreator: true,
        media: {
          select: {
            id: true,
            name: true,
            meta: true,
            size: true,
            path: true,
            extension: true,
            driveId: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            bio: true,
            profile: {
              select: {
                id: true,
                name: true,
                meta: true,
                size: true,
                path: true,
                extension: true,
                driveId: true,
              },
            },
          },
        },
      },
    });

    if (!findPost) {
      throw new BadRequestException('post donot exist');
    }

    return {
      status: true,
      message: 'post found successfully',
      data: findPost,
    };
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

  private async createNewSavedFolderAndSavePost(
    userId: number,
    postId: number,
  ) {
    await this._dbService.$transaction(async (prisma) => {
      const createNewSavedPostFolder = await prisma.savedPostFolder.create({
        data: {
          user: { connect: { id: userId } },
          name: 'New Folder',
        },
      });
      await prisma.savedPost.create({
        data: {
          post: { connect: { id: postId } },
          savedByUser: { connect: { id: userId } },
          folder: { connect: { id: createNewSavedPostFolder.id } },
        },
      });
    });
  }

  private async checkIfPostAlreadySavedUnsavedIt(
    userId: number,
    postId: number,
    folderId: number,
  ) {
    const findSavePost = await this._dbService.savedPost.findFirst({
      where: {
        folderId: folderId,
        deletedAt: null,
        postId: postId,
        savedByUserId: userId,
      },
      select: { id: true },
    });

    if (findSavePost) {
      await this._dbService.savedPost.delete({
        where: { id: findSavePost.id },
      });

      return true;
    }

    return false;
  }
}
