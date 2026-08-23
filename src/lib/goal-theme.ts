import {
  GraduationCap,
  Home,
  Palmtree,
  Plane,
  Shield,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'

export type GoalTheme = {
  icon: LucideIcon
  gradient: string
  accent: string
  progress: string
}

const themes: { match: RegExp; theme: GoalTheme }[] = [
  {
    match: /retire|pension|future/i,
    theme: {
      icon: Palmtree,
      gradient: 'from-[#6657E8] to-[#4F46C8]',
      accent: '#6657E8',
      progress: '#6657E8',
    },
  },
  {
    match: /emergency|safety|buffer/i,
    theme: {
      icon: Shield,
      gradient: 'from-[#57C7A3] to-[#3DAF8A]',
      accent: '#57C7A3',
      progress: '#57C7A3',
    },
  },
  {
    match: /child|education|college|school/i,
    theme: {
      icon: GraduationCap,
      gradient: 'from-[#FF9B7A] to-[#F07A5A]',
      accent: '#FF9B7A',
      progress: '#FF9B7A',
    },
  },
  {
    match: /home|house|property/i,
    theme: {
      icon: Home,
      gradient: 'from-[#6BB8E8] to-[#4A9FD4]',
      accent: '#6BB8E8',
      progress: '#6BB8E8',
    },
  },
  {
    match: /travel|vacation|trip/i,
    theme: {
      icon: Plane,
      gradient: 'from-[#6BB8E8] to-[#57A8E0]',
      accent: '#6BB8E8',
      progress: '#6BB8E8',
    },
  },
]

const defaultTheme: GoalTheme = {
  icon: Target,
  gradient: 'from-[#6657E8] to-[#7B6FF0]',
  accent: '#6657E8',
  progress: '#6657E8',
}

export function getGoalTheme(name: string, index = 0): GoalTheme {
  const matched = themes.find((entry) => entry.match.test(name))
  if (matched) return matched.theme
  const fallbacks: GoalTheme[] = [
    defaultTheme,
    {
      icon: Sparkles,
      gradient: 'from-[#57C7A3] to-[#45B892]',
      accent: '#57C7A3',
      progress: '#57C7A3',
    },
    {
      icon: Target,
      gradient: 'from-[#FF9B7A] to-[#F08A68]',
      accent: '#FF9B7A',
      progress: '#FF9B7A',
    },
  ]
  return fallbacks[index % fallbacks.length] ?? defaultTheme
}
