import { Injectable } from '@nestjs/common';
import { basicSearchDto, keywordSearchDto } from './dto/search.dto';
import { User } from '@prisma/client';
import { APIResponseDTO } from 'src/core/response/response.schema';
import DatabaseService from 'src/database/database.service';
import { UtilityService } from 'src/util/utility.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly _db: DatabaseService,
    private readonly _util: UtilityService,
    private readonly _redis: RedisService,
  ) {}

  async basic(user: User, query?: basicSearchDto): Promise<APIResponseDTO> {
    if (!query || !query.keyword || query.keyword.trim() === '') {
      return {
        status: true,
        message: 'No accounts found',
        data: null,
      };
    }

    const blockUserIds = await this._util.getMyBlockedUserIds(user.id);
    const peopleWhoBlockedMeIds = await this._util.getUserWhoBlockMeIds(
      user.id,
    );
    const blockIds: number[] = [...blockUserIds, ...peopleWhoBlockedMeIds];

    const users = await this._db.user.findMany({
      where: {
        OR: [
          { username: { contains: query.keyword.trim(), mode: 'insensitive' } },
          { fullName: { contains: query.keyword.trim(), mode: 'insensitive' } },
          { email: { contains: query.keyword.trim(), mode: 'insensitive' } },
        ],
        activeStatus: 'ACTIVE',
        NOT: {
          id: { in: blockIds },
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

  private async storeRecentSearch(
    userId: number,
    keyword: string,
    postId?: number,
    accountId?: number,
    reelId?: number,
  ) {
    const recentSearch = await this._db.recentSearch.create({
      data: {
        searchByUserId: userId,
        keyword: keyword,
        postId: postId || null,
        accountId: accountId || null,
        reelId: reelId || null,
      },
    });

    await this._redis.set(
      `recent_search_user:${userId}`,
      JSON.stringify(recentSearch),
    );
    return recentSearch;
  }

  async onKeyword(
    user: User,
    query: keywordSearchDto,
  ): Promise<APIResponseDTO> {
    const { keyword } = query;
    await this.storeRecentSearch(user.id, keyword);

    const results = await this.performKeywordSearch(keyword, user.id);

    return {
      status: true,
      message: 'Search results based on the keyword',
      data: results,
    };
  }

  private async performKeywordSearch(keyword: string, userId: number) {
    const posts = await this._db.post.findMany({
      where: {
        caption: { contains: keyword, mode: 'insensitive' },
        creatorId: {
          not: userId,
        },
      },
      select: {
        id: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profile: {
              select: {
                path: true,
              },
            },
          },
        },
        media: {
          select: {
            path: true,
          },
        },
      },
    });

    const users = await this._db.user.findMany({
      where: {
        OR: [
          { username: { contains: keyword, mode: 'insensitive' } },
          { fullName: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
        ],
        id: {
          not: userId,
        },
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        profile: {
          select: {
            path: true,
          },
        },
      },
    });

    const reels = await this._db.reel.findMany({
      where: {
        caption: { contains: keyword, mode: 'insensitive' },
        creatorId: {
          not: userId,
        },
      },
      select: {
        id: true,
        caption: true,
        media: {
          select: {
            path: true,
          },
        },
        music: {
          select: {
            path: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profile: {
              select: {
                path: true,
              },
            },
          },
        },
      },
    });

    return {
      posts,
      users,
      reels,
    };
  }
}
