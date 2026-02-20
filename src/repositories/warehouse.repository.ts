import { Warehouse } from "@/entities/warehouse.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";

@Injectable()
export class WarehouseRepository extends Repository<Warehouse> {
  // Repository methods would go here
  constructor(private readonly dataSource: DataSource) {
    super(Warehouse, dataSource.createEntityManager());
  }
}