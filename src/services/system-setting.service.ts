import { SystemSetting } from "@/entities/system-setting";
import { SystemSettingRepository } from "@/repositories/system-setting.repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SystemSettingService {
    // Service methods would go here
    constructor(
        private readonly systemSettingRepository: SystemSettingRepository,
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
}