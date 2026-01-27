import { Permission } from "@/entities/permission.entity";
import { PermissionResponse } from "@libs/shared/types/permissions.type";

export class PermissionMapper {
    static toResponse(permission: Permission): PermissionResponse {
        return {
            permission_code: permission.permission_code,
            permission_name: permission.permission_name,
        };
    }

    static toResponseList(permissions: Permission[]): PermissionResponse[] {
        return permissions.map((permission) => this.toResponse(permission));
    }
}