import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import {
  Consumer,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  Kafka,
} from 'kafkajs';

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER],
  });

  private readonly consumers: Consumer[] = [];

  async consume({ topic, config, groupId }: ConsumeKafkaProp) {
    const consumer = this.kafka.consumer({
      groupId: groupId || '_backend_insta',
    });
    await consumer.connect();
    await consumer.subscribe(topic);
    await consumer.run(config);
    this.consumers.push(consumer);
  }

  async onApplicationShutdown(signal?: string) {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}

interface ConsumeKafkaProp {
  topic: ConsumerSubscribeTopics;
  config: ConsumerRunConfig;
  groupId?: string;
}
