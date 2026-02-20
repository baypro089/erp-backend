import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/guards/auth.guard";
import { ImportReceiptService } from "@/services/import-receipt.service";
import { ResponseHelper } from "@libs/core/helpers/response.helper";
import { ApiResponse } from "@libs/core/interfaces/apiResponse.interface";
import { CreateImportReceiptDTO } from "@/dtos/import-receipt.dto";
import { ImportReceiptMapper } from "@/mappers/import-receipt.mapper";
import { ReceiptStatus } from "@libs/shared/enums/receipt-status.enum";
import { ImportReceiptResponse, ImportReceiptTableFilteredAndPaged } from "@libs/shared/types/import-receipt.type";

@ApiTags('import-receipts')
@Controller('import-receipts')
@UseGuards(JwtAuthGuard)
export class ImportReceiptController {
    constructor(
        private readonly importReceiptService: ImportReceiptService
    ) { }

    @Post()
    async createImportReceipt(
        @Body() dto: CreateImportReceiptDTO,
        @Req() req: any,
    ): Promise<ApiResponse<ImportReceiptResponse>> {
        try {
            const userId = req.user.id; // Lấy userId từ JWT token
            if (!userId) {
                throw new UnauthorizedException('User not authenticated');
            }
            const result = await this.importReceiptService.createImportReceipt(userId, dto);
            return ResponseHelper.send(
                ImportReceiptMapper.toResponse(result),
                'Tạo phiếu nhập kho thành công'
            );
        } catch (error) {
            console.error('Error in createImportReceipt:', error);
            throw error;
        }
    }

    @Get(':id')
    async getImportReceiptById(
        @Param('id') id: string
    ): Promise<ApiResponse<ImportReceiptResponse>> {
        try {
            const result = await this.importReceiptService.getImportReceiptById(id);
            return ResponseHelper.send(
                ImportReceiptMapper.toResponse(result),
                'Lấy chi tiết phiếu nhập thành công'
            );
        } catch (error) {
            console.error('Error in getImportReceiptById:', error);
            throw error;
        }
    }

    @Get()
    async getAllImportReceipts(
        @Query() params: {
            code?: string;
            warehouseId?: string;
            dateFrom?: string;
            dateTo?: string;
            totalPriceFrom?: number;
            totalPriceTo?: number;
            status?: ReceiptStatus;
            page?: number;
            pageSize?: number;
        }
    ): Promise<ApiResponse<ImportReceiptTableFilteredAndPaged>> {
        try {
            const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
            const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

            const result = await this.importReceiptService.getAllImportReceipts(
                params.code,
                params.warehouseId,
                dateFrom,
                dateTo,
                params.totalPriceFrom,
                params.totalPriceTo,
                params.status,
                params.page,
                params.pageSize
            );

            const page = params.page || 1;
            const pageSize = params.pageSize || 10;

            return ResponseHelper.send({
                items: ImportReceiptMapper.toTableResponseList(result.items),
                totalCount: result.total,
                page,
                pageSize,
                totalPages: Math.ceil(result.total / pageSize),
                hasNextPage: page * pageSize < result.total,
                hasPreviousPage: page > 1,
            }, 'Lấy danh sách phiếu nhập thành công');
        } catch (error) {
            console.error('Error in getAllImportReceipts:', error);
            throw error;
        }
    }
}