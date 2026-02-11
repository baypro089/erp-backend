import { SalaryComponent } from "@/entities/salary-component";
import { SystemSetting } from "@/entities/system-setting";
import { SalaryComponentRepository } from "@/repositories/salary-component.repository";
import { SystemSettingRepository } from "@/repositories/system-setting.repository";
import { SalaryComponentResponse } from "@libs/shared/types/salary-component.type";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SystemSettingService {
    // Service methods would go here
    constructor(
        private readonly systemSettingRepository: SystemSettingRepository,
        private readonly salaryComponentRepository: SalaryComponentRepository,
    ) { }

    async findAll(): Promise<SystemSetting[]> {
        return this.systemSettingRepository.find();
    }

    async update(key: string, dto: Partial<SystemSetting>): Promise<SystemSetting> {
        const setting = await this.systemSettingRepository.findOneBy({ key: key });
        if (!setting) {
            throw new Error(`System setting with key ${key} not found.`);
        }
        await this.systemSettingRepository.update({ key: key }, dto);
        return this.systemSettingRepository.findOneBy({ key: key }) as Promise<SystemSetting>;
    }

    async getSalaryComponents(): Promise<SalaryComponent[]> {
        return this.salaryComponentRepository.find();
    }
}