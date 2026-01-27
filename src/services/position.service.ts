import { CreatePositionDto } from "@/dtos/positions.dto";
import { Position } from "@/entities/position.entity";
import { PositionRepository } from "@/repositories/position.repository";
import { Injectable } from "@nestjs/common";
import { createHash } from 'crypto';
import { RedisService } from "./redis.service";


@Injectable()
export class PositionService {
    // Define your service methods for position operations here
    constructor(
        private readonly positionRepository: PositionRepository,
        private readonly redisService: RedisService,
    ) { }

    async getAllPositions(): Promise<Position[]> {
        const cacheKey = 'all_positions';
        const cachedPositions: Position[] | undefined | null = await this.redisService.get(cacheKey);
        if (cachedPositions) {
            return cachedPositions;
        }
        const positions = await this.positionRepository.findAllPositions();
        await this.redisService.set(cacheKey, positions, 300); // Cache for 5 minutes
        return positions;
    }

    async getAllPositionsOptional(
        name?: string,
        minSalary?: number,
        maxSalary?: number,
        page?: number,
        pageSize?: number,
    ): Promise<{ items: Position[], total: number }> {

        const rawKey = JSON.stringify({
            name,
            minSalary,
            maxSalary,
            page: page || 1,
            pageSize: pageSize || 10,
        });

        const cacheKey = `positions:${createHash('md5').update(rawKey).digest('hex')}`;
        const cachedResult = await this.redisService.get<{ items: Position[]; total: number }>(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        const result = await this.positionRepository.findAllPositionsOptional(
            name,
            minSalary,
            maxSalary,
            page,
            pageSize,
        );
        await this.redisService.set(cacheKey, result, 300); // Cache for 5 minutes
        return result;
    }

    async getPositionById(id: string): Promise<Position | null> {
        return this.positionRepository.findById(id);
    }

    async createPosition(positionData: Partial<Position>): Promise<Position> {
        const newPosition = await this.positionRepository.createPosition(positionData);
        await this.redisService.delByPrefix('positions:'); // Invalidate related caches
        await this.redisService.del('all_positions'); // Invalidate all positions cache
        return newPosition;
    }

    async updatePosition(id: string, positionData: Partial<Position>): Promise<Position | null> {
        const updatedPosition = await this.positionRepository.updatePosition(id, positionData);
        await this.redisService.delByPrefix('positions:'); // Invalidate related caches
        await this.redisService.del('all_positions'); // Invalidate all positions cache
        return updatedPosition;
    }

    async deletePositions(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) {
            return;
        }
        await this.positionRepository.deletePosition(ids);
        await this.redisService.delByPrefix('positions:'); // Invalidate related caches
        await this.redisService.del('all_positions'); // Invalidate all positions cache
    }
}
