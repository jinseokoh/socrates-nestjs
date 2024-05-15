import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (exception instanceof QueryFailedError) {
      const status = 400;
      let message = exception.message;
      if (exception.message.match(/.*?(Unique constraint failed)/)) {
        message = 'already taken';
      }

      response.status(status).json({
        statusCode: status,
        message: message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else {
      // response.status(status).json({
      //   statusCode: status,
      //   message: exception.message,
      //   timestamp: new Date().toISOString(),
      //   path: request.url,
      // });
      super.catch(exception, host);
    }
  }
}
