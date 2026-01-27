import { User } from '../entities/user.entity';
import { UserResponse, UserResponseList } from '../../libs/shared/types/users.type';
import { RolesMapper } from '@/mappers/roles.mapper';

export class UsersMapper {
    static toDTO(entity: User): UserResponse {
        return {
            id: entity.id,
            username: entity.username,
            email: entity.email,
            role: RolesMapper.toDTO(entity.role),
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            status: entity.status,
            lastLogin: entity.lastLogin,
        };
    }
    static toListDTO(entities: User[]): UserResponseList {
        return entities.map((e) => this.toDTO(e));
    }
}