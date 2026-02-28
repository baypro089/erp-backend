import { EmployeeService } from "@/services/employee.service";
import { EmployeesMapper } from "@/mappers/employees.mapper";
import { AttachmentMapper } from "@/mappers/attachment.mapper";
import { EmployeeResponse, PagedAndFilteredEmployee } from "@libs/shared/types/employees.type";
import { AttachmentResponse } from "@libs/shared/types/attachment.type";
import { BadRequestException, Body, Controller, Delete, Get, Post, Put, Query, UploadedFile, UploadedFiles, UseInterceptors, Param } from "@nestjs/common";
import { Employee } from "@/entities/employee.entity";
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { FileInterceptor, FileFieldsInterceptor } from "@nestjs/platform-express";
import { FileService } from "@/services/file.service";
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreateEmployeeDto, UpdateEmployeeDto } from "@/dtos/employees.dto";


@ApiTags('Employees')
@Controller('employees')
export class EmployeeController {
    constructor(
        private employeeService: EmployeeService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Lấy danh sách tất cả nhân viên', description: 'Lấy danh sách tất cả nhân viên đang hoạt động' })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách nhân viên thành công' })
    async getAllEmployees(@Query('permissionPortal') permissionPortal?: string): Promise<ApiResponse<EmployeeResponse[]>> {
        try {
            const employees = await this.employeeService.getAllEmployees(permissionPortal);
            return ResponseHelper.send(EmployeesMapper.toDTOList(employees));
        } catch (error) {
            console.error('Error in getAllEmployees:', error);  
            throw error;
        }
    }

    @Get('/optional')
    @ApiOperation({ summary: 'Lấy danh sách nhân viên với bộ lọc', description: 'Lấy danh sách nhân viên với khả năng tìm kiếm, lọc và phân trang' })
    @ApiQuery({ name: 'fullName', required: false, description: 'Tìm kiếm theo tên nhân viên' })
    @ApiQuery({ name: 'departmentId', required: false, description: 'Lọc theo ID phòng ban' })
    @ApiQuery({ name: 'positionId', required: false, description: 'Lọc theo ID vị trí' })
    @ApiQuery({ name: 'startDateFrom', required: false, description: 'Ngày bắt đầu làm việc từ', type: Date })
    @ApiQuery({ name: 'startDateTo', required: false, description: 'Ngày bắt đầu làm việc đến', type: Date })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách nhân viên thành công' })
    async getEmployeesWithOptional(
        @Query() params: {
            employeeCode?: string,
            fullName?: string,
            departmentId?: string,
            positionId?: string,
            startDateFrom?: Date,
            startDateTo?: Date,
            level?: string,
            status?: string,
            page?: number,
            pageSize?: number,
        }
    ): Promise<ApiResponse<PagedAndFilteredEmployee>> {
        try {
            const employees = await this.employeeService.getAlllEmployeesOptional(
                params.employeeCode,
                params.fullName,
                params.departmentId,
                params.positionId,
                params.startDateFrom,
                params.startDateTo,
                params.level,
                params.status,
                params.page,
                params.pageSize,
            );
            const result: PagedAndFilteredEmployee = {
                items: EmployeesMapper.toResponseList(employees.items),
                totalCount: employees.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(employees.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < employees.total,
                hasPreviousPage: (params.page || 1) > 1,
            };
            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in getEmployeesWithOptional:', error);
            throw error;
        }
    }

    @Get('/optional/deleted')
    @ApiOperation({ summary: 'Lấy danh sách nhân viên đã xóa', description: 'Lấy danh sách nhân viên đã bị xóa (soft delete)' })
    @ApiQuery({ name: 'fullName', required: false, description: 'Tìm kiếm theo tên nhân viên' })
    @ApiQuery({ name: 'departmentId', required: false, description: 'Lọc theo ID phòng ban' })
    @ApiQuery({ name: 'positionId', required: false, description: 'Lọc theo ID vị trí' })
    @ApiQuery({ name: 'startDateFrom', required: false, description: 'Ngày bắt đầu làm việc từ', type: Date })
    @ApiQuery({ name: 'startDateTo', required: false, description: 'Ngày bắt đầu làm việc đến', type: Date })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ status: 200, description: 'Lấy danh sách nhân viên đã xóa thành công' })
    async getDeletedEmployees(
        @Query() params: {
            employeeCode?: string,
            fullName?: string,
            departmentId?: string,
            positionId?: string,
            startDateFrom?: Date,
            startDateTo?: Date,
            level?: string,
            status?: string,
            page?: number,
            pageSize?: number,
        }
    ): Promise<ApiResponse<PagedAndFilteredEmployee>> {
        try {
            const employees = await this.employeeService.getAllDeletedEmployeesOptional(
                params.employeeCode,
                params.fullName,
                params.departmentId,
                params.positionId,
                params.startDateFrom,
                params.startDateTo,
                params.level,
                params.status,
                params.page,
                params.pageSize,
            );
            const result: PagedAndFilteredEmployee = {
                items: EmployeesMapper.toResponseList(employees.items),
                totalCount: employees.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(employees.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < employees.total,
                hasPreviousPage: (params.page || 1) > 1,
            };
            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in getDeletedEmployees:', error);
            throw error;
        }
    }

    @Get('/:id')
    @ApiOperation({ summary: 'Lấy thông tin nhân viên theo ID', description: 'Lấy chi tiết thông tin một nhân viên' })
    @ApiParam({ name: 'id', description: 'ID của nhân viên', type: String })
    @SwaggerApiResponse({ status: 200, description: 'Lấy thông tin nhân viên thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
    async getEmployeeById(
        @Param('id') id: string
    ): Promise<ApiResponse<EmployeeResponse>> {
        try {
            const employee = await this.employeeService.getEmployeeById(id);
            return ResponseHelper.send(EmployeesMapper.toResponse(employee as Employee));
        } catch (error) {
            console.error('Error in getEmployeeById:', error);
            throw error;
        }
    }

    @Post()
    @ApiOperation({ summary: 'Tạo nhân viên mới', description: 'Tạo một nhân viên mới trong hệ thống' })
    @ApiBody({ type: CreateEmployeeDto, description: 'Thông tin nhân viên cần tạo' })
    @SwaggerApiResponse({ status: 201, description: 'Tạo nhân viên thành công' })
    @SwaggerApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    async createEmployee(
        @Body() createEmployeeDto: CreateEmployeeDto,
    ): Promise<ApiResponse<EmployeeResponse>> {
        try {
            const newEmployee = await this.employeeService.createEmployee(
                createEmployeeDto
            );
            console.log('Employee created successfully:', newEmployee);
            
            const response = EmployeesMapper.toResponse(newEmployee);
            console.log('Mapped response:', response);
            
            return ResponseHelper.send(response);
        } catch (error) {
            console.error('Error in createEmployee controller:', error);
            throw error;
        }
    }


    @Put('/:id')
    @ApiOperation({ summary: 'Cập nhật nhân viên', description: 'Cập nhật thông tin nhân viên (không bao gồm ảnh và CV)' })
    @ApiParam({ name: 'id', description: 'ID của nhân viên', type: String })
    @ApiBody({ type: UpdateEmployeeDto, description: 'Thông tin nhân viên cần cập nhật' })
    @SwaggerApiResponse({ status: 200, description: 'Cập nhật nhân viên thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
    async updateEmployee(
        @Param('id') id: string,
        @Body() updateEmployeeDto: UpdateEmployeeDto,
    ): Promise<ApiResponse<EmployeeResponse>> {
        try {
            const updatedEmployee = await this.employeeService.updateEmployee(id, updateEmployeeDto);
            return ResponseHelper.send(EmployeesMapper.toResponse(updatedEmployee as Employee));
        } catch (error) {
            console.error('Error in updateEmployee:', error);
            throw error;
        }
    }

    /**
     * Upload hoặc cập nhật ảnh của nhân viên
     */
    @Put('/:id/photo')
    @ApiOperation({ summary: 'Upload/Cập nhật ảnh nhân viên', description: 'Upload hoặc thay đổi ảnh của nhân viên' })
    @ApiConsumes('multipart/form-data')
    @ApiParam({ name: 'id', description: 'ID của nhân viên', type: String })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                photo: {
                    type: 'string',
                    format: 'binary',
                    description: 'Ảnh nhân viên',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('photo'))
    @SwaggerApiResponse({ status: 200, description: 'Upload ảnh thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
    async updateEmployeePhoto(
        @Param('id') id: string,
        @UploadedFile() photo: Express.Multer.File,
    ): Promise<ApiResponse<EmployeeResponse>> {
        try {
            if (!photo) {
                throw new BadRequestException('Photo file is required');
            }
            const updatedEmployee = await this.employeeService.updateEmployeePhoto(id, photo);
            return ResponseHelper.send(
                EmployeesMapper.toResponse(updatedEmployee as Employee),
                'Upload employee photo successfully.',
            );
        } catch (error) {
            console.error('Error in updateEmployeePhoto:', error);
            throw error;
        }
    }

    /**
     * Upload hoặc cập nhật CV của nhân viên
     */
    @Put('/:id/cv')
    @ApiOperation({ summary: 'Upload/Cập nhật CV nhân viên', description: 'Upload hoặc thay đổi CV của nhân viên' })
    @ApiConsumes('multipart/form-data')
    @ApiParam({ name: 'id', description: 'ID của nhân viên', type: String })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cv: {
                    type: 'string',
                    format: 'binary',
                    description: 'CV của nhân viên (PDF, DOC, DOCX)',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('cv'))
    @SwaggerApiResponse({ status: 200, description: 'Upload CV thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
    async updateEmployeeCV(
        @Param('id') id: string,
        @UploadedFile() cv: Express.Multer.File,
    ): Promise<ApiResponse<EmployeeResponse>> {
        try {
            if (!cv) {
                throw new BadRequestException('CV file is required');
            }
            const updatedEmployee = await this.employeeService.updateEmployeeCV(id, cv);
            return ResponseHelper.send(
                EmployeesMapper.toResponse(updatedEmployee as Employee),
                'Upload employee CV successfully.',
            );
        } catch (error) {
            console.error('Error in updateEmployeeCV:', error);
            throw error;
        }
    }

    /**
     * Lấy ảnh của nhân viên
     */
    @Get('/:id/photo')
    @ApiOperation({ summary: 'Lấy ảnh nhân viên', description: 'Lấy thông tin ảnh của nhân viên' })
    @ApiParam({ name: 'id', description: 'ID của nhân viên', type: String })
    @SwaggerApiResponse({ status: 200, description: 'Lấy ảnh nhân viên thành công' })
    async getEmployeePhoto(@Param('id') id: string): Promise<ApiResponse<AttachmentResponse | null>> {
        try {
            const photo = await this.employeeService.getEmployeePhoto(id);
            const response = photo ? AttachmentMapper.toResponse(photo) : null;
            return ResponseHelper.send(response, 'Get employee photo successfully.');
        } catch (error) {
            console.error('Error in getEmployeePhoto:', error);
            throw error;
        }
    }

    /**
     * Lấy CV của nhân viên
     */
    @Get('/:id/cv')
    @ApiOperation({ summary: 'Lấy CV nhân viên', description: 'Lấy thông tin CV của nhân viên' })
    @ApiParam({ name: 'id', description: 'ID của nhân viên', type: String })
    @SwaggerApiResponse({ status: 200, description: 'Lấy CV nhân viên thành công' })
    async getEmployeeCV(@Param('id') id: string): Promise<ApiResponse<AttachmentResponse | null>> {
        try {
            const cv = await this.employeeService.getEmployeeCV(id);
            const response = cv ? AttachmentMapper.toResponse(cv) : null;
            return ResponseHelper.send(response, 'Get employee CV successfully.');
        } catch (error) {
            console.error('Error in getEmployeeCV:', error);
            throw error;
        }
    }

    @Delete('/delete')
    @ApiOperation({ summary: 'Xóa nhân viên', description: 'Xóa một hoặc nhiều nhân viên' })
    @ApiBody({ schema: { type: 'array', items: { type: 'string' } }, description: 'Danh sách ID nhân viên cần xóa' })
    @SwaggerApiResponse({ status: 200, description: 'Xóa nhân viên thành công' })
    @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy nhân viên' })
    async deleteEmployee(
        @Body() ids: string[]
    ) {
        try {
            await this.employeeService.deleteEmployees(ids);
            return { message: 'Employee deleted successfully' };
        } catch (error) {
            console.error('Error in deleteEmployee:', error);
            throw error;
        }
    }
}