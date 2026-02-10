import { PermissionResponse } from "./permissions.type";

type RoleResponse = {
    role_code: string;
    role_name: string;
    is_active: boolean;
    permissions: PermissionResponse[];
}

type CreateRoleDTO = {
    roleCode: string;
    roleName: string;
    permissionCodes: string[];
}

type UpdateRoleDTO = {
    roleName?: string;
    permissionCodes?: string[];
}

export type { RoleResponse, CreateRoleDTO, UpdateRoleDTO };