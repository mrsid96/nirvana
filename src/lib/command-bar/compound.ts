const ACTION_PATTERN =
  /\b(invest|invested|sip|spent|spend|paid|payment|received|got|salary|income|withdraw|bought|purchase|create|add|emi)\b/i

export function splitCompoundInput(text: string): string[] {
  const trimmed = text.trim()
  if (!/\sand\s/i.test(trimmed)) return [trimmed]

  const parts = trimmed
    .split(/\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) return [trimmed]

  const actionable = parts.filter((part) => ACTION_PATTERN.test(part) || /\d/.test(part))
  return actionable.length >= 2 ? actionable : [trimmed]
}

export function summarizeClause(clause: string): string {
  const compact = clause.trim()
  if (compact.length <= 48) return compact
  return `${compact.slice(0, 45)}…`
}
