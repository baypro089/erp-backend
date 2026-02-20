import { ProductSerial } from "@/entities/product-serial.entity";
import { ProductSerialRepository } from "@/repositories/product-serial.repository";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Not } from "typeorm";

@Injectable()
export class ProductSerialService {
    constructor(
        private readonly productSerialRepository: ProductSerialRepository,
    ) { }

    // Lấy danh sách serial theo sản phẩm với phân trang
    async getSerialsByProduct(
        productId: string,
        warehouseId: string,
        page?: number,
        pageSize?: number
    ) : Promise<{ data: ProductSerial[]; total: number }> {
        return this.productSerialRepository.findAllByProductWithPagination(
            productId,
            warehouseId,
            page,
            pageSize
        );
    }

    // Lấy thông tin chi tiết serial theo số serial
    async getSerialByNumber(serialNumber: string): Promise<ProductSerial | null> {
        const serial =  this.productSerialRepository.findOne({
            where: { serialNumber },
            relations: ['product', 'warehouse'],
        });
        if (!serial) {
            throw new NotFoundException(`Serial number ${serialNumber} not found`);
        }
        return serial;
    }
}