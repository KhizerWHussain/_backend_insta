import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  async send(fcmToken: string, payload: admin.messaging.MessagingPayload) {
    try {
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      console.log('Notification sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Notification failed');
    }
  }
}
