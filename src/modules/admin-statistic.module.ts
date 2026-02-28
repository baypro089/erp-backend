import { AdminStatisticController } from "@/controllers/admin-statistic.controller";
import { AdminStatisticService } from "@/services/admin-statistic.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "@/entities/order.entity";
import { ImportReceipt } from "@/entities/import-receipt.entity";
import { Payslip } from "@/entities/payslip.entity";
import { OrderDetail } from "@/entities/order-detail.entity";
import { ProductStock } from "@/entities/product-stock.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order, 
            ImportReceipt, 
            Payslip, 
            OrderDetail, 
            ProductStock
        ]),
    ],
    providers: [AdminStatisticService],
    exports: [AdminStatisticService],
    controllers: [AdminStatisticController],
})
export class AdminStatisticModule {}
