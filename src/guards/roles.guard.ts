import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/decorators/public.decorator';
import { PERMISSIONS_KEY } from '@/decorators/permissions.decorator';

/**
 * PermissionsGuard kiểm tra xem người dùng hiện tại có đủ quyền hạn
 * để thực hiện hành động hay không.
 *
 * Guard này phải được dùng SAU JwtAuthGuard (vì cần request.user đã được
 * populate bởi JWT strategy).
 *
 * Cách dùng:
 * 1. Đăng ký global (app.useGlobalGuards) HOẶC sử dụng @UseGuards tại controller/route cụ thể.
 * 2. Dán decorator @RequirePermissions(...) lên route cần bảo vệ.
 *
 * @example
 * ```ts
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequirePermissions('DEPARTMENT_CREATE')
 * @Post()
 * createDepartment() { ... }
 * ```
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Nếu route được đánh dấu @Public() → bỏ qua kiểm tra
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Lấy danh sách permissions yêu cầu từ metadata của route/controller
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu route không khai báo @RequirePermissions → không yêu cầu permission cụ thể → cho qua
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    // Các permission chỉ là VIEW → mọi user đã xác thực đều được phép đọc dữ liệu
    if (requiredPermissions.every((perm) => perm.endsWith('_VIEW'))) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string; role: string; permissions: string[] };

    if (!user || !user.permissions) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    const hasPermission = requiredPermissions.every((perm) =>
      user.permissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Bạn không có quyền: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
