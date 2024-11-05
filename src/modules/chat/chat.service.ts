import { BadRequestException, Injectable } from '@nestjs/common';
import DatabaseService from 'src/database/database.service';
import { RandomChatDto, sendMessageDto } from './dto/chat.dto';
import { ChatType, Message, User } from '@prisma/client';
import { UtilityService } from 'src/util/utility.service';
import { APIResponseDTO } from 'src/core/response/response.schema';

@Injectable()
export class ChatService {
  constructor(
    private readonly _db: DatabaseService,
    private readonly _util: UtilityService,
  ) {}

  // api
  async initiateWithRandom(
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
        ChatParticipants: {
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
          ChatParticipants: {
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

  async storeMessage(payload: sendMessageDto) {
    const message = await this._db.message.create({
      data: {
        chatId: payload.chatId,
        messageSenderId: payload.messageSenderId,
        text: payload.message,
        mediaContent: {
          connect: payload.chatMediaIds.length
            ? payload.chatMediaIds?.map((mediaId: number) => ({
                id: mediaId,
              })) || []
            : undefined,
        },
        chatPostId: payload.postId || null,
        chatStoryId: payload.storyId || null,
        chatReelId: payload.reelId || null,
        sharedUserId: payload.sharedUserId || null,
        type: Array.isArray(payload.messageType)
          ? payload.messageType
          : [payload.messageType],
      },
    });
    return message;
  }

  async findById(chatId: number) {
    return this._db.chat.findUnique({
      where: { id: chatId },
      include: { ChatParticipants: true },
    });
  }

  async initiate(userId: number, targetUserId: number) {
    await this._util.checkMultipleUsersExistOrNot([userId, targetUserId]);
    const checkIfUserBlocked = await this._util.findBlockOnBothSides(
      userId,
      targetUserId,
    );

    if (checkIfUserBlocked) {
      throw new BadRequestException('cannot chat with blocked users');
    }

    console.log('userId ==>', userId);
    console.log('targetUserId ==>', targetUserId);

    let chat = await this._db.chat.findFirst({
      where: {
        type: 'PRIVATE',
        ChatParticipants: {
          some: {
            OR: [{ id: userId }, { id: targetUserId }],
          },
        },
      },
      include: { ChatParticipants: true, chatMessage: true },
    });

    // If not, create a new chat
    if (!chat) {
      chat = await this._db.chat.create({
        data: {
          chatCreator: { connect: { id: userId } },
          type: 'PRIVATE',
          ChatParticipants: {
            create: [
              { user: { connect: { id: userId } } }, // Connect the first participant (you)
              { user: { connect: { id: targetUserId } } }, // Connect the second participant
            ],
          },
        },
        include: { ChatParticipants: true, chatMessage: true },
      });
    }
    return chat;
  }

  // my chat listing
  async listing(userId: number) {
    const chats = await this._db.chat.findMany({
      where: {
        ChatParticipants: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        ChatParticipants: {
          where: {
            userId: {
              not: userId,
            },
          },
          select: {
            userId: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                profile: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          },
        },
        chatMessage: {
          select: {
            chatPost: true,
            chatReel: true,
            id: true,
            chatStory: true,
            text: true,
            createdAt: true,
            mediaContent: true,
            sharedUser: true,
            type: true,
            messageSender: {
              select: {
                id: true,
                firstName: true,
                profile: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          },
          // where: {deletedAt: null},
          orderBy: {
            createdAt: 'desc', // Get the last message first
          },
          take: 1, // Only take the latest message for each chat
        },
      },
    });

    const response = chats.map((chat) => ({
      chat: chat,
      recent: {
        message: chat.chatMessage[0]?.text || null,
        time: chat.chatMessage[0]?.createdAt.toISOString(),
      },
    }));

    return response;
  }

  async deleteMessage(
    messageId: number,
    chatId: number,
    userId: number,
  ): Promise<Message> {
    return await this._db.message.delete({
      where: { id: messageId, chatId, messageSenderId: userId },
    });
  }

  async getMessages(userId: number, chatId: number) {
    await this._util.findChatById(chatId);

    const chatMessages = await this._db.message.findMany({
      where: {
        chatId,
        deletedAt: null,
        chat: { ChatParticipants: { some: { id: userId } } },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        text: true,
        chatId: true,
        sharedUser: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                path: true,
              },
            },
          },
        },
        mediaContent: {
          select: {
            id: true,
            type: true,
            path: true,
            name: true,
          },
        },
        chatStory: {
          select: {
            id: true,
            caption: true,
            media: {
              select: {
                id: true,
                path: true,
              },
            },
            creator: {
              select: {
                id: true,
                fullName: true,
                profile: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          },
        },
        chatReel: {
          select: {
            id: true,
            caption: true,
            media: {
              select: {
                id: true,
                path: true,
              },
            },
            creator: {
              select: {
                id: true,
                fullName: true,
                profile: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          },
        },
        chatPost: {
          select: {
            id: true,
            caption: true,
            media: {
              select: {
                id: true,
                path: true,
              },
            },
            creator: {
              select: {
                id: true,
                fullName: true,
                profile: {
                  select: {
                    path: true,
                  },
                },
              },
            },
          },
        },
        messageSender: {
          select: {
            id: true,
            fullName: true,
            profile: {
              select: {
                path: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return chatMessages;
  }
}
