// Wikipedia is still used internally for verification — this only controls
// which citation links are shown to jury/head jury. Executive-facing sources
// only; social/reference-wiki sources are never displayed even if present.

const LABEL_RULES = [
  { match: 'forbes',          label: 'Forbes India' },
  { match: 'economictimes',   label: 'Economic Times' },
  { match: 'businessstandard',label: 'Business Standard' },
  { match: 'businesstoday',   label: 'Business Today' },
  { match: 'livemint',        label: 'Mint' },
  { match: 'thehindu',        label: 'The Hindu' },
  { match: 'hindubusinessline', label: 'The Hindu' },
  { match: 'moneycontrol',    label: 'Moneycontrol' },
  { match: 'ndtv',            label: 'NDTV Profit' },
  { match: 'cnbctv18',        label: 'CNBC-TV18' },
  { match: 'aima.in',         label: 'AIMA Records' },
]

const HIDDEN = ['wikipedia', 'wiki', 'linkedin', 'duckduckgo', 'twitter', 'x.com', 'facebook', 'instagram']

export function formatSourceForDisplay(url) {
  if (!url) return null
  const lower = url.toLowerCase()
  if (HIDDEN.some(h => lower.includes(h))) return null

  for (const rule of LABEL_RULES) {
    if (lower.includes(rule.match)) return { label: rule.label, url }
  }

  return null // hide unrecognised sources — only the whitelist above is shown
}

export function filterDisplaySources(urls = []) {
  return urls.map(formatSourceForDisplay).filter(Boolean)
}
