import { BadRequestException, Injectable } from '@nestjs/common';
import DatabaseService from 'src/database/database.service';
import { RandomChatDto } from './dto/chat.dto';
import { ChatType, User } from '@prisma/client';
import { UtilityService } from 'src/util/utility.service';
import { APIResponseDTO } from 'src/core/response/response.schema';

@Injectable()
export class ChatService {
  constructor(
    private readonly _db: DatabaseService,
    private readonly _util: UtilityService,
  ) {}

  async initiateWithRandomAccount(
    user: User,
    payload: RandomChatDto,
  ): Promise<APIResponseDTO> {
    await this._util.checkUserExistOrNot({ userId: payload.acountId });
    const { acountId, message } = payload;

    const userBlockIf = await this._util.findBlockOnBothSides(
      user.id,
      payload.acountId,
    );
    if (userBlockIf) {
      throw new BadRequestException(`cannot chat with blocked user`);
    }

    const privateChatWithRandom = await this._db.chat.findFirst({
      where: {
        type: ChatType.PRIVATE,
        deletedAt: null,
        chatParticipants: {
          every: {
            id: {
              in: [acountId, user.id],
            },
          },
        },
      },
    });

    if (acountId === user.id) {
      throw new BadRequestException('cannot chat with yourself');
    }

    if (privateChatWithRandom) {
      throw new BadRequestException('already have chat with this account');
    }

    const chat = await this._db.$transaction(async (prisma) => {
      return await prisma.chat.create({
        data: {
          type: ChatType.PRIVATE,
          chatCreator: { connect: { id: user.id } },
          chatParticipants: {
            connect: [{ id: user.id }, { id: acountId }],
          },
          chatMessage: {
            create: {
              messageSenderId: user.id,
              text: message,
              type: ['TEXT'],
              mediaContent: payload.chatMediaIds !== null && {
                connect: payload.chatMediaIds.map((mediaId: number) => ({
                  id: mediaId,
                })),
              },
            },
          },
        },
      });
    });

    return {
      status: true,
      message: 'Message sent',
      data: chat,
    };
  }
}
