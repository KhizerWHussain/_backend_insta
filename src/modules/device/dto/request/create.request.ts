import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';

export default class CreateDeviceRequestDTO {
    @ApiProperty({ enum: DeviceType })
    @IsEnum(DeviceType)
    type: DeviceType;

    @ApiProperty()
    @IsInt()
    userId: number;

    @ApiProperty()
    @IsString()
    @Length(1, 255)
    authToken: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 255)
    fcmToken?: string;
}
