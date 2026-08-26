import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const logoPath = path.join(root, 'public/nirvana-logo-horizontal.png')
const outPng = path.join(root, 'public/og.png')
const outSvg = path.join(root, 'public/og.svg')

const logoBase64 = fs.readFileSync(logoPath).toString('base64')

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Nirvana — Try free">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F8F7F3"/>
      <stop offset="55%" stop-color="#F3F0FA"/>
      <stop offset="100%" stop-color="#EAF8F2"/>
    </linearGradient>
    <linearGradient id="cta" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6657E8"/>
      <stop offset="55%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#57C7A3"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6657E8" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#57C7A3" stop-opacity="0.14"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="80" r="220" fill="#6657E8" opacity="0.1"/>
  <circle cx="120" cy="580" r="240" fill="#57C7A3" opacity="0.12"/>
  <rect x="720" y="120" width="380" height="390" rx="36" fill="url(#glow)"/>

  <image href="data:image/png;base64,${logoBase64}" x="80" y="78" width="340" height="76" preserveAspectRatio="xMidYMid meet"/>

  <text x="88" y="248" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="500" fill="#202124">Your money is growing.</text>
  <text x="88" y="318" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="28" fill="#6F7177">Goals · Investments · Loans · Monthly progress</text>

  <rect x="88" y="392" width="318" height="64" rx="32" fill="url(#cta)"/>
  <text x="247" y="434" text-anchor="middle" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">Try Nirvana Free →</text>

  <text x="88" y="520" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="22" fill="#6F7177">Track today. Plan tomorrow. Build your future.</text>
</svg>`

fs.writeFileSync(outSvg, svg)

await sharp(Buffer.from(svg)).png().toFile(outPng)

console.log('Generated public/og.svg and public/og.png')
