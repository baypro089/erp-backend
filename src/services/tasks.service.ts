import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ResignationRequestService } from './resignation-request.service';
import { LeaveRequestService } from './leave-request.service';

@Injectable()
export class TasksService {
    constructor(
        private readonly resignationRequestService: ResignationRequestService,
        private readonly leaveRequestService: LeaveRequestService,
    ) { }

    @Cron('0 0 * * *')
    async handleMidnightJob() {
        this.resignationRequestService.processDueResignations();
        await this.leaveRequestService.processMaternityLeave();
    }
}
