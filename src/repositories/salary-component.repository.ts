import { SalaryComponent } from "@/entities/salary-component";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class SalaryComponentRepository extends Repository<SalaryComponent> {
    // Service methods would go here
    constructor(
        // Dependency injections would go here
        private readonly dataSource: DataSource,
    ) {
        super(SalaryComponent, dataSource.createEntityManager());
    }
}