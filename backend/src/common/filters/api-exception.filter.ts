import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { Request, Response } from 'express'

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const request = context.getRequest<Request>()
    const response = context.getResponse<Response>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const raw = exception instanceof HttpException ? exception.getResponse() : null
    const message = typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object' && 'message' in raw
        ? (raw as { message: string | string[] }).message
        : exception instanceof Error && status < 500 ? exception.message : 'An unexpected server error occurred.'
    response.status(status).json({ error: Array.isArray(message) ? message.join(', ') : message })
    if (status >= 500 && exception instanceof Error) {
      // Avoid logging request bodies or credentials.
      process.stderr.write(`[API] ${request.method} ${request.path}: ${exception.name}\n`)
    }
  }
}
