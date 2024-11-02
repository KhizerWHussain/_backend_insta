import { Injectable, NotFoundException } from '@nestjs/common';
import { APIResponseDTO } from '../../core/response/response.schema';
import DatabaseService from '../../database/database.service';
import CreateDeviceRequestDTO from './dto/request/create.request';
import CreateDeviceResponseDTO from './dto/response/create.response';

@Injectable()
export default class DeviceService {
  constructor(private _dbService: DatabaseService) {}

  async create(data: CreateDeviceRequestDTO): Promise<CreateDeviceResponseDTO> {
    return await this._dbService.device.create({
      data: {
        type: data.type,
        userId: data.userId,
        authToken: data.authToken,
        fcmToken: data.fcmToken,
      },
    });
  }

  async findById(id: number): Promise<CreateDeviceResponseDTO> {
    const device = await this._dbService.device.findFirst({ where: { id } });
    if (!device) {
      throw new NotFoundException('User device not found');
    }
    return device;
  }

  async updateFcm(
    authToken: string,
    fcmToken: string,
  ): Promise<APIResponseDTO> {
    const device = await this._dbService.device.findFirst({
      where: { authToken },
    });

    if (!device) {
      throw new NotFoundException('User device not found');
    }

    await this._dbService.device.update({
      where: { id: device.id },
      data: { fcmToken },
    });

    return { status: true, message: 'Success' };
  }

  async delete(authToken: string): Promise<APIResponseDTO> {
    const device = await this._dbService.device.findFirst({
      where: { authToken },
      select: { id: true },
    });

    if (!device) {
      throw new NotFoundException('User device not found');
    }

    await this._dbService.device.delete({
      where: { id: device.id },
    });

    return { status: true, message: 'Success' };
  }

  async deleteAll(userId: number): Promise<APIResponseDTO> {
    const result = await this._dbService.device.deleteMany({
      where: { userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('User device not found');
    }

    return { status: true, message: 'Success' };
  }
}
