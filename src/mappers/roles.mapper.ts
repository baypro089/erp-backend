import { Role } from '../entities/role.entity';
import { RoleResponse } from '@libs/shared/types/roles.type';

export class RolesMapper {
    static toDTO(entity: Role): RoleResponse {
        return {
            role_code: entity.role_code,
            role_name: entity.role_name,
            is_active: entity.isActive,
            permissions: entity.permissions,
            AdminSiteAccess: entity.AdminSiteAccess
        };
    }
    static toRoleTypeList(entities: Role[]): RoleResponse[] {
        return entities.map((entity) => this.toDTO(entity));
    }
}