import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function firstName(displayName: string | null | undefined): string {
  if (!displayName) return 'there'
  return displayName.trim().split(/\s+/)[0] ?? 'there'
}
