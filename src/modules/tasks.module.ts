import { TasksService } from "@/services/tasks.service";
import { Module } from "@nestjs/common";

@Module({
    providers: [TasksService],
})
export class TasksModule { }
