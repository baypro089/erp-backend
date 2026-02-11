import { PayslipService } from "@/services/payslip.service";
import { 
    Controller, 
    Post, 
    Get, 
    Patch, 
    Body, 
    Param, 
    Query,
    BadRequestException 
} from "@nestjs/common";
import { PayslipsMapper } from "@/mappers/payslips.mapper";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody } from "@nestjs/swagger";
import { CalculatePayslipDto, GeneratePayrollDto, MarkPayslipAsPaidDto } from "@/dtos/payslips.dto";
import { PayslipResponse, PagedAndFilteredPayslip, PayrollGenerationResult } from "@libs/shared/types/payslips.type";

@ApiTags('Payslips')
@Controller('payslips')
export class PayslipController {
    constructor(private readonly payslipService: PayslipService) {}

    @Post('calculate')
    @ApiOperation({ 
        summary: 'Tính lương cho một nhân viên', 
        description: 'Tính lương cho một nhân viên cụ thể theo tháng và năm. Hệ thống sẽ tự động tính toán dựa trên ngày công, ngày nghỉ và mức lương hiện tại.' 
    })
    @ApiBody({ type: CalculatePayslipDto })
    @SwaggerApiResponse({ 
        status: 201, 
        description: 'Tính lương thành công' 
    })
    @SwaggerApiResponse({ 
        status: 400, 
        description: 'Dữ liệu không hợp lệ hoặc lương đã được thanh toán' 
    })
    async calculatePayslip(
        @Body() dto: CalculatePayslipDto
    ): Promise<ApiResponse<PayslipResponse>> {
        try {
            const payslip = await this.payslipService.calculatePayslip(
                dto.employeeId,
                dto.month,
                dto.year
            );
            return ResponseHelper.send(PayslipsMapper.toResponse(payslip));
        } catch (error) {
            console.error('Error in calculatePayslip:', error);
            throw error;
        }
    }

    @Post('generate-payroll')
    @ApiOperation({ 
        summary: 'Tính lương cho toàn bộ nhân viên', 
        description: 'Chạy batch job tính lương cho tất cả nhân viên trong tháng. Trả về kết quả chi tiết cho từng nhân viên.' 
    })
    @ApiBody({ type: GeneratePayrollDto })
    @SwaggerApiResponse({ 
        status: 201, 
        description: 'Tạo bảng lương thành công' 
    })
    async generatePayroll(
        @Body() dto: GeneratePayrollDto
    ): Promise<ApiResponse<PayrollGenerationResult>> {
        try {
            const result = await this.payslipService.generatePayrollForMonth(
                dto.month,
                dto.year
            );
            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in generatePayroll:', error);
            throw error;
        }
    }

    @Get()
    @ApiOperation({ 
        summary: 'Lấy danh sách phiếu lương với bộ lọc', 
        description: 'Lấy danh sách phiếu lương với khả năng lọc theo tháng, năm và phân trang' 
    })
    @ApiQuery({ name: 'month', required: false, description: 'Lọc theo tháng (1-12)', type: Number })
    @ApiQuery({ name: 'year', required: false, description: 'Lọc theo năm', type: Number })
    @ApiQuery({ name: 'page', required: false, description: 'Số trang', type: Number })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Số bản ghi mỗi trang', type: Number })
    @SwaggerApiResponse({ 
        status: 200, 
        description: 'Lấy danh sách phiếu lương thành công' 
    })
    async getAllPayslips(
        @Query() params: {
            month?: number,
            year?: number,
            page?: number,
            pageSize?: number,
        }
    ): Promise<ApiResponse<PagedAndFilteredPayslip>> {
        try {
            const payslips = await this.payslipService.findAllPayslips(
                params.month,
                params.year,
                params.page,
                params.pageSize
            );

            const result: PagedAndFilteredPayslip = {
                items: PayslipsMapper.toTableResponseList(payslips.items),
                totalCount: payslips.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(payslips.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < payslips.total,
                hasPreviousPage: (params.page || 1) > 1,
            };
            return ResponseHelper.send(result);
        } catch (error) {
            console.error('Error in getAllPayslips:', error);
            throw error;
        }
    }

    @Get('/my-payslips/:employeeId')
    @ApiOperation({ 
        summary: 'Lấy danh sách phiếu lương của chính mình', 
        description: 'Nhân viên có thể xem danh sách phiếu lương của mình theo tháng và năm'
    })
    @ApiParam({ name: 'employeeId', description: 'ID của nhân viên' })
    @ApiQuery({ name: 'month', required: false, description: 'Lọc theo tháng (1-12)', type: Number })
    @ApiQuery({ name: 'year', required: false, description: 'Lọc theo năm', type: Number })
    @SwaggerApiResponse({ 
        status: 200, 
        description: 'Lấy danh sách phiếu lương của chính mình thành công'
    })
    async getMyPayslips(
        @Param('employeeId') employeeId: string,
        @Query() params: {
            month?: number,
            year?: number,
            page?: number,
            pageSize?: number,
        }
    ): Promise<ApiResponse<PagedAndFilteredPayslip>> {
        try {
            const payslips = await this.payslipService.getMyPayslips(
                employeeId,
                params.month,
                params.year,
                params.page,
                params.pageSize
            );

            const result: PagedAndFilteredPayslip = {
                items: PayslipsMapper.toTableResponseList(payslips.items),
                totalCount: payslips.total,
                page: params.page || 1,
                pageSize: params.pageSize || 10,
                totalPages: Math.ceil(payslips.total / (params.pageSize || 10)),
                hasNextPage: (params.page || 1) * (params.pageSize || 10) < payslips.total,
                hasPreviousPage: (params.page || 1) > 1,
            };
            return ResponseHelper.send(result);
        }
        catch (error) {
            console.error(`Error in getMyPayslips: ${employeeId}`, error);
            throw error;
        }
    }

    @Patch(':id/mark-paid')
    @ApiOperation({ 
        summary: 'Đánh dấu phiếu lương đã thanh toán', 
        description: 'Cập nhật trạng thái phiếu lương thành đã thanh toán. Sau khi thanh toán, phiếu lương không thể chỉnh sửa.' 
    })
    @ApiParam({ name: 'id', description: 'ID của phiếu lương' })
    @SwaggerApiResponse({ 
        status: 200, 
        description: 'Đánh dấu thanh toán thành công' 
    })
    @SwaggerApiResponse({ 
        status: 404, 
        description: 'Không tìm thấy phiếu lương' 
    })
    async markAsPaid(
        @Param('id') id: string
    ): Promise<ApiResponse<PayslipResponse>> {
        try {
            const payslip = await this.payslipService.markPayslipAsPaid(id);
            return ResponseHelper.send(PayslipsMapper.toResponse(payslip));
        } catch (error) {
            console.error(`Error in markAsPaid: ${id}`, error);
            throw error;
        }
    }

    @Get(':id')
    @ApiOperation({ 
        summary: 'Lấy chi tiết phiếu lương theo ID',
        description: 'Lấy thông tin chi tiết của một phiếu lương dựa trên ID của nó.'
    })
    @ApiParam({ name: 'id', description: 'ID của phiếu lương' })
    @SwaggerApiResponse({ 
        status: 200, 
        description: 'Lấy chi tiết phiếu lương thành công'
    })
    async getPayslipById(
        @Param('id') id: string
    ): Promise<ApiResponse<PayslipResponse>> {
        try {
            const payslip = await this.payslipService.getPayslipById(id);
            return ResponseHelper.send(PayslipsMapper.toResponse(payslip));
        } catch (error) {
            console.error(`Error in getPayslipById: ${id}`, error);
            throw error;
        }
    }
}