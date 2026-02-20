import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateBrandDTO {
    @IsNotEmpty()
    @IsString()
    name: string;
}

export class UpdateBrandDTO {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    isActive?: boolean;
}