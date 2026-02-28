import { SalesStatisticController } from "@/controllers/sales-statistic.controller";
import { SalesStatisticService } from "@/services/sales-statistic.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "@/entities/order.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order
        ]),
    ],
    providers: [SalesStatisticService],
    exports: [SalesStatisticService],
    controllers: [SalesStatisticController],
})
export class SalesStatisticModule {}
