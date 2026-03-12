/**
 * ============================================================
 *  PERMISSIONS CONSTANT
 *  Dùng chung cho backend (NestJS) và frontend.
 *
 *  Cách dùng backend:
 *    import { PERMISSIONS } from '@libs/shared/constants/permissions.constant';
 *    @RequirePermissions(PERMISSIONS.DEPARTMENT.CREATE)
 *
 *  Cách dùng frontend (copy file hoặc chia sẻ qua package):
 *    import { PERMISSIONS } from '@/constants/permissions.constant';
 *    if (user.permissions.includes(PERMISSIONS.ORDER.VIEW)) { ... }
 * ============================================================
 */

// ─── USER ────────────────────────────────────────────────────────────────────
export const USER_PERMISSIONS = {
  CREATE:        'USER_CREATE',
  VIEW:          'USER_VIEW',
  UPDATE:        'USER_UPDATE',
  DELETE:        'USER_DELETE',
  BAN:           'USER_BAN',
} as const;

// ─── ROLE ─────────────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  CREATE: 'ROLE_CREATE',
  VIEW:   'ROLE_VIEW',
  UPDATE: 'ROLE_UPDATE',
  DELETE: 'ROLE_DELETE',
} as const;

// ─── PERMISSION ──────────────────────────────────────────────────────────────
export const PERMISSION_PERMISSIONS = {
  VIEW: 'PERMISSION_VIEW',
} as const;

// ─── DEPARTMENT ──────────────────────────────────────────────────────────────
export const DEPARTMENT_PERMISSIONS = {
  CREATE: 'DEPARTMENT_CREATE',
  VIEW:   'DEPARTMENT_VIEW',
  UPDATE: 'DEPARTMENT_UPDATE',
  DELETE: 'DEPARTMENT_DELETE',
} as const;

// ─── POSITION ────────────────────────────────────────────────────────────────
export const POSITION_PERMISSIONS = {
  CREATE: 'POSITION_CREATE',
  VIEW:   'POSITION_VIEW',
  UPDATE: 'POSITION_UPDATE',
  DELETE: 'POSITION_DELETE',
} as const;

// ─── EMPLOYEE ────────────────────────────────────────────────────────────────
export const EMPLOYEE_PERMISSIONS = {
  CREATE: 'EMPLOYEE_CREATE',
  VIEW:   'EMPLOYEE_VIEW',
  UPDATE: 'EMPLOYEE_UPDATE',
  DELETE: 'EMPLOYEE_DELETE',
} as const;

// ─── JOB_HISTORY ─────────────────────────────────────────────────────────────
export const JOB_HISTORY_PERMISSIONS = {
  CREATE: 'JOB_HISTORY_CREATE',
  VIEW:   'JOB_HISTORY_VIEW',
  UPDATE: 'JOB_HISTORY_UPDATE',
  DELETE: 'JOB_HISTORY_DELETE',
} as const;

// ─── LEAVE_REQUEST ───────────────────────────────────────────────────────────
export const LEAVE_REQUEST_PERMISSIONS = {
  CREATE:  'LEAVE_REQUEST_CREATE',
  VIEW:    'LEAVE_REQUEST_VIEW',
  UPDATE:  'LEAVE_REQUEST_UPDATE',
  APPROVE: 'LEAVE_REQUEST_APPROVE',
} as const;

// ─── PAYSLIP ─────────────────────────────────────────────────────────────────
export const PAYSLIP_PERMISSIONS = {
  VIEW:       'PAYSLIP_VIEW',
  CALCULATE:  'PAYSLIP_CALCULATE',
  GENERATE:   'PAYSLIP_GENERATE',
  MARK_PAID:  'PAYSLIP_MARK_PAID',
} as const;

// ─── HOLIDAY ─────────────────────────────────────────────────────────────────
export const HOLIDAY_PERMISSIONS = {
  CREATE: 'HOLIDAY_CREATE',
  VIEW:   'HOLIDAY_VIEW',
  UPDATE: 'HOLIDAY_UPDATE',
  DELETE: 'HOLIDAY_DELETE',
} as const;

// ─── RESIGNATION_REQUEST ─────────────────────────────────────────────────────
export const RESIGNATION_REQUEST_PERMISSIONS = {
  CREATE:  'RESIGNATION_REQUEST_CREATE',
  VIEW:    'RESIGNATION_REQUEST_VIEW',
  UPDATE:  'RESIGNATION_REQUEST_UPDATE',
  APPROVE: 'RESIGNATION_REQUEST_APPROVE',
} as const;

