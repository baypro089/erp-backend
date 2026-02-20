import { WarehouseController } from "@/controllers/warehouse.controller";
import { Warehouse } from "@/entities/warehouse.entity";
import { EmployeeRepository } from "@/repositories/employee.repository";
import { WarehouseRepository } from "@/repositories/warehouse.repository";
import { WarehouseService } from "@/services/warehouse.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Warehouse])],
    controllers: [WarehouseController],
    providers: [WarehouseService, WarehouseRepository, EmployeeRepository],
    exports: [WarehouseService, WarehouseRepository],
})
export class WarehouseModule { }