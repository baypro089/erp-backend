import { ProductController } from "@/controllers/product.controller";
import { ProductSerial } from "@/entities/product-serial.entity";
import { Product } from "@/entities/product.entity";
import { ProductRepository } from "@/repositories/product.repository";
import { ProductService } from "@/services/product.service";
import { AttachmentModule } from "./attachment.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, ProductSerial]),
        AttachmentModule,
    ],
    providers: [ProductService, ProductRepository],
    exports: [ProductService, ProductRepository],
    controllers: [ProductController],
})
export class ProductModule {}