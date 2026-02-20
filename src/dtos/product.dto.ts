import { IsNotEmpty, IsString, IsUUID, IsNumber, Min, IsOptional, IsBoolean, IsObject } from "class-validator";

export class CreateProductDTO {
    @IsNotEmpty()
    @IsString()
    sku: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsUUID()
    categoryId: string;

    @IsNotEmpty()
    @IsUUID()
    brandId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    retailPrice: number;

    @IsOptional()
    @IsBoolean()
    hasSerialNumber?: boolean;

    @IsOptional()
    @IsObject()
    specifications?: Record<string, any>;

    @IsOptional()
    @IsString()
    thumbnailUrl?: string;
}

export class UpdateProductDTO {
    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsUUID()
    brandId?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    retailPrice?: number;

    @IsOptional()
    @IsBoolean()
    hasSerialNumber?: boolean;

    @IsOptional()
    @IsObject()
    specifications?: Record<string, any>;
    
    @IsOptional()
    @IsString()
    thumbnailUrl?: string;
}