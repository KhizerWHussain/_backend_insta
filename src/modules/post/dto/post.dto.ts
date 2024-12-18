import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceType, PostFeedType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsArray,
  IsNotEmpty,
  ArrayMaxSize,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
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
  @ArrayMinSize(1, { message: 'must contain atleast one media' })
  mediaIds: number[];

  @ApiProperty({
    description: 'ids of user to be tagged in the post',
    required: false,
  })
  @IsOptional()
  @IsArray()
  userIds: number[];

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
    minLength: 1,
    isArray: true,
    type: [createPollDTO],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'atleast one poll must be created' })
  @ValidateNested({ each: true })
  @Type(() => createPollDTO)
  poll?: createPollDTO[];
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

export class UpdatePostFeedTypeDto {
  @ApiProperty({
    description: 'post feed type',
    required: true,
    enum: PostFeedType,
  })
  @IsNotEmpty()
  @IsEnum(PostFeedType)
  feedType: PostFeedType;

  @ApiProperty({
    description: 'postId',
  })
  @IsNumber()
  @IsNotEmpty()
  postId: number;
}

export class savedPostDTO {
  @ApiProperty({ description: 'saved post folder id' })
  @IsOptional()
  @IsNumber()
  savedPostFolderId?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  postId: number;
}

export class createSavedPostFolderDto {
  @ApiProperty({ description: 'name of saved post folder' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class commentOnPostDto {
  @ApiProperty({ description: 'parent comment id', required: false })
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  parentCommentId?: number;

  @ApiProperty({ description: 'comment', required: true })
  @IsNotEmpty()
  @IsString()
  comment: string;
}

export class likeCommentOfPostDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  postId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  commentId: number;
}

export class PollAnswerDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  pollId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  postId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  option: string;
}

export class getLikesOfCommentInAPostDto {
  @ApiProperty({ description: 'comment id', required: true })
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  commentId: number;

  @ApiProperty({ description: 'comment', required: true })
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  postId: number;
}

export class sharePostToChatDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  chatId?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  postId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sharingToUserId: number;
}
