import { AudienceType, MediaType, User } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/story.dto';
import DatabaseService from 'src/database/database.service';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { MediaService } from '../media/media.service';
import { ExcludeFields } from 'src/helpers/util.helper';
import { UtilityService } from 'src/util/utility.service';

@Injectable()
export class StoryService {
  constructor(
    private readonly _dbService: DatabaseService,
    private readonly _mediaService: MediaService,
    private readonly _util: UtilityService,
  ) {}

  async createStory(
    user: User,
    payload: CreateStoryDto,
  ): Promise<APIResponseDTO> {
    const { mediaType, mediaIds } = payload;
    await this._util.checkUserExistOrNot({ userId: user.id });

    const checkMediaWithMediaType = await this._mediaService.findMediaByType(
      mediaIds,
      mediaType,
    );

    if (!checkMediaWithMediaType) {
      throw new BadRequestException(
        `All uploaded media must be of type ${mediaType.toLowerCase()}`,
      );
    }

    // if collage is true then create single story otherwise multiple stories with media
    if (payload?.collage && mediaType === 'IMAGE' && mediaIds.length > 1) {
      return await this.createSingleStory({
        mediaType,
        mediaIds,
        userId: user.id,
        audienceType: payload?.audienceType,
        caption: payload?.caption,
      });
    }

    if (payload?.collage && mediaType === 'VIDEO') {
      throw new BadRequestException(
        'videos are not supported in layout format',
      );
    }

    if (payload?.collage === true && mediaIds.length === 1) {
      throw new BadRequestException('cannot collage single media');
    }

    // if (!payload?.collage && mediaType === 'IMAGE' && mediaIds.length === 1) {
    // }

    return await this.createMultipleStories({
      mediaType,
      mediaIds,
      userId: user.id,
      audienceType: payload?.audienceType,
      caption: payload?.caption,
    });
  }

