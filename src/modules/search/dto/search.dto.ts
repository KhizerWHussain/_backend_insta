import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class basicSearchDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  keyword?: string;
}

export class keywordSearchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  keyword: string;
}
