import { SalesReportFilterDTO } from '@/dtos/sales-report-filter.dto';
import { OrderDetail } from '@/entities/order-detail.entity';
import { Order } from '@/entities/order.entity';
import { OrderStatus } from '@libs/shared/enums/order-status.enum';
import { ReportPeriod } from '@libs/shared/enums/report-period.enum';
import { ICommercialReport } from '@libs/shared/types/commercial-report.type';
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { DataSource } from 'typeorm';


@Injectable()
export class SalesReportService {
    constructor(private dataSource: DataSource) { }

    async getSalesAndProfitReport(filter: SalesReportFilterDTO): Promise<ICommercialReport> {
        const { periodType, month, quarter, year } = filter;
        const targetYear = year || new Date().getFullYear();

        const orderRepo = this.dataSource.getRepository(Order);
        const orderDetailRepo = this.dataSource.getRepository(OrderDetail);

        // ==========================================
        // TẠO ĐIỀU KIỆN LỌC THỜI GIAN ĐỘNG
        // ==========================================
        let timeCondition = `EXTRACT(YEAR FROM o.createdAt) = :year`;
        const params: any = { year: targetYear };

        if (periodType === ReportPeriod.MONTH && month) {
            timeCondition += ` AND EXTRACT(MONTH FROM o.createdAt) = :month`;
            params.month = month;
        } else if (periodType === ReportPeriod.QUARTER && quarter) {
            // Logic tính Quý trong SQL (Postgres/MySQL đều hỗ trợ)
            timeCondition += ` AND EXTRACT(QUARTER FROM o.createdAt) = :quarter`;
            params.quarter = quarter;
        }

        // ==========================================
        // 1. THỐNG KÊ LỢI NHUẬN (Doanh thu - Giá vốn)
        // ==========================================
        const profitQuery = await orderDetailRepo.createQueryBuilder('oi')
            .leftJoin('oi.order', 'o')
            .leftJoin('oi.product', 'p')
            // Tổng doanh thu = Tổng (Số lượng bán * Giá bán thực tế)
            .select('SUM(oi.amount)', 'totalRevenue')
            // Tổng giá vốn = Tổng (Số lượng bán * Giá nhập của sản phẩm)
            // Lấy p.retailPrice vì chưa tìm thấy costPrice, nếu có costPrice hãy đổi lại
            .addSelect('SUM(oi.quantity * p.retailPrice)', 'totalCost')
            // Chỉ tính những đơn đã giao hoặc xuất kho thành công
            .where('o.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] })
            .andWhere(timeCondition, params)
            .getRawOne();

        const revenue = Number(profitQuery?.totalRevenue || 0);
        const cost = Number(profitQuery?.totalCost || 0);
        const profit = revenue - cost;

        // ==========================================
        // 2. THỐNG KÊ SỐ LƯỢNG SẢN PHẨM ĐÃ XUẤT
        // ==========================================
        const exportedProducts = await orderDetailRepo.createQueryBuilder('oi')
            .leftJoin('oi.order', 'o')
            .leftJoinAndSelect('oi.product', 'p')
            .select('p.sku', 'sku')
            .addSelect('p.name', 'productName')
            .addSelect('SUM(oi.quantity)', 'totalExportedQuantity')
            .addSelect('SUM(oi.quantity * oi.unitPrice)', 'revenueFromProduct')
            .where('o.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] })
            .andWhere(timeCondition, params)
            .groupBy('p.id')
            .addGroupBy('p.sku')
            .addGroupBy('p.name')
            .orderBy('"totalExportedQuantity"', 'DESC')
            .getRawMany();

        return {
            periodInfo: { type: periodType, year: targetYear, value: month || quarter || 'All' },
            financials: {
                revenue,          // Tổng doanh thu
                cogs: cost,       // Giá vốn hàng bán
                grossProfit: profit, // Lợi nhuận
                profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) + '%' : '0%' // Tỷ suất lợi nhuận
            },
            exportedDetails: exportedProducts.map(item => ({
                sku: item.sku,
                productName: item.productName,
                totalExportedQuantity: Number(item.totalExportedQuantity),
                revenue: Number(item.revenueFromProduct)
            }))
        };
    }

    async exportSalesReportToExcel(filter: SalesReportFilterDTO): Promise<Buffer> {
        const report = await this.getSalesAndProfitReport(filter);
        const { periodInfo, financials, exportedDetails } = report;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ERP System';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Báo cáo doanh thu');

        // ── Tiêu đề báo cáo ──────────────────────────────────────
        const periodLabel = periodInfo.type === ReportPeriod.MONTH
            ? `Tháng ${periodInfo.value}/${periodInfo.year}`
            : periodInfo.type === ReportPeriod.QUARTER
                ? `Quý ${periodInfo.value}/${periodInfo.year}`
                : `Năm ${periodInfo.year}`;

        sheet.mergeCells('A1:F1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = `BÁO CÁO DOANH THU & LỢI NHUẬN – ${periodLabel.toUpperCase()}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 30;

        sheet.addRow([]);

        // ── Bảng tài chính ───────────────────────────────────────
        const finHeader = sheet.addRow(['CHỈ SỐ TÀI CHÍNH', '']);
        finHeader.font = { bold: true };
        finHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        finHeader.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        finHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        finHeader.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        const finRows = [
            ['Tổng doanh thu', financials.revenue],
            ['Giá vốn hàng bán (COGS)', financials.cogs],
            ['Lợi nhuận gộp', financials.grossProfit],
            ['Tỷ suất lợi nhuận', financials.profitMargin],
        ];

        finRows.forEach(([label, value], idx) => {
            const row = sheet.addRow([label, value]);
            row.getCell(1).font = { bold: true };
            if (typeof value === 'number') {
                row.getCell(2).numFmt = '#,##0';
            }
            if (idx % 2 === 0) {
                row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
                row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
            }
        });

        sheet.addRow([]);

        // ── Bảng chi tiết sản phẩm ───────────────────────────────
        const detailHeader = sheet.addRow(['STT', 'Mã SKU', 'Tên sản phẩm', 'Số lượng đã xuất', 'Doanh thu (VNĐ)']);
        detailHeader.font = { bold: true };
        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
            const cell = detailHeader.getCell(col);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
        });

        exportedDetails.forEach((item, idx) => {
            const row = sheet.addRow([
                idx + 1,
                item.sku,
                item.productName,
                item.totalExportedQuantity,
                item.revenue,
            ]);
            row.getCell(4).numFmt = '#,##0';
            row.getCell(5).numFmt = '#,##0';
            if (idx % 2 === 0) {
                ['A', 'B', 'C', 'D', 'E'].forEach(col => {
                    row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } };
                });
            }
        });

        // ── Độ rộng cột ──────────────────────────────────────────
        sheet.getColumn(1).width = 8;
        sheet.getColumn(2).width = 18;
        sheet.getColumn(3).width = 40;
        sheet.getColumn(4).width = 20;
        sheet.getColumn(5).width = 22;

        // ── Đóng gói thành Buffer ─────────────────────────────────
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}