import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    example: 'Phòng Kinh Doanh',
    description: 'Tên phòng ban'
  })

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Phòng kinh doanh chịu trách nhiệm về các hoạt động bán hàng và tiếp thị.',
    description: 'Mô tả về phòng ban',
    required: false
  })
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @ApiProperty({
    example: 'uuid của người quản lý',
    description: 'ID của người quản lý phòng ban',
    required: false
  })
  @IsString()
  managerId?: string;
}
