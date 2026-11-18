import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'

@Injectable()
export class CloudinaryService {
  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME')
    const apiKey = config.get<string>('CLOUDINARY_API_KEY')
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET')
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
    }
  }

  async uploadImage(fileData: string, filename?: string) {
    const config = cloudinary.config()
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new ServiceUnavailableException('Image uploads are not configured on the backend.')
    }
    const options: Record<string, unknown> = {
      folder: 'dubazaarmart/products',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
    }
    if (filename) options.public_id = filename
    const result = await cloudinary.uploader.upload(fileData, options)
    return {
      url: result.secure_url || result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    }
  }
}
