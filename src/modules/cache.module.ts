import { CacheController } from '@/controllers/cache.controller';
import { Module } from '@nestjs/common';

@Module({
    controllers: [CacheController],
})
export class CacheModule {}
