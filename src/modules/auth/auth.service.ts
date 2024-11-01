import { Injectable, UnauthorizedException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import DatabaseService from '../../database/database.service';
import { DeviceType, User } from '@prisma/client';
import DeviceService from '../device/device.service';
import { RedisService } from 'src/redis/redis.service';
import { UtilityService } from 'src/util/utility.service';

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
    private readonly _db: DatabaseService,
    private readonly _device: DeviceService,
    private readonly _redis: RedisService,
    private readonly _util: UtilityService,
  ) {}

  private createToken() {
    return uuid();
  }

  async createSession(
    userId: number,
    fcmToken?: string,
    type: DeviceType = 'ANDROID',
  ): Promise<string> {
    const loginUserToken = await this._db.device.findFirst({
      where: { userId: userId, deletedAt: null },
      select: { authToken: true },
    });

    if (loginUserToken) {
      await this.destroySession(loginUserToken.authToken);
    }

    const uniqueToken = this.createToken();

    const loginExpiry_6hours = await this._util.createExpiryTime({
      time: 6,
      lap: 'hours',
    });

    const Auth = new AuthModel(userId);

    await this._redis.set(uniqueToken, Auth, 'EX', loginExpiry_6hours);
    await this._device.create({
      type,
      userId,
      authToken: uniqueToken,
      fcmToken,
    });
    return uniqueToken;
  }

  async getSession(token: string): Promise<AuthModel> {
    const redisAuth: AuthModel = await this._redis.get(token);
    if (!redisAuth) return null;

    redisAuth.user = await this._db.user.findFirst({
      where: { id: redisAuth['id'] },
    });

    return redisAuth;

    // const deviceSession = await this._db.device.findFirst({
    //   where: { authToken: token, deletedAt: null },
    //   select: { userId: true },
    // });

    // if (!deviceSession) {
    //   throw new UnauthorizedException('Session not found');
    // }

    // const user = await this._db.user.findFirst({
    //   where: { id: deviceSession.userId },
    // });

    // if (!user) {
    //   throw new UnauthorizedException('User not found');
    // }

    // const auth: AuthModel = { id: user.id, user: user };
    // return auth;
  }

  async destroySession(token: string) {
    // const redisAuth: AuthModel = await this._redis.get(token);
    // if (!redisAuth) return null;

    // console.log('token ==>', token);

    await this._redis.delete(token);
    await this._device.delete(token);

    return true;
  }

  async RefreshTokenTime(token: string) {
    const redisAuth: AuthModel = await this._redis.get(token);
    await this._redis.set(token, redisAuth, process.env.TOKEN_EXPIRATION);
  }
}
