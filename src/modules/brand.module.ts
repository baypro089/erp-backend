import { BrandController } from "@/controllers/brand.controller";
import { Brand } from "@/entities/brand.entity";
import { BrandRepository } from "@/repositories/brand.repository";
import { BrandService } from "@/services/brand.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Brand])],
    providers: [BrandService, BrandRepository],
    exports: [BrandService, BrandRepository],
    controllers: [BrandController],
})
export class BrandModule {}