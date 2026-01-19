# erp-backend/Dockerfile

# Base image
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /usr/src/app

# Copy package.json và lock file
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Expose port
EXPOSE 3000

# Lệnh chạy mặc định (sẽ bị ghi đè bởi command trong docker-compose nếu có)
CMD ["npm", "run", "start"]