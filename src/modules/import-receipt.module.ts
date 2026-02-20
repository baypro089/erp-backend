import { ImportReceiptController } from "@/controllers/import-receipt.controller";
import { ImportDetail } from "@/entities/import-detail.entity";
import { ImportReceipt } from "@/entities/import-receipt.entity";
import { ImportReceiptRepository } from "@/repositories/import-receipt.repository";
import { ImportReceiptService } from "@/services/import-receipt.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([ImportReceipt, ImportDetail])],
    controllers: [ImportReceiptController],
    providers: [ImportReceiptService, ImportReceiptRepository],
    exports: [ImportReceiptRepository, ImportReceiptService],
})
export class ImportReceiptModule { }