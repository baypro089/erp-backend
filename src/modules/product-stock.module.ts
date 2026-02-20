import { ProductStockController } from "@/controllers/product-stock.controller";
import { ProductStock } from "@/entities/product-stock.entity";
import { StockHistory } from "@/entities/stock-history.entity";
import { ProductStockRepository } from "@/repositories/product-stock.repository";
import { StockHistoryRepository } from "@/repositories/stock-history.repository";
import { ProductStockService } from "@/services/product-stock.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([ProductStock, StockHistory])],
    controllers: [ProductStockController],
    providers: [ProductStockService, ProductStockRepository, StockHistoryRepository],
    exports: [ProductStockService, ProductStockRepository, StockHistoryRepository],
})
export class ProductStockModule { }