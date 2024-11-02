import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class BadRequestExceptionResponse {
  @ApiProperty({ default: 'Bad request. check input' })
  message: string;

  @ApiProperty({ nullable: true, default: null })
  errors: { [key: string]: string };
}
export class NotFoundExceptionResponse {
  @ApiProperty({ default: 'Not found' })
  message: string;
}
export class ForbiddenExceptionResponse {
  @ApiProperty({ default: 'Access not allowed' })
  message: string;
}
export class UnauthorizedExceptionResponse {
  @ApiProperty({ default: 'Not authorized' })
  message: string;
}
export class FatalErrorExceptionResponse {
  @ApiProperty({ default: 'Something went wrong' })
  message: string;
}
export class APIResponseDTO {
  @ApiPropertyOptional()
  status: boolean;

  @ApiProperty()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional()
  data?: any;

  @ApiPropertyOptional()
  test?: any;
}
