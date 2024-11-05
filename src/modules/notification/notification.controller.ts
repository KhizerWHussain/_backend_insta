import { BadRequestException, Controller, Param, Sse } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Authorized, CurrentUser, Get } from 'src/core/decorators';
import { User } from '@prisma/client';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { Observable } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly _notificationService: NotificationService,
    private readonly _eventEmitter: EventEmitter2,
  ) {}

  @Authorized()
  @Get({
    path: '/getMine',
    description: 'getting all my (user) notifications',
    response: APIResponseDTO,
  })
  async getNotifications(@CurrentUser() user: User) {
    return await this._notificationService.getMine(user);
  }

  // event emitter notification work
  @Authorized()
  @Sse('sse/:userId')
  sse(
    @Param('userId') userId: number,
    @CurrentUser() user: User,
  ): Observable<any> {
    if (user.id !== userId) {
      throw new BadRequestException(
        'Unauthorized: You can only listen to your own notifications',
      );
    }

    return new Observable((observer) => {
      const onNewNotification = (notification: any) => {
        observer.next({ event: 'newNotification', data: notification });
      };

      this._eventEmitter.on(`notifications.${user.id}`, onNewNotification);

      return () => {
        this._eventEmitter.off(`notifications.${user.id}`, onNewNotification);
      };
    });
  }
}
