import { SalaryComponent } from "@/entities/salary-component";
import { SystemSetting } from "@/entities/system-setting";
import { SalaryComponentResponse } from "@libs/shared/types/salary-component.type";
import { SystemSettingResponse } from "@libs/shared/types/system-setting.type";

export class SystemSettingMapper {
    static toDto(entity: SystemSetting): SystemSettingResponse {
        return {
            key: entity.key,
            value: entity.value,
            description: entity.description,
            isActive: entity.isActive,
        };
    }

    static toDtoList(entities: SystemSetting[]): SystemSettingResponse[] {
        return entities.map((entity) => this.toDto(entity));
    }

    static salaryComponentToDtoList(entities: SalaryComponent[]): SalaryComponentResponse[] {
        return entities.map((entity) => ({
            id: entity.id,
            name: entity.name,
            code: entity.code,
            type: entity.type,
        }));
    }
}