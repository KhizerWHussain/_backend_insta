import { Injectable, Logger } from '@nestjs/common';
import { Redis, RedisKey } from 'ioredis';

@Injectable()
export class RedisService {
  private redisClient: Redis;

  constructor() {
    try {
      const redisHost: any = process.env.REDIS_DB_HOST;
      const redisPort: any = process.env.REDIS_DB_PORT;
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
      });
    } catch (error) {
      console.log('ErrorInConnection ==> ', Logger.error(error));
    }
  }

  async keys(key: any) {
    return await this.redisClient.keys(key);
    this.redisClient.hgetall;
  }

  async set(key: string, value: any, secondsToken?: any, expireTime?: number) {
    if (secondsToken && expireTime) {
      return await this.redisClient.set(
        key,
        JSON.stringify(value),
        secondsToken,
        expireTime,
      );
    } else {
      return await this.redisClient.set(key, JSON.stringify(value));
    }
  }

  async get(key: RedisKey): Promise<any> {
    return JSON.parse(await this.redisClient.get(key));
  }

  async getWithoutParse(key: RedisKey) {
    return await this.redisClient.get(key);
  }

  async delete(key: RedisKey) {
    await this.redisClient.del(key);
  }

  async hset(key: RedisKey, hashKey: string | Buffer, value: any) {
    await this.redisClient.hset(key, hashKey, JSON.stringify(value));
  }

  async hget(key: RedisKey, hashKey: string | Buffer) {
    return await this.redisClient.hget(key, hashKey);
  }

  async hgetall(key: RedisKey): Promise<any> {
    return await this.redisClient.hgetall(key);
  }

  async mget(key: RedisKey) {
    return await this.redisClient.mget(key);
  }

  async deleteAllKeysByDirectoryName(directoryName: string) {
    const allKeys = await this.redisClient.keys(directoryName);

    for (const key of allKeys) {
      await this.redisClient.del(key);
    }
  }

  async updateAllKeysByDirectoryName(directoryName: string, payload: any) {
    const allKeys = await this.redisClient.keys(directoryName);

    for (const key of allKeys) {
      await this.set(key, payload);
    }
  }

  async cleareCaches(): Promise<void> {
    await this.redisClient.reset();
  }

  async expireIn(key: string, seconds: number) {
    await this.redisClient.expire(key, seconds);
  }
}
