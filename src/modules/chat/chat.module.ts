import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import DatabaseModule from 'src/database/database.module';
import { UtilityModule } from 'src/util/utility.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [DatabaseModule, UtilityModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
