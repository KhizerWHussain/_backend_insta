import { Injectable, NotFoundException } from '@nestjs/common';
import {
  basicSearchDto,
  keywordSearchDto,
  postSearchByLocationDto,
} from './dto/search.dto';
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

  async accounts(user: User, query?: basicSearchDto): Promise<APIResponseDTO> {
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
    const blockIds: number[] = [
      ...blockUserIds,
      ...peopleWhoBlockedMeIds,
      user.id,
    ];

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
    const existingSearch = await this._db.recentSearch.findFirst({
      where: {
        deletedAt: null,
        searchByUserId: userId,
        keyword: keyword,
      },
    });

    if (existingSearch) {
      return existingSearch;
    }

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
    const promises: any = [];

    // Fetch posts
    promises.push(
      this._db.post.findMany({
        where: {
          deletedAt: null,
          feedType: 'ONFEED',
          caption: { contains: keyword, mode: 'insensitive' },
          creatorId: { not: userId },
        },
        select: {
          id: true,
          location: true,
          caption: true,
          creator: {
            select: {
              id: true,
              fullName: true,
              username: true,
              profile: { select: { path: true } },
            },
          },
          media: { select: { path: true } },
        },
      }),
    );

    // Fetch users
    promises.push(
      this._db.user.findMany({
        where: {
          deletedAt: null,
          activeStatus: 'ACTIVE',
          OR: [
            { username: { contains: keyword, mode: 'insensitive' } },
            { fullName: { contains: keyword, mode: 'insensitive' } },
            { email: { contains: keyword, mode: 'insensitive' } },
          ],
          id: { not: userId },
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          profile: { select: { path: true } },
        },
      }),
    );

    // Fetch reels
    promises.push(
      this._db.reel.findMany({
        where: {
          deletedAt: null,
          caption: { contains: keyword, mode: 'insensitive' },
          creatorId: { not: userId },
        },
        select: {
          id: true,
          caption: true,
          media: { select: { path: true } },
          music: { select: { path: true, name: true } },
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              profile: { select: { path: true } },
            },
          },
        },
      }),
    );

    // Fetch unique locations
    promises.push(
      this._db.post.findMany({
        where: {
          deletedAt: null,
          feedType: 'ONFEED',
          location: { contains: keyword, mode: 'insensitive', not: null },
          creatorId: { not: userId },
        },
        select: { location: true },
        distinct: ['location'],
      }),
    );

    // Fetch hashtags
    promises.push(
      this._db.hashtag.findMany({
        where: {
          tag: { contains: keyword, mode: 'insensitive' },
          creatorId: { not: userId },
          deletedAt: null,
        },
        distinct: ['tag'],
        select: { id: true, tag: true },
      }),
    );

    const [posts, users, reels, uniqueLocations, hashtags] =
      await Promise.all(promises);

    return {
      forYou: posts,
      users,
      reels,
      places: uniqueLocations,
      hashtags,
    };
  }

  async postByLocation(
    user: User,
    query: postSearchByLocationDto,
  ): Promise<APIResponseDTO> {
    const { location } = query;

    const posts = await this._db.post.findMany({
      where: {
        deletedAt: null,
        feedType: 'ONFEED',
        location: { contains: location, mode: 'insensitive' },
        creatorId: {
          not: user.id,
        },
      },
      select: {
        id: true,
        location: true,
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

    return {
      status: true,
      message: 'post by locations found',
      data: posts,
    };
  }

  async getRecent(user: User) {
    const findRecentSearched = await this._db.recentSearch.findMany({
      where: { searchByUserId: user.id, deletedAt: null },
      select: {
        id: true,
        account: true,
        post: true,
        reel: true,
        keyword: true,
      },
      distinct: ['keyword'],
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return findRecentSearched;
  }

  async deleteOne(userId: number, id: number) {
    const singleSearh = await this._db.recentSearch.findUnique({
      where: { id, searchByUserId: userId },
      select: { id: true },
    });
    if (!singleSearh) {
      throw new NotFoundException('recent search not found');
    }
    await this._db.recentSearch.delete({
      where: { id },
    });
  }

  async deleteAll(userId: number) {
    await this._db.recentSearch.deleteMany({
      where: { searchByUserId: userId },
    });
  }

  async otherUserContent() {}
}
