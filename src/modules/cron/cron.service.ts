import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import DatabaseService from 'src/database/database.service';

@Injectable()
export default class CronService {
  constructor(private readonly _db: DatabaseService) {}

  // @Cron(CronExpression.EVERY_HOUR, { name: 'test' })
  // HandleTestMessage() {
  //   Logger.log('===> Generated from test cron <===', '[CRON]');
  // }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'delete_expire_stories',
  })
  async deleteExpireStories() {
    const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hour

    try {
      const expiredStories = await this._db.story.findMany({
        where: {
          createdAt: {
            lt: expirationTime,
          },
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      const expireStoriesIds: number[] = expiredStories.map(
        (story: { id: number }) => story.id,
      );

      if (expiredStories.length > 0) {
        await this._db.$transaction(async (prisma) => {
          await prisma.media.deleteMany({
            where: {
              storyId: {
                in: expireStoriesIds,
              },
            },
          });
          await prisma.story.deleteMany({
            where: {
              id: {
                in: expireStoriesIds,
              },
            },
          });
        });
      }
    } catch (error) {
      Logger.log('error deleting expired stories ==>', error);
    }
  }
}
