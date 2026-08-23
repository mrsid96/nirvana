/** Bottom-tab routes — the four primary screens in the app shell. */
export const MAIN_TAB_ROUTES = ['/', '/wealth', '/loans', '/profile'] as const

export type MainTabRoute = (typeof MAIN_TAB_ROUTES)[number]

export function isMainTabRoute(pathname: string): pathname is MainTabRoute {
  return (MAIN_TAB_ROUTES as readonly string[]).includes(pathname)
}
