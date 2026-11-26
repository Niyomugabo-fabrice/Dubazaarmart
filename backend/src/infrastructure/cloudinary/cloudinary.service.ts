import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import * as fs from 'node:fs'
import * as path from 'node:path'

export interface UploadResult {
  url: string
  secure_url: string
  public_id: string
  format: string
  width?: number
  height?: number
  bytes?: number
  storage: 'cloudinary' | 'local'
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name)
  private readonly isConfigured: boolean
  private readonly uploadsRoot: string
  private readonly backendBaseUrl: string

  constructor(private readonly config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME')
    const apiKey = config.get<string>('CLOUDINARY_API_KEY')
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET')
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
      this.isConfigured = true
    } else {
      this.isConfigured = false
      this.logger.warn('Cloudinary credentials not provided. Using local disk storage fallback for image uploads.')
    }

    const configuredAppUrl = config.get<string>('APP_URL') || config.get<string>('BACKEND_URL')
    const port = config.get<string>('PORT') || '3001'
    this.backendBaseUrl = configuredAppUrl ? configuredAppUrl.replace(/\/+$/, '') : `http://127.0.0.1:${port}`
    this.uploadsRoot = path.resolve(process.cwd(), 'uploads')
  }

  async uploadImage(fileData: string, filename?: string, folder = 'products'): Promise<UploadResult> {
    if (this.isConfigured) {
      const options: Record<string, unknown> = {
        folder: `dubazaarmart/${folder}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: folder === 'testimonials'
          ? [{ width: 300, height: 300, crop: 'limit' }, { quality: 'auto:good' }, { fetch_format: 'auto' }]
          : folder === 'categories'
            ? [{ width: 400, height: 400, crop: 'limit' }, { quality: 'auto:good' }, { fetch_format: 'auto' }]
            : folder === 'hero-slides'
              ? [{ width: 1920, crop: 'limit' }, { quality: 'auto:good' }, { fetch_format: 'auto' }]
              : [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
      }
      if (filename) options.public_id = filename
      if (folder === 'categories') {
        options.overwrite = true
        options.invalidate = true
      }
      const result = await cloudinary.uploader.upload(fileData, options)
      return {
        url: result.secure_url || result.url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        storage: 'cloudinary',
      }
    }

    return this.uploadLocally(fileData, filename, folder)
  }

  private async uploadLocally(fileData: string, filename?: string, folder = 'products'): Promise<UploadResult> {
    const targetFolder = path.join(this.uploadsRoot, folder)
    await fs.promises.mkdir(targetFolder, { recursive: true })

    let buffer: Buffer
    let extension = 'png'

    const mimeMatch = fileData.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/)
    if (mimeMatch) {
      const subtype = mimeMatch[1].toLowerCase()
      extension = subtype === 'jpeg' ? 'jpg' : subtype.replace(/[^a-z0-9]/g, '')
      buffer = Buffer.from(mimeMatch[2], 'base64')
    } else if (fileData.startsWith('data:')) {
      const commaIndex = fileData.indexOf(',')
      buffer = Buffer.from(fileData.slice(commaIndex + 1), 'base64')
    } else {
      buffer = Buffer.from(fileData, 'base64')
    }

    const cleanFilename = filename?.replace(/[^a-zA-Z0-9_-]/g, '') || `upload-${Date.now()}`
    const finalFilename = folder === 'categories'
      ? `${cleanFilename}.${extension}`
      : `${cleanFilename}-${Date.now()}.${extension}`

    const filePath = path.join(targetFolder, finalFilename)
    await fs.promises.writeFile(filePath, buffer)

    const fileUrl = `${this.backendBaseUrl}/uploads/${folder}/${finalFilename}`

    return {
      url: fileUrl,
      secure_url: fileUrl,
      public_id: `${folder}/${finalFilename}`,
      format: extension,
      bytes: buffer.length,
      storage: 'local',
    }
  }
}
