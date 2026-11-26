import 'reflect-metadata'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import express from 'express'
import { AppModule } from './app.module'
import { ApiExceptionFilter } from './common/filters/api-exception.filter'

function isLocalDevelopmentOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true
    const octets = hostname.split('.').map(Number)
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
    return octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
  } catch {
    return false
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })
  const config = app.get(ConfigService)
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  const uploadsDir = path.resolve(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  const staticUploadOptions = {
    setHeaders: (res: express.Response) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    },
  }
  app.use('/uploads', express.static(uploadsDir, staticUploadOptions))
  app.use('/api/v1/uploads', express.static(uploadsDir, staticUploadOptions))
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
      if (!isProduction && isLocalDevelopmentOrigin(origin)) {
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
