import { existsSync, readFileSync } from 'node:fs'

const redirectsPath = 'public/_redirects'

if (!existsSync(redirectsPath)) {
  process.exit(0)
}

const content = readFileSync(redirectsPath, 'utf8')
if (/\/index\.html/.test(content)) {
  console.error(
    'Deploy blocked: public/_redirects rewrites to index.html, which conflicts with wrangler.jsonc assets.not_found_handling = "single-page-application". Remove public/_redirects and rely on wrangler SPA routing instead.',
  )
  process.exit(1)
}
