import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import dataSource from './data-source'
import { AdminEntity } from '../modules/auth/infrastructure/persistence/typeorm/admin.entity'
import { WebsiteSettingsEntity } from '../modules/settings/infrastructure/persistence/typeorm/website-settings.entity'
import { AnnouncementEntity } from '../modules/settings/infrastructure/persistence/typeorm/announcement.entity'

async function seed() {
  const email = process.env.ADMIN_DEFAULT_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_DEFAULT_PASSWORD
  if (!email || !password) {
    throw new Error('Set ADMIN_DEFAULT_EMAIL and ADMIN_DEFAULT_PASSWORD before running db:seed.')
  }
  if (password.length < 12) throw new Error('ADMIN_DEFAULT_PASSWORD must be at least 12 characters.')

  await dataSource.initialize()
  try {
    const admins = dataSource.getRepository(AdminEntity)
    const existingAdmin = await admins.findOneBy({ email })
    if (!existingAdmin) {
      await admins.save(admins.create({ id: randomUUID(), email, passwordHash: await bcrypt.hash(password, 12), name: 'Store Administrator', role: 'admin' }))
      process.stdout.write('Administrator account created.\n')
    } else {
      process.stdout.write('Administrator already exists; credentials were left unchanged.\n')
    }

    const settings = dataSource.getRepository(WebsiteSettingsEntity)
    if (!(await settings.findOneBy({ id: 'primary' }))) {
      await settings.save(settings.create({ id: 'primary' }))
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
