import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({ 
    example: 'Nhân viên Kinh doanh', 
    description: 'Tên vị trí công việc' 
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: 'Vị trí chịu trách nhiệm về các hoạt động kinh doanh và bán hàng.', 
    description: 'Mô tả về vị trí công việc',
    required: false
  })
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    example: 15000000, 
    description: 'Lương cơ bản (VND)' 
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'baseSalary must not be less than 0' })
  baseSalary: number;
}

export class UpdatePositionDto extends PartialType(CreatePositionDto) {}
