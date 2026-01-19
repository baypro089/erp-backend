import { ArrayNotEmpty, ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRoleDTO {
    @IsNotEmpty({ message: 'Role code is required' })
    @IsString({ message: 'Role code must be a string' })
    roleCode: string;

    @IsNotEmpty({ message: 'Role name is required' })
    @IsString({ message: 'Role name must be a string' })
    roleName: string;

    @IsOptional()
    @IsArray({ message: 'permissionCodes must be an array' })
    @IsString({ each: true, message: 'Each permissionCode must be a string' })
    @ArrayUnique({ message: 'permissionCodes must be unique' })
    permissionCodes?: string[];

    @IsOptional()
    AdminSiteAccess?: boolean;
}

export class UpdateRoleDTO {
    roleCode: string;

    @IsNotEmpty({ message: 'Role name is required' })
    @IsString({ message: 'Role name must be a string' })
    roleName: string;

    @IsOptional()
    @IsArray({ message: 'permissionCodes must be an array' })
    @IsString({ each: true, message: 'Each permissionCode must be a string' })
    @ArrayUnique({ message: 'permissionCodes must be unique' })
    permissionCodes: string[];
}

export class DeleteRolesDTO {
    @IsArray({ message: 'ids must be an array' })
    @ArrayNotEmpty({ message: 'Need at least 1 role code to delete' })
    roleCodes: string[];
}