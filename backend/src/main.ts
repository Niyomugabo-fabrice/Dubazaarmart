import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import express from 'express'
import { AppModule } from './app.module'
import { ApiExceptionFilter } from './common/filters/api-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })
  const config = app.get(ConfigService)
  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  const origins = (config.get<string>('FRONTEND_URL') || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  const isProduction = config.get<string>('NODE_ENV') === 'production'

  if (isProduction && (origins.length === 0 || origins.includes('*'))) {
    throw new Error('FRONTEND_URL must contain explicit production origins.')
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (origins.includes(origin)) return callback(null, true)
      if (!isProduction && /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true)
      }
      return callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
  })
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  app.useGlobalFilters(new ApiExceptionFilter())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DubazaarMart API')
    .setDescription('Versioned REST API for the DubazaarMart storefront and admin dashboard.')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs/openapi.json' })

  const port = Number(config.get<string>('PORT') || 3001)
  await app.listen(port, '0.0.0.0')
  process.stdout.write(`DubazaarMart API listening on port ${port}\n`)
}

void bootstrap()
