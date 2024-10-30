import { User } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReelDto } from './dto/reel.dto';
import { APIResponseDTO } from 'src/core/response/response.schema';
import DatabaseService from 'src/database/database.service';

@Injectable()
export class ReelService {
  constructor(private readonly _dbService: DatabaseService) {}

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
}
