import { IsOptional, IsString } from "class-validator";

export class UpdateSystemSettingDto {
    @IsString()
    @IsOptional()
    value?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    isActive?: boolean;
}