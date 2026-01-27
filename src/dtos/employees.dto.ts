import { Status } from '@libs/shared/enums/employee-status.enum';
import { Gender } from '@libs/shared/enums/gender.enum';
import { Level } from '@libs/shared/enums/level.enum';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateEmployeeDto {

  @ApiProperty({ 
    example: 'Nguyễn Văn A', 
    description: 'Họ và tên đầy đủ của nhân viên' 
  })
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ 
    example: '2026-01-25', 
    description: 'Ngày bắt đầu làm việc' 
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;


  @ApiProperty({ 
    example: 'EMP001', 
    description: 'Mã nhân viên' 
  })
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440001', 
    description: 'ID phòng ban' 
  })
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440002', 
    description: 'ID vị trí hiện tại' 
  })
  @IsNotEmpty()
  currentPositionId: string;
}

export class UpdateEmployeeDto {
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440003', 
    description: 'ID người dùng liên kết',
    required: false 
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ 
    example: 'Trần Thị B', 
    description: 'Họ và tên đầy đủ',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  fullName?: string;

  @ApiProperty({ 
    example: 'MALE', 
    enum: ['MALE', 'FEMALE', 'OTHER'],
    description: 'Giới tính',
    required: false 
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ 
    example: '0987654321', 
    description: 'Số điện thoại',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ 
    example: '001234567890', 
    description: 'Số CMND/CCCD',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  identityNumber?: string;

  @ApiProperty({ 
    example: '2020-01-15', 
    description: 'Ngày cấp CMND/CCCD',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  identityIssuedDate?: Date;

  @ApiProperty({ 
    example: 'Công an TP.HCM', 
    description: 'Nơi cấp CMND/CCCD',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identityIssuedPlace?: string;

  @ApiProperty({ 
    example: '123 Đường ABC, Quận 1, TP.HCM', 
    description: 'Địa chỉ thường trú',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressPermanent?: string;

  @ApiProperty({ 
    example: '456 Đường XYZ, Quận 3, TP.HCM', 
    description: 'Địa chỉ tạm trú',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressCurrent?: string;

  @ApiProperty({ 
    example: 'Việt Nam', 
    description: 'Quốc tịch',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nationality?: string;

  @ApiProperty({ 
    example: '1990-05-20', 
    description: 'Ngày sinh',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({ 
    example: 'https://example.com/photos/employee.jpg', 
    description: 'URL ảnh đại diện',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  photoUrl?: string;

  @ApiProperty({ 
    example: 'EMP002', 
    description: 'Mã nhân viên',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  employeeCode?: string;

  @ApiProperty({ 
    example: '2026-02-01', 
    description: 'Ngày bắt đầu làm việc',
    required: false 
  })
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ 
    example: 'SENIOR', 
    enum: ['INTERN', 'FRESHER', 'JUNIOR', 'SENIOR', 'LEAD', 'MANAGER'],
    description: 'Cấp bậc',
    required: false 
  })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440004', 
    description: 'ID phòng ban',
    required: false 
  })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440005', 
    description: 'ID vị trí hiện tại',
    required: false 
  })
  @IsUUID()
  @IsOptional()
  currentPositionId?: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440006', 
    description: 'ID người quản lý',
    required: false 
  })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiProperty({ 
    example: 'ACTIVE', 
    enum: ['Draft', 'Active', 'Inactive', 'Terminated'],
    description: 'Trạng thái nhân viên',
    required: false 
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
