export const products = [
  {
    slug: "perpetuals",
    title: "Perpetual Futures",
    blurb: "Listed perpetual futures with crypto margin — always-on, no expiry clock.",
    page: "Trade 24/7 index-linked perps with a single collateral pool and transparent funding windows.",
  },
  {
    slug: "spot",
    title: "Leveraged Spot",
    blurb: "Retail spot with listed leverage on the same rails as listed derivatives.",
    page: "Buy and sell the underlying with defined leverage bands, delivery, and the same clearing account.",
  },
  {
    slug: "futures-options",
    title: "Futures & Options",
    blurb: "Crypto-margined and crypto-settled dated futures and options.",
    page: "Dated contracts that settle in the asset itself so hedges map to actual inventory, not a cash proxy.",
  },
]

export const productBands = ["bg-paper", "bg-mist", "bg-fog"]

export const pillars = [
  {
    n: "01",
    title: "Regulated",
    body: "Designed as a US-style listed stack: exchange, clearing, and brokerage in one operating group.",
  },
  {
    n: "02",
    title: "Leverage",
    body: "Maximize capital efficiency with up to 6x leverage on eligible margin trades.*",
    note: "* Margin rates are illustrative and subject to change.",
  },
  {
    n: "03",
    title: "Crypto Settlement",
    body: "Settle in the underlying digital asset for inventory management, hedging, and precise price discovery.",
  },
  {
    n: "04",
    title: "Crypto Margin",
    body: "Post digital assets as collateral against listed products instead of converting everything to fiat first.",
  },
  {
    n: "05",
    title: "Tax Benefits",
    body: "Eligible listed contracts may qualify for blended long/short-term treatment under US futures rules.*",
    note: "* Not tax advice. Consult your advisor before making any investment.",
  },
  {
    n: "06",
    title: "No Pre-Collateralization",
    body: "Hold on to your assets until you take the contract to delivery.*",
    note: "* Except for event contracts.",
  },
  {
    n: "07",
    title: "Unified Clearing",
    body: "Single collateral pool across perpetuals, futures, options, and spot on one integrated clearinghouse.",
  },
]

export const faqs = [
  {
    q: "Is Northclear a live licensed exchange?",
    a: "This site is a product prototype inspired by US-regulated DCM / DCO / FCM architecture. It is a design and UX demo — not an offer to trade, and not affiliated with Bitnomial or Payward.",
  },
  {
    q: "Is Northclear only open to US residents?",
    a: "In the product vision, accounts are available to eligible US and international participants after identity checks and, for futures, an FCM onboarding flow. Check local rules before assuming access.",
  },
  {
    q: "What is Cleardeck?",
    a: "Cleardeck is Northclear’s trading technology platform: perpetuals, dated futures, options, leveraged spot, and event contracts in one interface, one margin view, and one drop-copy.",
  },
  {
    q: "How does crypto margin work?",
    a: "Eligible digital assets can be posted as collateral. Haircuts, concentration limits, and variation margin are applied by the clearing model before you can leverage a position.",
  },
  {
    q: "Do contracts settle in crypto?",
    a: "Listed physically settled products deliver the underlying at expiry. Cash-settled event contracts pay in the account’s settlement currency.",
  },
]

export const press = [
  {
    source: "Wire Desk",
    title: "Northclear lists SOL calendar futures, extending listed access beyond bitcoin and ether",
    date: "July 12, 2026",
  },
  {
    source: "Market Note",
    title: "Two FCMs connect to Northclear clearing, widening access to event contracts and crypto-margined perps",
    date: "June 04, 2026",
  },
  {
    source: "Industry Brief",
    title: "Northclear launches a unified listed stack: perps, options, leveraged spot, and predictions",
    date: "May 18, 2026",
  },
]

export const posts = [
  {
    tag: "Regulation",
    title: "The listing fast lane still starts on a DCM",
    excerpt:
      "Shorter ETF clocks do not replace a designated contract market. For any asset that wants institutional rails, the path still starts with a transparent order book and a clearinghouse.",
    date: "March 02, 2026",
  },
  {
    tag: "Product",
    title: "Digital assets as first-class margin",
    excerpt:
      "If the collateral is the inventory you already hold, hedging stops being a cash-management problem. Northclear’s model treats crypto as margin and as settlement, not as a side wallet.",
    date: "December 11, 2025",
  },
  {
    tag: "Product",
    title: "Why crypto-settled futures matter",
    excerpt:
      "Cash-settled crypto futures track a number. Physically settled contracts move the asset. That difference unlocks inventory finance, basis books, and options overlays that cash contracts cannot replicate.",
    date: "October 08, 2025",
  },
]

export const markets = [
  { symbol: "BTC-PERP", last: "67,412.5", change: "+1.24%", vol: "1.82B", type: "Perpetual" },
  { symbol: "ETH-PERP", last: "3,508.20", change: "+0.61%", vol: "940M", type: "Perpetual" },
  { symbol: "SOL-PERP", last: "178.44", change: "-0.88%", vol: "312M", type: "Perpetual" },
  { symbol: "BTC-Z26", last: "68,050", change: "+0.42%", vol: "210M", type: "Future" },
  { symbol: "ETH-Z26", last: "3,562", change: "+0.19%", vol: "88M", type: "Future" },
  { symbol: "BTC-P68000", last: "1,240", change: "+4.10%", vol: "41M", type: "Option" },
  { symbol: "BTC-SPOT", last: "67,390", change: "+1.18%", vol: "620M", type: "Spot" },
  { symbol: "ETH-SPOT", last: "3,501.8", change: "+0.55%", vol: "275M", type: "Spot" },
  { symbol: "CPI-YES", last: "0.62", change: "+3.2%", vol: "19M", type: "Event" },
]

export const books = [
  { price: "67,418", size: "2.41", side: "ask" },
  { price: "67,416", size: "1.10", side: "ask" },
  { price: "67,415", size: "4.88", side: "ask" },
  { price: "67,412", size: "3.02", side: "bid" },
  { price: "67,410", size: "6.15", side: "bid" },
  { price: "67,408", size: "1.77", side: "bid" },
]
