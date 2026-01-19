import { permission } from "./permissions.type";

type RoleResponse = {
    role_code: string;
    role_name: string;
    is_active: boolean;
    permissions?: permission[];
    AdminSiteAccess?: boolean;
}

export type { RoleResponse };