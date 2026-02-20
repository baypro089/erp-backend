import { CategoryController } from "@/controllers/category.controller";
import { Category } from "@/entities/category.entity";
import { CategoryRepository } from "@/repositories/category.repository";
import { CategoryService } from "@/services/category.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Category])],
    providers: [CategoryService, CategoryRepository],
    exports: [CategoryService, CategoryRepository],
    controllers: [CategoryController],
})
export class CategoryModule {}