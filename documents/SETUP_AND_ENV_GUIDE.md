# Hướng Dẫn Cài Đặt Và Sử Dụng ERP Backend

Tài liệu này hướng dẫn cài đặt nhanh dự án và đặc biệt là cách điền file `.env` đúng cho môi trường local.

## 1) Yêu cầu hệ thống

- Node.js 20+
- npm 10+
- Docker Desktop (nếu dùng Postgres/Redis/pgAdmin bằng container)
- Git

## 2) Cài đặt dự án

Tại thư mục gốc dự án, chạy:

```bash
npm install
```

## 3) Tạo và điền file `.env`

Nếu chưa có file `.env`:

```bash
cp example.env .env
```

Nếu đang dùng Windows PowerShell:

```powershell
Copy-Item example.env .env
```

### Mẫu `.env` khuyến nghị cho local

```env
# --- APP CONFIG ---
PORT=3000

# --- DATABASE (POSTGRES) ---
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root
DB_NAME=erp_db

# --- TYPEORM ---
TYPEORM_SYNC=true

# --- REDIS ---
REDIS_HOST=localhost
REDIS_PORT=6379

# --- PGADMIN (GUI) ---
PGADMIN_PORT=5050
PGADMIN_EMAIL=admin@erp.com
PGADMIN_PASSWORD=admin123

# --- JWT ---
JWT_ACCESS_TOKEN_SECRET=your_super_long_random_access_secret
JWT_ACCESS_TOKEN_EXPIRATION=900s
JWT_REFRESH_TOKEN_SECRET=your_super_long_random_refresh_secret
JWT_REFRESH_TOKEN_EXPIRATION=7d

# --- CORS ---
CORS_ORIGIN=http://localhost:4000

# --- BCRYPT ---
BCRYPT_SALT_OR_ROUNDS=10

# --- EMAIL (SMTP GMAIL) ---
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_gmail_app_password
MAIL_SENDER=no-reply@erp.com
```

## 4) Giải thích nhanh các biến quan trọng trong `.env`

- `PORT`: Cổng backend, mặc định 3000.
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`: kết nối Postgres.
- `TYPEORM_SYNC`:
  - `true`: tự động đồng bộ schema (chỉ nên dùng local/dev).
  - `false`: an toàn hơn cho staging/production.
- `REDIS_HOST`, `REDIS_PORT`: kết nối Redis cache.
- `PGADMIN_PORT`, `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`: cấu hình giao diện pgAdmin.
- `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`: bắt buộc phải đặt giá trị mạnh, không để rỗng.
- `CORS_ORIGIN`: domain frontend được phép gọi API.
- `MAIL_USER`, `MAIL_PASS`: tài khoản gửi mail. Với Gmail, `MAIL_PASS` là App Password (không phải mật khẩu đăng nhập thường).

## 5) Tạo JWT secret mạnh (khuyến nghị)

Có thể dùng Node.js để tạo nhanh secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Chạy 2 lần để lấy 2 giá trị khác nhau cho:

- `JWT_ACCESS_TOKEN_SECRET`
- `JWT_REFRESH_TOKEN_SECRET`

## 6) Chạy Postgres + Redis + pgAdmin bằng Docker

Dự án đã có file `docker-compose.yml`. Chạy:

```bash
docker compose up -d
```

Kiểm tra container:

```bash
docker compose ps
```

Truy cập pgAdmin tại:

- http://localhost:5050

Đăng nhập bằng:

- email: giá trị `PGADMIN_EMAIL`
- password: giá trị `PGADMIN_PASSWORD`

## 7) Chạy backend

```bash
npm run start:dev
```

Nếu thành công, API sẽ chạy tại:

- http://localhost:3000

Swagger (nếu đã bật trong `main.ts`):

- http://localhost:3000/api

## 8) Kiểm tra nhanh sau khi khởi động

- Kiểm tra DB kết nối thành công (không có lỗi `connect ECONNREFUSED 5432`).
- Kiểm tra Redis kết nối thành công.
- Gọi thử 1 endpoint public hoặc endpoint đăng nhập.

## 9) Lỗi thường gặp và cách xử lý

### Lỗi kết nối Postgres

- Kiểm tra container postgres đã up chưa: `docker compose ps`
- Kiểm tra `DB_PORT` trong `.env` có trùng với port map trong `docker-compose.yml` không.
- Kiểm tra `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`.

### Lỗi kết nối Redis

- Kiểm tra redis container đang chạy.
- Kiểm tra `REDIS_HOST`, `REDIS_PORT`.

### Lỗi CORS trên frontend

- Đặt `CORS_ORIGIN` đúng với domain frontend.
- Nếu có nhiều origin, tách bằng dấu phẩy và xử lý parser theo code backend.

### Không gửi được email

- Kiểm tra `MAIL_USER` và `MAIL_PASS`.
- Nếu dùng Gmail, bật 2FA và tạo App Password.
- Kiểm tra `MAIL_PORT=587` và `MAIL_SECURE=false`.

## 10) Ghi chú cho production

- Đặt `TYPEORM_SYNC=false`.
- Dùng secret JWT mạnh, không commit `.env`.
- Cấu hình `CORS_ORIGIN` đúng domain thật.
- Dùng tài khoản DB/Redis riêng, mật khẩu mạnh.
