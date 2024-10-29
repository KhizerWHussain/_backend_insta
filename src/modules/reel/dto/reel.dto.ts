import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReelDto {
  @ApiProperty({
    description: 'caption (text-overlay) of reel',
    required: false,
  })
  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  caption: string;

  @ApiProperty({ description: 'media of reel (Video)' })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  mediaIds: number[];

  @ApiProperty({ description: 'music of reel', required: false })
  @IsOptional()
  @ApiPropertyOptional()
  @IsNumber()
  musicId: number;
}
