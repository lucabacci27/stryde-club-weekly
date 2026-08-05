# Turning a raw-bundle into the Stryde Club weekly digest

Input: `output/week-<dates>--raw-bundle.json` (produced by `scraper/consolidate.js`).
Output: a weekly Stryde Club newsletter draft — Markdown + HTML, saved to `output/`.

## The two-stage rewrite: Lupin, then Flo

The rewrite step is not one pass — it's two, using this project's existing
agent-mode pack (`Stryde Tools and Workflows/agents/`):

**Stage 1 — Lupin (financial analyst mode) analyzes the deals.** For every
story in the raw bundle that has real deal mechanics (a stake sale, a rights
deal, a financing, a sponsorship figure), Lupin rebuilds the numbers before
anything gets written in prose:
- What's the actual instrument — equity, revenue share, debt-like guaranteed
  return, an option? Don't take the source's "stake" language at face value.
- Basis check: cumulative vs. annual, per-deal vs. aggregate, gross vs. net.
- What's missing that the reporting glossed over (a buyback price, an implied
  valuation, an effective cost of capital, an interest rate)? Flag it as an
  open question, don't paper over it.
- Where two stories are comparable structures (e.g. two schools/leagues
  monetizing media rights differently), compare them explicitly — that
  comparison is usually more valuable than either story alone.

Lupin's output is a working note per deal-relevant story: the mechanics, the
basis check, and the open question — not yet newsletter prose.

**Stage 2 — Flo (synthesis mode) writes the article from Lupin's analysis.**
Flo's job is to find the industry trend connecting the week's deal-relevant
stories and lead with *that* — a short analytical framing of what's actually
changing in how sports/entertainment properties raise and structure capital
— using Lupin's numbers as evidence, not restating headlines. Every other
relevant update from the raw bundle goes below the lead, grouped by allocator
relevance (see structure below). A week with only one deal-relevant story
still gets a trend framing — connect it to the pattern from prior weeks
rather than writing a single-story lead.

## Prose rules (apply within each stage's output)

1. **Rewrite, don't copy.** Every headline and body sentence in the raw bundle is
   Daily Playbook's own wording (in turn often sourced from outlets like Front
   Office Sports, Sportico, The Athletic). Write new sentences that convey the
   same facts in Stryde's voice — don't lightly edit their phrasing. Keep each
   item to 2-4 sentences.
2. **Add a Stryde angle.** For each story, append one line of allocator-relevant
   context — why it matters to someone investing in sports/entertainment/adjacent
   alternatives (valuation signal, capital flow, governance risk, comp for a
   Stryde deal, etc). This is the part that makes it "in-house" rather than a
   reformatted copy.
3. **Regroup by allocator relevance, not the source's categories.** Suggested
   sections: **Capital & Deals** (financings, M&A, investor moves), **Valuations
   & Ownership** (stakes, rights sales, franchise values), **Leagues &
   Governance** (commissioners, rules, disputes), **Worth Watching** (smaller/
   miscellaneous items). Drop stories with no relevance to allocators rather
   than forcing a fit.
4. **Attribute.** Footer credits Daily Playbook as a curation input, and each
   item can carry a discreet "via [outlet]" using the `sourceUrl` domain from
   the raw bundle — don't hotlink Daily Playbook's own article, since this is
   an independent rewrite, not a repost.
5. **Cadence.** One edition per week, covering the editions gathered since the
   last run (normally the prior 5 weekday editions).
6. **Output is a draft, not a send.** This pipeline produces a reviewable file.
   Publishing to actual Stryde Club members is a separate, explicit action —
   never wire this step to auto-send.

## Running it

```
node scraper/scrape.js        # pull new editions since last run
node scraper/consolidate.js   # bundle them into one weekly package
```

Then the Lupin → Flo rewrite is done by a Claude session reading the
resulting `output/week-*--raw-bundle.json` against this guide — it's a
judgment-heavy two-stage analysis + synthesis, not a deterministic script.
