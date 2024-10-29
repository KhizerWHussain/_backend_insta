import { Test, TestingModule } from '@nestjs/testing';
import { ReelService } from './reel.service';

describe('ReelService', () => {
  let service: ReelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReelService],
    }).compile();

    service = module.get<ReelService>(ReelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
