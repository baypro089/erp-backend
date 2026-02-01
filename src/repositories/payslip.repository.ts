import { Payslip } from "@/entities/payslip.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class PayslipRepository extends Repository<Payslip> {
    constructor(private readonly dataSource: DataSource) {
        super(Payslip, dataSource.createEntityManager());
    }

    
}