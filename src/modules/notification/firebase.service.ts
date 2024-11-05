import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';
// import { readFileSync } from 'fs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FirebaseAdminService {
  private instance: admin.app.App;

  // private fcmToken =
  // 'f4I4lebSsK4IE8dSMRO-bG:APA91bEEcbvhpT48or-1-ZbZzgr0yynokaIO8rbhGiAqMtleJFzYlHZ7Xha6VKf6RnxIrAlYxAtuDCJCU4F6ApQrV9-EJMTyE6-7CyVJU05EooCFhvUJID0';

  constructor() {
    // const firebaseCredentials = JSON.parse(
    //   readFileSync(process.cwd() + '/firebase_console_insta.json', {
    //     encoding: 'utf-8',
    //   }),
    // );
    this.instance = admin.initializeApp({
      // credential: admin.credential.cert(firebaseCredentials),
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines
      }),
    });
  }

  private async createPayload(message: MessagePush, token: string) {
    const payload: admin.messaging.TokenMessage = {
      notification: {
        title: message.title,
        body: message.message,
      },
      android: {
        priority: 'normal',
        collapseKey: message.collapseKey,
      },
      fcmOptions: {
        analyticsLabel: `${message.title}.${token}`,
      },
      data: message?.data || {},
      token: token,
    };

    return payload;
  }

  private async createMultiPayload(message: MessagePush, tokens: string[]) {
    const payload: admin.messaging.MulticastMessage = {
      notification: {
        title: message.title,
        body: message.message,
      },
      android: {
        priority: 'normal',
        collapseKey: message.collapseKey,
      },
      fcmOptions: {
        analyticsLabel: `${message.title}.${tokens.join(',')}`,
      },
      data: message?.data || {},
      tokens: tokens,
    };

    return payload;
  }

  private async subscribe(tokens: string[] | string, topic: string) {
    const templateTopic = `notification-${topic}-${uuid()}`;
    try {
      return await this.instance
        .messaging()
        .subscribeToTopic(tokens, templateTopic);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  private async unsubscribe(tokens: string[] | string, topic: string) {
    const templateTopic = `notification-${topic}-${uuid()}`;
    try {
      return await this.instance
        .messaging()
        .unsubscribeFromTopic(tokens, templateTopic);
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
    }
  }

  async pushMulti(tokens: string[], message: MessagePushMulti) {
    await this.subscribe(tokens, message.topic);
    const payload = await this.createMultiPayload(message, tokens);

    try {
      const notificationSend = await this.instance
        .messaging()
        .sendEachForMulticast(payload);
      console.log('notificationSend ==>', notificationSend);

      if (notificationSend.failureCount > 0) {
        notificationSend.responses.forEach((response, index) => {
          if (!response.success) {
            console.error(
              `Failed to send message to ${tokens[index]}: ${response.error?.message}`,
            );
          }
        });
      }
    } catch (error) {
      this.errorHandler(error);
      await this.unsubscribe(tokens, message.topic);
    }
  }

  async push(token: string | null, message: MessagePushMulti) {
    await this.subscribe(token, message.topic);
    const payload = await this.createPayload(message, token);
    try {
      const notificationSend = await this.instance.messaging().send(payload);
      console.log('notificationSend ==>', notificationSend);
      return notificationSend;
    } catch (error) {
      this.errorHandler(error);
      await this.unsubscribe(token, message.topic);
    }
  }

  private errorHandler(error: any) {
    if (error.code === 'messaging/invalid-registration-token') {
      console.error('Invalid FCM token:', error.message);
    } else if (error.code === 'messaging/registration-token-not-registered') {
      console.error('FCM token not registered:', error.message);
    } else {
      console.error('Error sending FCM notification:', error);
    }
  }
}

interface MessagePush {
  title: string;
  message: string;
  data?: any;
  collapseKey?: string;
}

interface MessagePushMulti extends MessagePush {
  topic?: string;
}
