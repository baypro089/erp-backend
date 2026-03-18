import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '@/entities/permission.entity';
import { PORTAL_PERMISSIONS } from '@libs/shared/constants/portal-permissions.constant';

@Injectable()
export class PermissionSeeder {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  private readonly permissions: { permission_code: string; permission_name: string; type: string }[] = [
    // PORTAL
    { permission_code: PORTAL_PERMISSIONS.ADMIN, permission_name: 'Truy cập trang admin', type: 'PORTAL_ACCESS' },
    { permission_code: PORTAL_PERMISSIONS.HR, permission_name: 'Truy cập trang HR', type: 'PORTAL_ACCESS' },
    { permission_code: PORTAL_PERMISSIONS.SALE, permission_name: 'Truy cập trang Sale', type: 'PORTAL_ACCESS' },
    // ─── USER ────────────────────────────────────────────────────────────────
    { permission_code: 'USER_CREATE',        permission_name: 'Tạo người dùng',              type: 'USER' },
    { permission_code: 'USER_VIEW',          permission_name: 'Xem người dùng',              type: 'USER' },
    { permission_code: 'USER_UPDATE',        permission_name: 'Cập nhật người dùng',         type: 'USER' },
    { permission_code: 'USER_DELETE',        permission_name: 'Xóa người dùng',              type: 'USER' },
    { permission_code: 'USER_TOGGLE_ACTIVE', permission_name: 'Bật/Tắt trạng thái người dùng', type: 'USER' },
    { permission_code: 'USER_BAN',           permission_name: 'Cấm người dùng',              type: 'USER' },

    // ─── ROLE ────────────────────────────────────────────────────────────────
    { permission_code: 'ROLE_CREATE', permission_name: 'Tạo vai trò',          type: 'ROLE' },
    { permission_code: 'ROLE_VIEW',   permission_name: 'Xem vai trò',          type: 'ROLE' },
    { permission_code: 'ROLE_UPDATE', permission_name: 'Cập nhật vai trò',     type: 'ROLE' },
    { permission_code: 'ROLE_DELETE', permission_name: 'Xóa vai trò',          type: 'ROLE' },

    // ─── PERMISSION ──────────────────────────────────────────────────────────
    { permission_code: 'PERMISSION_VIEW', permission_name: 'Xem quyền hạn', type: 'PERMISSION' },

    // ─── DEPARTMENT ──────────────────────────────────────────────────────────
    { permission_code: 'DEPARTMENT_CREATE', permission_name: 'Tạo phòng ban',          type: 'DEPARTMENT' },
    { permission_code: 'DEPARTMENT_VIEW',   permission_name: 'Xem phòng ban',          type: 'DEPARTMENT' },
    { permission_code: 'DEPARTMENT_UPDATE', permission_name: 'Cập nhật phòng ban',     type: 'DEPARTMENT' },
    { permission_code: 'DEPARTMENT_DELETE', permission_name: 'Xóa phòng ban',          type: 'DEPARTMENT' },

    // ─── POSITION ────────────────────────────────────────────────────────────
    { permission_code: 'POSITION_CREATE', permission_name: 'Tạo vị trí',          type: 'POSITION' },
    { permission_code: 'POSITION_VIEW',   permission_name: 'Xem vị trí',          type: 'POSITION' },
    { permission_code: 'POSITION_UPDATE', permission_name: 'Cập nhật vị trí',     type: 'POSITION' },
    { permission_code: 'POSITION_DELETE', permission_name: 'Xóa vị trí',          type: 'POSITION' },

    // ─── EMPLOYEE ────────────────────────────────────────────────────────────
    { permission_code: 'EMPLOYEE_CREATE', permission_name: 'Tạo nhân viên',          type: 'EMPLOYEE' },
    { permission_code: 'EMPLOYEE_VIEW',   permission_name: 'Xem nhân viên',          type: 'EMPLOYEE' },
    { permission_code: 'EMPLOYEE_UPDATE', permission_name: 'Cập nhật nhân viên',     type: 'EMPLOYEE' },
    { permission_code: 'EMPLOYEE_DELETE', permission_name: 'Xóa nhân viên',          type: 'EMPLOYEE' },

    // ─── JOB_HISTORY ─────────────────────────────────────────────────────────
    { permission_code: 'JOB_HISTORY_CREATE', permission_name: 'Tạo lịch sử công việc',          type: 'JOB_HISTORY' },
    { permission_code: 'JOB_HISTORY_VIEW',   permission_name: 'Xem lịch sử công việc',          type: 'JOB_HISTORY' },
    { permission_code: 'JOB_HISTORY_UPDATE', permission_name: 'Cập nhật lịch sử công việc',     type: 'JOB_HISTORY' },
    { permission_code: 'JOB_HISTORY_DELETE', permission_name: 'Xóa lịch sử công việc',          type: 'JOB_HISTORY' },

    // ─── LEAVE_REQUEST ───────────────────────────────────────────────────────
    { permission_code: 'LEAVE_REQUEST_CREATE',  permission_name: 'Tạo đơn xin nghỉ phép',          type: 'LEAVE_REQUEST' },
    { permission_code: 'LEAVE_REQUEST_VIEW',    permission_name: 'Xem đơn xin nghỉ phép',          type: 'LEAVE_REQUEST' },
    { permission_code: 'LEAVE_REQUEST_UPDATE',  permission_name: 'Cập nhật đơn xin nghỉ phép',     type: 'LEAVE_REQUEST' },
    { permission_code: 'LEAVE_REQUEST_APPROVE', permission_name: 'Duyệt đơn xin nghỉ phép',        type: 'LEAVE_REQUEST' },

    // ─── PAYSLIP ─────────────────────────────────────────────────────────────
    { permission_code: 'PAYSLIP_VIEW',          permission_name: 'Xem phiếu lương',               type: 'PAYSLIP' },
    { permission_code: 'PAYSLIP_CALCULATE',     permission_name: 'Tính toán phiếu lương',         type: 'PAYSLIP' },
    { permission_code: 'PAYSLIP_GENERATE',      permission_name: 'Tạo bảng lương',                type: 'PAYSLIP' },
    { permission_code: 'PAYSLIP_MARK_PAID',     permission_name: 'Xác nhận đã thanh toán lương',  type: 'PAYSLIP' },

    // ─── HOLIDAY ─────────────────────────────────────────────────────────────
    { permission_code: 'HOLIDAY_CREATE', permission_name: 'Tạo ngày nghỉ lễ',          type: 'HOLIDAY' },
    { permission_code: 'HOLIDAY_VIEW',   permission_name: 'Xem ngày nghỉ lễ',          type: 'HOLIDAY' },
    { permission_code: 'HOLIDAY_UPDATE', permission_name: 'Cập nhật ngày nghỉ lễ',     type: 'HOLIDAY' },
    { permission_code: 'HOLIDAY_DELETE', permission_name: 'Xóa ngày nghỉ lễ',          type: 'HOLIDAY' },

    // ─── RESIGNATION_REQUEST ─────────────────────────────────────────────────
    { permission_code: 'RESIGNATION_REQUEST_CREATE',  permission_name: 'Tạo đơn từ chức',          type: 'RESIGNATION_REQUEST' },
    { permission_code: 'RESIGNATION_REQUEST_VIEW',    permission_name: 'Xem đơn từ chức',          type: 'RESIGNATION_REQUEST' },
    { permission_code: 'RESIGNATION_REQUEST_UPDATE',  permission_name: 'Cập nhật đơn từ chức',     type: 'RESIGNATION_REQUEST' },
    { permission_code: 'RESIGNATION_REQUEST_APPROVE', permission_name: 'Duyệt đơn từ chức',        type: 'RESIGNATION_REQUEST' },

    // ─── TERMINATION_REQUEST ────────────────────────────────────────────────
    { permission_code: 'TERMINATION_REQUEST_CREATE',  permission_name: 'Tạo yêu cầu sa thải',      type: 'TERMINATION_REQUEST' },
    { permission_code: 'TERMINATION_REQUEST_VIEW',    permission_name: 'Xem yêu cầu sa thải',      type: 'TERMINATION_REQUEST' },
    { permission_code: 'TERMINATION_REQUEST_UPDATE',  permission_name: 'Cập nhật yêu cầu sa thải', type: 'TERMINATION_REQUEST' },
    { permission_code: 'TERMINATION_REQUEST_APPROVE', permission_name: 'Duyệt yêu cầu sa thải',    type: 'TERMINATION_REQUEST' },
    { permission_code: 'TERMINATION_REQUEST_RESTORE', permission_name: 'Khôi phục sa thải nhầm',   type: 'TERMINATION_REQUEST' },

    // ─── SYSTEM_SETTING ──────────────────────────────────────────────────────
    { permission_code: 'SYSTEM_SETTING_VIEW',   permission_name: 'Xem cài đặt hệ thống',          type: 'SYSTEM_SETTING' },
    { permission_code: 'SYSTEM_SETTING_UPDATE', permission_name: 'Cập nhật cài đặt hệ thống',     type: 'SYSTEM_SETTING' },

    // ─── BRAND ───────────────────────────────────────────────────────────────
    { permission_code: 'BRAND_CREATE', permission_name: 'Tạo thương hiệu',          type: 'BRAND' },
    { permission_code: 'BRAND_VIEW',   permission_name: 'Xem thương hiệu',          type: 'BRAND' },
    { permission_code: 'BRAND_UPDATE', permission_name: 'Cập nhật thương hiệu',     type: 'BRAND' },
    { permission_code: 'BRAND_DELETE', permission_name: 'Xóa thương hiệu',          type: 'BRAND' },

    // ─── SUPPLIER ────────────────────────────────────────────────────────────
    { permission_code: 'SUPPLIER_CREATE', permission_name: 'Tạo nhà cung cấp',          type: 'SUPPLIER' },
    { permission_code: 'SUPPLIER_VIEW',   permission_name: 'Xem nhà cung cấp',          type: 'SUPPLIER' },
    { permission_code: 'SUPPLIER_UPDATE', permission_name: 'Cập nhật nhà cung cấp',     type: 'SUPPLIER' },
    { permission_code: 'SUPPLIER_DELETE', permission_name: 'Xóa nhà cung cấp',          type: 'SUPPLIER' },

    // ─── CATEGORY ────────────────────────────────────────────────────────────
    { permission_code: 'CATEGORY_CREATE', permission_name: 'Tạo danh mục',          type: 'CATEGORY' },
    { permission_code: 'CATEGORY_VIEW',   permission_name: 'Xem danh mục',          type: 'CATEGORY' },
    { permission_code: 'CATEGORY_UPDATE', permission_name: 'Cập nhật danh mục',     type: 'CATEGORY' },
    { permission_code: 'CATEGORY_DELETE', permission_name: 'Xóa danh mục',          type: 'CATEGORY' },

    // ─── PRODUCT ─────────────────────────────────────────────────────────────
    { permission_code: 'PRODUCT_CREATE', permission_name: 'Tạo sản phẩm',          type: 'PRODUCT' },
    { permission_code: 'PRODUCT_VIEW',   permission_name: 'Xem sản phẩm',          type: 'PRODUCT' },
    { permission_code: 'PRODUCT_UPDATE', permission_name: 'Cập nhật sản phẩm',     type: 'PRODUCT' },
    { permission_code: 'PRODUCT_DELETE', permission_name: 'Xóa sản phẩm',          type: 'PRODUCT' },

    // ─── WAREHOUSE ───────────────────────────────────────────────────────────
    { permission_code: 'WAREHOUSE_CREATE', permission_name: 'Tạo kho hàng',          type: 'WAREHOUSE' },
    { permission_code: 'WAREHOUSE_VIEW',   permission_name: 'Xem kho hàng',          type: 'WAREHOUSE' },
    { permission_code: 'WAREHOUSE_UPDATE', permission_name: 'Cập nhật kho hàng',     type: 'WAREHOUSE' },
    { permission_code: 'WAREHOUSE_DELETE', permission_name: 'Xóa kho hàng',          type: 'WAREHOUSE' },

    // ─── PRODUCT_STOCK ───────────────────────────────────────────────────────
    { permission_code: 'PRODUCT_STOCK_VIEW',   permission_name: 'Xem tồn kho sản phẩm',          type: 'PRODUCT_STOCK' },
    { permission_code: 'PRODUCT_STOCK_UPDATE', permission_name: 'Cập nhật tồn kho sản phẩm',     type: 'PRODUCT_STOCK' },

    // ─── PRODUCT_SERIAL ──────────────────────────────────────────────────────
    { permission_code: 'PRODUCT_SERIAL_CREATE', permission_name: 'Tạo serial sản phẩm',          type: 'PRODUCT_SERIAL' },
    { permission_code: 'PRODUCT_SERIAL_VIEW',   permission_name: 'Xem serial sản phẩm',          type: 'PRODUCT_SERIAL' },
    { permission_code: 'PRODUCT_SERIAL_UPDATE', permission_name: 'Cập nhật serial sản phẩm',     type: 'PRODUCT_SERIAL' },
    { permission_code: 'PRODUCT_SERIAL_DELETE', permission_name: 'Xóa serial sản phẩm',          type: 'PRODUCT_SERIAL' },

    // ─── IMPORT_RECEIPT ──────────────────────────────────────────────────────
    { permission_code: 'IMPORT_RECEIPT_CREATE', permission_name: 'Tạo phiếu nhập kho',  type: 'IMPORT_RECEIPT' },
    { permission_code: 'IMPORT_RECEIPT_VIEW',   permission_name: 'Xem phiếu nhập kho',  type: 'IMPORT_RECEIPT' },

    // ─── CUSTOMER ────────────────────────────────────────────────────────────
    { permission_code: 'CUSTOMER_CREATE', permission_name: 'Tạo khách hàng',          type: 'CUSTOMER' },
    { permission_code: 'CUSTOMER_VIEW',   permission_name: 'Xem khách hàng',          type: 'CUSTOMER' },
    { permission_code: 'CUSTOMER_UPDATE', permission_name: 'Cập nhật khách hàng',     type: 'CUSTOMER' },
    { permission_code: 'CUSTOMER_DELETE', permission_name: 'Xóa khách hàng',          type: 'CUSTOMER' },

    // ─── ORDER ───────────────────────────────────────────────────────────────
    { permission_code: 'ORDER_CREATE',  permission_name: 'Tạo đơn hàng',               type: 'ORDER' },
    { permission_code: 'ORDER_VIEW',    permission_name: 'Xem đơn hàng',               type: 'ORDER' },
    { permission_code: 'ORDER_UPDATE',  permission_name: 'Cập nhật trạng thái đơn hàng', type: 'ORDER' },
    { permission_code: 'ORDER_FULFILL', permission_name: 'Thực hiện đơn hàng',         type: 'ORDER' },

    // ─── RETURN_REQUEST ──────────────────────────────────────────────────────
    { permission_code: 'RETURN_REQUEST_CREATE', permission_name: 'Tạo yêu cầu trả hàng',          type: 'RETURN_REQUEST' },
    { permission_code: 'RETURN_REQUEST_VIEW',   permission_name: 'Xem yêu cầu trả hàng',          type: 'RETURN_REQUEST' },
    { permission_code: 'RETURN_REQUEST_UPDATE', permission_name: 'Cập nhật yêu cầu trả hàng',     type: 'RETURN_REQUEST' },

    // ─── ATTACHMENT ──────────────────────────────────────────────────────────
    { permission_code: 'ATTACHMENT_CREATE', permission_name: 'Tải lên tệp đính kèm',       type: 'ATTACHMENT' },
    { permission_code: 'ATTACHMENT_VIEW',   permission_name: 'Xem tệp đính kèm',           type: 'ATTACHMENT' },
    { permission_code: 'ATTACHMENT_UPDATE', permission_name: 'Cập nhật tệp đính kèm',      type: 'ATTACHMENT' },
    { permission_code: 'ATTACHMENT_DELETE', permission_name: 'Xóa tệp đính kèm',           type: 'ATTACHMENT' },

    // ─── REPORTS & STATISTICS ────────────────────────────────────────────────
    { permission_code: 'ADMIN_STATISTIC_VIEW',    permission_name: 'Xem thống kê admin',        type: 'ADMIN_STATISTIC' },
    { permission_code: 'HR_STATISTIC_VIEW',       permission_name: 'Xem thống kê nhân sự',      type: 'HR_STATISTIC' },
    { permission_code: 'HR_REPORT_VIEW',          permission_name: 'Xem báo cáo nhân sự',       type: 'HR_REPORT' },
    { permission_code: 'SALES_STATISTIC_VIEW',    permission_name: 'Xem thống kê bán hàng',     type: 'SALES_STATISTIC' },
    { permission_code: 'SALES_REPORT_VIEW',       permission_name: 'Xem báo cáo bán hàng',      type: 'SALES_REPORT' },
    { permission_code: 'WAREHOUSE_REPORT_VIEW',   permission_name: 'Xem báo cáo kho hàng',      type: 'WAREHOUSE_REPORT' },
  ];

  async seed() {
    let created = 0;
    let skipped = 0;

    for (const perm of this.permissions) {
      const existing = await this.permissionRepository.findOne({
        where: { permission_code: perm.permission_code },
      });

      if (!existing) {
        await this.permissionRepository.save(this.permissionRepository.create(perm));
        console.log(`  ✅ Created: ${perm.permission_code}`);
        created++;
      } else {
        skipped++;
      }
    }

    console.log(`🎉 Permission seeding completed! Created: ${created}, Skipped: ${skipped}`);
  }
}
