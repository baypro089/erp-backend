import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/services/auth.service';
import { UsersService } from '@/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@/services/redis.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@/services/mail.service';
import { DataSource } from 'typeorm';
import { UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUsersService = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updateUser: jest.fn(),
    updatePasswordByEmail: jest.fn(),
};
const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
    verify: jest.fn(),
    decode: jest.fn(),
};
const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
};
const mockConfigService = { get: jest.fn().mockReturnValue('secret') };
const mockMailService = { sendOtpEmail: jest.fn(), sendWelcomeEmail: jest.fn() };
const mockDataSource = {};

const activeUser = {
    id: 'user-1',
    username: 'admin',
    password: 'hashed',
    isActive: true,
    email: 'admin@test.com',
    role: { role_code: 'ADMIN' },
};

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: RedisService, useValue: mockRedisService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: MailService, useValue: mockMailService },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<AuthService>(AuthService);
    });

    describe('login', () => {
        it('should return tokens on valid credentials', async () => {
            mockUsersService.findByUsername.mockResolvedValue(activeUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockRedisService.set.mockResolvedValue(undefined);
            mockUsersService.updateUser.mockResolvedValue(activeUser);

            const result = await service.login({ username: 'admin', password: 'pass' });
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockUsersService.findByUsername.mockResolvedValue(null);
            await expect(service.login({ username: 'x', password: 'y' })).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if user is inactive', async () => {
            mockUsersService.findByUsername.mockResolvedValue({ ...activeUser, isActive: false });
            await expect(service.login({ username: 'admin', password: 'pass' })).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password does not match', async () => {
            mockUsersService.findByUsername.mockResolvedValue(activeUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(service.login({ username: 'admin', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refreshAccessToken', () => {
        it('should return new access token when refresh token is valid', async () => {
            mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
            mockRedisService.get.mockResolvedValue('valid_refresh');
            mockUsersService.findById.mockResolvedValue(activeUser);

            const result = await service.refreshAccessToken('valid_refresh');
            expect(typeof result).toBe('string');
        });

        it('should throw UnauthorizedException for invalid token', async () => {
            mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
            await expect(service.refreshAccessToken('bad')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if stored token differs', async () => {
            mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
            mockRedisService.get.mockResolvedValue('other_token');
            await expect(service.refreshAccessToken('this_token')).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('should delete refresh token from redis', async () => {
            mockJwtService.decode.mockReturnValue({ sub: 'user-1' });
            await service.logout('some_token');
            expect(mockRedisService.del).toHaveBeenCalledWith('refresh_token:user-1');
        });

        it('should not throw if decoding fails', async () => {
            mockJwtService.decode.mockReturnValue(null);
            await expect(service.logout('bad')).resolves.not.toThrow();
        });
    });

    describe('me', () => {
        it('should return user by id', async () => {
            mockUsersService.findById.mockResolvedValue(activeUser);
            const result = await service.me('user-1');
            expect(result).toEqual(activeUser);
        });
    });

    describe('sendForgotPasswordOtp', () => {
        it('should set OTP in redis and send email', async () => {
            mockUsersService.findByEmail.mockResolvedValue(activeUser);
            mockRedisService.set.mockResolvedValue(undefined);
            mockMailService.sendOtpEmail.mockResolvedValue(undefined);

            const result = await service.sendForgotPasswordOtp('admin@test.com');
            expect(result).toEqual({ message: 'OTP sent to email' });
            expect(mockMailService.sendOtpEmail).toHaveBeenCalled();
        });

        it('should throw NotFoundException if email not found', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            await expect(service.sendForgotPasswordOtp('x@x.com')).rejects.toThrow(NotFoundException);
        });
    });

    describe('verifyOtp', () => {
        it('should return success on valid OTP', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify({ otp: '123456', attempts: 0 }));
            mockRedisService.del.mockResolvedValue(undefined);
            const result = await service.verifyOtp('admin@test.com', '123456');
            expect(result).toEqual({ message: 'OTP verified successfully' });
        });

        it('should throw BadRequestException if OTP expired', async () => {
            mockRedisService.get.mockResolvedValue(null);
            await expect(service.verifyOtp('a@b.com', '111')).rejects.toThrow(BadRequestException);
        });

        it('should throw ForbiddenException after 5 wrong attempts', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify({ otp: '123456', attempts: 5 }));
            await expect(service.verifyOtp('a@b.com', '123456')).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException on wrong OTP', async () => {
            mockRedisService.get.mockResolvedValue(JSON.stringify({ otp: '123456', attempts: 0 }));
            mockRedisService.ttl.mockResolvedValue(200);
            mockRedisService.set.mockResolvedValue(undefined);
            await expect(service.verifyOtp('a@b.com', '000000')).rejects.toThrow(BadRequestException);
        });
    });
});
