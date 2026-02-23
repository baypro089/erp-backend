import { OrderController } from "@/controllers/order.controller";
import { OrderDetail } from "@/entities/order-detail.entity";
import { Order } from "@/entities/order.entity";
import { OrderRepository } from "@/repositories/order.repository";
import { OrderService } from "@/services/order.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderDetail])],
    controllers: [OrderController],
    providers: [OrderRepository, OrderService],
    exports: [OrderRepository, OrderService],
})
export class OrderModule { }