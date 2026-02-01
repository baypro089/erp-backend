import { Controller, Get, Post, Body, Put, Delete, Query, Patch, Param } from '@nestjs/common';
import { UsersService } from '../services/user.service';
import { UsersMapper } from '@/mappers/users.mapper';
import type { ApiResponse } from '@libs/core/interfaces/apiResponse.interface';
import { CreateUserDto, UpdateUserDto } from '@/dtos/users.dto';
import type { UserResponse, UserFilterAndPaged } from '@libs/shared/types/users.type';
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { User } from '@/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng', description: 'Lấy danh sách tất cả người dùng đang hoạt động' })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách người dùng thành công' })
    async getAllUsers(): Promise<ApiResponse<UserResponse[]>> {
        try {
            const users = await this.usersService.getAllUsers();
            return ResponseHelper.send(UsersMapper.toListDTO(users));
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    }

    @Get('/optional')
    @ApiOperation({ summary: 'Lấy danh sách người dùng với bộ lọc', description: 'Lấy danh sách người dùng với khả năng tìm kiếm, lọc và phân trang' })
    @ApiQuery({ name: 'userId', required: false, description: 'ID người dùng' })
    @ApiQuery({ name: 'username', required: false, description: 'Tên đăng nhập' })
    @ApiQuery({ name: 'email', required: false, description: 'Email' })
    @ApiQuery({ name: 'roleId', required: false, description: 'Mã vai trò' })
    @ApiQuery({ name: 'employeeName', required: false, description: 'Tên nhân viên' })
    @ApiQuery({ name: 'createDateFrom', required: false, description: 'Ngày tạo từ', type: Date })
    @ApiQuery({ name: 'createDateTo', required: false, description: 'Ngày tạo đến', type: Date })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách người dùng thành công' })
    async getUsersWithOptional(
        @Query() params: {
            userId?: string,
            username?: string,
            email?: string,
            roleId?: string,
            employeeName?: string,
            createDateFrom?: Date,
            createDateTo?: Date,
            page?: number,
            pageSize?: number,
        }
    ): Promise<ApiResponse<UserFilterAndPaged>> {
        try {
            const result = await this.usersService.getAllUsersOptional(
                params.userId,
                params.username,
                params.email,
                params.roleId,
                params.employeeName,
                params.createDateFrom,
                params.createDateTo,
                params.page,
                params.pageSize,
            );
            
            return ResponseHelper.send({
                ...result,
                items: UsersMapper.toListDTO(result.items),
            });
        } catch (error) {
            console.error('Error in getUsersWithOptional:', error);
            throw error;
        }
    }

    @Get('/:id')
    @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID', description: 'Lấy chi tiết thông tin một người dùng' })
    @ApiParam({ name: 'id', description: 'ID của người dùng', type: String })
    @SwaggerApiResponse({ status: 200, description: 'Lấy thông tin người dùng thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
    async getUserById(
        @Param('id') id: string
    ): Promise<ApiResponse<UserResponse>> {
        try {
            const user = await this.usersService.findById(id);
            return ResponseHelper.send(UsersMapper.toDTO(user as User));
        } catch (error) {
            console.error('Error in getUserById:', error);
            throw error;
        }
    }

    @Post()
    @ApiOperation({ summary: 'Tạo người dùng mới', description: 'Tạo một người dùng mới trong hệ thống' })
    @ApiBody({ type: CreateUserDto, description: 'Thông tin người dùng cần tạo' })
    @SwaggerApiResponse({ status: 201, description: 'Tạo người dùng thành công' })
    @SwaggerApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    async createUser(
        @Body() createUserDto: CreateUserDto,
    ): Promise<ApiResponse<UserResponse>> {
        try {
            const newUser = await this.usersService.createUser(createUserDto);
            return ResponseHelper.send(UsersMapper.toDTO(newUser));
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    @Put('/:id')
    @ApiOperation({ summary: 'Cập nhật người dùng', description: 'Cập nhật thông tin người dùng' })
    @ApiParam({ name: 'id', description: 'ID của người dùng', type: String })
    @ApiBody({ type: UpdateUserDto, description: 'Thông tin người dùng cần cập nhật' })
    @SwaggerApiResponse({ status: 200, description: 'Cập nhật người dùng thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
    async updateUser(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<ApiResponse<UserResponse>> {
        try {
            const updatedUser = await this.usersService.updateUser(id, updateUserDto);
            return ResponseHelper.send(UsersMapper.toDTO(updatedUser as User));
        } catch (error) {
            console.error('Error in updateUser:', error);
            throw error;
        }
    }

    @Post('/:id/ban')
    @ApiOperation({ summary: 'Cấm người dùng', description: 'Cấm một người dùng khỏi hệ thống' })
    @ApiParam({ name: 'id', description: 'ID của người dùng', type: String })
    @SwaggerApiResponse({ status: 200, description: 'Cấm người dùng thành công' })
    async banUser(
        @Param('id') id: string
    ): Promise<ApiResponse<{ message: string }>> {
        try {
            await this.usersService.banUser(id);
            return ResponseHelper.send({ message: 'User banned successfully' });
        } catch (error) {
            console.error('Error in banUser:', error);
            throw error;
        }
    }
}