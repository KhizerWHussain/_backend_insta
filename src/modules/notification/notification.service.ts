import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from './firebase.service';
import DatabaseService from 'src/database/database.service';
import { User } from '@prisma/client';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { UtilityService } from 'src/util/utility.service';
import { startOfToday, startOfYesterday } from 'date-fns';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
  constructor(
    private readonly _firebase: FirebaseAdminService,
    private readonly _db: DatabaseService,
    private readonly _util: UtilityService,
    private readonly _eventEmitter: EventEmitter2,
  ) {}

  async follow({
    fcm,
    title,
    data,
    message,
    toBeFollowUserId,
    userId,
    userFollowId,
    topic,
  }: followProp) {
    if (fcm) {
      await this._firebase.push(fcm, {
        title,
        data,
        message,
        topic,
      });
    }
    await this._db.notification.create({
      data: {
        title,
        type: 'FOLLOW',
        data,
        message,
        userFollow: { connect: { id: userFollowId } },
        sender: { connect: { id: userId } },
        reciever: { connect: { id: toBeFollowUserId } },
      },
    });
  }

  async sentFollowRequest({
    fcm,
    followRequestId,
    message,
    topic,
    title,
    requestRecieverId,
    userId,
    data,
  }: followRequest) {
    if (fcm) {
      await this._firebase.push(fcm, {
        title,
        data,
        message,
        topic,
      });
    }
    await this._db.notification.create({
      data: {
        title,
        type: 'FOLLOW',
        data,
        message,
        followRequest: { connect: { id: followRequestId } },
        sender: { connect: { id: userId } },
        reciever: { connect: { id: requestRecieverId } },
      },
    });
  }

  async likeOnPost({
    fcm,
    likePostId,
    message,
    title,
    topic,
    userId,
    data,
    requestRecieverId,
    postId,
  }: LikePostProp) {
    if (fcm) {
      await this._firebase.push(fcm, {
        title,
        data,
        message,
        topic,
      });
    }
    const notification = await this._db.notification.create({
      data: {
        title,
        type: 'POST_LIKE',
        data,
        message,
        sender: { connect: { id: userId } },
        reciever: { connect: { id: requestRecieverId } },
        likePost: { connect: { id: likePostId } },
        post: { connect: { id: postId } },
      },
    });
    this.emitNotificationList(
      `notifications.${requestRecieverId}`,
      notification,
    );
  }

  async acceptFollow({
    fcm,
    message,
    title,
    topic,
    requestedUserId,
    userFollowId,
    userId,
    data,
  }: acceptFollowProp) {
    if (fcm) {
      await this._firebase.push(fcm, {
        title,
        data,
        message,
        topic,
      });
    }
    await this._db.notification.create({
      data: {
        title,
        type: 'FOLLOW',
        data,
        message,
        sender: { connect: { id: userId } },
        reciever: { connect: { id: requestedUserId } },
        userFollow: { connect: { id: userFollowId } },
      },
    });
  }

  private timeAgoFormatter(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 30) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 31536000) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 31536000)}y`;
  }

  async getMine(user: User): Promise<APIResponseDTO> {
    const blockedUserIds = await this._util.getMyBlockedUserIds(user.id);

    const notifications = await this._db.notification.findMany({
      where: {
        recieverId: user.id,
        deletedAt: null,
        sender: {
          NOT: {
            id: {
              in: blockedUserIds,
            },
          },
        },
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        chat: true,
        commentPost: true,
        followRequest: true,
        likePost: true,
        likeReel: true,
        likeStory: true,
        post: true,
        story: true,
        reel: true,
        taggedPost: true,
        userFollow: true,
        data: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profile: {
              select: {
                id: true,
                path: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!notifications.length) {
      return {
        status: true,
        message: 'No Notifications available',
        data: [],
      };
    }

    const finalResponse = await this.notificationResponse(notifications);

    await this._db.notification.updateMany({
      where: { recieverId: user.id, deletedAt: null },
      data: {
        isRead: true,
      },
    });

    return {
      status: true,
      message: 'notifications found',
      data: finalResponse,
    };
  }

  private async notificationResponse(notifications) {
    const todayData = {
      title: 'Today',
      _count: 0,
      data: [],
    };
    const yesterData = {
      title: 'Yesterday',
      _count: 0,
      data: [],
    };
    const earlierData = {
      title: 'Earlier',
      _count: 0,
      data: [],
    };

    const today = startOfToday();
    const yesterday = startOfYesterday();

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.createdAt);
      const timeAgo = this.timeAgoFormatter(notificationDate);
      if (notificationDate >= today) {
        todayData.data.push({
          ...notification,
          timeAgo,
        });
        todayData._count++;
      } else if (notificationDate >= yesterday) {
        yesterData.data.push({
          ...notification,
          timeAgo,
        });
        yesterData._count++;
      } else {
        earlierData.data.push({
          ...notification,
          timeAgo,
        });
        earlierData._count++;
      }

      return notification;
    });

    const notificationResponse = [todayData, yesterData, earlierData].filter(
      (data) => data._count > 0,
    );

    return notificationResponse;
  }

  private emitNotificationList(event: string, data: any) {
    this._eventEmitter.emit(event, data);
  }
}

interface firebaseBody {
  fcm: string;
  title: string;
  topic: string;
  data?: any;
  message: string;
  userId: number;
}

interface followProp extends firebaseBody {
  toBeFollowUserId: number;
  userFollowId: number;
}

interface followRequest extends firebaseBody {
  followRequestId: number;
  requestRecieverId: number;
}

interface LikePostProp extends firebaseBody {
  likePostId: number;
  requestRecieverId: number;
  postId: number;
}

interface acceptFollowProp extends firebaseBody {
  requestedUserId: number;
  userFollowId: number;
}
