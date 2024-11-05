import { HashtagType, User } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  commentOnPostDto,
  CreatePostDto,
  createSavedPostFolderDto,
  likeCommentOfPostDto,
  PollAnswerDTO,
  savedPostDTO,
  UpdatePostDto,
  UpdatePostFeedTypeDto,
} from './dto/post.dto';
import { APIResponseDTO } from 'src/core/response/response.schema';
import DatabaseService from 'src/database/database.service';
import { UtilityService } from 'src/util/utility.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PostService {
  constructor(
    private _dbService: DatabaseService,
    private readonly _util: UtilityService,
    private readonly _notification: NotificationService,
  ) {}

  async create(user: User, payload: CreatePostDto): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId: user.id });

    const mediaExists = await this._dbService.media.findMany({
      where: { id: { in: payload.mediaIds } },
    });

    if (!mediaExists.length || payload.mediaIds.length == 0) {
      throw new BadRequestException('media does not exist');
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

      if (payload.poll && Array.isArray(payload.poll)) {
        const pollsData = payload.poll.map((poll) => ({
          question: poll.question,
          options: poll.options,
          postId: post.id,
          pollCreatorId: user.id,
        }));

        await prisma.poll.createMany({
          data: pollsData,
        });
      }

      // taggUser in post along with push notificatio to taggedUsers
      if (payload?.userIds && payload?.userIds?.length) {
        const taggedData = payload.userIds.map((userId) => ({
          taggedUserId: userId,
          postId: post.id,
        }));
        await prisma.taggedPost.createMany({
          data: taggedData,
          skipDuplicates: true, // Optional: avoids error if a tag already exists for the same user-post pair
        });

        const taggedPosts = await prisma.taggedPost.findMany({
          where: { postId: post.id, taggedUserId: { in: payload.userIds } },
          select: { id: true },
        });
        const taggedPostIds: number[] = taggedPosts.map(
          (tagPost) => tagPost.id,
        );

        const usersFcms = await this._util.findUsersFcm(payload.userIds);
        const message = `${user.firstName} has tagged you in ${user.gender === 'MALE' ? 'his' : 'her'} post`;

        await this._notification.taggedOnPost({
          fcms: usersFcms,
          message: message,
          taggedUserIds: payload.userIds,
          topic: 'tagged_post',
          title: 'Tagged On Post',
          userId: user.id,
          taggedPostIds,
          postId: post.id,
          prisma,
        });
      }

      // extract #hashtags from caption and store in separate model
      if (payload.caption) {
        const hashtags = await this._util.extractHashtags(payload.caption);
        if (hashtags.length) {
          const hashes = hashtags.map((tag) => ({
            postId: post.id,
            creatorId: user.id,
            tag,
            type: HashtagType.POST,
          }));
          await prisma.hashtag.createMany({
            data: hashes,
            skipDuplicates: true,
          });
        }
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
        hashtags: true,
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

    const result = await this._dbService.$transaction(async (prisma) => {
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

      if (payload.caption) {
        const newHashtags = await this._util.extractHashtags(payload.caption);
        const existingHashtags = findPost.hashtags.map((h) => h.tag);

        // Determine hashtags to add and remove
        const hashtagsToAdd = newHashtags.filter(
          (tag) => !existingHashtags.includes(tag),
        );
        const hashtagsToRemove = existingHashtags.filter(
          (tag) => !newHashtags.includes(tag),
        );

        // Remove old hashtags
        if (hashtagsToRemove.length > 0) {
          await prisma.hashtag.deleteMany({
            where: {
              tag: { in: hashtagsToRemove },
              postId: findPost.id,
              creatorId: user.id,
            },
          });
        }

        // Add new hashtags
        if (hashtagsToAdd.length > 0) {
          const hashes = hashtagsToAdd.map((tag) => ({
            postId: postId,
            creatorId: user.id,
            tag,
            type: HashtagType.POST,
          }));

          await prisma.hashtag.createMany({
            data: hashes,
            skipDuplicates: true,
          });
        }
      }

      const updatedPost = await prisma.post.update({
        where: { id: findPost.id },
        data: {
          audience: payload.audience || findPost.audience,
          caption: payload.caption || findPost.caption,
          feedType: payload.feedType || findPost.feedType,
          likedByCreator: false,
          location: payload.location || findPost.location,
        },
      });

      return updatedPost;
    });

    return {
      status: true,
      message: 'post has been updated successfully',
      data: result,
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
    const findPostToLike = await this._util.checkPostExistOrNot(postId);

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
        await this._dbService.notification.deleteMany({
          where: { likePostId: postAlreadyLiked.id },
        });
      }
      return {
        status: true,
        message: 'post unliked',
        data: null,
      };
    }

    const postHasBeenLiked = await this._dbService.likePost.create({
      data: {
        likeByUser: { connect: { id: user.id } },
        post: { connect: { id: postId } },
      },
    });

    // if post like successfull & post is not being like by post creator then
    if (postHasBeenLiked.id && findPostToLike.creatorId !== user.id) {
      const UserWhoCreatedPostFcm = await this._util.findUserFcm(
        findPostToLike.creatorId,
      );
      await this._notification.likeOnPost({
        fcm: UserWhoCreatedPostFcm,
        message: `${user.firstName} has liked your post`,
        title: 'Post Liked',
        topic: 'like_post',
        likePostId: postHasBeenLiked.id,
        requestRecieverId: findPostToLike.creatorId,
        userId: user.id,
        postId: findPostToLike.id,
      });
    }

    if (findPostToLike.creatorId === user.id) {
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
            comments: true,
            taggedUsers: true,
          },
        },
        caption: true,
        createdAt: true,
        updatedAt: true,
        location: true,
        poll: true,
        likedByCreator: true,
        hashtags: {
          select: {
            tag: true,
          },
        },
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

  async commentOnPost(
    user: User,
    postId: number,
    payload: commentOnPostDto,
  ): Promise<APIResponseDTO> {
    await this._util.checkPostExistOrNot(postId);

    if (payload.parentCommentId) {
      const parentCommentExists = await this._dbService.commentPost.findUnique({
        where: { id: payload.parentCommentId, deletedAt: null },
      });
      if (!parentCommentExists) {
        throw new NotFoundException('parent comment dono exist');
      }
    }

    const comment = await this._dbService.$transaction(async (prisma) => {
      const newComment = await prisma.commentPost.create({
        data: {
          comment: payload.comment,
          commentator: {
            connect: { id: user.id },
          },
          post: {
            connect: { id: postId },
          },
          parentComment: payload?.parentCommentId
            ? { connect: { id: payload.parentCommentId } }
            : undefined,
        },
      });
      return newComment;
    });

    return {
      status: true,
      message: 'commented successfully',
      data: comment,
    };
  }

  async getParentCommentsOfPost(
    user: User,
    postId: number,
  ): Promise<APIResponseDTO> {
    await this._util.checkPostExistOrNot(postId);

    const comments = await this._dbService.commentPost.findMany({
      where: { postId, parentCommentId: null },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        postId: true,
        commentator: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                path: true,
              },
            },
          },
        },
        comment: true,
        replies: {
          select: {
            id: true,
            comment: true,
            likedBy: true,
            commentator: {
              select: {
                id: true,
                fullName: true,
                profile: {
                  select: {
                    path: true,
                  },
                },
              },
            },
            // Include nested replies
            replies: {
              select: {
                id: true,
                comment: true,
                likedBy: true,
                commentator: {
                  select: {
                    id: true,
                    fullName: true,
                    profile: {
                      select: {
                        path: true,
                      },
                    },
                  },
                },
              },
              take: 3,
            },
          },
          take: 3,
        },
        likedBy: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    const commentsWithLikedByMe = comments.map((comment) => ({
      ...comment,
      likedByMe: comment.likedBy.includes(user.id),
      replies: comment.replies.map((reply) => ({
        ...reply,
        likedByMe: reply.likedBy.includes(user.id),
        replies: reply.replies.map((nestedReply) => ({
          ...nestedReply,
          likedByMe: nestedReply.likedBy.includes(user.id),
        })),
      })),
    }));

    return {
      status: true,
      message: 'Post comments found',
      data: commentsWithLikedByMe,
    };
  }

  async deleteCommentOnPost(
    user: User,
    postId: number,
    commentId: number,
  ): Promise<APIResponseDTO> {
    const commentExist = await this._util.CheckCommentOnPostExistOrNot(
      commentId,
      postId,
    );

    if (commentExist.commentatorId !== user.id) {
      throw new BadRequestException('you cannot delete other user comments');
    }

    await this._dbService.$transaction(async (prisma) => {
      if (commentExist.replies.length > 0) {
        await prisma.commentPost.deleteMany({
          where: { parentCommentId: commentId },
        });
      }

      await prisma.commentPost.delete({
        where: { id: commentId },
      });
    });

    return {
      status: true,
      message: 'comment deleted successfully',
      data: null,
    };
  }

  async likeUnlikeComment(
    user: User,
    payload: likeCommentOfPostDto,
  ): Promise<APIResponseDTO> {
    await this._util.checkPostExistOrNot(payload.postId);
    const { commentId, postId } = payload;
    const comment = await this._util.CheckCommentOnPostExistOrNot(
      commentId,
      postId,
    );

    if (comment.likedBy.includes(user.id)) {
      const updatedLikedBy = comment.likedBy.filter((id) => id !== user.id);

      await this._dbService.commentPost.update({
        where: {
          id: comment.id,
        },
        data: {
          likedBy: updatedLikedBy,
        },
      });

      return {
        status: true,
        message: 'Comment unliked successfully',
        data: null,
      };
    }

    await this._dbService.commentPost.update({
      where: {
        id: comment.id,
      },
      data: {
        likedBy: [...comment.likedBy, user.id],
      },
    });

    return {
      status: true,
      message: 'comment liked successfully',
      data: null,
    };
  }

  async answerPoll(
    user: User,
    payload: PollAnswerDTO,
  ): Promise<APIResponseDTO> {
    const { option, pollId, postId } = payload;
    await this._util.checkPostExistOrNot(postId);

    const poll = await this._dbService.poll.findUnique({
      where: { id: pollId, postId },
    });

    if (!poll) {
      throw new NotFoundException('poll does not exist');
    }

    if (!poll.options.includes(option)) {
      throw new BadRequestException(
        `invalid option selected, options must be from ${poll.options}`,
      );
    }

    const existingAnswer = await this._dbService.pollAnswer.findFirst({
      where: { pollId, answeredByUserId: user.id },
    });

    if (existingAnswer) {
      throw new BadRequestException('you already has answered this poll');
    }

    await this._dbService.pollAnswer.create({
      data: {
        answeredByUser: { connect: { id: user.id } },
        option,
        poll: { connect: { id: pollId } },
      },
    });

    return {
      status: true,
      message: 'poll answered',
    };
  }

  async getNestedComments(
    user: User,
    postId: number,
    commentId: number,
  ): Promise<APIResponseDTO> {
    await this._util.CheckCommentOnPostExistOrNot(commentId, postId);

    const comments = await this._dbService.commentPost.findMany({
      where: {
        parentCommentId: commentId,
        deletedAt: null,
      },
      include: {
        replies: {
          include: {
            commentator: {
              select: {
                id: true,
                fullName: true,
                profile: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          },
        },
        commentator: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                path: true,
              },
            },
          },
        },
        post: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const commentsWithLikedByMe = comments.map((comment: any) => ({
      ...comment,
      likedByMe: comment.likedBy.includes(user.id),
      replies: comment.replies.map((reply: any) => ({
        ...reply,
        likedByMe: reply.likedBy.includes(user.id),
        replies: reply.replies.map((nestedReply: any) => ({
          ...nestedReply,
          likedByMe: nestedReply.likedBy.includes(user.id),
        })),
      })),
    }));

    return {
      status: true,
      message: 'replies to this comment found',
      data: commentsWithLikedByMe,
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
