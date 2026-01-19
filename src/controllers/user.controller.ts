import { Controller, Get, Post, Body, ValidationPipe, UsePipes, BadRequestException } from '@nestjs/common';
import { UsersService } from '../services/user.service';
import { UsersMapper } from '@/mappers/users.mapper';
import type { ApiResponse } from '@libs/core/interfaces/apiResponse.interface';
import type { CreateUserDto } from '@/dtos/users.dto';
import type { UserResponse, UserResponseList } from '@libs/shared/types/users.type';
import { ResponseHelper } from '@libs/core/helpers/response.helper';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // @Post()
    // @UsePipes(new ValidationPipe()) // Validate dữ liệu đầu vào theo DTO
    // async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<UserResponse>> {
    //     try {
    //         const user = await this.usersService.(createUserDto);
    //         return ResponseHelper.send(UsersMapper.toDTO(user), 'Tạo người dùng thành công.');
    //     } catch (error) {
    //         throw new BadRequestException('Lỗi khi tạo người dùng: ' + error.message);
    //     }
    // }

    // @Get()
    // async findAll(): Promise<ApiResponse<UserResponseList>> {
    //     try {
    //         const users = await this.usersService.();
    //         return ResponseHelper.send(UsersMapper.toListDTO(users), 'Lấy danh sách người dùng thành công.');
    //     } catch (error) {
    //         throw new BadRequestException('Lỗi khi lấy danh sách người dùng: ' + error.message);
    //     }
    // }
}