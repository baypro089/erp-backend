import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ResignationRequestService } from './resignation-request.service';

@Injectable()
export class TasksService {
    constructor(
        private readonly resignationRequestService: ResignationRequestService,
    ) { }

    @Cron('0 0 * * *')
    handleMidnightJob() {
        this.resignationRequestService.processDueResignations();
    }
}
