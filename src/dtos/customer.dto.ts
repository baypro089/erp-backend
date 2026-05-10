import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, Length } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CustomerTier } from '@libs/shared/enums/customer-tier.enum';

export class CreateCustomerDTO {
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  @Matches(/^(0[3|5|7|8|9])+([0-9]{8})\b/, { message: 'Số điện thoại không hợp lệ (Định dạng VN)' })
  phoneNumber: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 255)
  address?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateCustomerDTO extends PartialType(CreateCustomerDTO) {
  // Update DTO kế thừa toàn bộ thuộc tính của Create (thành optional)
  @IsOptional()
  @IsEnum(CustomerTier, { message: 'Hạng khách hàng không hợp lệ' })
  tier?: CustomerTier; // Có thể cập nhật hạng khách hàng
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động không hợp lệ' })
  isActive?: boolean; // Có thể cập nhật trạng thái hoạt động
}