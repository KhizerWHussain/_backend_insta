import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReelService } from './reel.service';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';

@Controller('reel')
export class ReelController {
  constructor(private readonly reelService: ReelService) {}

  @Post()
  create(@Body() createReelDto: CreateReelDto) {
    return this.reelService.create(createReelDto);
  }

  @Get()
  findAll() {
    return this.reelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reelService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReelDto: UpdateReelDto) {
    return this.reelService.update(+id, updateReelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reelService.remove(+id);
  }
}
