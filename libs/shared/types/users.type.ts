import { RoleResponse } from "./roles.type";

type CreateUserDto = {
    username: string;
    password: string;
    email: string;
    role_code: string;
}

type UserResponse = {
    id: string;
    username: string;
    email: string;
    role: RoleResponse;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

type UserResponseList = UserResponse[];

export type {  CreateUserDto, UserResponse, UserResponseList };