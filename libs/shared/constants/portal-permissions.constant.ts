/**
 * Portal Access Permission Constants
 * These permissions determine which sites/portals a user can access
 */
export const PORTAL_PERMISSIONS = {
  ADMIN: 'ACCESS_ADMIN_PORTAL',
  HR: 'ACCESS_HR_PORTAL',
  SALE: 'ACCESS_SALE_PORTAL',
  WAREHOUSE: 'ACCESS_WAREHOUSE_PORTAL',
} as const;

export const PORTAL_PERMISSION_VALUES = Object.values(PORTAL_PERMISSIONS);

export type PortalPermission = typeof PORTAL_PERMISSIONS[keyof typeof PORTAL_PERMISSIONS];

export interface PortalInfo {
  permission: string;
  name: string;
  path: string;
  description: string;
  icon: string;
  available: boolean;
}

export const PORTAL_INFO: Record<string, PortalInfo> = {
  [PORTAL_PERMISSIONS.ADMIN]: {
    permission: PORTAL_PERMISSIONS.ADMIN,
    name: 'Admin Portal',
    path: '/admin/profile',
    description: 'Quản trị hệ thống',
    icon: 'AdminPanelSettings',
    available: true,
  },
  [PORTAL_PERMISSIONS.HR]: {
    permission: PORTAL_PERMISSIONS.HR,
    name: 'HR Portal',
    path: '/hr/profile',
    description: 'Quản lý nhân sự',
    icon: 'People',
    available: true,
  },
  [PORTAL_PERMISSIONS.SALE]: {
    permission: PORTAL_PERMISSIONS.SALE,
    name: 'Sales Portal',
    path: '/sales/dashboard',
    description: 'Quản lý bán hàng',
    icon: 'ShoppingCart',
    available: false, // Coming soon
  },
  [PORTAL_PERMISSIONS.WAREHOUSE]: {
    permission: PORTAL_PERMISSIONS.WAREHOUSE,
    name: 'Warehouse Portal',
    path: '/warehouse/dashboard',
    description: 'Quản lý kho',
    icon: 'Warehouse',
    available: false, // Coming soon
  },
};
