import { Controller, Body } from '@nestjs/common';
import { KafkaService } from './kafka.service';

@Controller('kafka')
export class KafkaController {
  constructor(private readonly _kafka: KafkaService) {}
}
