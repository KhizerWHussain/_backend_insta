import { AudienceType, MediaType, User } from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/story.dto';
import DatabaseService from 'src/database/database.service';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { UserService } from '../user/user.service';
import { MediaService } from '../media/media.service';

@Injectable()
export class StoryService {
  constructor(
    private readonly _dbService: DatabaseService,
    private readonly _userService: UserService,
    private readonly _mediaService: MediaService,
  ) {}

  async createStory(
    user: User,
    payload: CreateStoryDto,
  ): Promise<APIResponseDTO> {
    const { mediaType, mediaIds } = payload;
    await this._userService.checkUserExistOrNot({ userId: user.id });

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
    if (payload?.collage && mediaType === 'IMAGE') {
      return await this.createSingleStory({
        mediaType,
        mediaIds,
        userId: user.id,
        audienceType: payload?.audienceType,
        caption: payload?.caption,
      });
    }

    if (payload.collage && mediaType === 'VIDEO') {
      throw new BadRequestException(
        'videos are not supported in layout format',
      );
    }

    return await this.createMultipleStories({
      mediaType,
      mediaIds,
      userId: user.id,
      audienceType: payload?.audienceType,
      caption: payload?.caption,
    });
  }

  async getMyStories(user: User): Promise<APIResponseDTO> {
    await this._userService.checkUserExistOrNot({ userId: user.id });

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
