// Strict allow-list — only shown if a source matches a known, independent,
// reputable publication below. Everything else is hidden: company/investor
// press releases and foundation sites, MSN and other news-aggregator
// syndication, blogs/vlogs/content-farms, Wikipedia, and social media. A
// nominee dossier for a real executive should only cite sources jury members
// can independently trust — not the subject's own PR, not an unverified
// aggregator repost.

const LABEL_RULES = [
  { match: 'forbes',            label: 'Forbes India' },
  { match: 'economictimes',     label: 'Economic Times' },
  { match: 'business-standard', label: 'Business Standard' },
  { match: 'businessstandard',  label: 'Business Standard' },
  { match: 'businesstoday',     label: 'Business Today' },
  { match: 'livemint',          label: 'Mint' },
  { match: 'thehindubusinessline', label: 'The Hindu' },
  { match: 'thehindu',          label: 'The Hindu' },
  { match: 'moneycontrol',      label: 'Moneycontrol' },
  { match: 'ndtvprofit',        label: 'NDTV Profit' },
  { match: 'ndtv',              label: 'NDTV' },
  { match: 'cnbctv18',          label: 'CNBC-TV18' },
  { match: 'cnbc.com',          label: 'CNBC' },
  { match: 'bqprime',           label: 'BQ Prime' },
  { match: 'bloombergquint',    label: 'Bloomberg Quint' },
  { match: 'bloomberg',         label: 'Bloomberg' },
  { match: 'reuters',           label: 'Reuters' },
  { match: 'hindustantimes',    label: 'Hindustan Times' },
  { match: 'indianexpress',     label: 'The Indian Express' },
  { match: 'timesofindia',      label: 'Times of India' },
  { match: 'indiatoday',        label: 'India Today' },
  { match: 'financialexpress',  label: 'Financial Express' },
  { match: 'fortuneindia',      label: 'Fortune India' },
  { match: 'deccanherald',      label: 'Deccan Herald' },
  { match: 'theprint.in',       label: 'The Print' },
  { match: 'outlookbusiness',   label: 'Outlook Business' },
  { match: 'outlookindia',      label: 'Outlook India' },
  { match: 'news18',            label: 'News18' },
  { match: 'zeebiz',            label: 'Zee Business' },
  { match: 'etnownews',         label: 'ET Now' },
  { match: 'yourstory',         label: 'YourStory' },
  { match: 'inc42',             label: 'Inc42' },
  { match: 'vccircle',          label: 'VCCircle' },
  { match: 'entrackr',          label: 'Entrackr' },
  { match: 'pib.gov.in',        label: 'Press Information Bureau' },
  { match: 'aima.in',           label: 'AIMA Records' },
]

export function formatSourceForDisplay(url) {
  if (!url) return null
  const lower = url.toLowerCase()

  for (const rule of LABEL_RULES) {
    if (lower.includes(rule.match)) return { label: rule.label, url }
  }

  return null // not a recognised independent publication — hide it
}

export function filterDisplaySources(urls = []) {
  return urls.map(formatSourceForDisplay).filter(Boolean)
}
