export const LOADING_QUOTES = [
  {
    text: 'Wealth is built one deliberate decision at a time.',
    author: 'Nirvana',
  },
  {
    text: 'The stock market is a device for transferring money from the impatient to the patient.',
    author: 'Warren Buffett',
  },
  {
    text: 'Do not save what is left after spending — spend what is left after saving.',
    author: 'Warren Buffett',
  },
  {
    text: 'Beware of little expenses; a small leak will sink a great ship.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'Your net worth is not your self-worth.',
    author: 'Nirvana',
  },
  {
    text: 'Compound interest is the eighth wonder of the world. He who understands it, earns it.',
    author: 'Albert Einstein',
  },
  {
    text: 'A budget is telling your money where to go instead of wondering where it went.',
    author: 'Dave Ramsey',
  },
  {
    text: 'Inflation is when you pay fifteen dollars for the ten-dollar haircut you used to get for five.',
    author: 'Sam Ewing',
  },
  {
    text: 'You are not tracking numbers — you are building a future.',
    author: 'Nirvana',
  },
  {
    text: 'The goal isn’t more money. The goal is living life on your terms.',
    author: 'Chris Brogan',
  },
  {
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'Calm money habits beat clever shortcuts every time.',
    author: 'Nirvana',
  },
  {
    text: 'The safest way to double your money is to fold it over and put it in your pocket.',
    author: 'Kin Hubbard',
  },
  {
    text: 'Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.',
    author: 'Ayn Rand',
  },
  {
    text: 'Progress, not perfection, creates lasting wealth.',
    author: 'Nirvana',
  },
] as const

export function pickLoadingQuote() {
  return LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)] ?? LOADING_QUOTES[0]
}

let sessionQuote: (typeof LOADING_QUOTES)[number] | null = null

/** One quote per page load — survives LoadingScreen remounts and Strict Mode. */
export function getSessionLoadingQuote() {
  sessionQuote ??= pickLoadingQuote()
  return sessionQuote
}
