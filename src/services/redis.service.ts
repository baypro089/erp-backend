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

    async ttl(key: string): Promise<number> {
        return this.redis.ttl(key);
    }

    /**
     * Xóa toàn bộ cache dữ liệu nghiệp vụ, giữ nguyên các key xác thực
     * (refresh_token:*, otp:*, banned:*).
     * Dùng cho endpoint "Refresh cache" ở frontend.
     */
    async flushAllDataCache(): Promise<void> {
        const EXCLUDED_PREFIXES = ['refresh_token:', 'otp:', 'banned:'];

        let cursor = '0';
        const keysToDelete: string[] = [];

        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'COUNT', 100);
            cursor = nextCursor;

            for (const key of keys) {
                const isAuth = EXCLUDED_PREFIXES.some((prefix) => key.startsWith(prefix));
                if (!isAuth) {
                    keysToDelete.push(key);
                }
            }
        } while (cursor !== '0');

        if (keysToDelete.length > 0) {
            await this.redis.del(keysToDelete);
        }
    }
}
