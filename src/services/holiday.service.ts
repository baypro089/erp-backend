import { Holiday } from '@/entities/holiday.entity';
import { HolidayRepository } from '@/repositories/holiday.repository';
import { Injectable } from '@nestjs/common';
import Holidays from 'date-holidays';
import { Between, DataSource } from 'typeorm';

@Injectable()
export class HolidayService {
    constructor(
        private readonly holidayRepo : HolidayRepository
    ) {}

    async seedHolidays(year: number){
        const hd = new Holidays('VN');
        const holidays = hd.getHolidays(year);
        const holidayEntities = holidays.map(h => this.holidayRepo.create({
            date: new Date(h.date),
            name: h.name,
        }));
        await this.holidayRepo.save(holidayEntities);
    }

    async getHolidays(year: number): Promise<Holiday[]> {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        return this.holidayRepo.find({
            where: {
                date: Between(startDate, endDate),
            },
        });
    }

    async createHoliday(data: Partial<Holiday>): Promise<Holiday> {
        const holiday = this.holidayRepo.create({
            ...data
        });
        return this.holidayRepo.save(holiday);
    }

    async deleteHoliday(id: number): Promise<void> {
        await this.holidayRepo.delete(id);
    }
}