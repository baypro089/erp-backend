import { WarehouseReportController } from "@/controllers/warehouse-report.controller";
import { WarehouseReportService } from "@/services/warehouse-report.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "@/entities/product.entity";
import { ProductStock } from "@/entities/product-stock.entity";
import { StockHistory } from "@/entities/stock-history.entity";
import { Warehouse } from "@/entities/warehouse.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            ProductStock,
            StockHistory,
            Warehouse
        ]),
    ],
    providers: [WarehouseReportService],
    exports: [WarehouseReportService],
    controllers: [WarehouseReportController],
})
export class WarehouseReportModule {}
