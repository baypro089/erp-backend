// redis.service.ts
import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) { }

    async scanByPrefix(prefix: string): Promise<string[]> {
        let cursor = '0';
        const keys: string[] = [];

        do {
            const [nextCursor, result] = await this.redis.scan(
                cursor,
                'MATCH',
                `${prefix}*`,
                'COUNT',
                100,
            );

            cursor = nextCursor;
            keys.push(...result);
        } while (cursor !== '0');

        return keys;
    }


    async get<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttl?: number) {
        const payload = JSON.stringify(value);
        if (ttl) {
            await this.redis.set(key, payload, 'EX', ttl);
        } else {
            await this.redis.set(key, payload);
        }
    }

    async del(key: string) {
        await this.redis.del(key);
    }

    async delByPrefix(prefix: string) {
        const keys = await this.scanByPrefix(prefix);
        if (keys.length) {
            await this.redis.del(keys);
        }
    }


    async onModuleDestroy() {
        await this.redis.quit();
    }
}
