import { Request, Response } from 'express';
import { RoleService } from '../services/role.service';
import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { ApiResponse } from '@libs/core/interfaces/apiResponse.interface';
import { Role } from '@/entities/role.entity';
import { RolesMapper } from '@/mappers/roles.mapper';
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { RoleResponse } from '@libs/shared/types/roles.type';
import { CreateRoleDTO, UpdateRoleDTO } from '@/dtos/roles.dtos';

@Controller('roles')
export class RoleController {

    constructor(private readonly roleService: RoleService) {    }

    @Get()
    async getRoles(
        @Query('roleCode') roleCode: string,
        @Query('roleName') roleName: string,
    ): Promise<ApiResponse<RoleResponse[]>> {
        try {
            const roleResponses = await this.roleService.getRolesByCondition(roleCode, roleName);
            const response = RolesMapper.toRoleTypeList(roleResponses);
            return ResponseHelper.send(response, 'Get roles successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to get roles: ' + error.message);
        }
    }

    @Get('/:id')
    async getRoleByCode(@Param('id') id: string) {
        try {
            const role = await this.roleService.getRoleByCode(id);
            if (!role) {
                throw new NotFoundException('Role not found');
            }
            return ResponseHelper.send(RolesMapper.toDTO(role), 'Get role successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to get role: ' + error.message);
        }
    }

    @Post()
    async createRole(@Body() body: CreateRoleDTO) {
        try {
            const newRole = await this.roleService.createRole(body);
            return ResponseHelper.send(RolesMapper.toDTO(newRole), 'Create role successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to create role: ' + error.message);
        }
    }

    @Put('/:id')
    async updateRole(@Param('id') id: string, @Body() body: UpdateRoleDTO) {
        try {
            body.roleCode = id;
            const updatedRole = await this.roleService.updateRole(body);
            if (!updatedRole) {
                throw new NotFoundException('Role not found');
            }
            return ResponseHelper.send(RolesMapper.toDTO(updatedRole), 'Update role successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to update role: ' + error.message);
        }
    }

    @Delete()
    async deleteRole(@Body() codes: string[]) {
        try {
            await this.roleService.deleteRoles(codes);
            return ResponseHelper.send(null, 'Delete role(s) successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to delete role(s): ' + error.message);
        }
    }
}