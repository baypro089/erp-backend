# Huong Dan Cai Dat Va Su Dung ERP Backend

Tai lieu nay huong dan cai dat nhanh du an va dac biet la cach dien file .env dung cho moi truong local.

## 1) Yeu cau he thong

- Node.js 20+
- npm 10+
- Docker Desktop (neu dung Postgres/Redis/pgAdmin bang container)
- Git

## 2) Cai dat du an

Tai thu muc goc du an, chay:

```bash
npm install
```

## 3) Tao va dien file .env

Neu chua co file .env:

```bash
cp example.env .env
```

Neu dang dung Windows PowerShell:

```powershell
Copy-Item example.env .env
```

### Mau .env khuyen nghi cho local

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

## 4) Giai thich nhanh cac bien quan trong trong .env

- PORT: Cong backend, mac dinh 3000.
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME: ket noi Postgres.
- TYPEORM_SYNC:
  - true: tu dong dong bo schema (chi nen dung local/dev).
  - false: an toan hon cho staging/production.
- REDIS_HOST, REDIS_PORT: ket noi Redis cache.
- PGADMIN_PORT, PGADMIN_EMAIL, PGADMIN_PASSWORD: cau hinh giao dien pgAdmin.
- JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET: bat buoc phai dat gia tri manh, khong de rong.
- CORS_ORIGIN: domain frontend duoc phep goi API.
- MAIL_USER, MAIL_PASS: tai khoan gui mail. Voi Gmail, MAIL_PASS la App Password (khong phai mat khau dang nhap thuong).

## 5) Tao JWT secret manh (khuyen nghi)

Co the dung Node.js de tao nhanh secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Chay 2 lan de lay 2 gia tri khac nhau cho:

- JWT_ACCESS_TOKEN_SECRET
- JWT_REFRESH_TOKEN_SECRET

## 6) Chay Postgres + Redis + pgAdmin bang Docker

Du an da co file docker-compose.yml. Chay:

```bash
docker compose up -d
```

Kiem tra container:

```bash
docker compose ps
```

Truy cap pgAdmin tai:

- http://localhost:5050

Dang nhap bang:

- email: gia tri PGADMIN_EMAIL
- password: gia tri PGADMIN_PASSWORD

## 7) Chay backend

```bash
npm run start:dev
```

Neu thanh cong, API se chay tai:

- http://localhost:3000

Swagger (neu da bat trong main.ts):

- http://localhost:3000/api

## 8) Kiem tra nhanh sau khi khoi dong

- Kiem tra DB ket noi thanh cong (khong co loi connect ECONNREFUSED 5432).
- Kiem tra Redis ket noi thanh cong.
- Goi thu 1 endpoint public hoac endpoint dang nhap.

## 9) Loi thuong gap va cach xu ly

### Loi ket noi Postgres

- Kiem tra container postgres da up chua: docker compose ps
- Kiem tra DB_PORT trong .env co trung voi port map trong docker-compose.yml khong.
- Kiem tra DB_USERNAME, DB_PASSWORD, DB_NAME.

### Loi ket noi Redis

- Kiem tra redis container dang chay.
- Kiem tra REDIS_HOST, REDIS_PORT.

### Loi CORS tren frontend

- Dat CORS_ORIGIN dung voi domain frontend.
- Neu co nhieu origin, tach bang dau phay va xu ly parser theo code backend.

### Khong gui duoc email

- Kiem tra MAIL_USER va MAIL_PASS.
- Neu dung Gmail, bat 2FA va tao App Password.
- Kiem tra MAIL_PORT=587 va MAIL_SECURE=false.

## 10) Ghi chu cho production

- Dat TYPEORM_SYNC=false.
- Dung secret JWT manh, khong commit .env.
- Cau hinh CORS_ORIGIN dung domain that.
- Dung tai khoan DB/Redis rieng, mat khau manh.
