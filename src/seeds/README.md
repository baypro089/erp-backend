# Database Seeding

## Mô tả

Thư mục này chứa các file seed để khởi tạo dữ liệu mẫu cho hệ thống.

## Seeds hiện có

### 1. Salary Component Seed
Tạo các thành phần lương cơ bản:
- **LUNCH**: Phụ cấp ăn trưa (Earning)
- **TRANSPORT**: Phụ cấp đi lại (Earning)
- **BONUS**: Thưởng cố định (Earning)
- **BHXH**: Bảo hiểm xã hội (Deduction)
- **BHYT**: Bảo hiểm y tế (Deduction)
- **BHTN**: Bảo hiểm thất nghiệp (Deduction)
- **PIT**: Thuế TNCN (Deduction)

### 2. System Setting Seed
Tạo các cấu hình hệ thống:
- **GLOBAL_LUNCH_AMOUNT**: 730,000 VNĐ
- **GLOBAL_TRANSPORT_AMOUNT**: 500,000 VNĐ
- **GLOBAL_BONUS_AMOUNT**: 1,000,000 VNĐ
- **BASE_SALARY**: 2,340,000 VNĐ
- **INSURANCE_RATE_PERCENT**: 8 (%)
- **HEALTH_INSURANCE_RATE_PERCENT**: 1.5 (%)
- **UNEMPLOYMENT_INSURANCE_RATE_PERCENT**: 1 (%)

## Cách chạy

### Chạy tất cả seeds:
```bash
npm run seed
```

### Hoặc chạy trực tiếp:
```bash
ts-node -r tsconfig-paths/register src/seeds/run-seed.ts
```

## Lưu ý

- Seed sẽ tự động kiểm tra dữ liệu đã tồn tại, không tạo trùng lặp
- Đảm bảo database đã được cấu hình đúng trước khi chạy seed
- Nên chạy seed sau khi migration hoàn tất
