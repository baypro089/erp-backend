import { TasksService } from "@/services/tasks.service";
import { Module } from "@nestjs/common";
import { ResignationRequestModule } from "./resignation-request.module";
import { LeaveRequestModule } from "./leave-request.module";

@Module({
    imports: [ResignationRequestModule, LeaveRequestModule],
    providers: [TasksService],
})
export class TasksModule { }
