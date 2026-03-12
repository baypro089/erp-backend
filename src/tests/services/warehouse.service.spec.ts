import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from '@/services/warehouse.service';
import { WarehouseRepository } from '@/repositories/warehouse.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { RedisService } from '@/services/redis.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WarehouseType } from '@libs/shared/enums/warehouse-type.enum';

const fakeWarehouse = { id: 'wh1', code: 'WH-001', name: 'Main Warehouse', isActive: true };
const fakeEmployee = { id: 'e1', fullName: 'Manager' };

const mockWarehouseRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
};
const mockEmpRepo = { findOneBy: jest.fn() };
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

describe('WarehouseService', () => {
    let service: WarehouseService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WarehouseService,
                { provide: WarehouseRepository, useValue: mockWarehouseRepo },
                { provide: EmployeeRepository, useValue: mockEmpRepo },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        service = module.get<WarehouseService>(WarehouseService);
    });

    describe('createWarehouse', () => {
        it('should throw if warehouse code already exists', async () => {
            mockWarehouseRepo.findOne.mockResolvedValue(fakeWarehouse);
            await expect(service.createWarehouse({ code: 'WH-001', name: 'Test', type: WarehouseType.CENTRAL })).rejects.toThrow(BadRequestException);
        });

        it('should throw if manager not found', async () => {
            mockWarehouseRepo.findOne.mockResolvedValue(null);
            mockEmpRepo.findOneBy.mockResolvedValue(null);
            await expect(service.createWarehouse({ code: 'WH-002', name: 'Test', type: WarehouseType.CENTRAL, managerId: 'ghost' })).rejects.toThrow(NotFoundException);
        });

        it('should create warehouse successfully', async () => {
            mockWarehouseRepo.findOne.mockResolvedValue(null);
            mockWarehouseRepo.create.mockReturnValue(fakeWarehouse);
            mockWarehouseRepo.save.mockResolvedValue(fakeWarehouse);
            const result = await service.createWarehouse({ code: 'WH-002', name: 'New', type: WarehouseType.CENTRAL });
            expect(result).toEqual(fakeWarehouse);
            expect(mockRedis.del).toHaveBeenCalledWith('all_warehouses');
        });
    });

    describe('findAllWarehouses', () => {
        it('should return cached warehouses on hit', async () => {
            mockRedis.get.mockResolvedValue([fakeWarehouse]);
            const result = await service.findAllWarehouses();
            expect(result).toEqual([fakeWarehouse]);
            expect(mockWarehouseRepo.find).not.toHaveBeenCalled();
        });

        it('should fetch and cache on miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockWarehouseRepo.find.mockResolvedValue([fakeWarehouse]);
            const result = await service.findAllWarehouses();
            expect(result).toEqual([fakeWarehouse]);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('findOneWarehouse', () => {
        it('should throw NotFoundException if not found', async () => {
            mockWarehouseRepo.findOne.mockResolvedValue(null);
            await expect(service.findOneWarehouse('ghost')).rejects.toThrow(NotFoundException);
        });

        it('should return the warehouse', async () => {
            mockWarehouseRepo.findOne.mockResolvedValue(fakeWarehouse);
            expect(await service.findOneWarehouse('wh1')).toEqual(fakeWarehouse);
        });
    });

    describe('updateWarehouse', () => {
        it('should throw if manager invalid', async () => {
            mockWarehouseRepo.findOne.mockResolvedValue(fakeWarehouse);
            mockEmpRepo.findOneBy.mockResolvedValue(null);
            await expect(service.updateWarehouse('wh1', { managerId: 'ghost' })).rejects.toThrow(NotFoundException);
        });

        it('should update warehouse and invalidate cache', async () => {
            mockWarehouseRepo.findOne.mockResolvedValue(fakeWarehouse);
            mockEmpRepo.findOneBy.mockResolvedValue(fakeEmployee);
            mockWarehouseRepo.save.mockResolvedValue({ ...fakeWarehouse, name: 'Updated' });
            const result = await service.updateWarehouse('wh1', { managerId: 'e1', name: 'Updated' });
            expect(result.name).toBe('Updated');
        });
    });

    describe('removeWarehouse', () => {
        it('should soft-delete warehouses and invalidate cache', async () => {
            mockWarehouseRepo.update.mockResolvedValue(undefined);
            mockWarehouseRepo.findOne.mockResolvedValue({ ...fakeWarehouse, isActive: false });
            const result = await service.removeWarehouse(['wh1']);
            expect(mockWarehouseRepo.update).toHaveBeenCalledWith('wh1', { isActive: false });
            expect(mockRedis.del).toHaveBeenCalledWith('all_warehouses');
            expect(result[0].isActive).toBe(false);
        });
    });
});
