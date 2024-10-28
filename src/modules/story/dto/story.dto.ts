import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceType, MediaType } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateStoryDto {
  @ApiProperty({ description: 'audience type of story', required: false })
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(AudienceType)
  audienceType?: AudienceType;

  @ApiProperty({
    description: 'collage media (IMAGE, VIDEO) in layout',
    required: true,
  })
  @ApiPropertyOptional()
  //   @IsOptional()
  @IsBoolean()
  collage: boolean;

  @ApiProperty({
    description: 'mediaIds fo uploaded media (IMAGE, VIDEO)',
    required: true,
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  mediaIds: number[];

  @ApiProperty({
    description: 'enum for mediaType',
    required: true,
    enum: MediaType,
  })
  @IsNotEmpty()
  @IsEnum([MediaType.IMAGE, MediaType.VIDEO], { message: 'invalid media' })
  mediaType: MediaType;

  @ApiProperty({
    description: 'optional caption for story',
    required: false,
  })
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;
}
