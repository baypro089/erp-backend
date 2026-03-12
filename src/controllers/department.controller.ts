import { DepartmentService } from "@/services/department.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "@/dtos/departments.dto";
import { DepartmentResponse, PagedAndFilteredDepartment } from "@libs/shared/types/departments.type";
import { Body, Controller, Delete, Get, Post, Put, Query, Param } from "@nestjs/common";
import { DepartmentsMapper } from "@/mappers/departments.mapper";
import { Department } from "@/entities/department.entity";
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { RequirePermissions } from '@/decorators/permissions.decorator';
import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';


@ApiTags('Departments')
@Controller('departments')
export class DepartmentController {
    constructor(
        private departmentService: DepartmentService,
    ) { }

    @Get()
    @RequirePermissions(PERMISSIONS.DEPARTMENT.VIEW)
    @ApiOperation({ summary: 'Lấy danh sách tất cả phòng ban', description: 'Lấy danh sách tất cả phòng ban đang hoạt động' })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách phòng ban thành công' })
    async getAllDepartments(): Promise<ApiResponse<DepartmentResponse[]>> {
        try {
            const departments = await this.departmentService.getAllDepartments();
            return ResponseHelper.send(DepartmentsMapper.toResponseList(departments));
        } catch (error) {
            console.error('Error in getAllDepartments:', error);
            throw error;
        }
    }

    @Get('/optional')
    @RequirePermissions(PERMISSIONS.DEPARTMENT.VIEW)
    @ApiOperation({ summary: 'Lấy danh sách phòng ban với bộ lọc', description: 'Lấy danh sách phòng ban với khả năng tìm kiếm, lọc và phân trang' })
    @ApiQuery({ name: 'name', required: false, description: 'Tìm kiếm theo tên phòng ban' })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách phòng ban thành công' })
    async getDepartmentsWithOptional(
        @Query() params: {
            name?: string,
            page?: number,
            pageSize?: number,
        }
    ): Promise<ApiResponse<PagedAndFilteredDepartment>> {
        try {
            const departments = await this.departmentService.getAllDepartmentsOptional(
                params.name,
                params.page,
                params.pageSize,
            );
            const result: PagedAndFilteredDepartment = {
                items: DepartmentsMapper.toResponseList(departments.items),
                totalCount: departments.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(departments.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < departments.total,
                hasPreviousPage: (params.page || 1) > 1,
            };
            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in getDepartmentsWithOptional:', error);
            throw error;
        }
    }

    @Get('/:id')
    @RequirePermissions(PERMISSIONS.DEPARTMENT.VIEW)
    @ApiOperation({ summary: 'Lấy thông tin phòng ban theo ID', description: 'Lấy chi tiết thông tin một phòng ban' })
    @ApiParam({ name: 'id', description: 'ID của phòng ban', type: String })
    @SwaggerApiResponse({ status: 200, description: 'Lấy thông tin phòng ban thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
    async getDepartmentById(
        @Param('id') id: string
    ): Promise<ApiResponse<DepartmentResponse>> {
        try {
            const department = await this.departmentService.getDepartmentById(id);
            return ResponseHelper.send(DepartmentsMapper.toResponse(department as Department));
        } catch (error) {
            console.error('Error in getDepartmentById:', error);
            throw error;
        }
    }

    @Post()
    @RequirePermissions(PERMISSIONS.DEPARTMENT.CREATE)
    @ApiOperation({ summary: 'Tạo phòng ban mới', description: 'Tạo một phòng ban mới' })
    @ApiBody({ type: CreateDepartmentDto, description: 'Thông tin phòng ban cần tạo' })
    @SwaggerApiResponse({ status: 201, description: 'Tạo phòng ban thành công' })
    @SwaggerApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    async createDepartment(
        @Body() createDepartmentDto: CreateDepartmentDto,
    ): Promise<ApiResponse<DepartmentResponse>> {
        try {
            const newDepartment = await this.departmentService.createDepartment(
                createDepartmentDto,
            );

            return ResponseHelper.send(
                DepartmentsMapper.toResponse(newDepartment),
            );
        } catch (error) {
            console.error('Error in createDepartment:', error);
            throw error;
        }
    }


    @Put('/:id')
    @RequirePermissions(PERMISSIONS.DEPARTMENT.UPDATE)
    @ApiOperation({ summary: 'Cập nhật phòng ban', description: 'Cập nhật thông tin phòng ban' })
    @ApiParam({ name: 'id', description: 'ID của phòng ban', type: String })
    @ApiBody({ type: UpdateDepartmentDto, description: 'Thông tin phòng ban cần cập nhật' })
    @SwaggerApiResponse({ status: 200, description: 'Cập nhật phòng ban thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
    async updateDepartment(
        @Param('id') id: string,
        @Body() updateDepartmentDto: UpdateDepartmentDto,
    ): Promise<ApiResponse<DepartmentResponse>> {
        try {
            const updatedDepartment = await this.departmentService.updateDepartment(id, updateDepartmentDto);
            return ResponseHelper.send(DepartmentsMapper.toResponse(updatedDepartment as Department));
        } catch (error) {
            console.error('Error in updateDepartment:', error);
            throw error;
        }
    }

    @Delete('/delete')
    @RequirePermissions(PERMISSIONS.DEPARTMENT.DELETE)
    @ApiOperation({ summary: 'Xóa phòng ban', description: 'Xóa một hoặc nhiều phòng ban' })
    @ApiBody({ schema: { type: 'array', items: { type: 'string' } }, description: 'Danh sách ID phòng ban cần xóa' })
    @SwaggerApiResponse({ status: 200, description: 'Xóa phòng ban thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy phòng ban' })
    async deleteDepartments(
        @Body() ids: string[]
    ) {
        try {
            await this.departmentService.deleteDepartments(ids);
            return { message: 'Department deleted successfully' };
        } catch (error) {
            console.error('Error in deleteDepartments:', error);
            throw error;
        }
    }
}
