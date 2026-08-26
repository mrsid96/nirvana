import { getSessionLoadingQuote } from '@/lib/loading-quotes'
import { NirvanaLoaderLogo } from '@/components/NirvanaLogo'

const quote = getSessionLoadingQuote()

export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="loader-brand-mark mb-10" aria-hidden>
        <div className="loader-brand-ring" />
        <div className="loader-brand-glow" />
        <NirvanaLoaderLogo size="hero" className="relative z-10 loader-brand-logo" />
      </div>

      <p className="loader-quote max-w-sm font-serif text-lg leading-relaxed text-ink dark:text-[#f5f5f4]">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="mt-3 text-sm text-ink-muted dark:text-[#a8a29e]">— {quote.author}</p>

      <div className="loader-progress mt-10" role="progressbar" aria-label="Loading">
        <div className="loader-progress-track">
          <div className="loader-progress-bar" />
        </div>
      </div>
    </div>
  )
}
