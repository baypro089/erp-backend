import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { fakerVI as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

// ── entities ────────────────────────────────────────────────────────────────
import { Permission } from '@/entities/permission.entity';
import { Role } from '@/entities/role.entity';
import { Department } from '@/entities/department.entity';
import { Position } from '@/entities/position.entity';
import { Employee } from '@/entities/employee.entity';
import { User } from '@/entities/user.entity';
import { JobHistory } from '@/entities/job-history.entity';
import { Holiday } from '@/entities/holiday.entity';
import { LeaveRequest } from '@/entities/leave-request.entity';
import { ResignationRequest } from '@/entities/resignation-request.entity';
import { Payslip } from '@/entities/payslip.entity';
import { Brand } from '@/entities/brand.entity';
import { Supplier } from '@/entities/supplier.entity';
import { Category } from '@/entities/category.entity';
import { Product } from '@/entities/product.entity';
import { Warehouse } from '@/entities/warehouse.entity';
import { ProductStock } from '@/entities/product-stock.entity';
import { ProductSerial } from '@/entities/product-serial.entity';
import { ImportReceipt } from '@/entities/import-receipt.entity';
import { ImportDetail } from '@/entities/import-detail.entity';
import { Customer } from '@/entities/customer.entity';
import { Order } from '@/entities/order.entity';
import { OrderDetail } from '@/entities/order-detail.entity';
import { ReturnRequest } from '@/entities/return-request.entity';
import { ReturnItem } from '@/entities/return-item.entity';
import { StockHistory } from '@/entities/stock-history.entity';

// ── enums ────────────────────────────────────────────────────────────────────
import { Gender } from '@libs/shared/enums/gender.enum';
import { Level } from '@libs/shared/enums/level.enum';
import { Status } from '@libs/shared/enums/employee-status.enum';
import { LeaveRequestStatus, LeaveRequestType } from '@libs/shared/enums/leave-request-status.enum';
import { ResignationStatus } from '@libs/shared/enums/resignation-status.enum';
import { OrderStatus } from '@libs/shared/enums/order-status.enum';
import { ReceiptStatus } from '@libs/shared/enums/receipt-status.enum';
import { ReturnStatus } from '@libs/shared/enums/return-status.enum';
import { SerialStatus } from '@libs/shared/enums/serial-status.enum';
import { CustomerTier } from '@libs/shared/enums/customer-tier.enum';
import { WarehouseType, StockChangeType } from '@libs/shared/enums/warehouse-type.enum';
import { UserStatus } from '@libs/shared/enums/user-status.enum';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class DataSeeder {
  private readonly logger = new Logger(DataSeeder.name);

  constructor(private readonly dataSource: DataSource) {}

  // ── helpers ────────────────────────────────────────────────────────────────
  private pick<T>(arr: T[]): T {
    return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
  }

  private pickN<T>(arr: T[], n: number): T[] {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
  }

  private pad(n: number, len = 4): string {
    return String(n).padStart(len, '0');
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // ── entry point ────────────────────────────────────────────────────────────
  async seed(): Promise<void> {
    const count = await this.dataSource.getRepository(Product).count();
    if (count > 1) {
      this.logger.log('⏭️  Data already seeded — skipping.');
      return;
    }

    faker.seed(2025);

    this.logger.log('🏢 Departments...');
    const depts = await this.seedDepartments();

    this.logger.log('💼 Positions...');
    const positions = await this.seedPositions();

    this.logger.log('👥 Employees...');
    const { employees, posMap } = await this.seedEmployees(depts, positions);

    this.logger.log('🔐 Roles...');
    const roles = await this.seedRoles();

    this.logger.log('👤 Users...');
    const users = await this.seedUsers(employees, roles, posMap, positions);

    this.logger.log('🔗 Linking employees → users...');
    await this.linkEmployees(employees, users);

    this.logger.log('📋 Job histories...');
    await this.seedJobHistories(employees, positions, depts, posMap);

    this.logger.log('🎉 Holidays...');
    await this.seedHolidays();

    this.logger.log('📅 Leave requests...');
    await this.seedLeaveRequests(employees, users);

    this.logger.log('📝 Resignation requests...');
    await this.seedResignationRequests(employees, users);

    this.logger.log('💰 Payslips...');
    await this.seedPayslips(employees, positions, posMap);

    this.logger.log('🏷️  Brands...');
    const brands = await this.seedBrands();

    this.logger.log('🏭 Suppliers...');
    const suppliers = await this.seedSuppliers();

    this.logger.log('📂 Categories...');
    const categories = await this.seedCategories();

    this.logger.log('📦 Products...');
    const products = await this.seedProducts(categories, brands);

    this.logger.log('🏪 Warehouses...');
    const warehouses = await this.seedWarehouses(employees, posMap, positions);

    this.logger.log('📊 Product stocks...');
    await this.seedProductStocks(products, warehouses);

    this.logger.log('📥 Import receipts...');
    const { savedReceipts, savedDetails } = await this.seedImportReceipts(warehouses, suppliers, users, products);

    this.logger.log('🔢 Product serials...');
    const { serialPool } = await this.seedProductSerials(products, warehouses, savedReceipts, savedDetails);

    this.logger.log('👨‍👩‍👧 Customers...');
    const customers = await this.seedCustomers();

    this.logger.log('🛒 Orders...');
    const { orders, soldSerialsMap } = await this.seedOrders(customers, users, products, posMap, positions, serialPool);

    this.logger.log('↩️  Return requests...');
    await this.seedReturnRequests(orders, customers, warehouses, users, products, soldSerialsMap);

    this.logger.log('📈 Stock histories...');
    await this.seedStockHistories(products, warehouses, users);

    this.logger.log('📊 Recalculating stock quantities...');
    await this.recalcStockQuantities(products, warehouses);

    this.logger.log('✅ Data seeding completed!');
  }

  // ── 1. Departments ─────────────────────────────────────────────────────────
  private async seedDepartments(): Promise<Department[]> {
    const repo = this.dataSource.getRepository(Department);
    const rows = [
      { name: 'Ban Giám đốc',    description: 'Điều hành và quản lý toàn bộ công ty' },
      { name: 'Phòng Kinh doanh', description: 'Quản lý bán hàng và chăm sóc khách hàng' },
      { name: 'Phòng Nhân sự',   description: 'Tuyển dụng và quản lý nhân sự' },
      { name: 'Phòng Kho vận',   description: 'Quản lý kho hàng và xuất nhập hàng hóa' },
      { name: 'Phòng IT',        description: 'Phát triển và duy trì hệ thống công nghệ' },
      { name: 'Phòng Kế toán',   description: 'Quản lý tài chính và kế toán' },
      { name: 'Phòng Marketing', description: 'Quảng bá thương hiệu và sản phẩm' },
      { name: 'Phòng Kỹ thuật',  description: 'Bảo hành, sửa chữa và hỗ trợ kỹ thuật' },
    ];
    const saved = await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${saved.length} departments`);
    return saved;
  }

  // ── 2. Positions ───────────────────────────────────────────────────────────
  private async seedPositions(): Promise<Position[]> {
    const repo = this.dataSource.getRepository(Position);
    const rows = [
      { name: 'Giám đốc điều hành',  description: 'CEO',                      baseSalary: 80_000_000 },
      { name: 'Phó Giám đốc',        description: 'Deputy Director',           baseSalary: 50_000_000 },
      { name: 'Trưởng phòng',        description: 'Department Head',           baseSalary: 30_000_000 },
      { name: 'Phó phòng',           description: 'Deputy Head',               baseSalary: 22_000_000 },
      { name: 'Chuyên viên cấp cao', description: 'Senior Specialist',         baseSalary: 18_000_000 },
      { name: 'Nhân viên kinh doanh', description: 'Sales Representative',     baseSalary: 10_000_000 },
      { name: 'Quản lý bán hàng',    description: 'Sales Manager',             baseSalary: 20_000_000 },
      { name: 'Nhân viên nhân sự',   description: 'HR Officer',                baseSalary: 10_000_000 },
      { name: 'Quản lý nhân sự',     description: 'HR Manager',                baseSalary: 20_000_000 },
      { name: 'Nhân viên kho',       description: 'Warehouse Operator',        baseSalary:  9_000_000 },
      { name: 'Quản lý kho',         description: 'Warehouse Manager',         baseSalary: 18_000_000 },
      { name: 'Nhân viên kế toán',   description: 'Accountant',                baseSalary: 11_000_000 },
      { name: 'Chuyên viên IT',      description: 'IT Specialist',             baseSalary: 16_000_000 },
      { name: 'Chuyên viên marketing', description: 'Marketing Specialist',    baseSalary: 12_000_000 },
      { name: 'Kỹ thuật viên',       description: 'Technician',                baseSalary: 11_000_000 },
    ];
    const saved = await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${saved.length} positions`);
    return saved;
  }

  // ── 3. Employees ───────────────────────────────────────────────────────────
  private async seedEmployees(
    depts: Department[],
    positions: Position[],
  ): Promise<{ employees: Employee[]; posMap: Map<string, string> }> {
    const repo = this.dataSource.getRepository(Employee);

    const [dBGD, dKD, dHR, dWH, dIT, dACC, dMKT, dTECH] = depts;
    const [pCEO, pVP, pHead, pDeputy, pSenior, pSalesStaff, pSalesMgr,
            pHRStaff, pHRMgr, pWHStaff, pWHMgr, pAcc, pIT, pMkt, pTech] = positions;

    // posMap: positionId → roleCode (used later for user seeding)
    const posMap = new Map<string, string>([
      [pCEO.id,       'ADMIN'],
      [pVP.id,        'ADMIN'],
      [pHead.id,      'ADMIN'],
      [pDeputy.id,    'ADMIN'],
      [pSenior.id,    'ADMIN'],
      [pSalesStaff.id,'SALES_STAFF'],
      [pSalesMgr.id,  'SALES_MANAGER'],
      [pHRStaff.id,   'HR_STAFF'],
      [pHRMgr.id,     'HR_MANAGER'],
      [pWHStaff.id,   'WH_STAFF'],
      [pWHMgr.id,     'WH_MANAGER'],
      [pAcc.id,       'ADMIN'],
      [pIT.id,        'ADMIN'],
      [pMkt.id,       'SALES_STAFF'],
      [pTech.id,      'WH_STAFF'],
    ]);

    // [department, position, level, howMany]
    type Slot = [Department, Position, Level, number];
    const slots: Slot[] = [
      // Ban Giám đốc (3)
      [dBGD, pCEO,    Level.C_LEVEL,  1],
      [dBGD, pVP,     Level.VP,       1],
      [dBGD, pDeputy, Level.DIRECTOR, 1],
      // Kinh doanh (13)
      [dKD, pSalesMgr,  Level.MANAGER, 1],
      [dKD, pDeputy,    Level.LEAD,    2],
      [dKD, pSalesStaff,Level.JUNIOR, 10],
      // Nhân sự (8)
      [dHR, pHRMgr,  Level.MANAGER, 1],
      [dHR, pDeputy, Level.LEAD,    1],
      [dHR, pHRStaff,Level.JUNIOR,  6],
      // Kho vận (12)
      [dWH, pWHMgr,   Level.MANAGER, 1],
      [dWH, pDeputy,  Level.LEAD,    1],
      [dWH, pWHStaff, Level.JUNIOR, 10],
      // IT (7)
      [dIT, pHead, Level.MANAGER, 1],
      [dIT, pIT,   Level.MID,     6],
      // Kế toán (6)
      [dACC, pHead, Level.MANAGER, 1],
      [dACC, pAcc,  Level.JUNIOR,  5],
      // Marketing (6)
      [dMKT, pHead, Level.MANAGER, 1],
      [dMKT, pMkt,  Level.MID,     5],
      // Kỹ thuật (5)
      [dTECH, pHead, Level.MANAGER, 1],
      [dTECH, pTech, Level.MID,     4],
    ];

    // Static Vietnamese name parts
    const lastNames  = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Đinh'];
    const midNames   = ['Thành', 'Thanh', 'Quang', 'Gia', 'Tiến', 'Như', 'Hoàng', 'Công', 'Đình', 'Xuân', 'Tấn', 'Kim', 'Thị'];
    const maleFirst  = ['Hùng', 'Dũng', 'Khoa', 'Bảo', 'Huy', 'Long', 'Phúc', 'Trọng', 'Nam', 'Tuấn', 'Minh', 'Đức', 'Tín', 'Đại', 'Kiên'];
    const femaleFirst= ['Ngọc', 'Thu', 'Mai', 'Lan', 'Hoa', 'Linh', 'Trang', 'An', 'Yên', 'Phương', 'Bích', 'Chi', 'Vy', 'Anh', 'Thảo'];
    const places     = ['Công an TP. Hồ Chí Minh', 'Công an TP. Hà Nội', 'Công an TP. Đà Nẵng', 'Cục CSQLHC về TTXH'];

    const rows: Partial<Employee>[] = [];
    let idx = 0;
    for (const [dept, pos, level, count] of slots) {
      for (let i = 0; i < count; i++) {
        idx++;
        const gender = Math.random() > 0.45 ? Gender.MALE : Gender.FEMALE;
        const first  = gender === Gender.MALE ? this.pick(maleFirst) : this.pick(femaleFirst);
        const fullName = `${this.pick(lastNames)} ${this.pick(midNames)} ${first}`;
        rows.push({
          employeeCode: `EMP-${this.pad(idx)}`,
          fullName,
          gender,
          dateOfBirth: faker.date.between({ from: '1975-01-01', to: '2000-12-31' }),
          phone: '0' + faker.number.int({ min: 300_000_000, max: 999_999_999 }),
          identityNumber: String(faker.number.int({ min: 100_000_000_000, max: 999_999_999_999 })),
          identityIssuedDate: faker.date.between({ from: '2015-01-01', to: '2022-06-01' }),
          identityIssuedPlace: this.pick(places),
          nationality: 'Việt Nam',
          addressPermanent: `${faker.location.streetAddress()}, TP. Hồ Chí Minh`,
          addressCurrent:   `${faker.location.streetAddress()}, TP. Hồ Chí Minh`,
          startDate: faker.date.between({ from: '2018-01-01', to: '2024-06-01' }),
          level,
          departmentId: dept.id,
          currentPositionId: pos.id,
          status: Status.ACTIVE,
          totalAnnualLeave: 12,
          usedAnnualLeave: faker.number.int({ min: 0, max: 8 }),
        });
      }
    }

    const saved = await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${saved.length} employees`);
    return { employees: saved, posMap };
  }

  // ── 4. Roles ───────────────────────────────────────────────────────────────
  private async seedRoles(): Promise<Role[]> {
    const permRepo = this.dataSource.getRepository(Permission);
    const roleRepo = this.dataSource.getRepository(Role);

    const allPerms = await permRepo.find();
    const byCode   = new Map(allPerms.map(p => [p.permission_code, p]));
    const get = (...codes: string[]) =>
      codes.map(c => byCode.get(c)).filter((p): p is Permission => !!p);

    const defs: Array<{ role_code: string; role_name: string; perms: Permission[] }> = [
      {
        role_code: 'ADMIN',
        role_name: 'Quản trị viên',
        perms: allPerms,
      },
      {
        role_code: 'SALES_STAFF',
        role_name: 'Nhân viên bán hàng',
        perms: get(
          'ORDER_CREATE', 'ORDER_VIEW',
          'CUSTOMER_CREATE', 'CUSTOMER_VIEW', 'CUSTOMER_UPDATE', 'CUSTOMER_DELETE',
          'PRODUCT_VIEW', 'PRODUCT_STOCK_VIEW',
          'RETURN_REQUEST_CREATE', 'RETURN_REQUEST_VIEW', 'RETURN_REQUEST_UPDATE',
          'ATTACHMENT_VIEW', 'ATTACHMENT_CREATE',
        ),
      },
      {
        role_code: 'SALES_MANAGER',
        role_name: 'Quản lí bán hàng',
        perms: get(
          'ORDER_CREATE', 'ORDER_VIEW', 'ORDER_UPDATE', 'ORDER_FULFILL',
          'CUSTOMER_CREATE', 'CUSTOMER_VIEW', 'CUSTOMER_UPDATE', 'CUSTOMER_DELETE',
          'PRODUCT_VIEW', 'PRODUCT_STOCK_VIEW',
          'RETURN_REQUEST_CREATE', 'RETURN_REQUEST_VIEW', 'RETURN_REQUEST_UPDATE',
          'SALES_STATISTIC_VIEW', 'SALES_REPORT_VIEW', 'ADMIN_STATISTIC_VIEW',
          'USER_VIEW', 'ATTACHMENT_VIEW', 'ATTACHMENT_CREATE', 'ATTACHMENT_UPDATE',
        ),
      },
      {
        role_code: 'HR_STAFF',
        role_name: 'Nhân viên nhân sự',
        perms: get(
          'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE',
          'DEPARTMENT_VIEW', 'POSITION_VIEW',
          'JOB_HISTORY_VIEW', 'JOB_HISTORY_CREATE', 'JOB_HISTORY_UPDATE',
          'LEAVE_REQUEST_VIEW', 'LEAVE_REQUEST_CREATE', 'LEAVE_REQUEST_UPDATE', 'LEAVE_REQUEST_APPROVE',
          'RESIGNATION_REQUEST_VIEW', 'RESIGNATION_REQUEST_UPDATE',
          'PAYSLIP_VIEW', 'PAYSLIP_CALCULATE',
          'HOLIDAY_VIEW', 'HOLIDAY_CREATE', 'HOLIDAY_UPDATE', 'HOLIDAY_DELETE',
          'ATTACHMENT_VIEW', 'ATTACHMENT_CREATE',
        ),
      },
      {
        role_code: 'HR_MANAGER',
        role_name: 'Quản lí nhân sự',
        perms: get(
          'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE',
          'DEPARTMENT_VIEW', 'DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE', 'DEPARTMENT_DELETE',
          'POSITION_VIEW',  'POSITION_CREATE',  'POSITION_UPDATE',  'POSITION_DELETE',
          'JOB_HISTORY_VIEW', 'JOB_HISTORY_CREATE', 'JOB_HISTORY_UPDATE', 'JOB_HISTORY_DELETE',
          'LEAVE_REQUEST_VIEW', 'LEAVE_REQUEST_CREATE', 'LEAVE_REQUEST_UPDATE', 'LEAVE_REQUEST_APPROVE',
          'RESIGNATION_REQUEST_VIEW', 'RESIGNATION_REQUEST_CREATE',
          'RESIGNATION_REQUEST_UPDATE', 'RESIGNATION_REQUEST_APPROVE',
          'PAYSLIP_VIEW', 'PAYSLIP_CALCULATE', 'PAYSLIP_GENERATE', 'PAYSLIP_MARK_PAID',
          'HOLIDAY_VIEW', 'HOLIDAY_CREATE', 'HOLIDAY_UPDATE', 'HOLIDAY_DELETE',
          'SYSTEM_SETTING_VIEW', 'SYSTEM_SETTING_UPDATE',
          'HR_STATISTIC_VIEW', 'HR_REPORT_VIEW',
          'USER_VIEW', 'USER_CREATE', 'USER_UPDATE',
          'ROLE_VIEW', 'PERMISSION_VIEW',
          'ATTACHMENT_VIEW', 'ATTACHMENT_CREATE', 'ATTACHMENT_UPDATE', 'ATTACHMENT_DELETE',
        ),
      },
      {
        role_code: 'WH_STAFF',
        role_name: 'Nhân viên kho',
        perms: get(
          'WAREHOUSE_VIEW',
          'PRODUCT_VIEW', 'PRODUCT_STOCK_VIEW',
          'IMPORT_RECEIPT_VIEW', 'IMPORT_RECEIPT_CREATE',
          'PRODUCT_SERIAL_VIEW', 'PRODUCT_SERIAL_CREATE', 'PRODUCT_SERIAL_UPDATE', 'PRODUCT_SERIAL_DELETE',
          'SUPPLIER_VIEW', 'BRAND_VIEW', 'CATEGORY_VIEW',
          'ATTACHMENT_VIEW', 'ATTACHMENT_CREATE',
        ),
      },
      {
        role_code: 'WH_MANAGER',
        role_name: 'Quản lý kho',
        perms: get(
          'WAREHOUSE_VIEW', 'WAREHOUSE_CREATE', 'WAREHOUSE_UPDATE', 'WAREHOUSE_DELETE',
          'PRODUCT_VIEW', 'PRODUCT_UPDATE',
          'PRODUCT_STOCK_VIEW', 'PRODUCT_STOCK_UPDATE',
          'IMPORT_RECEIPT_VIEW', 'IMPORT_RECEIPT_CREATE',
          'PRODUCT_SERIAL_VIEW', 'PRODUCT_SERIAL_CREATE',
          'PRODUCT_SERIAL_UPDATE', 'PRODUCT_SERIAL_DELETE',
          'SUPPLIER_VIEW', 'SUPPLIER_CREATE', 'SUPPLIER_UPDATE', 'SUPPLIER_DELETE',
          'BRAND_VIEW', 'CATEGORY_VIEW',
          'WAREHOUSE_REPORT_VIEW', 'USER_VIEW',
          'ATTACHMENT_VIEW', 'ATTACHMENT_CREATE', 'ATTACHMENT_UPDATE',
        ),
      },
    ];

    const saved: Role[] = [];
    for (const d of defs) {
      const exists = await roleRepo.findOne({ where: { role_code: d.role_code } });
      if (exists) { saved.push(exists); continue; }
      saved.push(await roleRepo.save(roleRepo.create({
        role_code: d.role_code,
        role_name: d.role_name,
        permissions: d.perms,
        isActive: true,
      })));
    }
    this.logger.log(`  ✅ ${saved.length} roles`);
    return saved;
  }

  // ── 5. Users ───────────────────────────────────────────────────────────────
  private async seedUsers(
    employees: Employee[],
    roles: Role[],
    posMap: Map<string, string>,
    positions: Position[],
  ): Promise<User[]> {
    const repo     = this.dataSource.getRepository(User);
    const roleMap  = new Map(roles.map(r => [r.role_code, r]));
    const HASH     = await bcrypt.hash('123456@', 10);

    const rows: Partial<User>[] = employees.map(emp => {
      const roleCode = posMap.get(emp.currentPositionId) ?? 'ADMIN';
      const normalised = emp.fullName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/\s+/g, '.');
      return {
        username:  emp.employeeCode,
        email:     `${normalised}@company.vn`,
        password:  HASH,
        roleCode,
        isActive:  true,
        status:    UserStatus.ACTIVE,
        lastLogin: faker.date.recent({ days: 30 }),
      };
    });

    const saved = await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${saved.length} users`);
    return saved;
  }

  // Link employee.userId after users are created
  private async linkEmployees(employees: Employee[], users: User[]): Promise<void> {
    const repo = this.dataSource.getRepository(Employee);
    const codeToUser = new Map(users.map(u => [u.username, u]));
    for (const emp of employees) {
      const u = codeToUser.get(emp.employeeCode);
      if (u) await repo.update(emp.id, { userId: u.id });
    }
  }

  // ── 6. Job histories ───────────────────────────────────────────────────────
  private async seedJobHistories(
    employees: Employee[],
    positions: Position[],
    depts: Department[],
    posMap: Map<string, string>,
  ): Promise<void> {
    const repo = this.dataSource.getRepository(JobHistory);
    const rows: Partial<JobHistory>[] = [];

    for (const emp of employees) {
      const pos = positions.find(p => p.id === emp.currentPositionId)!;
      // Current record
      rows.push({
        employeeId:   emp.id,
        positionId:   emp.currentPositionId,
        departmentId: emp.departmentId,
        startDate:    emp.startDate,
        endDate:      undefined,
        salaryAtTime: Number(pos.baseSalary),
        isCurrent:    true,
        note:         'Vị trí hiện tại',
      });
      // One past record for ~60% of employees
      if (Math.random() < 0.6) {
        const prevPos = this.pick(positions.filter(p => p.id !== emp.currentPositionId));
        const prevDept = this.pick(depts);
        const prevStart = faker.date.between({ from: '2015-01-01', to: new Date(emp.startDate.getTime() - 86400000 * 30) });
        const prevEnd   = new Date(emp.startDate.getTime() - 86400000 * faker.number.int({ min: 3, max: 30 }));
        rows.push({
          employeeId:   emp.id,
          positionId:   prevPos.id,
          departmentId: prevDept.id,
          startDate:    prevStart,
          endDate:      prevEnd,
          salaryAtTime: Number(prevPos.baseSalary) * faker.number.float({ min: 0.8, max: 1.0 }),
          isCurrent:    false,
          note:         'Vị trí trước đây',
        });
      }
    }

    await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${rows.length} job history records`);
  }

  // ── 7. Holidays ────────────────────────────────────────────────────────────
  private async seedHolidays(): Promise<void> {
    const repo = this.dataSource.getRepository(Holiday);
    const rows = [
      { date: '2026-01-01', name: 'Tết Dương lịch',               description: 'Nghỉ lễ theo quy định nhà nước' },
      { date: '2026-01-27', name: 'Tết Nguyên Đán (28 tháng Chạp)', description: 'Nghỉ Tết Nguyên Đán' },
      { date: '2026-01-28', name: 'Tết Nguyên Đán (29 tháng Chạp)', description: 'Nghỉ Tết Nguyên Đán' },
      { date: '2026-01-29', name: 'Tết Nguyên Đán (mùng 1)',       description: 'Nghỉ Tết Nguyên Đán' },
      { date: '2026-01-30', name: 'Tết Nguyên Đán (mùng 2)',       description: 'Nghỉ Tết Nguyên Đán' },
      { date: '2026-01-31', name: 'Tết Nguyên Đán (mùng 3)',       description: 'Nghỉ Tết Nguyên Đán' },
      { date: '2026-02-01', name: 'Tết Nguyên Đán (mùng 4)',       description: 'Nghỉ Tết Nguyên Đán' },
      { date: '2026-02-02', name: 'Tết Nguyên Đán (mùng 5)',       description: 'Nghỉ Tết Nguyên Đán' },
      { date: '2026-04-07', name: 'Giỗ tổ Hùng Vương',             description: '10/3 Âm lịch' },
      { date: '2026-04-30', name: 'Ngày Giải phóng miền Nam',      description: 'Nghỉ lễ 30/4' },
      { date: '2026-05-01', name: 'Ngày Quốc tế Lao động',         description: 'Nghỉ lễ 1/5' },
      { date: '2026-09-02', name: 'Ngày Quốc khánh',               description: 'Nghỉ lễ 2/9' },
      { date: '2026-09-03', name: 'Ngày Quốc khánh (bù)',          description: 'Nghỉ bù ngày Quốc khánh' },
      { date: '2026-12-25', name: 'Lễ Giáng sinh',                 description: 'Nghỉ nội bộ' },
    ];
    await repo.save(rows.map(r => repo.create({ ...r, date: new Date(r.date) })));
    this.logger.log(`  ✅ ${rows.length} holidays`);
  }

  // ── 8. Leave requests ──────────────────────────────────────────────────────
  private async seedLeaveRequests(employees: Employee[], users: User[]): Promise<void> {
    const repo     = this.dataSource.getRepository(LeaveRequest);
    const hrUsers  = users.filter(u => u.roleCode === 'HR_MANAGER' || u.roleCode === 'HR_STAFF');
    const types    = [LeaveRequestType.ANNUAL, LeaveRequestType.SICK, LeaveRequestType.UNPAID, LeaveRequestType.OTHER];
    const statuses = [LeaveRequestStatus.APPROVED, LeaveRequestStatus.APPROVED, LeaveRequestStatus.REJECTED, LeaveRequestStatus.PENDING];
    const reasons  = [
      'Nghỉ phép năm theo kế hoạch', 'Ốm đau, cần nghỉ dưỡng',
      'Việc gia đình đột xuất', 'Đi công tác kết hợp nghỉ phép',
      'Khám sức khỏe định kỳ', 'Nghỉ lễ cưới', 'Đi học nâng cao',
    ];
    const rows: Partial<LeaveRequest>[] = [];

    for (let i = 0; i < 80; i++) {
      const emp      = this.pick(employees);
      const startDate = faker.date.between({ from: '2025-06-01', to: '2026-02-28' });
      const days     = faker.number.int({ min: 1, max: 3 });
      const endDate  = this.addDays(startDate, days - 1);
      const status   = this.pick(statuses);
      const approver = status !== LeaveRequestStatus.PENDING ? this.pick(hrUsers) : null;
      rows.push({
        employeeId: emp.id,
        startDate,
        endDate,
        duration: days,
        type: this.pick(types),
        reason: this.pick(reasons),
        status,
        approverId: approver?.id ?? undefined,
        rejectionReason: status === LeaveRequestStatus.REJECTED ? 'Chưa đủ điều kiện' : undefined,
      });
    }

    await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${rows.length} leave requests`);
  }

  // ── 9. Resignation requests ────────────────────────────────────────────────
  private async seedResignationRequests(employees: Employee[], users: User[]): Promise<void> {
    const repo     = this.dataSource.getRepository(ResignationRequest);
    const hrMgrs   = users.filter(u => u.roleCode === 'HR_MANAGER');
    const reasons  = [
      'Chuyển sang công ty khác với mức lương tốt hơn',
      'Lý do gia đình cá nhân',
      'Muốn thay đổi lĩnh vực công việc',
      'Theo chồng/vợ định cư ở nơi khác',
      'Cần nghỉ ngơi và định hướng lại sự nghiệp',
    ];
    const rows: Partial<ResignationRequest>[] = [];

    // Pick 15 random employees to resign
    const resigned = this.pickN(employees, 15);
    for (const emp of resigned) {
      const submitDate     = faker.date.between({ from: '2025-01-01', to: '2025-12-01' });
      const desiredLastDay = this.addDays(submitDate, faker.number.int({ min: 30, max: 60 }));
      const status         = this.pick([ResignationStatus.COMPLETED, ResignationStatus.APPROVED, ResignationStatus.PENDING, ResignationStatus.REJECTED]);
      const approver       = status !== ResignationStatus.PENDING ? this.pick(hrMgrs) : null;
      rows.push({
        employeeId:      emp.id,
        submitDate,
        desiredLastDay,
        approvedLastDay: status === ResignationStatus.COMPLETED ? this.addDays(desiredLastDay, faker.number.int({ min: -5, max: 5 })) : undefined,
        reason:          this.pick(reasons),
        status,
        approverId:      approver?.id ?? undefined,
        handoverNote:    'https://docs.google.com/document/bàngiao-' + emp.employeeCode,
        hrNote:          status === ResignationStatus.COMPLETED ? 'Hoàn tất bàn giao, thủ tục đã xử lý.' : undefined,
      });
    }

    await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${rows.length} resignation requests`);
  }

  // ── 10. Payslips ───────────────────────────────────────────────────────────
  private async seedPayslips(
    employees: Employee[],
    positions: Position[],
    posMap: Map<string, string>,
  ): Promise<void> {
    const repo = this.dataSource.getRepository(Payslip);

    const today    = new Date();
    const months   = [
      { month: today.getMonth() - 2 < 1 ? today.getMonth() + 10 : today.getMonth() - 1, year: today.getMonth() - 2 < 1 ? today.getFullYear() - 1 : today.getFullYear() },
      { month: today.getMonth() < 1 ? 12 : today.getMonth(),       year: today.getMonth() < 1 ? today.getFullYear() - 1 : today.getFullYear() },
      { month: today.getMonth() + 1,  year: today.getFullYear() },
    ];

    const rows: Partial<Payslip>[] = [];
    for (const emp of employees) {
      const pos = positions.find(p => p.id === emp.currentPositionId);
      const base = pos ? Number(pos.baseSalary) : 10_000_000;

      for (const { month, year } of months) {
        const unpaid       = faker.number.int({ min: 0, max: 2 });
        const standardDays = 26;
        const actualDays   = standardDays - unpaid;
        const lunch        = 730_000;
        const transport    = 500_000;
        const insurance    = Math.round(base * 0.105);
        const gross        = Math.round((base / standardDays) * actualDays) + lunch + transport;
        const finalSalary  = gross - insurance;

        rows.push({
          employeeId:      emp.id,
          month,
          year,
          baseSalary:      base,
          standardWorkDays: standardDays,
          actualWorkDays:   actualDays,
          unpaidLeaveDays:  unpaid,
          finalSalary,
          isPaid:           month < today.getMonth() + 1,
          details: { lunch, transport, insurance, gross },
        });
      }
    }

    await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${rows.length} payslips (${employees.length} employees × 3 months)`);
  }

  // ── 11. Brands ─────────────────────────────────────────────────────────────
  private async seedBrands(): Promise<Brand[]> {
    const repo = this.dataSource.getRepository(Brand);
    const names = [
      'Intel', 'AMD', 'NVIDIA', 'Samsung', 'Corsair', 'Kingston', 'Crucial', 'G.Skill',
      'ASUS', 'MSI', 'Gigabyte', 'ASRock', 'Western Digital', 'Seagate', 'LG',
      'Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'Xiaomi', 'Sony',
      'Logitech', 'Razer', 'SteelSeries',
    ];
    const saved = await repo.save(names.map(name => repo.create({ name, isActive: true })));
    this.logger.log(`  ✅ ${saved.length} brands`);
    return saved;
  }

  // ── 12. Suppliers ──────────────────────────────────────────────────────────
  private async seedSuppliers(): Promise<Supplier[]> {
    const repo = this.dataSource.getRepository(Supplier);
    const rows = [
      { name: 'Công ty TNHH Phân phối FPT',          contactPhone: '0281234567', address: '285 Cách Mạng Tháng 8, Q.10, TP.HCM' },
      { name: 'CTCP Thế Giới Di Động Distribution',  contactPhone: '0282345678', address: '128 Trần Quang Khải, Q.1, TP.HCM' },
      { name: 'Công ty TNHH Synnex FPT',              contactPhone: '0283456789', address: '191 Bà Triệu, Hai Bà Trưng, Hà Nội' },
      { name: 'CTCP Công nghệ An Phát Holdings',      contactPhone: '0284567890', address: '391 Nguyễn Kiệm, PN, TP.HCM' },
      { name: 'Công ty TNHH Intel Việt Nam',          contactPhone: '0285678901', address: 'HEPZA, Bình Chánh, TP.HCM' },
      { name: 'CTCP Phân phối MSI Việt Nam',          contactPhone: '0286789012', address: '15 Lý Thường Kiệt, Q.5, TP.HCM' },
      { name: 'Công ty TNHH Samsung Electronics VN', contactPhone: '0287890123', address: 'KCN Yên Phong, Bắc Ninh' },
      { name: 'CTCP Thiên Nam Computer',              contactPhone: '0288901234', address: '234 Điện Biên Phủ, BT, TP.HCM' },
      { name: 'Công ty TNHH Western Digital VN',     contactPhone: '0289012345', address: 'Khu CNC Hòa Lạc, Hà Nội' },
      { name: 'CTCP Phân phối Corsair APAC',          contactPhone: '0290123456', address: 'Tòa nhà Phú Mỹ Hưng, Q.7, TP.HCM' },
      { name: 'Công ty TNHH LG Electronics VN',      contactPhone: '0291234567', address: 'KCN Tràng Duệ, Hải Phòng' },
      { name: 'CTCP Phân phối Logitech VN',           contactPhone: '0292345678', address: '45 Nguyễn Huệ, Q.1, TP.HCM' },
      { name: 'Công ty TNHH ASUS Technology VN',     contactPhone: '0293456789', address: '99 Nguyễn Đình Chiểu, Q.3, TP.HCM' },
      { name: 'CTCP Lenovo Vietnam',                  contactPhone: '0294567890', address: '25F, Keangnam, Từ Liêm, Hà Nội' },
      { name: 'Công ty TNHH AMD Vietnam',             contactPhone: '0295678901', address: 'Tòa nhà TNR, Q.1, TP.HCM' },
      { name: 'CTCP Gigabyte Technology VN',          contactPhone: '0296789012', address: '72 Lê Thánh Tôn, Q.1, TP.HCM' },
      { name: 'Công ty TNHH Kingston Vietnam',        contactPhone: '0297890123', address: 'VSIP 2, Bình Dương' },
      { name: 'CTCP Phân phối Seagate ASEAN',         contactPhone: '0298901234', address: 'Office Park, Tân Bình, TP.HCM' },
      { name: 'Công ty TNHH Razer Asia-Pacific',     contactPhone: '0299012345', address: 'Tòa nhà Bitexco, Q.1, TP.HCM' },
      { name: 'CTCP Công nghệ Hoàng Long',            contactPhone: '0280123456', address: '56 Phan Xích Long, PN, TP.HCM' },
    ];
    const saved = await repo.save(rows.map(r => repo.create({ ...r, isActive: true })));
    this.logger.log(`  ✅ ${saved.length} suppliers`);
    return saved;
  }

  // ── 13. Categories ─────────────────────────────────────────────────────────
  private async seedCategories(): Promise<Category[]> {
    const repo = this.dataSource.getRepository(Category);

    // Parent categories first
    const parents = await repo.save([
      { name: 'CPU (Bộ vi xử lý)' },
      { name: 'RAM (Bộ nhớ)' },
      { name: 'VGA (Card màn hình)' },
      { name: 'Mainboard (Bo mạch chủ)' },
      { name: 'Ổ cứng' },
      { name: 'Laptop' },
      { name: 'Điện thoại' },
      { name: 'Màn hình' },
      { name: 'Thiết bị ngoại vi' },
      { name: 'Phụ kiện & Linh kiện' },
    ].map(r => repo.create({ ...r, isActive: true })));

    const [cCPU, cRAM, cVGA, cMB, cStorage, cLaptop, cPhone, cMonitor, cPeripheral, cAccessory] = parents;

    // Child categories
    const children = await repo.save([
      { name: 'CPU Intel',        parentId: cCPU.id },
      { name: 'CPU AMD',          parentId: cCPU.id },
      { name: 'RAM DDR4',         parentId: cRAM.id },
      { name: 'RAM DDR5',         parentId: cRAM.id },
      { name: 'SSD',              parentId: cStorage.id },
      { name: 'HDD',              parentId: cStorage.id },
      { name: 'NVMe SSD',         parentId: cStorage.id },
      { name: 'VGA NVIDIA',       parentId: cVGA.id },
      { name: 'VGA AMD Radeon',   parentId: cVGA.id },
      { name: 'Chuột',            parentId: cPeripheral.id },
      { name: 'Bàn phím',         parentId: cPeripheral.id },
      { name: 'Tai nghe & Loa',   parentId: cPeripheral.id },
      { name: 'Cáp & Hub USB',    parentId: cAccessory.id },
      { name: 'Tản nhiệt',        parentId: cAccessory.id },
      { name: 'Case máy tính',    parentId: cAccessory.id },
    ].map(r => repo.create({ ...r, isActive: true })));

    const all = [...parents, ...children];
    this.logger.log(`  ✅ ${all.length} categories`);
    return all;
  }

  // ── 14. Products ───────────────────────────────────────────────────────────
  private async seedProducts(categories: Category[], brands: Brand[]): Promise<Product[]> {
    const repo = this.dataSource.getRepository(Product);
    const byName = (n: string) => brands.find(b => b.name === n) ?? brands[0];
    const catByName = (n: string) => categories.find(c => c.name === n) ?? categories[0];

    const defs: Array<Partial<Product>> = [
      // CPUs
      { sku: 'CPU-I9-14900K',   name: 'Intel Core i9-14900K',      categoryId: catByName('CPU Intel').id,       brandId: byName('Intel').id,   retailPrice: 13_500_000, warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { socket: 'LGA1700', cores: 24, threads: 32, tdp: '125W' } },
      { sku: 'CPU-I7-14700K',   name: 'Intel Core i7-14700K',      categoryId: catByName('CPU Intel').id,       brandId: byName('Intel').id,   retailPrice: 9_800_000,  warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { socket: 'LGA1700', cores: 20, threads: 28, tdp: '125W' } },
      { sku: 'CPU-I5-14600K',   name: 'Intel Core i5-14600K',      categoryId: catByName('CPU Intel').id,       brandId: byName('Intel').id,   retailPrice: 7_200_000,  warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { socket: 'LGA1700', cores: 14, threads: 20, tdp: '125W' } },
      { sku: 'CPU-I5-13400F',   name: 'Intel Core i5-13400F',      categoryId: catByName('CPU Intel').id,       brandId: byName('Intel').id,   retailPrice: 4_900_000,  warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { socket: 'LGA1700', cores: 10, threads: 16, tdp: '65W' } },
      { sku: 'CPU-R9-7950X',    name: 'AMD Ryzen 9 7950X',         categoryId: catByName('CPU AMD').id,         brandId: byName('AMD').id,     retailPrice: 16_500_000, warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { socket: 'AM5', cores: 16, threads: 32, tdp: '170W' } },
      { sku: 'CPU-R7-7700X',    name: 'AMD Ryzen 7 7700X',         categoryId: catByName('CPU AMD').id,         brandId: byName('AMD').id,     retailPrice: 7_800_000,  warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { socket: 'AM5', cores: 8,  threads: 16, tdp: '105W' } },
      { sku: 'CPU-R5-7600X',    name: 'AMD Ryzen 5 7600X',         categoryId: catByName('CPU AMD').id,         brandId: byName('AMD').id,     retailPrice: 5_500_000,  warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { socket: 'AM5', cores: 6,  threads: 12, tdp: '105W' } },
      // RAMs
      { sku: 'RAM-COR-DDR5-32',  name: 'Corsair Vengeance DDR5 32GB 6000MHz', categoryId: catByName('RAM DDR5').id, brandId: byName('Corsair').id, retailPrice: 3_800_000, warrantyMonths: 'Vĩnh viễn', hasSerialNumber: false, specifications: { capacity: '32GB', speed: '6000MHz', type: 'DDR5' } },
      { sku: 'RAM-GS-DDR5-32',   name: 'G.Skill Trident Z5 RGB DDR5 32GB',  categoryId: catByName('RAM DDR5').id, brandId: byName('G.Skill').id,  retailPrice: 4_200_000, warrantyMonths: 'Vĩnh viễn', hasSerialNumber: false, specifications: { capacity: '32GB', speed: '6400MHz', type: 'DDR5' } },
      { sku: 'RAM-KIN-DDR4-16',  name: 'Kingston Fury Beast DDR4 16GB 3200', categoryId: catByName('RAM DDR4').id, brandId: byName('Kingston').id, retailPrice: 1_350_000, warrantyMonths: 'Vĩnh viễn', hasSerialNumber: false, specifications: { capacity: '16GB', speed: '3200MHz', type: 'DDR4' } },
      { sku: 'RAM-CRU-DDR4-32',  name: 'Crucial Ballistix DDR4 32GB 3600',  categoryId: catByName('RAM DDR4').id, brandId: byName('Crucial').id,  retailPrice: 2_100_000, warrantyMonths: 'Vĩnh viễn', hasSerialNumber: false, specifications: { capacity: '32GB', speed: '3600MHz', type: 'DDR4' } },
      // VGAs
      { sku: 'VGA-RTX-4090',     name: 'ASUS ROG Strix RTX 4090 24GB',       categoryId: catByName('VGA NVIDIA').id, brandId: byName('ASUS').id,   retailPrice: 42_000_000, warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { vram: '24GB GDDR6X', tdp: '450W', outputs: '3xDP+1xHDMI' } },
      { sku: 'VGA-RTX-4080S',    name: 'MSI Gaming X Trio RTX 4080 Super',   categoryId: catByName('VGA NVIDIA').id, brandId: byName('MSI').id,    retailPrice: 24_500_000, warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { vram: '16GB GDDR6X', tdp: '320W' } },
      { sku: 'VGA-RTX-4070',     name: 'Gigabyte Eagle OC RTX 4070',         categoryId: catByName('VGA NVIDIA').id, brandId: byName('Gigabyte').id, retailPrice: 15_200_000, warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { vram: '12GB GDDR6X', tdp: '200W' } },
      { sku: 'VGA-RX-7900XTX',   name: 'Sapphire NITRO+ RX 7900 XTX',       categoryId: catByName('VGA AMD Radeon').id, brandId: byName('AMD').id, retailPrice: 26_000_000, warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { vram: '24GB GDDR6', tdp: '355W' } },
      { sku: 'VGA-RTX-4060Ti',   name: 'ASUS Dual RTX 4060 Ti 16GB',        categoryId: catByName('VGA NVIDIA').id, brandId: byName('ASUS').id,   retailPrice: 11_500_000, warrantyMonths: '36 tháng', hasSerialNumber: true,  specifications: { vram: '16GB GDDR6', tdp: '165W' } },
      // Mainboards
      { sku: 'MB-ASUS-Z790',     name: 'ASUS ROG Maximus Z790 Hero',         categoryId: catByName('Mainboard (Bo mạch chủ)').id, brandId: byName('ASUS').id,    retailPrice: 14_800_000, warrantyMonths: '36 tháng', hasSerialNumber: false, specifications: { socket: 'LGA1700', chipset: 'Z790', formfactor: 'ATX' } },
      { sku: 'MB-MSI-B760',      name: 'MSI MAG B760 Tomahawk WiFi',         categoryId: catByName('Mainboard (Bo mạch chủ)').id, brandId: byName('MSI').id,     retailPrice: 5_500_000,  warrantyMonths: '36 tháng', hasSerialNumber: false, specifications: { socket: 'LGA1700', chipset: 'B760', formfactor: 'ATX' } },
      { sku: 'MB-GIG-X670E',     name: 'Gigabyte AORUS X670E Master',        categoryId: catByName('Mainboard (Bo mạch chủ)').id, brandId: byName('Gigabyte').id, retailPrice: 12_500_000, warrantyMonths: '36 tháng', hasSerialNumber: false, specifications: { socket: 'AM5', chipset: 'X670E', formfactor: 'E-ATX' } },
      // SSDs
      { sku: 'SSD-SAM-990P-2T',  name: 'Samsung 990 Pro NVMe 2TB',          categoryId: catByName('NVMe SSD').id,   brandId: byName('Samsung').id, retailPrice: 3_900_000, warrantyMonths: '60 tháng', hasSerialNumber: false, specifications: { capacity: '2TB', read: '7450 MB/s', write: '6900 MB/s', interface: 'PCIe 4.0 x4' } },
      { sku: 'SSD-SAM-870-1T',   name: 'Samsung 870 EVO SATA 1TB',          categoryId: catByName('SSD').id,        brandId: byName('Samsung').id, retailPrice: 2_100_000, warrantyMonths: '60 tháng', hasSerialNumber: false, specifications: { capacity: '1TB', read: '560 MB/s', write: '530 MB/s', interface: 'SATA 3' } },
      { sku: 'SSD-WD-SN850X-1T', name: 'WD Black SN850X NVMe 1TB',          categoryId: catByName('NVMe SSD').id,   brandId: byName('Western Digital').id, retailPrice: 2_500_000, warrantyMonths: '60 tháng', hasSerialNumber: false, specifications: { capacity: '1TB', read: '7300 MB/s', write: '6600 MB/s', interface: 'PCIe 4.0 x4' } },
      // HDDs
      { sku: 'HDD-SEA-4T',       name: 'Seagate Barracuda 4TB 5400RPM',     categoryId: catByName('HDD').id,        brandId: byName('Seagate').id, retailPrice: 2_800_000, warrantyMonths: '24 tháng', hasSerialNumber: false, specifications: { capacity: '4TB', rpm: '5400', cache: '256MB', interface: 'SATA 3' } },
      { sku: 'HDD-WD-2T',        name: 'WD Blue 2TB 7200RPM',               categoryId: catByName('HDD').id,        brandId: byName('Western Digital').id, retailPrice: 1_800_000, warrantyMonths: '24 tháng', hasSerialNumber: false, specifications: { capacity: '2TB', rpm: '7200', cache: '256MB', interface: 'SATA 3' } },
      // Laptops
      { sku: 'LT-ASUS-GU604',    name: 'ASUS ROG Zephyrus G16 RTX 4090',   categoryId: catByName('Laptop').id,     brandId: byName('ASUS').id,   retailPrice: 85_000_000, warrantyMonths: '24 tháng', hasSerialNumber: true,  specifications: { cpu: 'Core i9-13980HX', ram: '32GB', ssd: '2TB', display: '16" QHD+ 240Hz' } },
      { sku: 'LT-DELL-XPS15',    name: 'Dell XPS 15 9530 Core i7',          categoryId: catByName('Laptop').id,     brandId: byName('Dell').id,   retailPrice: 52_000_000, warrantyMonths: '12 tháng', hasSerialNumber: true,  specifications: { cpu: 'Core i7-13700H', ram: '16GB', ssd: '512GB', display: '15.6" OLED 3.5K' } },
      { sku: 'LT-LENOVO-X1C',    name: 'Lenovo ThinkPad X1 Carbon Gen 11',  categoryId: catByName('Laptop').id,     brandId: byName('Lenovo').id, retailPrice: 48_000_000, warrantyMonths: '12 tháng', hasSerialNumber: true,  specifications: { cpu: 'Core i7-1365U', ram: '32GB', ssd: '1TB', display: '14" IPS 2K' } },
      { sku: 'LT-APPLE-MBP14',   name: 'Apple MacBook Pro 14" M3 Pro',      categoryId: catByName('Laptop').id,     brandId: byName('Apple').id,  retailPrice: 62_000_000, warrantyMonths: '12 tháng', hasSerialNumber: true,  specifications: { cpu: 'M3 Pro', ram: '18GB', ssd: '512GB', display: '14.2" Liquid Retina XDR' } },
      { sku: 'LT-HP-ENVY16',     name: 'HP Envy 16 RTX 4060',               categoryId: catByName('Laptop').id,     brandId: byName('HP').id,     retailPrice: 35_000_000, warrantyMonths: '12 tháng', hasSerialNumber: true,  specifications: { cpu: 'Core i9-13900H', ram: '32GB', ssd: '1TB', display: '16" 120Hz' } },
      // Monitors
      { sku: 'MON-LG-27GP950',   name: 'LG 27GP950 UHD 4K 144Hz IPS',      categoryId: catByName('Màn hình').id,   brandId: byName('LG').id,     retailPrice: 18_500_000, warrantyMonths: '36 tháng', hasSerialNumber: false, specifications: { size: '27"', resolution: '4K UHD', refresh: '144Hz', panel: 'IPS' } },
      { sku: 'MON-SAM-LS32',     name: 'Samsung 32" QD-OLED 240Hz',         categoryId: catByName('Màn hình').id,   brandId: byName('Samsung').id, retailPrice: 22_000_000, warrantyMonths: '36 tháng', hasSerialNumber: false, specifications: { size: '32"', resolution: '2560x1440', refresh: '240Hz', panel: 'QD-OLED' } },
      { sku: 'MON-ASUS-27IN',    name: 'ASUS ProArt PA278CGV 27" IPS 165Hz', categoryId: catByName('Màn hình').id, brandId: byName('ASUS').id,   retailPrice: 12_000_000, warrantyMonths: '36 tháng', hasSerialNumber: false, specifications: { size: '27"', resolution: '2560x1440', refresh: '165Hz', panel: 'IPS' } },
      // Peripherals
      { sku: 'MOUSE-LOG-G502X',  name: 'Logitech G502 X Plus Wireless',     categoryId: catByName('Chuột').id,      brandId: byName('Logitech').id, retailPrice: 2_850_000, warrantyMonths: '24 tháng', hasSerialNumber: false, specifications: { sensor: 'HERO 25K', dpi: '25600', connection: 'Wireless 2.4GHz' } },
      { sku: 'MOUSE-RAZ-V3',     name: 'Razer DeathAdder V3 Pro',           categoryId: catByName('Chuột').id,      brandId: byName('Razer').id,   retailPrice: 3_200_000, warrantyMonths: '24 tháng', hasSerialNumber: false, specifications: { sensor: 'Focus Pro 30K', dpi: '30000', connection: 'HyperSpeed Wireless' } },
      { sku: 'KB-LOG-G915',      name: 'Logitech G915 TKL Wireless',        categoryId: catByName('Bàn phím').id,   brandId: byName('Logitech').id, retailPrice: 4_500_000, warrantyMonths: '24 tháng', hasSerialNumber: false, specifications: { switch: 'GL Tactile', layout: 'TKL', connection: 'Wireless' } },
      { sku: 'KB-RAZ-HUNT',      name: 'Razer Huntsman V2 TKL',             categoryId: catByName('Bàn phím').id,   brandId: byName('Razer').id,   retailPrice: 3_800_000, warrantyMonths: '24 tháng', hasSerialNumber: false, specifications: { switch: 'Red Optical', layout: 'TKL', connection: 'USB' } },
      { sku: 'HS-SONY-WH1000XM5', name: 'Sony WH-1000XM5 Wireless ANC',    categoryId: catByName('Tai nghe & Loa').id, brandId: byName('Sony').id, retailPrice: 8_500_000, warrantyMonths: '12 tháng', hasSerialNumber: false, specifications: { driver: '30mm', anc: 'Yes', battery: '30h', connection: 'Bluetooth 5.2' } },
      // Accessories
      { sku: 'COOL-CORSAIR-H150', name: 'Corsair iCUE H150i Elite 360mm AIO', categoryId: catByName('Tản nhiệt').id, brandId: byName('Corsair').id, retailPrice: 6_200_000, warrantyMonths: '60 tháng', hasSerialNumber: false, specifications: { radiator: '360mm', pump: 'Xylem D5', rgb: 'Yes' } },
      { sku: 'CASE-CORSAIR-7000D', name: 'Corsair 7000D AIRFLOW Full Tower', categoryId: catByName('Case máy tính').id, brandId: byName('Corsair').id, retailPrice: 5_800_000, warrantyMonths: '24 tháng', hasSerialNumber: false, specifications: { formfactor: 'E-ATX', drives: '6 HDD + 4 SSD', fans: '3x120mm' } },
    ];

    const saved = await repo.save(defs.map(d => repo.create({ ...d, stockQuantity: 0, isActive: true, specifications: d.specifications ?? {} })));
    this.logger.log(`  ✅ ${saved.length} products`);
    return saved;
  }

  // ── 15. Warehouses ─────────────────────────────────────────────────────────
  private async seedWarehouses(
    employees: Employee[],
    posMap: Map<string, string>,
    positions: Position[],
  ): Promise<Warehouse[]> {
    const repo = this.dataSource.getRepository(Warehouse);

    // Warehouse managers = employees with WH_MANAGER or WH_STAFF role who have positionId = Quản lý kho
    const whManagers = employees.filter(e => posMap.get(e.currentPositionId) === 'WH_MANAGER');
    const getManager = (i: number) => whManagers[i % whManagers.length];

    const rows: Partial<Warehouse>[] = [
      { code: 'WH-HCM-01', name: 'Kho Tổng TP. Hồ Chí Minh',   address: 'Lô B5, KCN Tân Bình, Q. Tân Bình, TP.HCM',         type: WarehouseType.CENTRAL, manager: getManager(0), isActive: true },
      { code: 'WH-HN-01',  name: 'Kho Chi Nhánh Hà Nội',        address: 'KCN Sài Đồng, Long Biên, Hà Nội',                  type: WarehouseType.STORE,   manager: getManager(1), isActive: true },
      { code: 'WH-HCM-02', name: 'Cửa Hàng Trưng Bày HCM',     address: 'Tầng 1, 285 Cách Mạng Tháng 8, Q.10, TP.HCM',     type: WarehouseType.STORE,   manager: getManager(2 % whManagers.length), isActive: true },
      { code: 'WH-TECH-01', name: 'Kho Kỹ Thuật & Bảo Hành',   address: '45 Đinh Tiên Hoàng, Q. Bình Thạnh, TP.HCM',        type: WarehouseType.DAMAGED, manager: getManager(0), isActive: true },
    ];

    const saved = await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${saved.length} warehouses`);
    return saved;
  }

  // ── 16. Product stocks ─────────────────────────────────────────────────────
  private async seedProductStocks(products: Product[], warehouses: Warehouse[]): Promise<void> {
    const repo  = this.dataSource.getRepository(ProductStock);
    const rows: Partial<ProductStock>[] = [];

    // Main warehouse: all products
    // Store warehouses: ~70% of products
    // Damaged warehouse: only ~10% (returned/defective items)
    for (const product of products) {
      for (const wh of warehouses) {
        const isDamaged = wh.type === WarehouseType.DAMAGED;
        const isStore   = wh.type === WarehouseType.STORE;

        if (isDamaged && Math.random() > 0.15) continue;
        if (isStore   && Math.random() > 0.7)  continue;

        const qty = isDamaged
          ? faker.number.int({ min: 0, max: 5 })
          : faker.number.int({ min: 5, max: 80 });

        rows.push({
          productId:    product.id,
          warehouseId:  wh.id,
          quantity:     qty,
          minStockLevel: faker.number.int({ min: 3, max: 15 }),
        });
      }
    }

    await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${rows.length} product stocks`);
  }

  // ── 17. Import receipts ────────────────────────────────────────────────────
  private async seedImportReceipts(
    warehouses: Warehouse[],
    suppliers: Supplier[],
    users: User[],
    products: Product[],
  ): Promise<{ savedReceipts: ImportReceipt[]; savedDetails: ImportDetail[] }> {
    const receiptRepo = this.dataSource.getRepository(ImportReceipt);
    const detailRepo  = this.dataSource.getRepository(ImportDetail);

    const whUsers    = users.filter(u => u.roleCode === 'WH_MANAGER' || u.roleCode === 'WH_STAFF');
    const mainWh     = warehouses.find(w => w.type === WarehouseType.CENTRAL) ?? warehouses[0];
    const statuses   = [ReceiptStatus.COMPLETED, ReceiptStatus.COMPLETED, ReceiptStatus.PENDING, ReceiptStatus.CANCELLED];

    let receiptIdx = 1;
    const receipts: Partial<ImportReceipt>[] = [];
    const details:  Partial<ImportDetail>[]  = [];
    const receiptToProducts: Array<{ receiptIdx: number; productIds: string[]; qtys: number[]; prices: number[] }> = [];

    for (let i = 0; i < 30; i++) {
      const date     = faker.date.between({ from: '2025-06-01', to: '2026-02-15' });
      const month    = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const code     = `PN-${month}-${this.pad(receiptIdx++, 3)}`;
      const supplier = this.pick(suppliers);
      const creator  = this.pick(whUsers);
      const wh       = i < 20 ? mainWh : this.pick(warehouses.filter(w => w.type !== WarehouseType.DAMAGED));
      const status   = this.pick(statuses);

      // 3-8 products per receipt
      const picked   = this.pickN(products, faker.number.int({ min: 3, max: 8 }));
      const qtys     = picked.map(() => faker.number.int({ min: 5, max: 30 }));
      const prices   = picked.map(p => Math.round(Number(p.retailPrice) * faker.number.float({ min: 0.6, max: 0.75 })));
      const total    = picked.reduce((s, _, j) => s + qtys[j] * prices[j], 0);

      receipts.push({
        code, warehouseId: wh.id, supplierId: supplier.id,
        createdBy: creator.id, totalPrice: total,
        status, note: `Nhập hàng từ ${supplier.name}`, isActive: true,
      });

      receiptToProducts.push({ receiptIdx: receipts.length - 1, productIds: picked.map(p => p.id), qtys, prices });
    }

    const savedReceipts = await receiptRepo.save(receipts.map(r => receiptRepo.create(r)));

    for (const mapping of receiptToProducts) {
      const receipt = savedReceipts[mapping.receiptIdx];
      for (let j = 0; j < mapping.productIds.length; j++) {
        details.push({
          receiptId: receipt.id,
          productId: mapping.productIds[j],
          quantity:  mapping.qtys[j],
          unitPrice: mapping.prices[j],
          amount:    mapping.qtys[j] * mapping.prices[j],
          scannedSerials: undefined,
        });
      }
    }

    const savedDetails = await detailRepo.save(details.map(d => detailRepo.create(d)));
    this.logger.log(`  ✅ ${savedReceipts.length} import receipts, ${savedDetails.length} import details`);
    return { savedReceipts, savedDetails };
  }

  // ── 18. Product serials ────────────────────────────────────────────────────
  private async seedProductSerials(
    products: Product[],
    warehouses: Warehouse[],
    savedReceipts: ImportReceipt[],
    savedDetails: ImportDetail[],
  ): Promise<{ serialPool: Map<string, Array<{ serialNumber: string; warehouseId: string }>> }> {
    const repo       = this.dataSource.getRepository(ProductSerial);
    const detailRepo = this.dataSource.getRepository(ImportDetail);

    const serialProducts = products.filter(p => p.hasSerialNumber);
    const mainWh         = warehouses.find(w => w.type === WarehouseType.CENTRAL) ?? warehouses[0];
    const storeWhs       = warehouses.filter(w => w.type === WarehouseType.STORE);
    const damagedWh      = warehouses.find(w => w.type === WarehouseType.DAMAGED) ?? mainWh;

    const completedIds = new Set(savedReceipts.filter(r => r.status === ReceiptStatus.COMPLETED).map(r => r.id));

    // productId → list of { detail, receipt } for COMPLETED receipts that contain serial products
    const detailsByProduct = new Map<string, Array<{ detail: ImportDetail; receipt: ImportReceipt }>>();
    for (const detail of savedDetails) {
      if (!completedIds.has(detail.receiptId)) continue;
      if (!serialProducts.find(p => p.id === detail.productId)) continue;
      const receipt = savedReceipts.find(r => r.id === detail.receiptId)!;
      if (!detailsByProduct.has(detail.productId)) detailsByProduct.set(detail.productId, []);
      detailsByProduct.get(detail.productId)!.push({ detail, receipt });
    }

    const rows: Partial<ProductSerial>[] = [];
    // detailId → serial numbers generated for it (to update ImportDetail.scannedSerials)
    const detailSerialMap = new Map<string, string[]>();
    // Pool of AVAILABLE serials per productId for later order assignment
    const serialPool = new Map<string, Array<{ serialNumber: string; warehouseId: string }>>();

    const usedSerialNumbers = new Set<string>();
    const makeSerial = (sku: string): string => {
      let sn: string;
      do { sn = `${sku}-${faker.string.alphanumeric(8).toUpperCase()}`; } while (usedSerialNumbers.has(sn));
      usedSerialNumbers.add(sn);
      return sn;
    };

    for (const product of serialProducts) {
      const sku         = product.sku ?? 'PROD';
      const productDets = detailsByProduct.get(product.id) ?? [];

      // 1. Serials from COMPLETED import receipts — linked to receipt + populate scannedSerials
      for (const { detail, receipt } of productDets) {
        const count = Math.min(detail.quantity, 8); // cap to avoid excessive data
        const wh    = warehouses.find(w => w.id === receipt.warehouseId) ?? mainWh;
        const snList: string[] = [];
        for (let i = 0; i < count; i++) {
          const sn = makeSerial(sku);
          snList.push(sn);
          rows.push({ serialNumber: sn, status: SerialStatus.AVAILABLE, productId: product.id, warehouseId: wh.id, importReceiptId: receipt.id });
          if (!serialPool.has(product.id)) serialPool.set(product.id, []);
          serialPool.get(product.id)!.push({ serialNumber: sn, warehouseId: wh.id });
        }
        detailSerialMap.set(detail.id, snList);
      }

      // 2. Standalone AVAILABLE serials (existing stock not tied to these receipts)
      const standaloneCount = faker.number.int({ min: 5, max: 12 });
      for (let i = 0; i < standaloneCount; i++) {
        const wh = Math.random() > 0.3 ? mainWh : this.pick([mainWh, ...storeWhs]);
        const sn = makeSerial(sku);
        rows.push({ serialNumber: sn, status: SerialStatus.AVAILABLE, productId: product.id, warehouseId: wh.id });
        if (!serialPool.has(product.id)) serialPool.set(product.id, []);
        serialPool.get(product.id)!.push({ serialNumber: sn, warehouseId: wh.id });
      }

      // 3. A few DEFECTIVE serials in the damaged warehouse
      const defectCount = faker.number.int({ min: 0, max: 3 });
      for (let i = 0; i < defectCount; i++) {
        const sn = makeSerial(sku);
        rows.push({ serialNumber: sn, status: SerialStatus.DEFECTIVE, productId: product.id, warehouseId: damagedWh.id });
      }
    }

    await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${rows.length} product serials`);

    // Back-fill scannedSerials on completed import details
    for (const [detailId, snList] of detailSerialMap) {
      if (snList.length > 0) await detailRepo.update(detailId, { scannedSerials: snList });
    }

    return { serialPool };
  }

  // ── 19. Customers ──────────────────────────────────────────────────────────
  private async seedCustomers(): Promise<Customer[]> {
    const repo = this.dataSource.getRepository(Customer);
    const lastNames  = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi'];
    const firstNames = ['Hùng', 'Minh', 'Lan', 'Mai', 'Hoa', 'Tuấn', 'Long', 'Phúc', 'Linh', 'Chi', 'Nam', 'Huy', 'Trang', 'Ngọc', 'Bảo'];
    const midNames   = ['Thành', 'Quang', 'Xuân', 'Thanh', 'Gia', 'Công', 'Đình', 'Thị', 'Kim'];
    const tiers      = [CustomerTier.STANDARD, CustomerTier.STANDARD, CustomerTier.STANDARD, CustomerTier.SILVER, CustomerTier.GOLD, CustomerTier.PLATINUM];
    const notes      = ['Khách mua thường xuyên', 'Khách doanh nghiệp', 'Hay mua trả góp', 'Khách VIP ưu tiên', null, null, null];

    const rows: Partial<Customer>[] = [];
    const phoneSet = new Set<string>();
    const emailSet = new Set<string>();

    for (let i = 1; i <= 150; i++) {
      let phone: string;
      do { phone = '0' + faker.number.int({ min: 300_000_000, max: 999_999_999 }); } while (phoneSet.has(phone));
      phoneSet.add(phone);

      const fullName = `${this.pick(lastNames)} ${this.pick(midNames)} ${this.pick(firstNames)}`;
      const normalised = fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');
      let email: string | null = Math.random() > 0.3 ? `${normalised}${i}@gmail.com` : null;
      if (email && emailSet.has(email)) email = null;
      if (email) emailSet.add(email);

      const tier = this.pick(tiers);
      const totalSpent = tier === CustomerTier.PLATINUM ? faker.number.int({ min: 50_000_000, max: 500_000_000 })
        : tier === CustomerTier.GOLD   ? faker.number.int({ min: 10_000_000, max: 50_000_000 })
        : tier === CustomerTier.SILVER ? faker.number.int({ min: 2_000_000, max: 10_000_000 })
        : faker.number.int({ min: 0, max: 2_000_000 });

      rows.push({
        fullName, phoneNumber: phone, email: email ?? undefined, tier, totalSpent,
        rewardPoints: Math.floor(totalSpent / 100_000),
        address: `${faker.location.streetAddress()}, ${this.pick(['TP. HCM', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai'])}`,
        note: this.pick(notes) ?? undefined,
        isActive: true,
      });
    }

    const saved = await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${saved.length} customers`);
    return saved;
  }

  // ── 20. Orders ─────────────────────────────────────────────────────────────
  private async seedOrders(
    customers: Customer[],
    users: User[],
    products: Product[],
    posMap: Map<string, string>,
    positions: Position[],
    serialPool: Map<string, Array<{ serialNumber: string; warehouseId: string }>>,
  ): Promise<{ orders: Order[]; soldSerialsMap: Map<string, Map<string, string[]>> }> {
    const orderRepo  = this.dataSource.getRepository(Order);
    const detailRepo = this.dataSource.getRepository(OrderDetail);
    const serialRepo = this.dataSource.getRepository(ProductSerial);

    const salesUsers  = users.filter(u => u.roleCode === 'SALES_STAFF' || u.roleCode === 'SALES_MANAGER');
    const statuses    = [OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING, OrderStatus.PENDING, OrderStatus.CANCELLED];
    const shippers    = ['GHN', 'GHTK', 'ViettelPost', 'J&T Express', 'Tự đến lấy'];

    let orderIdx = 1;
    const orders: Partial<Order>[] = [];
    const orderToItems: Array<{ oIdx: number; productIds: string[]; qtys: number[]; prices: number[] }> = [];

    for (let i = 0; i < 100; i++) {
      const date       = faker.date.between({ from: '2025-07-01', to: '2026-02-28' });
      const month      = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const code       = `SO-${month}-${this.pad(orderIdx++, 4)}`;
      const customer   = this.pick(customers);
      const creator    = this.pick(salesUsers);
      const status     = this.pick(statuses);
      const picked     = this.pickN(products, faker.number.int({ min: 1, max: 4 }));
      const qtys       = picked.map(() => faker.number.int({ min: 1, max: 3 }));
      const prices     = picked.map(p => Number(p.retailPrice));
      const total      = picked.reduce((s, _, j) => s + qtys[j] * prices[j], 0);
      const discount   = Math.random() > 0.7 ? faker.number.int({ min: 100_000, max: 2_000_000 }) : 0;
      const shipper    = Math.random() > 0.2 ? this.pick(shippers) : undefined;

      orders.push({
        code, customerId: customer.id, creatorId: creator.id,
        totalAmount: total - discount, discountAmount: discount,
        status, shippingProvider: shipper,
        shippingAddress: customer.address ?? undefined,
        trackingCode: shipper && shipper !== 'Tự đến lấy' ? faker.string.alphanumeric(12).toUpperCase() : undefined,
      });
      orderToItems.push({ oIdx: orders.length - 1, productIds: picked.map(p => p.id), qtys, prices });
    }

    const savedOrders = await orderRepo.save(orders.map(r => orderRepo.create(r)));

    // soldSerialsMap: orderId → Map<productId, serialNumber[]>  (used by return requests)
    const soldSerialsMap = new Map<string, Map<string, string[]>>();
    const serialsToMarkSold: Array<{ serialNumber: string; orderId: string }> = [];
    const details: Partial<OrderDetail>[] = [];

    for (const m of orderToItems) {
      const order = savedOrders[m.oIdx];
      const assignSerials = order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SHIPPED;

      for (let j = 0; j < m.productIds.length; j++) {
        const productId = m.productIds[j];
        const product   = products.find(p => p.id === productId)!;
        const qty       = m.qtys[j];
        let assignedSerials: string[] | undefined;

        if (assignSerials && product.hasSerialNumber) {
          const pool = serialPool.get(productId);
          if (pool && pool.length > 0) {
            const taken = pool.splice(0, Math.min(qty, pool.length));
            assignedSerials = taken.map(s => s.serialNumber);
            if (!soldSerialsMap.has(order.id)) soldSerialsMap.set(order.id, new Map());
            soldSerialsMap.get(order.id)!.set(productId, assignedSerials);
            for (const sn of assignedSerials) serialsToMarkSold.push({ serialNumber: sn, orderId: order.id });
          }
        }

        details.push({
          orderId: order.id, productId,
          quantity: qty, unitPrice: m.prices[j],
          amount: qty * m.prices[j], assignedSerials,
        });
      }
    }

    await detailRepo.save(details.map(d => detailRepo.create(d)));

    // Batch-update sold serials, grouped by orderId for efficiency
    const byOrder = new Map<string, string[]>();
    for (const { serialNumber, orderId } of serialsToMarkSold) {
      if (!byOrder.has(orderId)) byOrder.set(orderId, []);
      byOrder.get(orderId)!.push(serialNumber);
    }
    for (const [orderId, serials] of byOrder) {
      await serialRepo.update({ serialNumber: In(serials) }, { status: SerialStatus.SOLD, orderId });
    }

    this.logger.log(`  ✅ ${savedOrders.length} orders, ${details.length} order details, ${serialsToMarkSold.length} serials marked SOLD`);
    return { orders: savedOrders, soldSerialsMap };
  }

  // ── 21. Return requests ────────────────────────────────────────────────────
  private async seedReturnRequests(
    orders: Order[],
    customers: Customer[],
    warehouses: Warehouse[],
    users: User[],
    products: Product[],
    soldSerialsMap: Map<string, Map<string, string[]>>,
  ): Promise<void> {
    const rrRepo     = this.dataSource.getRepository(ReturnRequest);
    const riRepo     = this.dataSource.getRepository(ReturnItem);
    const serialRepo = this.dataSource.getRepository(ProductSerial);
    // Pick completed/delivered orders
    const eligible = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.SHIPPED);
    const techWh   = warehouses.find(w => w.type === WarehouseType.DAMAGED) ?? warehouses[0];
    const salesUsers = users.filter(u => u.roleCode === 'SALES_STAFF' || u.roleCode === 'SALES_MANAGER');
    const reasons  = [
      'Màn hình bị điểm chết', 'Sản phẩm không hoạt động', 'Hàng bị hỏng trong quá trình vận chuyển',
      'Sản phẩm không đúng mô tả', 'Khách hàng đổi ý', 'Lỗi phần mềm firmware',
    ];

    let rrIdx = 1;
    const rrs:    Partial<ReturnRequest>[] = [];
    const riRows: Partial<ReturnItem>[]    = [];
    const rrToItems: Array<{ rrIdx: number; productIds: string[]; qtys: number[]; refunds: number[] }> = [];

    const sample = this.pickN(eligible, Math.min(25, eligible.length));

    for (const order of sample) {
      const month   = `${order.createdAt ? new Date(order.createdAt).getFullYear() : 2026}${String((order.createdAt ? new Date(order.createdAt).getMonth() : 0) + 2).padStart(2, '0')}`;
      const code    = `RMA-${month}-${this.pad(rrIdx++, 3)}`;
      const creator = this.pick(salesUsers);
      const prods   = this.pickN(products, faker.number.int({ min: 1, max: 2 }));
      const qtys    = prods.map(() => faker.number.int({ min: 1, max: 2 }));
      const refunds = prods.map(p => Math.round(Number(p.retailPrice) * 0.95));
      const total   = refunds.reduce((s, r, j) => s + r * qtys[j], 0);

      rrs.push({
        code, orderId: order.id, customerId: order.customerId,
        warehouseId: techWh.id, creatorId: creator.id,
        status: ReturnStatus.COMPLETED,
        refundAmount: total,
        reason: this.pick(reasons),
      });
      rrToItems.push({ rrIdx: rrs.length - 1, productIds: prods.map(p => p.id), qtys, refunds });
    }

    const savedRRs = await rrRepo.save(rrs.map(r => rrRepo.create(r)));

    const serialsToDefect: string[] = [];

    for (const m of rrToItems) {
      const rr = savedRRs[m.rrIdx];
      for (let j = 0; j < m.productIds.length; j++) {
        const productId = m.productIds[j];
        const product   = products.find(p => p.id === productId)!;
        const qty       = m.qtys[j];
        let returnedSerials: string[] | undefined;

        if (product.hasSerialNumber) {
          const orderSerials = soldSerialsMap.get(rr.orderId)?.get(productId) ?? [];
          if (orderSerials.length > 0) {
            returnedSerials = orderSerials.slice(0, Math.min(qty, orderSerials.length));
            for (const sn of returnedSerials) serialsToDefect.push(sn);
          }
        }

        riRows.push({
          returnRequestId: rr.id,
          productId,
          quantity: qty,
          refundPrice: m.refunds[j],
          returnedSerials,
        });
      }
    }

    await riRepo.save(riRows.map(r => riRepo.create(r)));

    if (serialsToDefect.length > 0) {
      await serialRepo.update({ serialNumber: In(serialsToDefect) }, { status: SerialStatus.DEFECTIVE });
    }

    this.logger.log(`  ✅ ${savedRRs.length} return requests, ${riRows.length} return items, ${serialsToDefect.length} serials marked DEFECTIVE`);
  }

  // ── 22. Stock histories ────────────────────────────────────────────────────
  private async seedStockHistories(
    products: Product[],
    warehouses: Warehouse[],
    users: User[],
  ): Promise<void> {
    const repo = this.dataSource.getRepository(StockHistory);
    const mainWh = warehouses.find(w => w.type === WarehouseType.CENTRAL) ?? warehouses[0];
    const whUsers = users.filter(u => u.roleCode === 'WH_STAFF' || u.roleCode === 'WH_MANAGER');
    const rows: Partial<StockHistory>[] = [];

    for (const product of products) {
      let balance = faker.number.int({ min: 20, max: 100 });

      // 2-5 import events
      for (let i = 0; i < faker.number.int({ min: 2, max: 5 }); i++) {
        const change = faker.number.int({ min: 10, max: 50 });
        balance += change;
        rows.push({
          productId: product.id, warehouseId: mainWh.id,
          type: StockChangeType.IMPORT, changeAmount: change,
          balanceAfter: balance,
          referenceCode: `PN-2025${this.pad(faker.number.int({ min: 1, max: 12 }), 2)}-${this.pad(i + 1, 3)}`,
          reason: 'Nhập hàng từ nhà cung cấp',
          performer: this.pick(whUsers),
        });
      }

      // 2-4 export/sell events
      for (let i = 0; i < faker.number.int({ min: 2, max: 4 }); i++) {
        if (balance <= 0) break;
        const change = faker.number.int({ min: 1, max: Math.min(15, balance) });
        balance -= change;
        rows.push({
          productId: product.id, warehouseId: mainWh.id,
          type: StockChangeType.EXPORT, changeAmount: -change,
          balanceAfter: balance,
          referenceCode: `SO-2026${this.pad(faker.number.int({ min: 1, max: 2 }), 2)}-${this.pad(i + 1, 4)}`,
          reason: `Xuất bán theo đơn hàng`,
          performer: this.pick(whUsers),
        });
      }
    }

    await repo.save(rows.map(r => repo.create(r)));
    this.logger.log(`  ✅ ${rows.length} stock history records`);
  }

  // ── 23. Recalculate stock quantities ───────────────────────────────────────
  private async recalcStockQuantities(products: Product[], warehouses: Warehouse[]): Promise<void> {
    const productRepo = this.dataSource.getRepository(Product);
    const stockRepo   = this.dataSource.getRepository(ProductStock);
    const serialRepo  = this.dataSource.getRepository(ProductSerial);

    for (const product of products) {
      let totalStock = 0;

      if (product.hasSerialNumber) {
        // For serial-tracked products: count AVAILABLE serials per warehouse and sync ProductStock
        for (const wh of warehouses) {
          const count = await serialRepo.count({
            where: { productId: product.id, warehouseId: wh.id, status: SerialStatus.AVAILABLE },
          });
          const existing = await stockRepo.findOne({ where: { productId: product.id, warehouseId: wh.id } });
          if (existing) {
            await stockRepo.update(existing.id, { quantity: count });
          } else if (count > 0) {
            await stockRepo.save(stockRepo.create({ productId: product.id, warehouseId: wh.id, quantity: count, minStockLevel: 3 }));
          }
          totalStock += count;
        }
      } else {
        // For non-serial products: sum existing ProductStock quantities
        const stocks = await stockRepo.find({ where: { productId: product.id } });
        totalStock = stocks.reduce((s, st) => s + st.quantity, 0);
      }

      await productRepo.update(product.id, { stockQuantity: totalStock });
    }

    this.logger.log(`  ✅ stockQuantity recalculated for ${products.length} products`);
  }
}
