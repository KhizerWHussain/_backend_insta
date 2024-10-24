import { Injectable, UnauthorizedException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import DatabaseService from '../../database/database.service';
import { DeviceType, User } from '@prisma/client';
// import AppConfig from '../../configs/app.config';
import DeviceService from '../device/device.service';

export class AuthModel {
  id: number;
  user: User | null;

  constructor(id: number, user?: User) {
    this.id = id;
    if (user) {
      this.user = user;
    }
  }
}

@Injectable()
export default class AuthService {
  constructor(
    private _databaseService: DatabaseService,
    private _deviceService: DeviceService,
  ) {}

  private _generateToken() {
    return uuid();
  }

  async CreateSession(
    userId: number,
    fcmToken?: string,
    type: DeviceType = 'ANDROID',
  ): Promise<string> {
    const Token = this._generateToken();
    // const Auth = new AuthModel(userId);
    const currentUserDevice = await this._databaseService.device.findFirst({
      where: { userId: userId },
      select: { id: true, authToken: true },
    });
    if (currentUserDevice) {
      await this.DestroySession(currentUserDevice.authToken);
    }
    await this._deviceService.Create({
      type,
      userId,
      authToken: Token,
      fcmToken,
    });
    return Token;
  }
  async GetSession(token: string): Promise<AuthModel> {
    const deviceSession = await this._databaseService.device.findFirst({
      where: { authToken: token, deletedAt: null },
      select: { userId: true },
    });

    if (!deviceSession) {
      throw new UnauthorizedException('Session not found');
    }

    const user = await this._databaseService.user.findFirst({
      where: { id: deviceSession.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const auth: AuthModel = { id: user.id, user: user };
    return auth;
  }

  async DestroySession(token: string) {
    await this._deviceService.Delete(token);
    return true;
  }

  async RefreshTokenTime(token: string) {}
}
