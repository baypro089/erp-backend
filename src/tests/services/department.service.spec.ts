import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentService } from '@/services/department.service';
import { DepartmentRepository } from '@/repositories/department.repository';
import { RedisService } from '@/services/redis.service';

const mockDeptRepo = {
    findAllDepartments: jest.fn(),
    findAllDepartmentsOptional: jest.fn(),
    findById: jest.fn(),
    createDepartment: jest.fn(),
    updateDepartment: jest.fn(),
    deleteDepartments: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), delByPrefix: jest.fn() };

const fakeDept = { id: 'd1', name: 'Engineering' };

describe('DepartmentService', () => {
    let service: DepartmentService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DepartmentService,
                { provide: DepartmentRepository, useValue: mockDeptRepo },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        service = module.get<DepartmentService>(DepartmentService);
    });

    describe('getAllDepartments', () => {
        it('should return from cache if available', async () => {
            mockRedis.get.mockResolvedValue([fakeDept]);
            const result = await service.getAllDepartments();
            expect(result).toEqual([fakeDept]);
            expect(mockDeptRepo.findAllDepartments).not.toHaveBeenCalled();
        });

        it('should fetch and cache if cache miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockDeptRepo.findAllDepartments.mockResolvedValue([fakeDept]);
            const result = await service.getAllDepartments();
            expect(result).toEqual([fakeDept]);
            expect(mockRedis.set).toHaveBeenCalledWith('all_departments', [fakeDept], 300);
        });
    });

    describe('getAllDepartmentsOptional', () => {
        it('should return from cache if available', async () => {
            const cached = { items: [fakeDept], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.getAllDepartmentsOptional('Eng');
            expect(result).toEqual(cached);
        });

        it('should fetch and cache on miss', async () => {
            const paged = { items: [fakeDept], total: 1 };
            mockRedis.get.mockResolvedValue(null);
            mockDeptRepo.findAllDepartmentsOptional.mockResolvedValue(paged);
            const result = await service.getAllDepartmentsOptional();
            expect(result).toEqual(paged);
        });
    });

    describe('getDepartmentById', () => {
        it('should return department by id', async () => {
            mockDeptRepo.findById.mockResolvedValue(fakeDept);
            const result = await service.getDepartmentById('d1');
            expect(result).toEqual(fakeDept);
        });
    });

    describe('createDepartment', () => {
        it('should create and invalidate cache', async () => {
            mockDeptRepo.createDepartment.mockResolvedValue(fakeDept);
            const result = await service.createDepartment({ name: 'Engineering' });
            expect(result).toEqual(fakeDept);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('departments:');
            expect(mockRedis.del).toHaveBeenCalledWith('all_departments');
        });
    });

    describe('updateDepartment', () => {
        it('should update and invalidate cache', async () => {
            mockDeptRepo.updateDepartment.mockResolvedValue(fakeDept);
            const result = await service.updateDepartment('d1', { name: 'HR' });
            expect(result).toEqual(fakeDept);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('departments:');
        });
    });

    describe('deleteDepartments', () => {
        it('should do nothing if ids is empty', async () => {
            await service.deleteDepartments([]);
            expect(mockDeptRepo.deleteDepartments).not.toHaveBeenCalled();
        });

        it('should delete and invalidate cache', async () => {
            mockDeptRepo.deleteDepartments.mockResolvedValue(undefined);
            await service.deleteDepartments(['d1']);
            expect(mockDeptRepo.deleteDepartments).toHaveBeenCalledWith(['d1']);
            expect(mockRedis.del).toHaveBeenCalledWith('all_departments');
        });
    });
});
