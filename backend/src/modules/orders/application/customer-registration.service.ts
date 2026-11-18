import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'
import { CustomerEntity } from '../infrastructure/persistence/typeorm/customer.entity'
import { RegisterCustomerDto } from '../presentation/dto/register-customer.dto'

@Injectable()
export class CustomerRegistrationService {
  constructor(
    @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>,
  ) {}

  async register(input: RegisterCustomerDto) {
    const name = input.name.trim()
    const email = input.email.trim().toLowerCase()
    if (Buffer.byteLength(input.password, 'utf8') > 72) {
      throw new BadRequestException('Password must be at most 72 bytes.')
    }
    const existing = await this.customers.findOneBy({ email })
    if (existing) throw new ConflictException('An account already exists for this email address.')

    const customer = this.customers.create({
      name,
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
    })

    try {
      const saved = await this.customers.save(customer)
      return {
        success: true,
        customer: { id: saved.id, name: saved.name, email: saved.email },
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An account already exists for this email address.')
      }
      throw error
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}
