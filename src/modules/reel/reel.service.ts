import { User } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReelDto } from './dto/reel.dto';
import { APIResponseDTO } from 'src/core/response/response.schema';
import DatabaseService from 'src/database/database.service';
import { UtilityService } from 'src/util/utility.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReelService {
  constructor(
    private readonly _dbService: DatabaseService,
    private readonly _util: UtilityService,
    private readonly _notification: NotificationService,
  ) {}

  async create(user: User, payload: CreateReelDto): Promise<APIResponseDTO> {
    const { mediaIds } = payload;

    const findMedia = await this._dbService.media.findMany({
      where: { id: { in: mediaIds }, deletedAt: null, type: 'VIDEO' },
      select: { type: true },
    });

    if (findMedia.length === 0) {
      throw new NotFoundException('Media does not exist');
    }

    let musicMedia: any = null;
    if (payload.musicId) {
      musicMedia = await this._dbService.media.findUnique({
        where: { id: payload.musicId, deletedAt: null },
        select: {
          id: true,
          type: true,
        },
      });

      if (!musicMedia) {
        throw new NotFoundException('music media does not exist');
      }

      if (musicMedia && musicMedia?.type !== 'AUDIO') {
        throw new BadRequestException('music must be audio media');
      }
    }

    await this._dbService.$transaction(async (prisma) => {
      const reelCreated = await prisma.reel.create({
        data: {
          caption: payload.caption || null,
          media: {
            connect: mediaIds.map((mediaId: number) => ({ id: mediaId })),
          },
          creator: { connect: { id: user.id } },
          // musicId: payload?.musicId ?? null,
          music: payload.musicId
            ? { connect: { id: payload.musicId } }
            : undefined,
        },
      });

      if (musicMedia && payload.musicId) {
        await prisma.media.update({
          where: { id: musicMedia.id, deletedAt: null },
          data: {
            // reel: { connect: { id: reelCreated.id } },
            reelid: reelCreated.id,
          },
        });
      }
    });

    return {
      status: true,
      message: 'reel created successfully',
      data: null,
    };
  }

  async deleteMyReel(user: User, reelId: number): Promise<APIResponseDTO> {
    const findReel = await this._dbService.reel.findUnique({
      where: { id: reelId, creatorId: user.id, deletedAt: null },
    });

    if (!findReel) {
      throw new NotFoundException('reel does not exist');
    }

    await this._dbService.$transaction(async (prisma) => {
      await prisma.media.deleteMany({
        where: { reelid: reelId },
      });
      await prisma.notification.deleteMany({
        where: { reelId },
      });
      await prisma.reel.delete({
        where: { id: reelId },
      });
    });

    return {
      status: true,
      message: 'reel deleted successfully',
      data: null,
    };
  }

  async singleReelDetail(user: User, reelId: number): Promise<APIResponseDTO> {
    const findReel = await this._dbService.reel.findUnique({
      where: { id: reelId, deletedAt: null },
      select: {
        id: true,
        caption: true,
        createdAt: true,
        media: {
          select: {
            id: true,
            driveId: true,
            path: true,
            extension: true,
          },
        },
        music: {
          select: {
            id: true,
            driveId: true,
            path: true,
            extension: true,
            name: true,
            size: true,
          },
        },
        seenByCreator: false,
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            bio: true,
            profile: {
              select: {
                id: true,
                driveId: true,
                path: true,
                extension: true,
                name: true,
                size: true,
                meta: true,
              },
            },
          },
        },
      },
    });

    if (!findReel) {
      throw new NotFoundException('reel does not exist');
    }

    return {
      status: true,
      message: 'reel found',
      data: findReel,
    };
  }

  async likeReel(user: User, reelId: number): Promise<APIResponseDTO> {
    const blockUsersIds: number[] = await this._util.getMyBlockedUserIds(
      user.id,
    );

    const reel = await this.findReelById(reelId, {
      throwErrorIfNotFound: true,
    });

    if (blockUsersIds.includes(reel.creatorId)) {
      throw new BadRequestException(
        'You cannot like a reel created by a user you have blocked.',
      );
    }

    const findReelLiked = await this.findReelLiked(reelId, user.id);

    if (findReelLiked) {
      await this._dbService.likeReel.deleteMany({
        where: { reelId, likedByUserId: user.id },
      });
      await this._dbService.notification.deleteMany({
        where: { likeReelId: findReelLiked.id },
      });
      return {
        status: true,
        message: 'reel unliked',
      };
    }

    const likeReel = await this._dbService.likeReel.create({
      data: {
        likedByUser: { connect: { id: user.id } },
        reel: { connect: { id: reelId } },
      },
      select: { id: true },
    });

    if (likeReel.id && reel.creatorId !== user.id) {
      const UserWhoCreatedStoryFcm = await this._util.findUserFcm(
        reel.creatorId,
      );
      await this._notification.likeOnReel({
        fcm: UserWhoCreatedStoryFcm,
        message: `${user.firstName} has liked your reel`,
        title: 'Reel Liked',
        topic: 'like_reel',
        likeReelId: likeReel.id,
        requestRecieverId: reel.creatorId,
        userId: user.id,
        reelId: reel.id,
      });
    }

    return {
      status: true,
      message: 'reel liked',
    };
  }

  private async findReelById(
    id: number,
    { throwErrorIfNotFound = false, whereCondition = {} } = {},
  ) {
    const reelFound = await this._dbService.reel.findUnique({
      where: { id, deletedAt: null, ...whereCondition },
    });
    if (!reelFound && throwErrorIfNotFound === true) {
      throw new BadRequestException('reel does not exist');
    }
    return reelFound;
  }

  private async findReelLiked(
    id: number,
    userId: number,
    { throwErrorIfNotFound = false } = {},
  ) {
    const findReelLiked = await this._dbService.likeReel.findFirst({
      where: { reelId: id, likedByUserId: userId, deletedAt: null },
    });

    if (!findReelLiked && throwErrorIfNotFound === true) {
      throw new BadRequestException('reel has not been liked');
    }

    return findReelLiked;
  }
}
