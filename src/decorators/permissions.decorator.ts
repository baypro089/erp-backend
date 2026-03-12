import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator để khai báo permission cần thiết cho một route.
 *
 * @example
 * ```ts
 * @RequirePermissions('DEPARTMENT_VIEW', 'DEPARTMENT_CREATE')
 * @Get()
 * getDepartments() { ... }
 * ```
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
