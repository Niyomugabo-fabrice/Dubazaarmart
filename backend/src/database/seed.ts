import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import dataSource from './data-source'
import { UserEntity } from '../modules/auth/infrastructure/persistence/typeorm/user.entity'
import { WebsiteSettingsEntity } from '../modules/settings/infrastructure/persistence/typeorm/website-settings.entity'
import { AnnouncementEntity } from '../modules/settings/infrastructure/persistence/typeorm/announcement.entity'

async function seed() {
  const email = process.env.MANAGER_DEFAULT_EMAIL?.trim().toLowerCase()
  const password = process.env.MANAGER_DEFAULT_PASSWORD
  if (!email || !password) {
    throw new Error('Set MANAGER_DEFAULT_EMAIL and MANAGER_DEFAULT_PASSWORD before running db:seed.')
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('MANAGER_DEFAULT_PASSWORD must contain 12 to 72 UTF-8 bytes.')
  }

  await dataSource.initialize()
  try {
    const users = dataSource.getRepository(UserEntity)
    const existingManager = await users.findOneBy({ email })
    if (!existingManager) {
      await users.save(users.create({
        id: randomUUID(),
        firstName: 'Store',
        lastName: 'Manager',
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'MANAGER',
        status: 'ACTIVE',
        emailVerified: true,
        permissions: [],
      }))
      process.stdout.write('Manager account created.\n')
    } else if (existingManager.role !== 'MANAGER') {
      throw new Error('MANAGER_DEFAULT_EMAIL is already assigned to a staff account.')
    } else {
      process.stdout.write('Manager already exists; credentials were left unchanged.\n')
    }

    const settings = dataSource.getRepository(WebsiteSettingsEntity)
    if (!(await settings.findOneBy({ id: 'primary' }))) {
      await settings.save(settings.create({ id: 'primary', allowStaffRegistration: false }))
      process.stdout.write('Default website settings created.\n')
    }

    const announcements = dataSource.getRepository(AnnouncementEntity)
    if ((await announcements.count()) === 0) {
      await announcements.save(announcements.create({
        id: randomUUID(),
        title: 'Direct Dubai Electronics Import',
        message: 'Genuine electronics sourced directly from Dubai wholesale hubs. Same-day delivery is available across Kigali.',
        tag: 'Announcement',
        active: true,
      }))
      process.stdout.write('Initial announcement created.\n')
    }
  } finally {
    await dataSource.destroy()
  }
}

void seed().catch((error: unknown) => {
  process.stderr.write(`Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
  process.exitCode = 1
})
