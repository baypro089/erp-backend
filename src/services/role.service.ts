import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RoleRepository } from "@/repositories/role.repository";
import { Role } from "@/entities/role.entity";
import { CreateRoleDTO, UpdateRoleDTO } from "@/dtos/roles.dtos";
import { PermissionRepository } from "@/repositories/permission.repository";
import { PermissionResponse } from "@libs/shared/types/permissions.type";
import { Permission } from "@/entities/permission.entity";

@Injectable()
export class RoleService {
    // Implement role-related business logic here
    constructor(
        private readonly roleRepository: RoleRepository,
        private readonly permissionRepository: PermissionRepository,
    ) { }

    async getRolesByCondition(roleCode?: string, roleName?: string): Promise<Role[]> {
        return this.roleRepository.findByCondition(roleCode, roleName);
    }

    async getRoleByCode(roleCode: string): Promise<Role | null> {
        return this.roleRepository.findByCode(roleCode);
    }

    async createRole(createRoleDto: CreateRoleDTO): Promise<Role> {
        const { roleCode, roleName, permissionCodes } = createRoleDto;

        if (await this.roleRepository.findByCode(roleCode)) {
            throw new Error(`Role with code ${roleCode} already exists.`);
        }

        if (!permissionCodes || permissionCodes.length === 0) {
            throw new Error('A role must have at least one permission.');
        }

        const permissions = await this.permissionRepository.findByCodes(permissionCodes as string[]);

        if (!permissions || permissions.length === 0) {
            throw new Error('No valid permissions found to assign to the role.');
        }

        return this.roleRepository.handleCreate({
            role_code: roleCode,
            role_name: roleName,
            permissions: permissions,
        });
    }

    async updateRole(id: string, updateRoleDto: UpdateRoleDTO): Promise<Role | null> {
        const role = await this.roleRepository.findByCode(id);
        if (!role) {
            throw new Error('Role not found!');
        }

        let permissions = role.permissions;
        if (updateRoleDto.permissionCodes) {
            permissions = await this.permissionRepository.findByCodes(updateRoleDto.permissionCodes);
            if (!permissions || permissions.length === 0) {
                throw new Error('No valid permissions found to assign to the role.');
            }
        }

        return await this.roleRepository.handleUpdate( {
            role_code: id,
            role_name: updateRoleDto.roleName ?? role.role_name,
            permissions: permissions,
        });
    }

    async deleteRoles(roleCodes: string[]): Promise<void> {
        const roles = await this.roleRepository.findByCodes(roleCodes);
        if (!roles) {
            throw new Error(`Roles not found!`);
        }
        for (const role of roles) {
            if (role.users && role.users.length > 0) {
                throw new Error(`Cannot delete role ${role.role_code} as it is assigned to users.`);
            }
            await this.roleRepository.handleDelete(role);
        }
    }

    async getAllPermissions(): Promise<Permission[]> {
        const permissions = await this.permissionRepository.getAllPermissions();
        return permissions;
    }
}