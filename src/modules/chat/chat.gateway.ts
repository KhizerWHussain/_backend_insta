import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true }) // Enable CORS for the gateway
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private _chat: ChatService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(client: Socket, payload: any) {
    // Broadcast the message to other clients
    this.server.emit('receiveMessage', payload);
  }
}
