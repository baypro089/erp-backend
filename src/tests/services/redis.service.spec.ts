import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@/services/redis.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  ttl: jest.fn(),
  quit: jest.fn(),
};

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();
    service = module.get<RedisService>(RedisService);
  });

  describe('get', () => {
    it('should return parsed JSON when key exists', async () => {
      mockRedis.get.mockResolvedValue('{"id":1}');
      const result = await service.get<{ id: number }>('key');
      expect(result).toEqual({ id: 1 });
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await service.get('key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with TTL when ttl is provided', async () => {
      await service.set('key', { a: 1 }, 60);
      expect(mockRedis.set).toHaveBeenCalledWith('key', JSON.stringify({ a: 1 }), 'EX', 60);
    });

    it('should set value without TTL when ttl is not provided', async () => {
      await service.set('key', 'value');
      expect(mockRedis.set).toHaveBeenCalledWith('key', JSON.stringify('value'));
    });
  });

  describe('del', () => {
    it('should call redis.del with the given key', async () => {
      await service.del('some_key');
      expect(mockRedis.del).toHaveBeenCalledWith('some_key');
    });
  });

  describe('delByPrefix', () => {
    it('should delete all keys matching the prefix', async () => {
      mockRedis.scan
        .mockResolvedValueOnce(['0', ['prefix:a', 'prefix:b']]);
      await service.delByPrefix('prefix:');
      expect(mockRedis.del).toHaveBeenCalledWith(['prefix:a', 'prefix:b']);
    });

    it('should not call del if no keys match', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', []]);
      await service.delByPrefix('empty:');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('ttl', () => {
    it('should return TTL for a given key', async () => {
      mockRedis.ttl.mockResolvedValue(120);
      const result = await service.ttl('key');
      expect(result).toBe(120);
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit the redis connection', async () => {
      await service.onModuleDestroy();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
