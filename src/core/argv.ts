export interface FlagSpec {
  name: string
  boolean?: boolean
}

// Flags may appear before or after the filename. A value flag with nothing
// after it is an error, so `--to` cannot silently mean "every platform" and
// `--status` cannot be accepted blank. Boolean flags do not consume the next
// argument, so `publish --dry-run post.md` keeps the filename.
export function extractFlags(
  args: string[],
  specs: FlagSpec[],
): { flags: Record<string, string | undefined>; rest: string[] } {
  const known = new Map(specs.map(spec => [spec.name, spec]))
  const flags: Record<string, string | undefined> = {}
  const rest: string[] = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--') {
      rest.push(...args.slice(i + 1))
      break
    }
    if (!arg.startsWith('--')) {
      rest.push(arg)
      continue
    }
    const name = arg.slice(2)
    const spec = known.get(name)
    if (!spec) throw new Error(`unknown option --${name}`)
    if (spec.boolean) {
      flags[name] = 'true'
      continue
    }
    const value = args[i + 1]
    if (value === undefined || value.startsWith('--')) throw new Error(`--${name} requires a value`)
    flags[name] = value
    i++
  }
  return { flags, rest }
}
