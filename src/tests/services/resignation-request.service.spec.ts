import { Test, TestingModule } from '@nestjs/testing';
import { ResignationRequestService } from '@/services/resignation-request.service';
import { ResignationRequestRepository } from '@/repositories/resignation-request.repository';
import { RedisService } from '@/services/redis.service';
import { DataSource } from 'typeorm';
import { ResignationStatus } from '@libs/shared/enums/resignation-status.enum';
import { ResignationRequest } from '@/entities/resignation-request.entity';
import { Employee } from '@/entities/employee.entity';
import { User } from '@/entities/user.entity';

const mockResignRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAllFilteredAndPaged: jest.fn(),
    find: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };

const fakeResignation = {
    id: 'rr1', status: ResignationStatus.PENDING,
    employee: { id: 'e1', fullName: 'John', user: { id: 'u1' } },
};

describe('ResignationRequestService', () => {
    let service: ResignationRequestService;

    const buildService = async (dataSource?: any) => {
        const ds = dataSource ?? {
            transaction: jest.fn((cb: any) => cb({
                getRepository: (entity: any) => {
                    if (entity === ResignationRequest) return {
                        find: jest.fn().mockResolvedValue([{ ...fakeResignation, status: ResignationStatus.APPROVED, approvedLastDay: new Date('2020-01-01') }]),
                        update: jest.fn().mockResolvedValue(undefined),
                    };
                    if (entity === Employee) return { update: jest.fn().mockResolvedValue(undefined) };
                    if (entity === User) return { update: jest.fn().mockResolvedValue(undefined) };
                    return {};
                },
            })),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResignationRequestService,
                { provide: ResignationRequestRepository, useValue: mockResignRepo },
                { provide: DataSource, useValue: ds },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        return module.get<ResignationRequestService>(ResignationRequestService);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should throw if there is already a pending request', async () => {
            mockResignRepo.findOne.mockResolvedValue(fakeResignation);
            service = await buildService();
            await expect(service.create({ employeeId: 'e1', desiredLastDay: new Date(), reason: 'moving', handoverNote: 'doc-link' })).rejects.toThrow('already a pending');
        });

        it('should create a new resignation request', async () => {
            mockResignRepo.findOne.mockResolvedValue(null);
            mockResignRepo.create.mockReturnValue(fakeResignation);
            mockResignRepo.save.mockResolvedValue(fakeResignation);
            service = await buildService();
            const result = await service.create({ employeeId: 'e1', desiredLastDay: new Date(), reason: 'moving', handoverNote: 'doc-link' });
            expect(result).toEqual(fakeResignation);
        });
    });

    describe('approve', () => {
        it('should throw if resignation not found', async () => {
            mockResignRepo.findOne.mockResolvedValue(null);
            service = await buildService();
            await expect(service.approve('ghost', new Date())).rejects.toThrow('not found');
        });

        it('should approve the resignation request', async () => {
            mockResignRepo.findOne.mockResolvedValue({ ...fakeResignation });
            mockResignRepo.save.mockResolvedValue({ ...fakeResignation, status: ResignationStatus.APPROVED });
            service = await buildService();
            const result = await service.approve('rr1', new Date('2026-03-31'));
            expect(result.status).toBe(ResignationStatus.APPROVED);
        });
    });

    describe('reject', () => {
        it('should throw if resignation not found', async () => {
            mockResignRepo.findOne.mockResolvedValue(null);
            service = await buildService();
            await expect(service.reject('ghost', 'no reason')).rejects.toThrow('not found');
        });

        it('should reject the resignation with a note', async () => {
            mockResignRepo.findOne.mockResolvedValue({ ...fakeResignation });
            mockResignRepo.save.mockResolvedValue({ ...fakeResignation, status: ResignationStatus.REJECTED });
            service = await buildService();
            const result = await service.reject('rr1', 'Not approved');
            expect(result.status).toBe(ResignationStatus.REJECTED);
        });
    });

    describe('findAllFilteredAndPaged', () => {
        it('should return cached result if available', async () => {
            service = await buildService();
            const cached = { items: [fakeResignation], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllFilteredAndPaged();
            expect(result).toEqual(cached);
        });

        it('should fetch and cache on miss', async () => {
            service = await buildService();
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [fakeResignation], total: 1 };
            mockResignRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            const result = await service.findAllFilteredAndPaged();
            expect(result).toEqual(paged);
        });
    });

    describe('findAllByEmployeeId', () => {
        it('should return resignations for an employee', async () => {
            service = await buildService();
            mockResignRepo.find.mockResolvedValue([fakeResignation]);
            const result = await service.findAllByEmployeeId('e1');
            expect(result).toEqual([fakeResignation]);
        });
    });
});
