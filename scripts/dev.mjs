import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const frontendPort = process.env.PORT || '8443'
const backendPort = process.env.API_PORT || '3001'
const children = []
let shuttingDown = false

for (const service of [
  { name: 'frontend', directory: 'frontend', script: 'dev', port: frontendPort },
  { name: 'backend', directory: 'backend', script: 'start:dev', port: backendPort },
]) {
  const child = spawn(command, ['run', service.script], {
    cwd: resolve(root, service.directory),
    env: { ...process.env, PORT: service.port },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  children.push(child)
  child.on('error', (error) => {
    process.stderr.write(`[${service.name}] ${error.message}\n`)
    shutdown(1)
  })
  child.on('exit', (code) => {
    if (!shuttingDown) shutdown(code ?? 1)
  })
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }
  process.exitCode = code
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