  async getMyStories(user: User): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId: user.id });

    const findMyStories = await this._dbService.story.findMany({
      where: { creatorId: user.id, deletedAt: null },
      include: {
        _count: {
          select: {
            seenBy: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            profile: {
              select: {
                id: true,
                size: true,
                name: true,
                meta: true,
                path: true,
                extension: true,
                driveId: true,
              },
            },
          },
        },
        media: {
          select: {
            id: true,
            size: true,
            name: true,
            meta: true,
            path: true,
            extension: true,
            driveId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: true,
      message: 'your stories found',
      data: findMyStories,
    };
  }

  // async getStoriesOnFeed(user: User): Promise<APIResponseDTO> {
  //   await this._userService.checkUserExistOrNot({ userId: user.id });

  //   const now = new Date();
  //   const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  //   const myStories = await this._dbService.story.findMany({
  //     where: {
  //       creatorId: user.id,
  //       deletedAt: null,
  //       createdAt: {
  //         gte: twentyFourHoursAgo, // Only stories from the last 24 hours
  //       },
  //     },
  //     include: {
  //       media: {
  //         select: {
  //           id: true,
  //           driveId: true,
  //           path: true,
  //         },
  //       },
  //       seenBy: {
  //         select: {
  //           viewerId: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //   });

  //   // const findUsersWhomIAmFollowing =
  //   //   await this._userService.findUsersWhomIAmFollowing({
  //   //     user,
  //   //     onlyIds: true,
  //   //   });
  //   // const userWhomIFollowIds = findUsersWhomIAmFollowing.map((user) => user.id);

  //   const followingStories = await this._dbService.story.findMany({
  //     where: {
  //       creator: {
  //         // id: { in: userWhomIFollowIds },
  //         following: {
  //           some: {
  //             follower: {
  //               id: user.id,
  //             },
  //           },
  //         },
  //       },
  //       deletedAt: null,
  //       createdAt: {
  //         gte: twentyFourHoursAgo,
  //       },
  //     },
  //     include: {
  //       media: {
  //         select: {
  //           id: true,
  //           driveId: true,
  //           path: true,
  //         },
  //       },
  //       seenBy: {
  //         select: {
  //           viewerId: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //   });

  //   const allStories = [...myStories, ...followingStories].map((story) => {
  //     const seenByMe = story.seenBy.some((view) => view.viewerId === user.id);
  //     const storyWithoutSeenByArray = ExcludeFields(story, ['seenBy']);
  //     return {
  //       ...storyWithoutSeenByArray,
  //       seenByMe,
  //     };
  //   });

  //   return {
  //     status: true,
  //     message: 'Stories on your feed found',
  //     data: allStories,
  //   };
  // }

  async getStoriesOnFeed(user: User): Promise<APIResponseDTO> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const myStoryData = await this.makeStoryData(user.id, twentyFourHoursAgo);
    const usersFollowingStories = await this.getFollowingUsersStories(
      user,
      twentyFourHoursAgo,
    );

    return {
      status: true,
      message: 'Stories on your feed found',
      data: [myStoryData, ...usersFollowingStories],
    };
  }

  async deleteStoryById(
    storyId: number,
    userId: number,
  ): Promise<APIResponseDTO> {
    const story = await this._dbService.story.findUnique({
      where: { id: storyId },
      select: { id: true, creatorId: true },
    });

    const findMediaOfStory = await this._dbService.media.findMany({
      where: { storyId: story.id, creatorId: userId, deletedAt: null },
      select: { id: true },
    });
    const findMediaIds = findMediaOfStory.map((media) => media.id);

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this story',
      );
    }

    await this._dbService.$transaction(async (prisma) => {
      await prisma.media.deleteMany({
        where: { id: { in: findMediaIds } },
      });

      await prisma.story.delete({
        where: { id: story.id },
      });
    });

    return {
      status: true,
      message: 'Story successfully deleted',
      data: null,
    };
  }

  async viewStory(user: User, storyId: number): Promise<APIResponseDTO> {
    const findStory = await this.findStoryById(storyId);

    if (!findStory) {
      throw new BadRequestException('Story does not exist');
    }

    await this._dbService.$transaction(async (prisma) => {
      if (user.id === findStory.creatorId && !findStory.seenByCreator) {
        await prisma.story.update({
          where: { id: storyId },
          data: {
            seenByCreator: true,
          },
        });
      }

      const existingView = await prisma.storyView.findFirst({
        where: {
          storyId: storyId,
          viewerId: user.id,
        },
      });

      if (existingView) {
        throw new BadRequestException('you have already viewed the story');
      }

      if (!existingView) {
        await prisma.storyView.create({
          data: {
            story: { connect: { id: storyId } },
            viewer: { connect: { id: user.id } },
            viewedAt: new Date(),
          },
        });
      }
    });

    return {
      status: true,
      message: 'Story has been viewed',
      data: null,
    };
  }

  async storyDetail(user: User, storyId: number): Promise<APIResponseDTO> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const findStory = await this._dbService.story.findUnique({
      where: {
        id: storyId,
        deletedAt: null,
        createdAt: {
          gte: twentyFourHoursAgo, // Filter stories created within the last 24 hours
        },
      },
      select: {
        id: true,
        creatorId: true,
        AudienceType: true,
        caption: true,
        mediaType: true,
        media: {
          select: {
            id: true,
            path: true,
            driveId: true,
            name: true,
          },
        },
        collage: true,
        _count: {
          select: {
            seenBy: true,
          },
        },
        seenByCreator: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profile: {
              select: {
                id: true,
                path: true,
                driveId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!findStory) {
      throw new BadRequestException('story does not exist');
    }

    const findUserWhoCreateTheStory = await this._dbService.user.findUnique({
      where: {
        id: findStory.creatorId,
        deletedAt: null,
        accountPrivacy: 'PUBLIC',
      },
    });

    if (!findUserWhoCreateTheStory) {
      throw new BadRequestException(
        'you cannot see stories of private account',
      );
    }

    if (findStory.AudienceType !== 'EVERYONE') {
      const isFollowing = await this._dbService.userFollow.findFirst({
        where: {
          followerId: user.id,
          followingId: findStory.creatorId,
        },
      });
      if (!isFollowing) {
        throw new BadRequestException(
          'You cannot see this story because you do not follow the user.',
        );
      }
    }

    return {
      status: true,
      message: 'story has been found',
      data: findStory,
    };
  }

  private async makeStoryData(userId: number, time: any) {
    const getMyStoryUser = await this._dbService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        profile: {
          select: {
            id: true,
            driveId: true,
            path: true,
            name: true,
          },
        },
        stories: {
          where: {
            deletedAt: null,
            createdAt: {
              gte: time,
            },
          },
          include: {
            seenBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const myStories = getMyStoryUser.stories.map((story) => {
      const seenByMe = story.seenBy.some((view) => view.viewerId === userId);
      return {
        ...ExcludeFields(story, ['seenBy']),
        seenByMe,
      };
    });

    const result = {
      id: getMyStoryUser.id,
      fullName: getMyStoryUser.fullName,
      profile: getMyStoryUser.profile,
      stories: myStories,
    };

    return result;
  }

  private async getFollowingUsersStories(user: User, twentyFourHoursAgo: Date) {
    const { userWhomIFollowIds } = await this._util.findUsersWhomIAmFollowing({
      user,
    });

    const followingStories = await this._dbService.story.findMany({
      where: {
        creatorId: {
          in: userWhomIFollowIds,
        },
        deletedAt: null,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                id: true,
                driveId: true,
                path: true,
                name: true,
              },
            },
          },
        },
        seenBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return followingStories.reduce((acc, story) => {
      let userEntry = acc.find((entry) => entry.id === story.creator.id);
      if (!userEntry) {
        userEntry = {
          id: story.creator.id,
          fullName: story.creator.fullName,
          profile: story.creator.profile,
          stories: [],
        };
        acc.push(userEntry);
      }
      const seenByMe = story.seenBy.some((view) => view.viewerId === user.id);
      userEntry.stories.push({
        ...ExcludeFields(story, ['seenBy', 'creator']),
        seenByMe,
      });

      return acc;
    }, []);
  }

  private async findStoryById(id: number) {
    const storyFound = await this._dbService.story.findUnique({
      where: { id, deletedAt: null },
    });
    return storyFound;
  }

  private async createMultipleStories({
    userId,
    mediaIds,
    mediaType,
    audienceType,
    caption,
  }: createStoriesProp) {
    const createdStories = await this._dbService.$transaction(
      async (prisma) => {
        const createStoriesPromises = mediaIds.map((mediaId: number) => {
          return prisma.story.create({
            data: {
              mediaType,
              collage: false,
              AudienceType: audienceType || 'EVERYONE',
              creatorId: userId,
              caption: caption || null,
              media: { connect: { id: mediaId } },
            },
          });
        });
        const stories = await Promise.all(createStoriesPromises);
        return stories;
      },
    );

    return {
      status: true,
      message: 'multiple stories created successfully',
      data: createdStories,
    };
  }

  private async createSingleStory({
    mediaIds,
    mediaType,
    userId,
    audienceType,
    caption,
  }: createStoriesProp) {
    const createdStory = await this._dbService.$transaction(async (prisma) => {
      const story = await prisma.story.create({
        data: {
          mediaType,
          collage: true,
          AudienceType: audienceType || 'EVERYONE',
          creator: { connect: { id: userId } },
          caption: caption || null,
          media: {
            connect: mediaIds.map((mediaId: number) => ({ id: mediaId })),
          },
        },
      });
      return story;
    });

    return {
      status: true,
      message: 'Collage story created successfully',
      data: createdStory,
    };
  }
}

interface createStoriesProp {
  userId: number;
  mediaIds: number[];
  mediaType: MediaType;
  audienceType?: AudienceType;
  caption?: string;
}
