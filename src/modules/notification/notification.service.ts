import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from './firebase.service';
import DatabaseService from 'src/database/database.service';
import { NotificationType, Prisma, User } from '@prisma/client';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { UtilityService } from 'src/util/utility.service';
import { startOfToday } from 'date-fns';
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
        type: NotificationType.FOLLOW,
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
        type: NotificationType.FOLLOW,
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
        type: NotificationType.POST_LIKE,
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
        type: NotificationType.FOLLOW,
        data,
        message,
        sender: { connect: { id: userId } },
        reciever: { connect: { id: requestedUserId } },
        userFollow: { connect: { id: userFollowId } },
      },
    });
  }

  async taggedOnPost({
    fcms,
    message,
    taggedUserIds,
    title,
    topic,
    userId,
    data,
    taggedPostIds,
    postId,
    prisma,
  }: taggedOnPostProp) {
    if (fcms.length > 0) {
      await this._firebase.pushMulti(fcms, {
        title,
        data,
        message,
        topic,
      });
    }
    const manyData = taggedUserIds.map((tagUserId: number, index: number) => ({
      title,
      type: NotificationType.TAG_POST,
      data,
      message,
      postId: postId,
      senderId: userId,
      recieverId: tagUserId,
      taggedPostId: taggedPostIds[index], // Use the index to get the corresponding taggedPostId
    }));

    await prisma.notification.createMany({
      data: manyData,
    });
  }

  async likeOnStory({
    fcm,
    likeStoryId,
    message,
    title,
    topic,
    userId,
    data,
    requestRecieverId,
    storyId,
  }: LikeOnStoryProp) {
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
        type: NotificationType.STORY_LIKE,
        data,
        message,
        sender: { connect: { id: userId } },
        reciever: { connect: { id: requestRecieverId } },
        likeStory: { connect: { id: likeStoryId } },
        story: { connect: { id: storyId } },
      },
    });
    this.emitNotificationList(
      `notifications.${requestRecieverId}`,
      notification,
    );
  }

  async likeOnReel({
    fcm,
    message,
    title,
    topic,
    userId,
    data,
    requestRecieverId,
    likeReelId,
    reelId,
  }: LikeOnReelProp) {
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
        type: NotificationType.REEL_LIKE,
        data,
        message,
        sender: { connect: { id: userId } },
        reciever: { connect: { id: requestRecieverId } },
        likeReel: { connect: { id: likeReelId } },
        reel: { connect: { id: reelId } },
      },
    });
    this.emitNotificationList(
      `notifications.${requestRecieverId}`,
      notification,
    );
  }

  async pushOnPostComment({
    fcmTokens,
    message,
    isParentComment,
    requestRecieverIds,
    title,
    topic,
    userId,
    data,
    parentCommentId,
    postCreatorId,
    commentPostId,
    postId,
    prismaInstance,
  }: commentOnPostOrReply) {
    if (isParentComment && typeof fcmTokens === 'string') {
      await this._firebase.push(fcmTokens, {
        title,
        data,
        message,
        topic,
      });
    } else {
      if (fcmTokens.length && Array.isArray(fcmTokens)) {
        await this._firebase.pushMulti(fcmTokens, {
          title,
          data,
          message,
          topic,
        });
      }
    }

    if (isParentComment && typeof requestRecieverIds === 'number') {
      const notification = await prismaInstance.notification.create({
        data: {
          title,
          type: NotificationType.COMMENT_POST,
          data,
          message,
          sender: { connect: { id: userId } },
          reciever: { connect: { id: requestRecieverIds } },
          commentPost: { connect: { id: commentPostId } },
          post: { connect: { id: postId } },
        },
      });
      this.emitNotificationList(
        `notifications.${requestRecieverIds}`,
        notification,
      );
    } else if (typeof requestRecieverIds !== 'number') {
      const manyData = requestRecieverIds.map((recieverId: number) => ({
        title,
        type: NotificationType.COMMENT_POST,
        data,
        message,
        senderId: userId,
        recieverId: recieverId,
        commentPostId: commentPostId,
        postId,
      }));

      await prismaInstance.notification.createMany({
        data: manyData,
        skipDuplicates: true,
      });

      requestRecieverIds.forEach((recieverId: number) => {
        const notification = {
          title,
          type: NotificationType.COMMENT_POST,
          data,
          message,
          senderId: userId,
          recieverId: recieverId,
          commentPostId: commentPostId,
          postId,
        };

        this.emitNotificationList(`notifications.${recieverId}`, notification);
      });
    }
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
        recieverId: true,
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
      title: 'new',
      _count: 0,
      data: [],
    };
    const last30DaysData = {
      title: 'last 30 days',
      _count: 0,
      data: [],
    };
    const olderData = {
      title: 'older',
      _count: 0,
      data: [],
    };

    const today = startOfToday();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.createdAt);
      const timeAgo = this.timeAgoFormatter(notificationDate);

      if (notificationDate >= today) {
        // If the notification is from today
        todayData.data.push({
          ...notification,
          timeAgo,
        });
        todayData._count++;
      } else if (notificationDate >= thirtyDaysAgo) {
        // If the notification is within the last 30 days
        last30DaysData.data.push({
          ...notification,
          timeAgo,
        });
        last30DaysData._count++;
      } else {
        // If the notification is older than 30 days
        olderData.data.push({
          ...notification,
          timeAgo,
        });
        olderData._count++;
      }
    });

    // Only return categories with notifications
    const notificationResponse = [todayData, last30DaysData, olderData].filter(
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

interface taggedOnPostProp {
  fcms: string[];
  title: string;
  topic: string;
  data?: any;
  message: string;
  userId: number;
  taggedUserIds: number[];
  taggedPostIds: number[];
  postId: number;
  prisma: Prisma.TransactionClient;
}

interface LikeOnStoryProp {
  fcm: string;
  likeStoryId: number;
  message: string;
  title: string;
  topic: string;
  userId: number;
  data?: any;
  requestRecieverId: number;
  storyId: number;
}

interface LikeOnReelProp extends firebaseBody {
  likeReelId: number;
  requestRecieverId: number;
  reelId: number;
}

interface commentOnPostOrReply {
  fcmTokens: string | string[];
  title: string;
  topic: string;
  data?: any;
  message: string;
  userId: number;

  parentCommentId?: number;
  postCreatorId?: number;
  requestRecieverIds: number | number[];
  isParentComment: boolean;
  commentPostId: number;
  postId: number;
  prismaInstance: Prisma.TransactionClient;
}
