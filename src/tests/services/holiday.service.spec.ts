import { Test, TestingModule } from '@nestjs/testing';
import { HolidayService } from '@/services/holiday.service';
import { HolidayRepository } from '@/repositories/holiday.repository';

const mockHolidayRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
};

const fakeHoliday = { id: 1, name: 'New Year', date: new Date('2026-01-01') };

describe('HolidayService', () => {
    let service: HolidayService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HolidayService,
                { provide: HolidayRepository, useValue: mockHolidayRepo },
            ],
        }).compile();
        service = module.get<HolidayService>(HolidayService);
    });

    describe('getHolidays', () => {
        it('should return holidays within the given year', async () => {
            mockHolidayRepo.find.mockResolvedValue([fakeHoliday]);
            const result = await service.getHolidays(2026);
            expect(result).toEqual([fakeHoliday]);
            expect(mockHolidayRepo.find).toHaveBeenCalled();
        });
    });

    describe('createHoliday', () => {
        it('should create and save a holiday', async () => {
            mockHolidayRepo.create.mockReturnValue(fakeHoliday);
            mockHolidayRepo.save.mockResolvedValue(fakeHoliday);
            const result = await service.createHoliday({ name: 'New Year', date: new Date('2026-01-01') });
            expect(result).toEqual(fakeHoliday);
            expect(mockHolidayRepo.save).toHaveBeenCalled();
        });
    });

    describe('deleteHoliday', () => {
        it('should delete a holiday by id', async () => {
            mockHolidayRepo.delete.mockResolvedValue(undefined);
            await service.deleteHoliday(1);
            expect(mockHolidayRepo.delete).toHaveBeenCalledWith(1);
        });
    });

    describe('seedHolidays', () => {
        it('should seed holidays for a given year', async () => {
            mockHolidayRepo.create.mockImplementation((data) => data);
            mockHolidayRepo.save.mockResolvedValue(undefined);
            await service.seedHolidays(2026);
            expect(mockHolidayRepo.save).toHaveBeenCalled();
        });
    });
});
