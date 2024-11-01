import { Injectable } from '@nestjs/common';
import { basicSearchDto } from './dto/search.dto';
import { User } from '@prisma/client';
import { APIResponseDTO } from 'src/core/response/response.schema';
import DatabaseService from 'src/database/database.service';
import { UtilityService } from 'src/util/utility.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly _db: DatabaseService,
    private readonly _util: UtilityService,
  ) {}

  async basicSearch(
    user: User,
    query?: basicSearchDto,
  ): Promise<APIResponseDTO> {
    if (!query || !query.keyword || query.keyword.trim() === '') {
      return {
        status: true,
        message: 'No accounts found',
        data: null,
      };
    }

    const myBlockedUsers = await this._util.getBlockedUsers(user.id);
    const blockUserIds: number[] = myBlockedUsers.map(
      (block: { id: number }) => block.id,
    );

    const users = await this._db.user.findMany({
      where: {
        OR: [
          { username: { contains: query.keyword.trim(), mode: 'insensitive' } },
          { fullName: { contains: query.keyword.trim(), mode: 'insensitive' } },
          { email: { contains: query.keyword.trim(), mode: 'insensitive' } },
        ],
        activeStatus: 'ACTIVE',
        NOT: {
          id: { in: blockUserIds },
        },
      },
      select: {
        id: true,
        fullName: true,
        bio: true,
        username: true,
        profile: {
          select: {
            path: true,
          },
        },
      },
    });

    return {
      status: true,
      message: 'accounts found',
      data: users,
    };
  }
}
