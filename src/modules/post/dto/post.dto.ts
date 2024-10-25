import { ApiProperty } from '@nestjs/swagger';
import { AudienceType, PostFeedType } from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  IsArray,
  IsNotEmpty,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class createPollDTO {
  @ApiProperty({ description: 'poll question', required: false })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiProperty({ description: 'poll answers', required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  options: string[];
}

export class CreatePostDto {
  @ApiProperty({ description: 'Caption for the post', required: false })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ description: 'media of the post', required: true })
  @IsNotEmpty()
  @IsArray()
  mediaIds: number[];

  @ApiProperty({
    description: 'Location associated with the post',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'ID of the music media associated with the post',
    required: false,
  })
  @IsOptional()
  @IsInt()
  musicId?: number;

  @ApiProperty({
    description: 'Audience type of the post',
    enum: AudienceType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AudienceType)
  audience?: AudienceType;

  @ApiProperty({
    description: 'Feed type of the post',
    enum: PostFeedType,
    default: PostFeedType.ONFEED,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostFeedType)
  feedType?: PostFeedType;

  @ApiProperty({
    description: 'Array of poll IDs associated with the post',
    required: false,
  })
  @IsOptional()
  @IsArray()
  poll?: createPollDTO;
}

export class UpdatePostDto {
  @ApiProperty({ description: 'Caption for the post', required: false })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ description: 'media of the post', required: true })
  @IsNotEmpty()
  @IsArray()
  mediaIds: number[];

  @ApiProperty({
    description: 'Location associated with the post',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'ID of the music media associated with the post',
    required: false,
  })
  @IsOptional()
  @IsInt()
  musicId?: number;

  @ApiProperty({
    description: 'Audience type of the post',
    enum: AudienceType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AudienceType)
  audience?: AudienceType;

  @ApiProperty({
    description: 'Feed type of the post',
    enum: PostFeedType,
    default: PostFeedType.ONFEED,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostFeedType)
  feedType?: PostFeedType;
}