// ─── SYSTEM_SETTING ──────────────────────────────────────────────────────────
export const SYSTEM_SETTING_PERMISSIONS = {
  VIEW:   'SYSTEM_SETTING_VIEW',
  UPDATE: 'SYSTEM_SETTING_UPDATE',
} as const;

// ─── BRAND ───────────────────────────────────────────────────────────────────
export const BRAND_PERMISSIONS = {
  CREATE: 'BRAND_CREATE',
  VIEW:   'BRAND_VIEW',
  UPDATE: 'BRAND_UPDATE',
  DELETE: 'BRAND_DELETE',
} as const;

// ─── SUPPLIER ────────────────────────────────────────────────────────────────
export const SUPPLIER_PERMISSIONS = {
  CREATE: 'SUPPLIER_CREATE',
  VIEW:   'SUPPLIER_VIEW',
  UPDATE: 'SUPPLIER_UPDATE',
  DELETE: 'SUPPLIER_DELETE',
} as const;

// ─── CATEGORY ────────────────────────────────────────────────────────────────
export const CATEGORY_PERMISSIONS = {
  CREATE: 'CATEGORY_CREATE',
  VIEW:   'CATEGORY_VIEW',
  UPDATE: 'CATEGORY_UPDATE',
  DELETE: 'CATEGORY_DELETE',
} as const;

// ─── PRODUCT ─────────────────────────────────────────────────────────────────
export const PRODUCT_PERMISSIONS = {
  CREATE: 'PRODUCT_CREATE',
  VIEW:   'PRODUCT_VIEW',
  UPDATE: 'PRODUCT_UPDATE',
  DELETE: 'PRODUCT_DELETE',
} as const;

// ─── WAREHOUSE ───────────────────────────────────────────────────────────────
export const WAREHOUSE_PERMISSIONS = {
  CREATE: 'WAREHOUSE_CREATE',
  VIEW:   'WAREHOUSE_VIEW',
  UPDATE: 'WAREHOUSE_UPDATE',
  DELETE: 'WAREHOUSE_DELETE',
} as const;

// ─── PRODUCT_STOCK ───────────────────────────────────────────────────────────
export const PRODUCT_STOCK_PERMISSIONS = {
  VIEW:   'PRODUCT_STOCK_VIEW',
  UPDATE: 'PRODUCT_STOCK_UPDATE',
} as const;

// ─── PRODUCT_SERIAL ──────────────────────────────────────────────────────────
export const PRODUCT_SERIAL_PERMISSIONS = {
  CREATE: 'PRODUCT_SERIAL_CREATE',
  VIEW:   'PRODUCT_SERIAL_VIEW',
  UPDATE: 'PRODUCT_SERIAL_UPDATE',
  DELETE: 'PRODUCT_SERIAL_DELETE',
} as const;

// ─── IMPORT_RECEIPT ──────────────────────────────────────────────────────────
export const IMPORT_RECEIPT_PERMISSIONS = {
  CREATE: 'IMPORT_RECEIPT_CREATE',
  VIEW:   'IMPORT_RECEIPT_VIEW',
} as const;

// ─── CUSTOMER ────────────────────────────────────────────────────────────────
export const CUSTOMER_PERMISSIONS = {
  CREATE: 'CUSTOMER_CREATE',
  VIEW:   'CUSTOMER_VIEW',
  UPDATE: 'CUSTOMER_UPDATE',
  DELETE: 'CUSTOMER_DELETE',
} as const;

// ─── ORDER ───────────────────────────────────────────────────────────────────
export const ORDER_PERMISSIONS = {
  CREATE:  'ORDER_CREATE',
  VIEW:    'ORDER_VIEW',
  UPDATE:  'ORDER_UPDATE',
  FULFILL: 'ORDER_FULFILL',
} as const;

// ─── RETURN_REQUEST ──────────────────────────────────────────────────────────
export const RETURN_REQUEST_PERMISSIONS = {
  CREATE: 'RETURN_REQUEST_CREATE',
  VIEW:   'RETURN_REQUEST_VIEW',
  UPDATE: 'RETURN_REQUEST_UPDATE',
} as const;

