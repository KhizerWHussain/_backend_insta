import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class RandomChatDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsNumber()
  @IsPositive()
  acountId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  chatMediaIds?: number[];

  //   @ApiPropertyOptional()
  //   @IsOptional()
  //   @IsInt()
  //   @IsNumber()
  //   @IsPositive()
  //   postId?: number;

  //   @ApiPropertyOptional()
  //   @IsOptional()
  //   @IsInt()
  //   @IsNumber()
  //   @IsPositive()
  //   storyId?: number;

  //   @ApiPropertyOptional()
  //   @IsOptional()
  //   @IsInt()
  //   @IsNumber()
  //   @IsPositive()
  //   reelId?: number;
}
