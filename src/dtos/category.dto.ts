import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean } from "class-validator";

export class CreateCategoryDTO {
    @IsNotEmpty()  
    @IsString()
    name: string;
    @IsOptional()
    @IsUUID()
    parentId?: string;
    @IsOptional()
    @IsBoolean()
    isActive?: boolean; 
}

export class UpdateCategoryDTO {
    @IsOptional()  
    @IsString()
    name?: string;
    @IsOptional()
    @IsUUID()
    parentId?: string;
    @IsOptional()
    @IsBoolean()
    isActive?: boolean; 
}