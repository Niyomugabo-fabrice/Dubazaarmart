import 'dotenv/config'
import bcrypt from 'bcryptjs'
import dataSource from './data-source'
import { UserEntity } from '../modules/auth/infrastructure/persistence/typeorm/user.entity'

type UserRole = 'MANAGER' | 'STAFF'

interface AccountOptions {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  roleProvided: boolean
  firstNameProvided: boolean
  lastNameProvided: boolean
  reset: boolean
  help: boolean
}

const USAGE = `Create or reset a manager/staff account directly in PostgreSQL.

Usage:
  pnpm --filter @dubazaarmart/backend db:create-account -- \\
    --email you@example.com --password "at-least-12-characters" \\
    [--first-name Admin] [--last-name User] [--role MANAGER|STAFF] [--reset]

Environment alternative (keeps values out of shell history):
  ACCOUNT_EMAIL=you@example.com ACCOUNT_PASSWORD="at-least-12-characters" \\
    pnpm --filter @dubazaarmart/backend db:create-account

Options:
  --email        Account email (required)
  --password     Password, 12-72 bytes (required)
  --first-name   First name (default "Manager" or "Staff")
  --last-name    Last name (default empty)
  --role         MANAGER or STAFF (default MANAGER)
  --reset        Reset the password of an existing account, mark it active and verified
  --help         Show this help
`

function readFlag(args: string[], index: number): { value: string; nextIndex: number } {
  const [name, inline] = args[index].slice(2).split('=', 2)
  if (inline !== undefined) return { value: inline, nextIndex: index }
  const value = args[index + 1]
  if (value === undefined || value.startsWith('--')) return { value: '', nextIndex: index }
  return { value, nextIndex: index + 1 }
}

function parseOptions(argv: string[]): AccountOptions {
  const values = new Map<string, string>()
  let reset = false
  let help = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      help = true
    } else if (argument === '--reset') {
      reset = true
    } else if (argument.startsWith('--')) {
      const { value, nextIndex } = readFlag(argv, index)
      values.set(argument.slice(2).split('=')[0].replace(/-/g, '').toLowerCase(), value)
      index = nextIndex
    }
  }

  const read = (name: string, envName: string): string => values.get(name)?.trim() || process.env[envName]?.trim() || ''
  const readRaw = (name: string, envName: string): string => values.get(name) ?? process.env[envName] ?? ''
  const rawRole = (read('role', 'ACCOUNT_ROLE') || 'MANAGER').toUpperCase()
  if (rawRole !== 'MANAGER' && rawRole !== 'STAFF') {
    throw new Error('Role must be MANAGER or STAFF.')
  }

  return {
    email: read('email', 'ACCOUNT_EMAIL'),
    password: readRaw('password', 'ACCOUNT_PASSWORD'),
    firstName: read('firstname', 'ACCOUNT_FIRST_NAME'),
    lastName: read('lastname', 'ACCOUNT_LAST_NAME'),
    role: rawRole,
    roleProvided: Boolean(values.get('role') || process.env.ACCOUNT_ROLE),
    firstNameProvided: Boolean(values.get('firstname') || process.env.ACCOUNT_FIRST_NAME),
    lastNameProvided: Boolean(values.get('lastname') || process.env.ACCOUNT_LAST_NAME),
    reset,
    help,
  }
}

function validate(options: AccountOptions): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(options.email)) {
    throw new Error('A valid --email is required.')
  }
  if (options.password.length < 12) {
    throw new Error('Password must be at least 12 characters long.')
  }
  if (Buffer.byteLength(options.password, 'utf8') > 72) {
    throw new Error('Password must be at most 72 bytes.')
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  if (options.help) {
    process.stdout.write(USAGE)
    return
  }

  const email = options.email.trim().toLowerCase()
  validate({ ...options, email })

  await dataSource.initialize()
  try {
    const users = dataSource.getRepository(UserEntity)
    const existing = await users
      .createQueryBuilder('user')
      .withDeleted()
      .where('LOWER(user.email) = :email', { email })
      .getOne()

    if (existing && !options.reset) {
      throw new Error(
        `An account with ${email} already exists (${existing.role}, ${existing.status}). ` +
        'Re-run with --reset to set a new password and reactivate it.',
      )
    }

    const passwordHash = await bcrypt.hash(options.password, 12)

    if (existing) {
      existing.passwordHash = passwordHash
      existing.status = 'ACTIVE'
      existing.emailVerified = true
      existing.deletedAt = null
      if (options.roleProvided) existing.role = options.role
      if (options.firstNameProvided) existing.firstName = options.firstName
      if (options.lastNameProvided) existing.lastName = options.lastName
      await users.save(existing)
      process.stdout.write(`Password reset for ${existing.role} account ${email}. The account is now active and verified.\n`)
      return
    }

    const firstName = options.firstName || (options.role === 'MANAGER' ? 'Manager' : 'Staff')
    const account = users.create({
      firstName,
      lastName: options.lastName,
      email,
      phoneNumber: null,
      passwordHash,
      role: options.role,
      status: 'ACTIVE',
      emailVerified: true,
      permissions: [],
      lastLoginAt: null,
    })
    await users.save(account)
    process.stdout.write(`${options.role} account created for ${email}. You can sign in from the admin page now.\n`)
  } finally {
    await dataSource.destroy()
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n`)
  process.stderr.write(USAGE)
  process.exitCode = 1
})
