import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '@/entities/department.entity';
import { DepartmentRepository } from '@/repositories/department.repository';
import { DepartmentService } from '@/services/department.service';
import { DepartmentController } from '@/controllers/department.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
    ]),
  ],
  controllers: [DepartmentController],
  providers: [DepartmentRepository, DepartmentService],
  exports: [DepartmentRepository, DepartmentService],
})
export class DepartmentsModule {}
