import { RedisService } from '@/services/redis.service';
import { ResponseHelper } from '@libs/core/helpers/response.helper';
import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Cache')
@ApiCookieAuth()
@Controller('cache')
export class CacheController {
    constructor(private readonly redisService: RedisService) {}

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refresh toàn bộ cache dữ liệu',
        description:
            'Xóa toàn bộ cache dữ liệu nghiệp vụ trong Redis. ' +
            'Các key xác thực (refresh_token, otp, banned) được giữ nguyên. ' +
            'Dùng cho nút Refresh ở frontend.',
    })
    @ApiResponse({ status: 200, description: 'Cache đã được làm mới thành công.' })
    async refreshCache() {
        await this.redisService.flushAllDataCache();
        return ResponseHelper.send(null, 'Cache refreshed successfully.');
    }
}
