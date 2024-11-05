import { Injectable } from '@nestjs/common';
import { FirebaseAdminService } from './firebase.service';
import DatabaseService from 'src/database/database.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly _firebase: FirebaseAdminService,
    private readonly _db: DatabaseService,
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
