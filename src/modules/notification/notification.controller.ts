import { Controller, Body, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { Authorized, CurrentUser, Post } from 'src/core/decorators';
import { User } from '@prisma/client';
import { APIResponseDTO } from 'src/core/response/response.schema';

@Controller('notification')
export class NotificationController {
  constructor(private readonly _notificationService: NotificationService) {}

  // @Authorized()
  // @Post({
  //   path: '/create/notification',
  //   description: 'create notifcation by  user (test)',
  //   response: APIResponseDTO,
  // })
  // async create(
  //   @CurrentUser() user: User,
  //   @Body() payload: CreateNotificationDto,
  // ) {
  //   return await this._notificationService.create(payload);
  // }

  // @Get()
  // findAll() {
  //   return this.notificationService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.notificationService.findOne(+id);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.notificationService.remove(+id);
  // }
}
