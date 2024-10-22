import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';
import { IsOptional, IsString, Length } from 'class-validator';

export default class CreateDeviceResponseDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: number;

    @ApiProperty({ enum: DeviceType })
    type: DeviceType;

    @ApiProperty()
    @IsString()
    @Length(1, 255)
    authToken: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    fcmToken: string;
}
