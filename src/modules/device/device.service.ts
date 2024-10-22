import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageResponseDTO } from 'core/response/response.schema';
import DatabaseService from 'database/database.service';
import { GenerateUUID } from 'helpers/util.helper';
import CreateDeviceRequestDTO from './dto/request/create.request';
import CreateDeviceResponseDTO from './dto/response/create.response';

@Injectable()
export default class DeviceService {
    constructor(private _dbService: DatabaseService) {}

    async Create(data: CreateDeviceRequestDTO): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.create({
            data: {
                type: data.type,
                userId: data.userId,
                authToken: data.authToken,
                fcmToken: data?.fcmToken,
            },
        });
    }

    async FindById(id: number): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.findFirst({ where: { id } });
    }

    async UpdateFCMToken(authToken: string, fcmToken: string): Promise<MessageResponseDTO> {
        const device = await this._dbService.device.findFirst({
            where: {
                authToken,
            },
        });

        if (!device) {
            throw new NotFoundException('user.device_not_found');
        }

        await this._dbService.device.update({
            where: {
                id: device.id,
            },
            data: {
                fcmToken,
            },
        });

        return {
            message: 'Success',
        };
    }

    async Delete(authToken: string): Promise<MessageResponseDTO> {
        const device = await this._dbService.device.findFirst({
            where: {
                authToken,
            },
            select: { id: true },
        });

        if (!device) {
            throw new NotFoundException('user.device_not_found');
        }

        await this._dbService.device.delete({
            where: { id: device.id },
        });

        return { message: 'Success' };
    }

    async DeleteAll(userId: number): Promise<MessageResponseDTO> {
        const device = await this._dbService.device.findFirst({
            where: { userId },
        });

        if (!device) {
            throw new NotFoundException('user.device_not_found');
        }

        await this._dbService.device.deleteMany({
            where: { userId },
        });

        return { message: 'Success' };
    }
}
