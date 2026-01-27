import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRoleDTO {
    @ApiProperty({ 
        example: 'MANAGER', 
        description: 'Mã vai trò (duy nhất)' 
    })
    @IsNotEmpty({ message: 'Role code is required' })
    @IsString({ message: 'Role code must be a string' })
    roleCode: string;

    @ApiProperty({ 
        example: 'Quản lý', 
        description: 'Tên vai trò' 
    })
    @IsNotEmpty({ message: 'Role name is required' })
    @IsString({ message: 'Role name must be a string' })
    roleName: string;

    @ApiProperty({ 
        example: ['USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE'], 
        description: 'Danh sách mã quyền',
        required: false,
        type: [String]
    })
    @IsNotEmpty({ message: 'permissionCodes should not be empty' })
    @IsArray({ message: 'permissionCodes must be an array' })
    @IsString({ each: true, message: 'Each permissionCode must be a string' })
    @ArrayUnique({ message: 'permissionCodes must be unique' })
    permissionCodes?: string[];

    @ApiProperty({ 
        example: true, 
        description: 'Quyền truy cập trang quản trị',
        required: false 
    })
    @IsNotEmpty({ message: 'AdminSiteAccess should not be empty' })
    AdminSiteAccess: boolean;
}

export class UpdateRoleDTO {

    @ApiProperty({ 
        example: 'Quản lý cấp cao', 
        description: 'Tên vai trò mới',
        required: false 
    })
    @IsOptional()
    @IsString({ message: 'Role name must be a string' })
    roleName?: string;

    @ApiProperty({ 
        example: ['USER_READ', 'EMPLOYEE_READ', 'DEPARTMENT_READ'], 
        description: 'Danh sách mã quyền mới',
        required: false,
        type: [String]
    })
    @IsOptional()
    @IsArray({ message: 'permissionCodes must be an array' })
    @IsString({ each: true, message: 'Each permissionCode must be a string' })
    @ArrayUnique({ message: 'permissionCodes must be unique' })
    permissionCodes?: string[];
}

export class DeleteRolesDTO {
    @ApiProperty({ 
        example: ['MANAGER', 'SUPERVISOR'], 
        description: 'Danh sách mã vai trò cần xóa',
        type: [String]
    })
    @IsArray({ message: 'ids must be an array' })
    @ArrayNotEmpty({ message: 'Need at least 1 role code to delete' })
    roleCodes: string[];
}