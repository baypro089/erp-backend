import { CustomerController } from "@/controllers/customer.controller";
import { Customer } from "@/entities/customer.entity";
import { CustomerRepository } from "@/repositories/customer.repository";
import { CustomerService } from "@/services/customer.service";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Customer])],
    providers: [CustomerService, CustomerRepository],
    exports: [CustomerService, CustomerRepository],
    controllers: [CustomerController],
})
export class CustomerModule {}
