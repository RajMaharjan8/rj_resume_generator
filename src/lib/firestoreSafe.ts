// Firestore rejects any document that contains a value of `undefined` anywhere
// in the tree (it throws "Unsupported field value: undefined"). Our models use
// many optional fields and sometimes set keys to `undefined` explicitly (e.g.
// `auto: auto || undefined`, `columns: undefined` after migrating to rows), so
// we deep-clean the doc right before saving.
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      out[k] = stripUndefined(v)
    }
    return out as T
  }
  return value
}
