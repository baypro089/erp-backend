import { SystemSettingController } from "@/controllers/system-setting.controller";
import { SalaryComponent } from "@/entities/salary-component";
import { SystemSetting } from "@/entities/system-setting";
import { SalaryComponentRepository } from "@/repositories/salary-component.repository";
import { SystemSettingRepository } from "@/repositories/system-setting.repository";
import { SystemSettingService } from "@/services/system-setting.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        // Import other modules if needed
        TypeOrmModule.forFeature([ SystemSetting, SalaryComponent ]),
    ],
    controllers: [
        // Register controllers here
        SystemSettingController,
    ],
    providers: [
        // Register services and repositories here
        SystemSettingRepository, SystemSettingService, SalaryComponentRepository
    ],
    exports: [
        // Export services or repositories if needed
        SystemSettingRepository, SystemSettingService
    ],
})
export class SystemSettingModule { }