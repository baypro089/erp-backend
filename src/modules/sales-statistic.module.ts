import { SalesStatisticController } from "@/controllers/sales-statistic.controller";
import { SalesStatisticService } from "@/services/sales-statistic.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "@/entities/order.entity";
import { SalesReportService } from "@/services/sales-report.service";
import { SalesReportController } from "@/controllers/sales-report.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order
        ]),
    ],
    providers: [SalesStatisticService, SalesReportService],
    exports: [SalesStatisticService, SalesReportService],
    controllers: [SalesStatisticController, SalesReportController],
})
export class SalesStatisticModule {}
