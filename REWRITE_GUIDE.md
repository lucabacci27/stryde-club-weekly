# Turning a raw-bundle into the Stryde Club weekly digest

Input: `output/week-<dates>--raw-bundle.json` (produced by `scraper/consolidate.js`).
Output: a weekly Stryde Club newsletter draft — Markdown + HTML, saved to `output/`.

## Rules

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
   last run (normally the prior 5 weekday editions). Lead with the single most
   allocator-relevant story of the week, then move section by section.
6. **Output is a draft, not a send.** This pipeline produces a reviewable file.
   Publishing to actual Stryde Club members is a separate, explicit action —
   never wire this step to auto-send.

## Running it

```
node scraper/scrape.js        # pull new editions since last run
node scraper/consolidate.js   # bundle them into one weekly package
```

Then the rewrite itself is done by a Claude session reading the resulting
`output/week-*--raw-bundle.json` against this guide — it's a judgment-heavy
rewrite step, not a deterministic script.
