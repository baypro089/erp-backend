import { JobHistory } from "@/entities/job-history.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { JobHistoryRepository } from "@/repositories/job-history.repository";
import { JobHistoryService } from "@/services/job-history.service";
import { JobHistoryController } from "@/controllers/job-history.controller";

@Module({
    imports: [TypeOrmModule.forFeature([JobHistory])],
    controllers: [JobHistoryController],
    providers: [JobHistoryRepository, JobHistoryService],
    exports: [JobHistoryRepository, JobHistoryService],
})
export class JobHistoryModule { }