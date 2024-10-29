import { Injectable } from '@nestjs/common';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';

@Injectable()
export class ReelService {
  create(createReelDto: CreateReelDto) {
    return 'This action adds a new reel';
  }

  findAll() {
    return `This action returns all reel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reel`;
  }

  update(id: number, updateReelDto: UpdateReelDto) {
    return `This action updates a #${id} reel`;
  }

  remove(id: number) {
    return `This action removes a #${id} reel`;
  }
}
