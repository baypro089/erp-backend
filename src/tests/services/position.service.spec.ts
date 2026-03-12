import { Test, TestingModule } from '@nestjs/testing';
import { PositionService } from '@/services/position.service';
import { PositionRepository } from '@/repositories/position.repository';
import { RedisService } from '@/services/redis.service';

const mockPositionRepo = {
    findAllPositions: jest.fn(),
    findAllPositionsOptional: jest.fn(),
    findById: jest.fn(),
    createPosition: jest.fn(),
    updatePosition: jest.fn(),
    deletePosition: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), delByPrefix: jest.fn() };

const fakePosition = { id: 'p1', name: 'Software Engineer', minSalary: 1000, maxSalary: 5000 };

describe('PositionService', () => {
    let service: PositionService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PositionService,
                { provide: PositionRepository, useValue: mockPositionRepo },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        service = module.get<PositionService>(PositionService);
    });

    describe('getAllPositions', () => {
        it('should return from cache when hit', async () => {
            mockRedis.get.mockResolvedValue([fakePosition]);
            const result = await service.getAllPositions();
            expect(result).toEqual([fakePosition]);
            expect(mockPositionRepo.findAllPositions).not.toHaveBeenCalled();
        });

        it('should fetch and cache on miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockPositionRepo.findAllPositions.mockResolvedValue([fakePosition]);
            const result = await service.getAllPositions();
            expect(result).toEqual([fakePosition]);
            expect(mockRedis.set).toHaveBeenCalledWith('all_positions', [fakePosition], 300);
        });
    });

    describe('getAllPositionsOptional', () => {
        it('should return cached paged result', async () => {
            const cached = { items: [fakePosition], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.getAllPositionsOptional('Engineer');
            expect(result).toEqual(cached);
        });

        it('should fetch on cache miss', async () => {
            const paged = { items: [fakePosition], total: 1 };
            mockRedis.get.mockResolvedValue(null);
            mockPositionRepo.findAllPositionsOptional.mockResolvedValue(paged);
            const result = await service.getAllPositionsOptional(undefined, 1000, 5000);
            expect(result).toEqual(paged);
        });
    });

    describe('getPositionById', () => {
        it('should return position by id', async () => {
            mockPositionRepo.findById.mockResolvedValue(fakePosition);
            const result = await service.getPositionById('p1');
            expect(result).toEqual(fakePosition);
        });
    });

    describe('createPosition', () => {
        it('should create and invalidate cache', async () => {
            mockPositionRepo.createPosition.mockResolvedValue(fakePosition);
            const result = await service.createPosition({ name: 'Software Engineer' });
            expect(result).toEqual(fakePosition);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('positions:');
            expect(mockRedis.del).toHaveBeenCalledWith('all_positions');
        });
    });

    describe('updatePosition', () => {
        it('should update and invalidate cache', async () => {
            mockPositionRepo.updatePosition.mockResolvedValue(fakePosition);
            const result = await service.updatePosition('p1', { name: 'Senior Engineer' });
            expect(result).toEqual(fakePosition);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('positions:');
        });
    });

    describe('deletePositions', () => {
        it('should do nothing if ids is empty', async () => {
            await service.deletePositions([]);
            expect(mockPositionRepo.deletePosition).not.toHaveBeenCalled();
        });

        it('should delete and invalidate cache', async () => {
            mockPositionRepo.deletePosition.mockResolvedValue(undefined);
            await service.deletePositions(['p1']);
            expect(mockPositionRepo.deletePosition).toHaveBeenCalledWith(['p1']);
        });
    });
});
