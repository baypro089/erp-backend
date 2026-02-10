import { SystemSettingController } from "@/controllers/system-setting.controller";
import { SystemSetting } from "@/entities/system-setting";
import { SystemSettingRepository } from "@/repositories/system-setting.repository";
import { SystemSettingService } from "@/services/system-setting.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Type } from "class-transformer";

@Module({
    imports: [
        // Import other modules if needed
        TypeOrmModule.forFeature([ SystemSetting ]),
    ],
    controllers: [
        // Register controllers here
        SystemSettingController,
    ],
    providers: [
        // Register services and repositories here
        SystemSettingRepository, SystemSettingService
    ],
    exports: [
        // Export services or repositories if needed
        SystemSettingRepository, SystemSettingService
    ],
})
export class SystemSettingModule { }