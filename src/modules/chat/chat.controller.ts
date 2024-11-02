import { Controller, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Authorized, CurrentUser, Post } from 'src/core/decorators';
import { APIResponseDTO } from 'src/core/response/response.schema';
import { User } from '@prisma/client';
import { RandomChatDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly _chat: ChatService) {}

  @Authorized()
  @Post({
    path: '/initiate/nonfriend',
    description: 'Initiate Chat with Non Friend',
    response: APIResponseDTO,
  })
  async createEvent(@CurrentUser() user: User, @Body() payload: RandomChatDto) {
    return await this._chat.initiateWithRandomAccount(user, payload);
  }
}
