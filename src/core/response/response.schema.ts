import { ApiProperty } from '@nestjs/swagger';

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
export class MessageResponseDTO {
    @ApiProperty()
    status?: boolean;

    @ApiProperty()
    message: string;
}
export class BooleanResponseDTO {
    @ApiProperty()
    data: boolean;
}

export class StringResponseDTO {
    @ApiProperty()
    data: string;
}
