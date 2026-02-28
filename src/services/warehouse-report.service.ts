import { WarehouseReportFilterDTO } from "@/dtos/warehouse-report-filter.dto";
import { Product } from "@/entities/product.entity";
import { Warehouse } from "@/entities/warehouse.entity";
import { StockChangeType } from "@libs/shared/enums/warehouse-type.enum";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class WarehouseReportService {
  constructor(private dataSource: DataSource) {}

  async getProductStatistics(filter: WarehouseReportFilterDTO) {
    const { month, year, warehouseId } = filter;
    
    // Mặc định lấy tháng hiện tại nếu không truyền
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    // Lấy tên kho nếu có warehouseId
    let warehouseName = 'Tất cả các kho';
    if (warehouseId) {
      const warehouse = await this.dataSource.getRepository(Warehouse).findOne({
        where: { id: warehouseId }
      });
      if (warehouse) {
        warehouseName = warehouse.name;
      }
    }

    // Mốc thời gian
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Bắt đầu Query từ bảng Product (Sản phẩm)
    let qb = this.dataSource.getRepository(Product).createQueryBuilder('p')
      .select('p.sku', 'sku')
      .addSelect('p.name', 'productName')
      .addSelect('p.hasSerialNumber', 'hasSerialNumber');

    // LEFT JOIN Thẻ Kho (StockHistory) trong khoảng thời gian để tính Nhập/Xuất kỳ này
    if (warehouseId) {
      qb.leftJoin(
        'p.stockHistories', 
        'sh', 
        'sh.createdAt BETWEEN :start AND :end AND sh.warehouseId = :wId', 
        { start: startDate, end: endDate, wId: warehouseId }
      );
    } else {
      qb.leftJoin(
        'p.stockHistories', 
        'sh', 
        'sh.createdAt BETWEEN :start AND :end', 
        { start: startDate, end: endDate }
      );
    }

    // LEFT JOIN Tồn kho hiện tại (ProductStock) để lấy số Tồn cuối
    if (warehouseId) {
      qb.leftJoin('p.productStocks', 'ps', 'ps.warehouseId = :wId', { wId: warehouseId });
    } else {
      qb.leftJoin('p.productStocks', 'ps');
    }

    // Tính toán TỔNG NHẬP (IMPORT) và TỔNG XUẤT (EXPORT/TRANSFER)
    qb.addSelect(
      `SUM(CASE WHEN sh.type = '${StockChangeType.IMPORT}' THEN sh.change_amount ELSE 0 END)`, 
      'totalImported'
    )
    .addSelect(
      // Xuất kho thì changeAmount là số âm, ta dùng ABS (trị tuyệt đối) để hiển thị số dương cho đẹp
      `SUM(CASE WHEN sh.type IN ('${StockChangeType.EXPORT}', '${StockChangeType.TRANSFER}') THEN ABS(sh.change_amount) ELSE 0 END)`, 
      'totalExported'
    )
    // Tồn kho cuối kỳ (Sum các kho lại nếu không truyền warehouseId)
    .addSelect('COALESCE(SUM(ps.quantity), 0)', 'currentStock')
    .groupBy('p.id')
    .addGroupBy('p.sku')
    .addGroupBy('p.name')
    .addGroupBy('p.hasSerialNumber')
    .orderBy('p.sku', 'ASC');

    const rawData = await qb.getRawMany();

    // Format lại dữ liệu cho sạch sẽ trước khi trả về FE
    const formattedData = rawData.map(item => ({
      sku: item.sku,
      productName: item.productName,
      hasSerialNumber: item.hasSerialNumber,
      totalImported: Number(item.totalImported || 0),
      totalExported: Number(item.totalExported || 0),
      currentStock: Number(item.currentStock || 0)
    }));

    return {
      period: `Tháng ${targetMonth}/${targetYear}`,
      warehouse: warehouseName,
      data: formattedData
    };
  }
}