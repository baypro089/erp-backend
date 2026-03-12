import { Test, TestingModule } from '@nestjs/testing';
import { JobHistoryService } from '@/services/job-history.service';
import { JobHistoryRepository } from '@/repositories/job-history.repository';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JobHistory } from '@/entities/job-history.entity';
import { Employee } from '@/entities/employee.entity';

const fakeEmployee = { id: 'e1', fullName: 'John Doe' };
const fakeJobHistory = { id: 'jh1', employeeId: 'e1', startDate: new Date('2023-01-01'), isCurrent: true };
const fakeNewJobHistory = { id: 'jh2', employeeId: 'e1', startDate: new Date('2024-01-01'), isCurrent: true };

describe('JobHistoryService', () => {
    let service: JobHistoryService;
    let mockDataSource: any;

    const buildDataSourceMock = (overrides: any = {}) => ({
        transaction: jest.fn((cb: any) => cb({
            getRepository: (entity: any) => {
                if (entity === JobHistory) {
                    return {
                        findOne: overrides.jobHistoryFindOne ?? jest.fn().mockResolvedValue(fakeJobHistory),
                        create: jest.fn().mockReturnValue(fakeNewJobHistory),
                        save: jest.fn().mockResolvedValue(fakeNewJobHistory),
                    };
                }
                if (entity === Employee) {
                    return {
                        findOne: overrides.employeeFindOne ?? jest.fn().mockResolvedValue(fakeEmployee),
                    };
                }
                return {};
            },
        })),
    });

    const mockJobHistoryRepo = {
        getJobHistoriesByEmployeeId: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockDataSource = buildDataSourceMock();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobHistoryService,
                { provide: DataSource, useValue: mockDataSource },
                { provide: JobHistoryRepository, useValue: mockJobHistoryRepo },
            ],
        }).compile();
        service = module.get<JobHistoryService>(JobHistoryService);
    });

    describe('createJobHistory', () => {
        it('should throw NotFoundException if employee does not exist', async () => {
            mockDataSource = buildDataSourceMock({ employeeFindOne: jest.fn().mockResolvedValue(null) });
            const module = await Test.createTestingModule({
                providers: [
                    JobHistoryService,
                    { provide: DataSource, useValue: mockDataSource },
                    { provide: JobHistoryRepository, useValue: mockJobHistoryRepo },
                ],
            }).compile();
            const svc = module.get<JobHistoryService>(JobHistoryService);
            await expect(svc.createJobHistory({ employeeId: 'ghost', startDate: new Date() })).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if new start date is not after current', async () => {
            const oldDate = new Date('2024-06-01');
            mockDataSource = buildDataSourceMock({
                jobHistoryFindOne: jest.fn().mockResolvedValue({ ...fakeJobHistory, startDate: oldDate }),
            });
            const module = await Test.createTestingModule({
                providers: [
                    JobHistoryService,
                    { provide: DataSource, useValue: mockDataSource },
                    { provide: JobHistoryRepository, useValue: mockJobHistoryRepo },
                ],
            }).compile();
            const svc = module.get<JobHistoryService>(JobHistoryService);
            await expect(
                svc.createJobHistory({ employeeId: 'e1', startDate: new Date('2024-01-01') })
            ).rejects.toThrow(BadRequestException);
        });

        it('should create new job history and close the previous one', async () => {
            const result = await service.createJobHistory({
                employeeId: 'e1',
                positionId: 'pos1',
                departmentId: 'dept1',
                startDate: new Date('2025-01-01'),
                salaryAtTime: 5000,
            });
            expect(result).toEqual(fakeNewJobHistory);
        });
    });

    describe('getJobHistoriesByEmployeeId', () => {
        it('should return job histories for an employee', async () => {
            mockJobHistoryRepo.getJobHistoriesByEmployeeId.mockResolvedValue([fakeJobHistory]);
            const result = await service.getJobHistoriesByEmployeeId('e1');
            expect(result).toEqual([fakeJobHistory]);
        });
    });
});
