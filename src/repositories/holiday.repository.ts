import { Holiday } from "@/entities/holiday.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class HolidayRepository extends Repository<Holiday> {
    // Implementation of holiday repository methods would go here
    constructor(private readonly dataSource: DataSource) {
        super(Holiday, dataSource.createEntityManager());
    }

    
}