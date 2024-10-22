import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import RedisService from 'core/cache/redis.service';
import DatabaseService from 'database/database.service';
import { DeviceType, User } from '@prisma/client';
import AppConfig from 'configs/app.config';
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
        private _cacheService: RedisService,
        private _databaseService: DatabaseService,
        private _deviceService: DeviceService,
    ) {}

    private _generateToken() {
        return uuid();
    }

    async CreateSession(userId: number, fcmToken?: string, type: DeviceType = 'ANDROID'): Promise<string> {
        const Token = this._generateToken();
        const Auth = new AuthModel(userId);
        await this._cacheService.Set(Token, Auth, AppConfig.APP.TOKEN_EXPIRATION);
        const currentUserDevice = await this._databaseService.device.findFirst({
            where: { userId: userId },
            select: { fcmToken: true, id: true, authToken: true },
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
        const Auth: AuthModel = await this._cacheService.Get(token);
        if (!Auth) return null;
        Auth.user = await this._databaseService.user.findFirst({
            where: { id: Auth.id },
        });

        return Auth;
    }

    async DestroySession(token: string) {
        const Auth: AuthModel = await this._cacheService.Get(token);
        if (!Auth) return null;
        await this._cacheService.Delete(token);
        await this._deviceService.Delete(token);
        return true;
    }

    async RefreshTokenTime(token: string) {
        const Auth: AuthModel = await this._cacheService.Get(token);
        await this._cacheService.Set(token, Auth, AppConfig.APP.TOKEN_EXPIRATION);
    }
}
