export function formatProductSpecs(specs: Record<string, unknown> | undefined): string {
  if (!specs) return ''

  return Object.entries(specs)
    .filter((entry): entry is [string, string | number] => typeof entry[1] === 'string' || typeof entry[1] === 'number')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}

export function parseProductSpecs(value: string): Record<string, string> {
  const specs: Record<string, string> = {}

  for (const [index, rawLine] of value.split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line) continue

    const separator = line.indexOf(':')
    const key = separator >= 0 ? line.slice(0, separator).trim() : ''
    const specValue = separator >= 0 ? line.slice(separator + 1).trim() : ''
    if (!key || !specValue) {
      throw new Error(`Specification on line ${index + 1} must use "name: value" format.`)
    }
    if (Object.prototype.hasOwnProperty.call(specs, key)) {
      throw new Error(`Specification "${key}" appears more than once.`)
    }

    specs[key] = specValue
  }

  return specs
}
