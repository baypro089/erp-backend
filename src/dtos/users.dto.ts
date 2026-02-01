import { User } from '@/entities/user.entity';
import { UserStatus } from '@libs/shared/enums/user-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ 
    example: 'john_doe', 
    description: 'Tên đăng nhập của người dùng' 
  })
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @ApiProperty({ 
    example: 'Password@123', 
    description: 'Mật khẩu người dùng (tối thiểu 6 ký tự)' 
  })
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @ApiProperty({ 
    example: 'john.doe@example.com', 
    description: 'Địa chỉ email của người dùng' 
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ 
    example: 'ADMIN', 
    description: 'Mã vai trò của người dùng' 
  })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  roleCode: string;

  @ApiProperty({ 
    example: 'ACTIVE', 
    enum: ['ACTIVE', 'INACTIVE', 'BANNED'], 
    description: 'Trạng thái tài khoản',
    required: false 
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'], { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;
}

export class UpdateUserDto {

  @ApiProperty({ 
    example: 'newemail@example.com', 
    description: 'Địa chỉ email mới' 
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
  
  @ApiProperty({ 
    example: 'USER', 
    description: 'Mã vai trò mới' 
  })
  @IsOptional()
  roleCode?: string;

  @ApiProperty({ 
    example: 'INACTIVE', 
    enum: ['ACTIVE', 'INACTIVE', 'BANNED'], 
    description: 'Trạng thái tài khoản mới',
    required: false 
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'BANNED'], { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;
}