// ─── ATTACHMENT ──────────────────────────────────────────────────────────────
export const ATTACHMENT_PERMISSIONS = {
  CREATE: 'ATTACHMENT_CREATE',
  VIEW:   'ATTACHMENT_VIEW',
  UPDATE: 'ATTACHMENT_UPDATE',
  DELETE: 'ATTACHMENT_DELETE',
} as const;

// ─── REPORTS & STATISTICS ────────────────────────────────────────────────────
export const ADMIN_STATISTIC_PERMISSIONS = {
  VIEW: 'ADMIN_STATISTIC_VIEW',
} as const;

export const HR_STATISTIC_PERMISSIONS = {
  VIEW: 'HR_STATISTIC_VIEW',
} as const;

export const HR_REPORT_PERMISSIONS = {
  VIEW: 'HR_REPORT_VIEW',
} as const;

export const SALES_STATISTIC_PERMISSIONS = {
  VIEW: 'SALES_STATISTIC_VIEW',
} as const;

export const SALES_REPORT_PERMISSIONS = {
  VIEW: 'SALES_REPORT_VIEW',
} as const;

export const WAREHOUSE_REPORT_PERMISSIONS = {
  VIEW: 'WAREHOUSE_REPORT_VIEW',
} as const;

// ─── COMBINED NAMESPACE ──────────────────────────────────────────────────────
/**
 * Namespace tổng hợp — truy cập theo dạng: PERMISSIONS.DEPARTMENT.CREATE
 */
export const PERMISSIONS = {
  USER:                USER_PERMISSIONS,
  ROLE:                ROLE_PERMISSIONS,
  PERMISSION:          PERMISSION_PERMISSIONS,
  DEPARTMENT:          DEPARTMENT_PERMISSIONS,
  POSITION:            POSITION_PERMISSIONS,
  EMPLOYEE:            EMPLOYEE_PERMISSIONS,
  JOB_HISTORY:         JOB_HISTORY_PERMISSIONS,
  LEAVE_REQUEST:        LEAVE_REQUEST_PERMISSIONS,
  PAYSLIP:             PAYSLIP_PERMISSIONS,
  HOLIDAY:             HOLIDAY_PERMISSIONS,
  RESIGNATION_REQUEST: RESIGNATION_REQUEST_PERMISSIONS,
  SYSTEM_SETTING:      SYSTEM_SETTING_PERMISSIONS,
  BRAND:               BRAND_PERMISSIONS,
  SUPPLIER:            SUPPLIER_PERMISSIONS,
  CATEGORY:            CATEGORY_PERMISSIONS,
  PRODUCT:             PRODUCT_PERMISSIONS,
  WAREHOUSE:           WAREHOUSE_PERMISSIONS,
  PRODUCT_STOCK:       PRODUCT_STOCK_PERMISSIONS,
  PRODUCT_SERIAL:      PRODUCT_SERIAL_PERMISSIONS,
  IMPORT_RECEIPT:      IMPORT_RECEIPT_PERMISSIONS,
  CUSTOMER:            CUSTOMER_PERMISSIONS,
  ORDER:               ORDER_PERMISSIONS,
  RETURN_REQUEST:      RETURN_REQUEST_PERMISSIONS,
  ATTACHMENT:          ATTACHMENT_PERMISSIONS,
  ADMIN_STATISTIC:     ADMIN_STATISTIC_PERMISSIONS,
  HR_STATISTIC:        HR_STATISTIC_PERMISSIONS,
  HR_REPORT:           HR_REPORT_PERMISSIONS,
  SALES_STATISTIC:     SALES_STATISTIC_PERMISSIONS,
  SALES_REPORT:        SALES_REPORT_PERMISSIONS,
  WAREHOUSE_REPORT:    WAREHOUSE_REPORT_PERMISSIONS,
} as const;

// ─── FLAT LIST ───────────────────────────────────────────────────────────────
/**
 * Mảng phẳng tất cả permission codes — hữu ích để validate hoặc hiển thị danh sách.
 */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((group) =>
  Object.values(group),
) as string[];

// ─── TYPE ─────────────────────────────────────────────────────────────────────
type PermissionGroup = typeof PERMISSIONS;
type Flatten<T> = T extends Record<string, infer V>
  ? V extends Record<string, infer U>
    ? U
    : never
  : never;

/**
 * Union type của tất cả permission codes.
 * Dùng để type-check khi cần đảm bảo giá trị là một permission hợp lệ.
 *
 * @example
 * function check(p: PermissionCode) { ... }
 */
export type PermissionCode = Flatten<PermissionGroup>;
