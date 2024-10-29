import { User } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReelDto } from './dto/reel.dto';
import { APIResponseDTO } from 'src/core/response/response.schema';
import DatabaseService from 'src/database/database.service';

@Injectable()
export class ReelService {
  constructor(private readonly _dbService: DatabaseService) {}
  async create(user: User, payload: CreateReelDto): Promise<APIResponseDTO> {
    const { mediaIds } = payload;

    const findMedia = await this._dbService.media.findMany({
      where: { id: { in: mediaIds }, deletedAt: null },
    });

    if (!findMedia) {
      throw new NotFoundException('media does not exist');
    }

    let musicMedia: any = null;
    if (payload.musicId) {
      musicMedia = await this._dbService.media.findUnique({
        where: { id: payload.musicId, deletedAt: null },
      });
    }

    await this._dbService.reel.create({
      data: {
        caption: payload.caption || null,
        media: {
          connect: mediaIds.map((mediaId: number) => ({ id: mediaId })),
        },
        music: musicMedia ? { connect: { id: musicMedia.id } } : null,
        creator: { connect: { id: user.id } },
      },
    });

    return {
      status: true,
      message: 'reel created successfully',
      data: null,
    };
  }
}
