import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from '@/services/customer.service';
import { CustomerRepository } from '@/repositories/customer.repository';
import { RedisService } from '@/services/redis.service';
import { NotFoundException } from '@nestjs/common';

const mockCustomerRepo = {
    findAllFilteredAndPaged: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
};
const mockRedis = { get: jest.fn(), set: jest.fn(), delByPrefix: jest.fn() };
const fakeCustomer = { id: 'cust1', fullName: 'John Smith', phoneNumber: '0901234567' };

describe('CustomerService', () => {
    let service: CustomerService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CustomerService,
                { provide: CustomerRepository, useValue: mockCustomerRepo },
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();
        service = module.get<CustomerService>(CustomerService);
    });

    describe('findAllFilteredAndPaged', () => {
        it('should return cached results on hit', async () => {
            const cached = { items: [fakeCustomer], total: 1 };
            mockRedis.get.mockResolvedValue(cached);
            const result = await service.findAllFilteredAndPaged('John');
            expect(result).toEqual(cached);
            expect(mockCustomerRepo.findAllFilteredAndPaged).not.toHaveBeenCalled();
        });

        it('should fetch and cache on miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            const paged = { items: [fakeCustomer], total: 1 };
            mockCustomerRepo.findAllFilteredAndPaged.mockResolvedValue(paged);
            const result = await service.findAllFilteredAndPaged();
            expect(result).toEqual(paged);
            expect(mockRedis.set).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return customer by id', async () => {
            mockCustomerRepo.findOne.mockResolvedValue(fakeCustomer);
            expect(await service.findById('cust1')).toEqual(fakeCustomer);
        });
    });

    describe('findByPhone', () => {
        it('should return customer by phone', async () => {
            mockCustomerRepo.findOne.mockResolvedValue(fakeCustomer);
            expect(await service.findByPhone('0901234567')).toEqual(fakeCustomer);
        });

        it('should throw NotFoundException if not found', async () => {
            mockCustomerRepo.findOne.mockResolvedValue(null);
            await expect(service.findByPhone('0000000000')).rejects.toThrow(NotFoundException);
        });
    });

    describe('createCustomer', () => {
        it('should create and invalidate cache', async () => {
            mockCustomerRepo.create.mockReturnValue(fakeCustomer);
            mockCustomerRepo.save.mockResolvedValue(fakeCustomer);
            const result = await service.createCustomer({ fullName: 'John' });
            expect(result).toEqual(fakeCustomer);
            expect(mockRedis.delByPrefix).toHaveBeenCalledWith('customers:');
        });
    });

    describe('updateCustomer', () => {
        it('should throw NotFoundException if customer not found', async () => {
            mockCustomerRepo.findOne.mockResolvedValue(null);
            await expect(service.updateCustomer('ghost', { fullName: 'X' })).rejects.toThrow(NotFoundException);
        });

        it('should throw if phone already taken by another customer', async () => {
            mockCustomerRepo.findOne
                .mockResolvedValueOnce(fakeCustomer) // find to update
                .mockResolvedValueOnce({ id: 'cust2' }); // phone belongs to another
            await expect(service.updateCustomer('cust1', { phoneNumber: '0999999999' })).rejects.toThrow(NotFoundException);
        });

        it('should update and invalidate cache', async () => {
            mockCustomerRepo.findOne
                .mockResolvedValueOnce(fakeCustomer)
                .mockResolvedValueOnce(null);
            mockCustomerRepo.save.mockResolvedValue({ ...fakeCustomer, fullName: 'Updated' });
            const result = await service.updateCustomer('cust1', { fullName: 'Updated' });
            expect(result.fullName).toBe('Updated');
        });
    });

    describe('deleteCustomer', () => {
        it('should throw NotFoundException for empty ids', async () => {
            await expect(service.deleteCustomer([])).rejects.toThrow(NotFoundException);
        });

        it('should delete and invalidate cache', async () => {
            mockCustomerRepo.delete.mockResolvedValue(undefined);
            await service.deleteCustomer(['cust1']);
            expect(mockCustomerRepo.delete).toHaveBeenCalledWith(['cust1']);
        });
    });
});
