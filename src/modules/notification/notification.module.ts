import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import DatabaseModule from 'src/database/database.module';
import { FirebaseAdminService } from './firebase.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseAdminService],
  exports: [NotificationService],
})
export class NotificationModule {}
