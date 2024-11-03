import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatType, MessageType } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
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

export class sendMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsNumber()
  @IsPositive()
  acountId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsNumber()
  @IsPositive()
  messageSenderId: number;

  @ApiProperty({ enum: ChatType, required: true })
  @ArrayMinSize(1)
  @IsArray()
  @IsEnum(MessageType, { each: true, message: 'Invalid message type' })
  messageType: MessageType[];

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsNumber()
  @IsPositive()
  chatId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  chatMediaIds?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsNumber()
  @IsPositive()
  postId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsNumber()
  @IsPositive()
  storyId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsNumber()
  @IsPositive()
  reelId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsNumber()
  @IsPositive()
  sharedUserId?: number;
}
