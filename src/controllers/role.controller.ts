import { Request, Response } from 'express';
import { RoleService } from '../services/role.service';
import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from "@nestjs/common";
import { ApiResponse } from '@libs/core/interfaces/apiResponse.interface';
import { Role } from '@/entities/role.entity';
import { RolesMapper } from '@/mappers/roles.mapper';
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { RoleResponse } from '@libs/shared/types/roles.type';
import { CreateRoleDTO, UpdateRoleDTO } from '@/dtos/roles.dtos';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PermissionResponse } from '@libs/shared/types/permissions.type';
import { PermissionMapper } from '@/mappers/permissions.mapper';
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';

@ApiTags('Roles')
@Controller('roles')
export class RoleController {

    constructor(private readonly roleService: RoleService) {    }

    @Get()
    @RequirePermissions(PERMISSIONS.ROLE.VIEW)
    @ApiOperation({ summary: 'Lấy danh sách vai trò', description: 'Lấy danh sách vai trò với khả năng lọc theo mã và tên' })
    @ApiQuery({ name: 'roleCode', required: false, description: 'Mã vai trò' })
    @ApiQuery({ name: 'roleName', required: false, description: 'Tên vai trò' })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách vai trò thành công' })
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
    @RequirePermissions(PERMISSIONS.ROLE.VIEW)
    @ApiOperation({ summary: 'Lấy thông tin vai trò theo mã', description: 'Lấy chi tiết thông tin một vai trò' })
    @ApiParam({ name: 'id', description: 'Mã vai trò', type: String })
    @SwaggerApiResponse({ status: 200, description: 'Lấy thông tin vai trò thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy vai trò' })
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
    @RequirePermissions(PERMISSIONS.ROLE.CREATE)
    @ApiOperation({ summary: 'Tạo vai trò mới', description: 'Tạo một vai trò mới trong hệ thống' })
    @ApiBody({ type: CreateRoleDTO, description: 'Thông tin vai trò cần tạo' })
    @SwaggerApiResponse({ status: 201, description: 'Tạo vai trò thành công' })
    @SwaggerApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    async createRole(@Body() body: CreateRoleDTO) {
        try {
            const newRole = await this.roleService.createRole(body);
            return ResponseHelper.send(RolesMapper.toDTO(newRole), 'Create role successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to create role: ' + error.message);
        }
    }

    @Put('/:id')
    @RequirePermissions(PERMISSIONS.ROLE.UPDATE)
    @ApiOperation({ summary: 'Cập nhật vai trò', description: 'Cập nhật thông tin vai trò' })
    @ApiParam({ name: 'id', description: 'Mã vai trò', type: String })
    @ApiBody({ type: UpdateRoleDTO, description: 'Thông tin vai trò cần cập nhật' })
    @SwaggerApiResponse({ status: 200, description: 'Cập nhật vai trò thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy vai trò' })
    async updateRole(@Param('id') id: string, @Body() body: UpdateRoleDTO) {
        try {
            const updatedRole = await this.roleService.updateRole(id, body);
            if (!updatedRole) {
                throw new NotFoundException('Role not found');
            }
            return ResponseHelper.send(RolesMapper.toDTO(updatedRole), 'Update role successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to update role: ' + error.message);
        }
    }

    @Delete('/delete')
    @RequirePermissions(PERMISSIONS.ROLE.DELETE)
    @ApiOperation({ summary: 'Xóa vai trò', description: 'Xóa một hoặc nhiều vai trò' })
    @ApiBody({ schema: { type: 'array', items: { type: 'string' } }, description: 'Danh sách mã vai trò cần xóa' })
    @SwaggerApiResponse({ status: 200, description: 'Xóa vai trò thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy vai trò' })
    async deleteRole(@Body() codes: string[]) {
        try {
            await this.roleService.deleteRoles(codes);
            return ResponseHelper.send(null, 'Delete role(s) successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to delete role(s): ' + error.message);
        }
    }

    @Get('/permissions/all')
    @RequirePermissions(PERMISSIONS.PERMISSION.VIEW)
    @ApiOperation({ summary: 'Lấy tất cả quyền', description: 'Lấy danh sách tất cả các quyền có trong hệ thống' })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách quyền thành công' })
    async getAllPermissions(): Promise<ApiResponse<PermissionResponse[]>> {
        try {
            const permissions = await this.roleService.getAllPermissions();
            return ResponseHelper.send(PermissionMapper.toResponseList(permissions), 'Get all permissions successfully.');
        } catch (error) {
            throw new BadRequestException('Failed to get permissions: ' + error.message);
        }
    }
}