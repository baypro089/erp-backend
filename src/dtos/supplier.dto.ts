import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateSupplierDTO {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    contactPhone: string;

    @IsOptional()
    @IsString()
    address?: string;
}

export class UpdateSupplierDTO {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsString()
    address?: string;
}
