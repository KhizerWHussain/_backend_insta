import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class basicSearchDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  keyword?: string;
}
