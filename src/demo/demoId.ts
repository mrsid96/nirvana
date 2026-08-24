let counter = 0

export function nextDemoId(prefix: string): string {
  counter += 1
  return `demo-${prefix}-${counter}-${Date.now().toString(36)}`
}

export function resetDemoIdCounter(): void {
  counter = 0
}
