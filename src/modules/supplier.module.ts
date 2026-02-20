import { SupplierController } from "@/controllers/supplier.controller";
import { ImportReceipt } from "@/entities/import-receipt.entity";
import { Supplier } from "@/entities/supplier.entity";
import { SupplierRepository } from "@/repositories/supplier.repository";
import { SupplierService } from "@/services/supplier.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Supplier])],
    providers: [SupplierService, SupplierRepository],
    exports: [SupplierService, SupplierRepository],
    controllers: [SupplierController],
})
export class SupplierModule { }
