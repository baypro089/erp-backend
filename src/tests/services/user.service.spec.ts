import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { RoleRepository } from '@/repositories/role.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { RedisService } from '@/services/redis.service';
import { MailService } from '@/services/mail.service';
import { DataSource } from 'typeorm';

const mockUserRepo = {
    findAllActiveUsers: jest.fn(),
    findAllUsersOptional: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateUser: jest.fn(),
    updatePasswordByEmail: jest.fn(),
    toggleUserActiveStatus: jest.fn(),
    banUser: jest.fn(),
};
const mockRoleRepo = { findOne: jest.fn() };
const mockEmployeeRepo = { findOne: jest.fn() };
const mockRedis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), delByPrefix: jest.fn() };
const mockMail = { sendWelcomeEmail: jest.fn() };

const fakeUser = { id: 'u1', username: 'emp001', email: 'emp@test.com', isActive: true };

describe('UsersService', () => {
    let service: UsersService;
    let mockDataSource: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        // Create a transaction mock that executes the callback
        mockDataSource = {
            transaction: jest.fn((cb) => cb({
                getRepository: (entity: any) => {
                    const name = entity.name || (entity.prototype ? entity.name : '');
                    if (name === 'User') return {
                        findOne: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockReturnValue(fakeUser),
                        save: jest.fn().mockResolvedValue(fakeUser),
                    };
                    if (name === 'Role') return { findOne: jest.fn().mockResolvedValue({ id: 'r1' }) };
                    if (name === 'Employee') return {
                        findOne: jest.fn().mockResolvedValue({ id: 'e1', fullName: 'Test', employeeCode: 'emp001' }),
                        update: jest.fn(),
                    };
                    return {};
                }
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: UserRepository, useValue: mockUserRepo },
                { provide: RoleRepository, useValue: mockRoleRepo },
                { provide: EmployeeRepository, useValue: mockEmployeeRepo },
                { provide: RedisService, useValue: mockRedis },
                { provide: MailService, useValue: mockMail },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<UsersService>(UsersService);
    });

    describe('getAllUsers', () => {
        it('should return cached users if cache hit', async () => {
            const cached = [fakeUser];
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.getAllUsers();
            expect(result).toEqual(cached);
            expect(mockUserRepo.findAllActiveUsers).not.toHaveBeenCalled();
        });

        it('should fetch from DB and cache on miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockUserRepo.findAllActiveUsers.mockResolvedValue([fakeUser]);
            const result = await service.getAllUsers();
            expect(result).toEqual([fakeUser]);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('findByUsername', () => {
        it('should delegate to userRepository', async () => {
            mockUserRepo.findByUsername.mockResolvedValue(fakeUser);
            const result = await service.findByUsername('emp001');
            expect(result).toEqual(fakeUser);
        });
    });

    describe('findById', () => {
        it('should delegate to userRepository', async () => {
            mockUserRepo.findById.mockResolvedValue(fakeUser);
            const result = await service.findById('u1');
            expect(result).toEqual(fakeUser);
        });
    });

    describe('updateUser', () => {
        it('should throw if password is included in updateData', async () => {
            await expect(service.updateUser('u1', { password: 'newpass' } as any)).rejects.toThrow();
        });

        it('should update user and invalidate caches', async () => {
            mockUserRepo.updateUser.mockResolvedValue(fakeUser);
            const result = await service.updateUser('u1', { email: 'new@test.com' });
            expect(result).toEqual(fakeUser);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('users:');
            expect(mockRedis.del).toHaveBeenCalledWith('all_users');
        });
    });

    describe('toggleUserActiveStatus', () => {
        it('should toggle status and invalidate cache', async () => {
            mockUserRepo.toggleUserActiveStatus.mockResolvedValue(undefined);
            await service.toggleUserActiveStatus('u1');
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('users:');
        });
    });

    describe('banUser', () => {
        it('should ban user, revoke refresh token, and blacklist', async () => {
            mockUserRepo.banUser.mockResolvedValue(undefined);
            await service.banUser('u1');
            expect(mockRedis.del).toHaveBeenCalledWith('refresh_token:u1');
            expect(mockRedis.set).toHaveBeenCalledWith('banned:u1', 'true', 86400);
        });
    });
});
