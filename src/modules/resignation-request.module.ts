import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResignationRequest } from '@/entities/resignation-request.entity';
import { Employee } from '@/entities/employee.entity';
import { User } from '@/entities/user.entity';
import { ResignationRequestRepository } from '@/repositories/resignation-request.repository';
import { ResignationRequestService } from '@/services/resignation-request.service';
import { ResignationRequestController } from '@/controllers/resignation-request.controller';
import { RedisModule } from './redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResignationRequest,
    ]),
  ],
  controllers: [ResignationRequestController],
  providers: [
    ResignationRequestRepository,
    ResignationRequestService,
  ],
  exports: [ResignationRequestService, ResignationRequestRepository],
})
export class ResignationRequestModule { }
