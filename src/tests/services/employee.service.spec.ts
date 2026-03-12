import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from '@/services/employee.service';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { DepartmentRepository } from '@/repositories/department.repository';
import { PositionRepository } from '@/repositories/position.repository';
import { RedisService } from '@/services/redis.service';
import { AttachmentService } from '@/services/attachment.service';
import { DataSource } from 'typeorm';
import { Employee } from '@/entities/employee.entity';
import { Department } from '@/entities/department.entity';
import { Position } from '@/entities/position.entity';
import { JobHistory } from '@/entities/job-history.entity';

const fakeEmployee = { id: 'e1', fullName: 'Jane Doe', employeeCode: 'EMP001', photo: null, cvUrl: null };
const fakeDept = { id: 'd1', name: 'Engineering' };
const fakePosition = { id: 'p1', name: 'Engineer' };

const mockEmpRepo = {
    createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([fakeEmployee]),
    }),
    findAllEmployeesOptional: jest.fn(),
    findAllDeletedEmployeesOptional: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployees: jest.fn(),
};
const mockDeptRepo = { findById: jest.fn() };
const mockPosRepo = { findById: jest.fn() };
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), delByPrefix: jest.fn() };
const mockAttachment = {
    uploadFile: jest.fn(),
    hardDelete: jest.fn(),
    findByEntityRaw: jest.fn(),
    findByEntity: jest.fn(),
    deleteMultiple: jest.fn(),
};

describe('EmployeeService', () => {
    let service: EmployeeService;
    let mockDataSource: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockDataSource = {
            transaction: jest.fn((cb: any) => cb({
                getRepository: (entity: any) => {
                    if (entity === Department) return { findOne: jest.fn().mockResolvedValue(fakeDept) };
                    if (entity === Position) return { findOne: jest.fn().mockResolvedValue(fakePosition) };
                    if (entity === Employee) return {
                        create: jest.fn().mockReturnValue(fakeEmployee),
                        save: jest.fn().mockResolvedValue(fakeEmployee),
                    };
                    if (entity === JobHistory) return {
                        create: jest.fn().mockReturnValue({}),
                        save: jest.fn().mockResolvedValue({}),
                    };
                    return {};
                },
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmployeeService,
                { provide: EmployeeRepository, useValue: mockEmpRepo },
                { provide: DepartmentRepository, useValue: mockDeptRepo },
                { provide: PositionRepository, useValue: mockPosRepo },
                { provide: DataSource, useValue: mockDataSource },
                { provide: RedisService, useValue: mockRedis },
                { provide: AttachmentService, useValue: mockAttachment },
            ],
        }).compile();
        service = module.get<EmployeeService>(EmployeeService);
    });

    describe('getAllEmployees', () => {
        it('should return cached employees if available', async () => {
            mockRedis.get.mockResolvedValue([fakeEmployee]);
            const result = await service.getAllEmployees();
            expect(result).toEqual([fakeEmployee]);
        });

        it('should fetch and cache on cache miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            const result = await service.getAllEmployees();
            expect(result).toEqual([fakeEmployee]);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('createEmployee', () => {
        it('should throw if department not found', async () => {
            mockDataSource.transaction = jest.fn((cb: any) => cb({
                getRepository: (entity: any) => {
                    if (entity === Department) return { findOne: jest.fn().mockResolvedValue(null) };
                    return {};
                },
            }));
            const module = await Test.createTestingModule({
                providers: [
                    EmployeeService,
                    { provide: EmployeeRepository, useValue: mockEmpRepo },
                    { provide: DepartmentRepository, useValue: mockDeptRepo },
                    { provide: PositionRepository, useValue: mockPosRepo },
                    { provide: DataSource, useValue: mockDataSource },
                    { provide: RedisService, useValue: mockRedis },
                    { provide: AttachmentService, useValue: mockAttachment },
                ],
            }).compile();
            const svc = module.get<EmployeeService>(EmployeeService);
            await expect(svc.createEmployee({
                fullName: 'Test', employeeCode: 'EMP001', departmentId: 'ghost', currentPositionId: 'p1', startDate: new Date('2024-01-01'),
            })).rejects.toThrow('Department not found');
        });

        it('should create employee with job history', async () => {
            const result = await service.createEmployee({
                fullName: 'Jane', employeeCode: 'EMP001', departmentId: 'd1', currentPositionId: 'p1', startDate: new Date('2024-01-01'),
            });
            expect(result).toEqual(fakeEmployee);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('employees:');
        });
    });

    describe('getEmployeeById', () => {
        it('should return employee by id', async () => {
            mockEmpRepo.findById.mockResolvedValue(fakeEmployee);
            const result = await service.getEmployeeById('e1');
            expect(result).toEqual(fakeEmployee);
        });
    });

    describe('updateEmployee', () => {
        it('should update employee and invalidate cache', async () => {
            mockEmpRepo.updateEmployee.mockResolvedValue(fakeEmployee);
            const result = await service.updateEmployee('e1', { fullName: 'Jane Updated' });
            expect(result).toEqual(fakeEmployee);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('employees:');
        });

        it('should resolve department and position if ids provided', async () => {
            mockDeptRepo.findById.mockResolvedValue(fakeDept);
            mockPosRepo.findById.mockResolvedValue(fakePosition);
            mockEmpRepo.updateEmployee.mockResolvedValue(fakeEmployee);
            await service.updateEmployee('e1', { departmentId: 'd1', currentPositionId: 'p1' } as any);
        });
    });

    describe('deleteEmployees', () => {
        it('should do nothing for empty array', async () => {
            await service.deleteEmployees([]);
            expect(mockEmpRepo.deleteEmployees).not.toHaveBeenCalled();
        });

        it('should delete employees and their attachments', async () => {
            mockAttachment.findByEntity.mockResolvedValue([{ id: 'att1' }]);
            mockAttachment.deleteMultiple.mockResolvedValue(undefined);
            mockEmpRepo.deleteEmployees.mockResolvedValue(undefined);
            await service.deleteEmployees(['e1']);
            expect(mockAttachment.deleteMultiple).toHaveBeenCalledWith(['att1']);
            expect(mockEmpRepo.deleteEmployees).toHaveBeenCalledWith(['e1']);
        });
    });
});
