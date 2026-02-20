import { ProductSerialController } from "@/controllers/product-serial.controller";
import { ProductSerial } from "@/entities/product-serial.entity";
import { ProductSerialRepository } from "@/repositories/product-serial.repository";
import { ProductSerialService } from "@/services/product-serial.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([ProductSerial])],
    controllers: [ProductSerialController],
    providers: [ProductSerialService, ProductSerialRepository],
    exports: [ProductSerialService, ProductSerialRepository]
})
export class ProductSerialModule { }