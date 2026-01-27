import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // 1️⃣ HttpException (BadRequest, NotFound, Unauthorized, ...)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
      }
    }

    // 2️⃣ TypeORM common errors (optional)
    else if ((exception as any)?.code) {
      switch ((exception as any).code) {
        case '23505': // unique_violation (PostgreSQL)
          status = HttpStatus.CONFLICT;
          message = 'Data already exists';
          error = 'Conflict';
          break;

        case '23503': // foreign_key_violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference data';
          error = 'Bad Request';
          break;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    });
  }
}
