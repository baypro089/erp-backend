import { SystemSetting } from "@/entities/system-setting";
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
}