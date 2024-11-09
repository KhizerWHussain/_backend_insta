import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../consumer.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  constructor(private readonly _consumer: ConsumerService) {}

  async onModuleInit() {
    await this._consumer.consume({
      topic: { topics: ['notifications'], fromBeginning: true },
      config: {
        eachMessage: async ({
          message,
          heartbeat,
          partition,
          pause,
          topic,
        }) => {
          console.log('heartbeat ==>', heartbeat);
          console.log('message ==>', message);
          console.log('partition ==>', partition);
          console.log('pause ==>', pause);
          console.log('topic ==>', topic);
        },
      },
    });
  }
}
