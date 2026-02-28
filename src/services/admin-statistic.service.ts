import { DashboardFilterDTO } from "@/dtos/dashboard-filter.dto";
import { ImportReceipt } from "@/entities/import-receipt.entity";
import { OrderDetail } from "@/entities/order-detail.entity";
import { Order } from "@/entities/order.entity";
import { Payslip } from "@/entities/payslip.entity";
import { ProductStock } from "@/entities/product-stock.entity";
import { OrderStatus } from "@libs/shared/enums/order-status.enum";
import { ReceiptStatus } from "@libs/shared/enums/receipt-status.enum";
import { IAdminDashboard } from "@libs/shared/types/statistics.type";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";


@Injectable()
export class AdminStatisticService {
  constructor(private dataSource: DataSource) {}

  async getMasterDashboard(filter: DashboardFilterDTO) : Promise<IAdminDashboard> {
    // Nếu không truyền ngày, mặc định lấy từ đầu tháng đến hiện tại
    const fromDate = filter.fromDate ? new Date(filter.fromDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = filter.toDate ? new Date(filter.toDate) : new Date();

    // 1. OVERVIEW: Doanh thu & Chi phí
    const revenueQuery = await this.dataSource.getRepository(Order)
      .createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'total')
      .where('o.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('o.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .getRawOne();
    const totalRevenue = Number(revenueQuery?.total || 0);

    const costQuery = await this.dataSource.getRepository(ImportReceipt)
      .createQueryBuilder('i')
      .select('SUM(i.totalPrice)', 'total')
      .where('i.status = :status', { status: ReceiptStatus.COMPLETED })
      .andWhere('i.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .getRawOne();
    const totalCost = Number(costQuery?.total || 0);

    // Tính payroll trong khoảng thời gian dựa trên tháng/năm của phiếu lương
    const fromMonth = fromDate.getMonth() + 1; // JavaScript month is 0-indexed
    const fromYear = fromDate.getFullYear();
    const toMonth = toDate.getMonth() + 1;
    const toYear = toDate.getFullYear();

    const payrollQuery = await this.dataSource.getRepository(Payslip)
      .createQueryBuilder('p')
      .select('SUM(p.finalSalary)', 'total')
      .where('p.isPaid = :isPaid', { isPaid: true })
      .andWhere('(p.year > :fromYear OR (p.year = :fromYear AND p.month >= :fromMonth))', { fromYear, fromMonth })
      .andWhere('(p.year < :toYear OR (p.year = :toYear AND p.month <= :toMonth))', { toYear, toMonth })
      .getRawOne();
    const totalPayroll = Number(payrollQuery?.total || 0);

    // 2. ORDER STATS (Gom nhóm theo trạng thái)
    const ordersByStatus = await this.dataSource.getRepository(Order)
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(o.id)', 'count')
      .andWhere('o.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .groupBy('o.status')
      .getRawMany();

    const orderStats = {
      pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
    };
    ordersByStatus.forEach(row => {
      orderStats[row.status.toLowerCase()] = Number(row.count);
    });

    // 3. TOP PRODUCTS (Top 5 linh kiện bán chạy nhất)
    const topProducts = await this.dataSource.getRepository(OrderDetail)
      .createQueryBuilder('oi')
      .leftJoinAndSelect('oi.product', 'product')
      .leftJoin('oi.order', 'order')
      .select('product.name', 'productName')
      .addSelect('product.sku', 'sku')
      .addSelect('SUM(oi.quantity)', 'totalSold')
      .addSelect('SUM(oi.amount)', 'revenue')
      .where('order.status != :status', { status: OrderStatus.CANCELLED })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from: fromDate, to: toDate })
      .groupBy('product.id')
      .orderBy('"totalSold"', 'DESC')
      .limit(5)
      .getRawMany();

    // 4. LOW STOCK (Cảnh báo kho)
    const lowStockCount = await this.dataSource.getRepository(ProductStock)
      .createQueryBuilder('ps')
      .where('ps.quantity <= ps.minStockLevel')
      .getCount();

    return {
      overview: {
        totalRevenue,
        totalCost,
        grossProfit: totalRevenue - totalCost,
        totalPayroll
      },
      orderStats,
      topProducts: topProducts.map(tp => ({
        ...tp,
        totalSold: Number(tp.totalSold),
        revenue: Number(tp.revenue)
      })),
      lowStockAlerts: lowStockCount
    };
  }
}