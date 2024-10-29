import { Test, TestingModule } from '@nestjs/testing';
import { ReelController } from './reel.controller';
import { ReelService } from './reel.service';

describe('ReelController', () => {
  let controller: ReelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReelController],
      providers: [ReelService],
    }).compile();

    controller = module.get<ReelController>(ReelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
