import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './interceptors/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const origins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('ERP-API')
    .setDescription('Tài liệu API chung cho toàn bộ ứng dụng.')
    .setVersion('1.0')
    // ✨ THÊM CẤU HÌNH JWT BEARER VÀO ĐÂY ✨
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'Nhập JWT Token tại đây'
      },
      'access-token' // <-- ID DUY NHẤT để tham chiếu đến lược đồ bảo mật này.
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
