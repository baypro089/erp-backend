import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '@/services/role.service';
import { RoleRepository } from '@/repositories/role.repository';
import { PermissionRepository } from '@/repositories/permission.repository';

const mockRoleRepo = {
    findByCondition: jest.fn(),
    findByCode: jest.fn(),
    findByCodes: jest.fn(),
    handleCreate: jest.fn(),
    handleUpdate: jest.fn(),
    handleDelete: jest.fn(),
};
const mockPermRepo = {
    findByCodes: jest.fn(),
    getAllPermissions: jest.fn(),
};

const fakeRole = { id: 'r1', role_code: 'ADMIN', role_name: 'Admin', permissions: [], users: [] };
const fakePermissions = [{ id: 'p1', permission_code: 'ADMIN_PORTAL' }];

describe('RoleService', () => {
    let service: RoleService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                { provide: RoleRepository, useValue: mockRoleRepo },
                { provide: PermissionRepository, useValue: mockPermRepo },
            ],
        }).compile();
        service = module.get<RoleService>(RoleService);
    });

    describe('getRolesByCondition', () => {
        it('should return roles matching condition', async () => {
            mockRoleRepo.findByCondition.mockResolvedValue([fakeRole]);
            const result = await service.getRolesByCondition('ADMIN');
            expect(result).toEqual([fakeRole]);
        });
    });

    describe('getRoleByCode', () => {
        it('should return a role by code', async () => {
            mockRoleRepo.findByCode.mockResolvedValue(fakeRole);
            const result = await service.getRoleByCode('ADMIN');
            expect(result).toEqual(fakeRole);
        });
    });

    describe('createRole', () => {
        it('should throw if role code already exists', async () => {
            mockRoleRepo.findByCode.mockResolvedValue(fakeRole);
            await expect(service.createRole({ roleCode: 'ADMIN', roleName: 'Admin', permissionCodes: ['p1'] })).rejects.toThrow('already exists');
        });

        it('should throw if no permission codes provided', async () => {
            mockRoleRepo.findByCode.mockResolvedValue(null);
            await expect(service.createRole({ roleCode: 'NEW', roleName: 'New', permissionCodes: [] })).rejects.toThrow('at least one permission');
        });

        it('should throw if no valid permissions found', async () => {
            mockRoleRepo.findByCode.mockResolvedValue(null);
            mockPermRepo.findByCodes.mockResolvedValue([]);
            await expect(service.createRole({ roleCode: 'NEW', roleName: 'New', permissionCodes: ['INVALID'] })).rejects.toThrow('No valid permissions');
        });

        it('should create role with valid data', async () => {
            mockRoleRepo.findByCode.mockResolvedValue(null);
            mockPermRepo.findByCodes.mockResolvedValue(fakePermissions);
            mockRoleRepo.handleCreate.mockResolvedValue(fakeRole);
            const result = await service.createRole({ roleCode: 'NEW', roleName: 'New Role', permissionCodes: ['ADMIN_PORTAL'] });
            expect(result).toEqual(fakeRole);
        });
    });

    describe('updateRole', () => {
        it('should throw if role not found', async () => {
            mockRoleRepo.findByCode.mockResolvedValue(null);
            await expect(service.updateRole('GHOST', {})).rejects.toThrow('Role not found');
        });

        it('should update role with new permission codes', async () => {
            mockRoleRepo.findByCode.mockResolvedValue({ ...fakeRole, permissions: [] });
            mockPermRepo.findByCodes.mockResolvedValue(fakePermissions);
            mockRoleRepo.handleUpdate.mockResolvedValue(fakeRole);
            const result = await service.updateRole('ADMIN', { permissionCodes: ['ADMIN_PORTAL'] });
            expect(result).toEqual(fakeRole);
        });
    });

    describe('deleteRoles', () => {
        it('should throw if role has assigned users', async () => {
            mockRoleRepo.findByCodes.mockResolvedValue([{ ...fakeRole, users: [{ id: 'u1' }] }]);
            await expect(service.deleteRoles(['ADMIN'])).rejects.toThrow('Cannot delete');
        });

        it('should delete roles with no users', async () => {
            mockRoleRepo.findByCodes.mockResolvedValue([{ ...fakeRole, users: [] }]);
            mockRoleRepo.handleDelete.mockResolvedValue(undefined);
            await expect(service.deleteRoles(['ADMIN'])).resolves.not.toThrow();
        });
    });

    describe('getAllPermissions', () => {
        it('should return all permissions', async () => {
            mockPermRepo.getAllPermissions.mockResolvedValue(fakePermissions);
            const result = await service.getAllPermissions();
            expect(result).toEqual(fakePermissions);
        });
    });
});
