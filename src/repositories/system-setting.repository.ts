import { SystemSetting } from "@/entities/system-setting";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class SystemSettingRepository extends Repository<SystemSetting> {
    // Service methods would go here
    constructor(
        // Dependency injections would go here
        private readonly dataSource: DataSource,
    ) {
        super(SystemSetting, dataSource.createEntityManager());
    }
}