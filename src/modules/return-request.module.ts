import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequest } from '@/entities/return-request.entity';
import { ReturnItem } from '@/entities/return-item.entity';
import { ReturnRequestRepository } from '@/repositories/return-request.repository';
import { ReturnService } from '@/services/return-request.service';
import { ReturnRequestController } from '@/controllers/return-request.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReturnRequest, ReturnItem]),
  ],
  controllers: [ReturnRequestController],
  providers: [
    ReturnRequestRepository,
    ReturnService,
  ],
  exports: [ReturnService, ReturnRequestRepository],
})
export class ReturnRequestModule { }
