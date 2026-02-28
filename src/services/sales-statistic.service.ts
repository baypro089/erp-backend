import { SalesDashboardFilterDTO } from "@/dtos/sales-dashboard-filter.dto";
import { Order } from "@/entities/order.entity";
import { OrderStatus } from "@libs/shared/enums/order-status.enum";
import { Injectable } from "@nestjs/common";
import { DataSource, Between } from "typeorm";


@Injectable()
export class SalesStatisticService {
  constructor(private dataSource: DataSource) {}

  async getDashboard(filter: SalesDashboardFilterDTO) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const targetMonth = filter.month ? Number(filter.month) : today.getMonth() + 1;
    const targetYear = filter.year ? Number(filter.year) : today.getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const orderRepo = this.dataSource.getRepository(Order);

    // 1. METRICS
    const todayRevQuery = await orderRepo.createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'total')
      .where('o.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] })
      .andWhere('o.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
      .getRawOne();
    
    const monthRevQuery = await orderRepo.createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'total')
      .where('o.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] })
      .andWhere('o.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth })
      .getRawOne();

    const pendingOrders = await orderRepo.count({ where: { status: OrderStatus.PENDING } });

    // Tính tỷ lệ hủy (Cancelled / Total * 100)
    const totalMonthOrders = await orderRepo.count({ 
      where: { createdAt: Between(startOfMonth, endOfMonth) } 
    });
    const cancelledOrders = await orderRepo.count({ 
      where: { status: OrderStatus.CANCELLED, createdAt: Between(startOfMonth, endOfMonth) } 
    });
    const cancelRate = totalMonthOrders > 0 ? (cancelledOrders / totalMonthOrders) * 100 : 0;

    // 2. TOP NHÂN VIÊN SALE (Cực kỳ quan trọng để tính thưởng KPI)
    const topStaffs = await orderRepo.createQueryBuilder('o')
      .leftJoin('o.creator', 'user')
      .leftJoin('user.employee', 'emp')
      .select('emp.fullName', 'staffName')
      .addSelect('COUNT(o.id)', 'totalOrders')
      .addSelect('SUM(o.totalAmount)', 'totalRevenue')
      .where('o.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] })
      .andWhere('o.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth })
      .groupBy('emp.id')
      .orderBy('"totalRevenue"', 'DESC')
      .limit(5)
      .getRawMany();

    // 3. TOP KHÁCH HÀNG (Để Sale chăm sóc, tặng quà)
    const topCustomers = await orderRepo.createQueryBuilder('o')
      .leftJoin('o.customer', 'cus')
      .select('cus.fullName', 'customerName')
      .addSelect('cus.phoneNumber', 'phone')
      .addSelect('SUM(o.totalAmount)', 'totalSpent')
      .where('o.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] })
      .andWhere('o.createdAt BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth })
      .groupBy('cus.id')
      .orderBy('"totalSpent"', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      metrics: {
        todayRevenue: Number(todayRevQuery?.total || 0),
        monthRevenue: Number(monthRevQuery?.total || 0),
        pendingOrders,
        cancelRate: Number(cancelRate.toFixed(2))
      },
      topStaffs: topStaffs.map(s => ({ ...s, totalOrders: Number(s.totalOrders), totalRevenue: Number(s.totalRevenue) })),
      topCustomers: topCustomers.map(c => ({ ...c, totalSpent: Number(c.totalSpent) }))
    };
  }
}