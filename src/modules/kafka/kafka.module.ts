import { Module } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { ConsumerService } from './consumer.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ProducerService, ConsumerService],
  exports: [ProducerService, ConsumerService],
})
export class KafkaModule {}
