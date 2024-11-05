import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { sendMessageDto } from './dto/chat.dto';
import { APIResponseDTO } from 'src/core/response/response.schema';

@WebSocketGateway({ transports: ['websocket'], cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private _chat: ChatService) {}

  private activeUsers = new Map<string, string>();

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('client connected ++>', client.id, client.rooms);
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected ++>', client.id, client.rooms);
    this.activeUsers.delete(client.id);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(client: Socket, payload: sendMessageDto) {
    // Use the ChatService to save the message to the database
    const message = await this._chat.storeMessage(payload);
    const chat = await this._chat.findById(payload.chatId);

    // Broadcast the message to the other participant(s)
    if (chat) {
      chat.ChatParticipants.forEach((participant: any) => {
        if (
          this.activeUsers.has(participant.userId) &&
          participant.userId !== payload.messageSenderId
        ) {
          const targetSocketId = Array.from(this.activeUsers.entries()).find(
            ([, userId]) => userId === participant.userId,
          )?.[0];
          if (targetSocketId) {
            this.server.to(targetSocketId).emit('new_message', message);
          }
        }
      });
    }
  }

  @SubscribeMessage('initiate_chat')
  async handleInitiateChat(
    client: Socket,
    payload: { userId: number; targetUserId: number },
  ) {
    const chat = await this._chat.initiate(
      payload.userId,
      payload.targetUserId,
    );
    client.emit('chatInitiated', chat);
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    client: Socket,
    userId: number,
    chatId: number,
  ): Promise<APIResponseDTO> {
    this.activeUsers.set(client.id, userId.toString());
    console.log(`User ${userId} joined chat with socket ID: ${client.id}`);

    client.join(chatId.toString());

    try {
      const messages = await this._chat.getMessages(userId, chatId);
      client.emit('messages', messages);

      return { status: true, message: 'sucessfull', data: messages };
    } catch (error) {
      console.error(
        `Error retrieving messages for user ${userId} in chat ${chatId}:`,
        error,
      );
      client.emit('error', { message: 'Could not retrieve messages.' });
      return {
        status: false,
        message: 'Could not retrieve messages.',
        data: null,
      };
    }
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(client: Socket, userId: number) {
    // Remove the user from active users
    this.activeUsers.delete(client.id);
    console.log(`user:${userId} has left chat`);
  }

  @SubscribeMessage('chat_listing')
  async chatListing(client: Socket, payload: { userId: number }) {
    const listing = await this._chat.listing(payload.userId);
    client.emit('chat_list', {
      status: true,
      message: 'chat_listing found',
      data: listing,
    });
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    client: Socket,
    payload: { messageId: number; chatId: number; userId: number },
  ) {
    const deletedMessage = await this._chat.deleteMessage(
      payload.messageId,
      payload.chatId,
      payload.userId,
    );

    // Notify other participants in the chat about the deleted message
    if (deletedMessage) {
      this.server.to(payload.chatId.toString()).emit('message_deleted', {
        messageId: payload.messageId,
        userId: payload.userId,
      });
    }
  }
}
