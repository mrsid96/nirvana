const ACTION_PATTERN =
  /\b(invest|invested|sip|spent|spend|paid|payment|received|got|salary|income|withdraw|redeem|redeemed|bought|purchase|create|add|start|begin|open|setup|emi|rd|putting|taking|goes|going)\b/i

export function splitCompoundInput(text: string): string[] {
  const trimmed = text.trim()

  if (/\s*,\s*/.test(trimmed)) {
    const commaParts = trimmed
      .split(/\s*,\s*/)
      .map((part) => part.replace(/^\s*so\s+/i, '').trim())
      .filter(Boolean)
    const actionable = commaParts.filter((part) => ACTION_PATTERN.test(part) || /\d/.test(part))
    if (actionable.length >= 2) return actionable
  }

  const hasMultipleParts = /\s+and\s+|\s+but\s+/i.test(trimmed)
  if (!hasMultipleParts) return [trimmed]

  const parts = trimmed
    .split(/\s+and\s+|\s+but\s+/i)
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
