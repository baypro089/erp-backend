import { HolidayController } from "@/controllers/holiday.controller";
import { Holiday } from "@/entities/holiday.entity";
import { HolidayRepository } from "@/repositories/holiday.repository";
import { HolidayService } from "@/services/holiday.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";


@Module({
    imports: [TypeOrmModule.forFeature([Holiday])],
    providers: [HolidayService, HolidayRepository],
    controllers: [HolidayController],
    exports: [HolidayService, HolidayRepository],
})

export class HolidayModule {}