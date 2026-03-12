import { Test, TestingModule } from '@nestjs/testing';
import { SystemSettingService } from '@/services/system-setting.service';
import { SystemSettingRepository } from '@/repositories/system-setting.repository';
import { SalaryComponentRepository } from '@/repositories/salary-component.repository';

const mockSettingRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
};
const mockSalaryCompRepo = { find: jest.fn() };

const fakeSetting = { key: 'ANNUAL_LEAVE_DAYS', value: '12', description: 'Annual leave per year' };
const fakeSalaryComponent = { id: 'sc1', name: 'Base Salary', type: 'FIXED' };

describe('SystemSettingService', () => {
    let service: SystemSettingService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SystemSettingService,
                { provide: SystemSettingRepository, useValue: mockSettingRepo },
                { provide: SalaryComponentRepository, useValue: mockSalaryCompRepo },
            ],
        }).compile();
        service = module.get<SystemSettingService>(SystemSettingService);
    });

    describe('findAll', () => {
        it('should return all system settings', async () => {
            mockSettingRepo.find.mockResolvedValue([fakeSetting]);
            const result = await service.findAll();
            expect(result).toEqual([fakeSetting]);
        });
    });

    describe('update', () => {
        it('should throw if setting key not found', async () => {
            mockSettingRepo.findOneBy.mockResolvedValue(null);
            await expect(service.update('NONEXISTENT', { value: '10' })).rejects.toThrow('not found');
        });

        it('should update the setting and return updated value', async () => {
            mockSettingRepo.findOneBy
                .mockResolvedValueOnce(fakeSetting)              // first call to check existence
                .mockResolvedValueOnce({ ...fakeSetting, value: '15' }); // second call to return updated
            mockSettingRepo.update.mockResolvedValue(undefined);
            const result = await service.update('ANNUAL_LEAVE_DAYS', { value: '15' });
            expect(result.value).toBe('15');
        });
    });

    describe('getSalaryComponents', () => {
        it('should return all salary components', async () => {
            mockSalaryCompRepo.find.mockResolvedValue([fakeSalaryComponent]);
            const result = await service.getSalaryComponents();
            expect(result).toEqual([fakeSalaryComponent]);
        });
    });
});
