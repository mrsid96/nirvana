import { getSessionLoadingQuote } from '@/lib/loading-quotes'
import { NirvanaLoaderLogo } from '@/components/NirvanaLogo'

const quote = getSessionLoadingQuote()

export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <NirvanaLoaderLogo size="hero" className="mb-8" />
      <p className="max-w-sm font-serif text-lg leading-relaxed text-ink dark:text-[#f5f5f4]">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="mt-3 text-sm text-ink-muted dark:text-[#a8a29e]">— {quote.author}</p>
      <div className="mt-10 flex gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent/60"
            style={{ animationDelay: `${dot * 200}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
