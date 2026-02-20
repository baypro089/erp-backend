import { WarehouseType } from '@libs/shared/enums/warehouse-type.enum';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Length } from 'class-validator';

// DTO Tạo mới
export class CreateWarehouseDTO {
    @IsNotEmpty({ message: 'Mã kho không được để trống' })
    @IsString()
    @Matches(/^[A-Z0-9-]+$/, { message: 'Mã kho chỉ chứa chữ in hoa, số và dấu gạch ngang' })
    code: string;

    @IsNotEmpty({ message: 'Tên kho không được để trống' })
    @IsString()
    @Length(5, 100)
    name: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsNotEmpty()
    @IsEnum(WarehouseType, { message: 'Loại kho không hợp lệ' })
    type: WarehouseType;

    @IsOptional()
    @IsUUID('4', { message: 'ID quản lý phải là UUID chuẩn' })
    managerId?: string;
}

// DTO Cập nhật
export class UpdateWarehouseDTO {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsEnum(WarehouseType, { message: 'Loại kho không hợp lệ' })
    type?: WarehouseType;

    @IsOptional()
    isActive?: boolean; // Cho phép đóng/mở kho

    @IsOptional()
    @IsUUID('4', { message: 'ID quản lý phải là UUID chuẩn' })
    managerId?: string;
}