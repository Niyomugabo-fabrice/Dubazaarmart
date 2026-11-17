import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Check API and PostgreSQL health' })
  async getHealth() {
    try {
      const rows = await this.dataSource.query('SELECT NOW() AS db_time')
      return {
        status: 'ok',
        service: 'DubazaarMart API',
        database: 'PostgreSQL (Connected)',
        dbTime: rows[0]?.db_time,
        timestamp: new Date().toISOString(),
      }
    } catch {
      throw new ServiceUnavailableException('PostgreSQL is not reachable.')
    }
  }
}
