# Turning a raw-bundle into Stryde Club consumer content

Input: `output/week-<dates>--raw-bundle.json` (produced by `scraper/consolidate.js`).
Output: a weekly Stryde Club newsletter draft — Markdown + HTML, saved to `output/`.

**This pipeline is building toward consumer-facing distribution, not an internal-only artifact** (Luca,
2026-08-12): the newsletter, the content hub, and socials all draw from the same weekly bundle. That's why
**Loki** is now a standing stage (below) rather than an edge case — every one of those channels is
something an outsider sees, so the `assets/dfsa-language.md` guardrails are live on every run, not a
someday concern. **Open item, not yet designed:** how one week's Flo draft actually gets cut into a
content-hub piece and individual social posts (one full-length asset vs. several atomized ones) — Loki
gives the angle per channel, but nothing in the pack yet writes the finished social copy itself. Flag this
for Luca before assuming social posts fall out of the pipeline automatically.

**Pending the multi-source inbox pivot** (see
`Marketing/Stryde-Newsletter-Automation-v2-handoff-2026-08-05.md`): once ingestion runs against
`donna@gostryde.com` instead of a single scrape, `output/week-*--raw-bundle.json` becomes **Donna's**
output rather than `consolidate.js`'s directly — she owns dedup and the week/month tagging across 20+
sources, with `scrape.js` demoted to her hybrid-fallback path for sources with no clean signup (Ecofoot).
Everything below (Lupin → Flo, and the prose rules) is unchanged by that pivot; it's the input bundle's
shape and provenance that expands, not the rewrite discipline.

## The rewrite: Donna, then Lupin, then Flo, then Loki

The rewrite step is not one pass — it's a chain, using this project's existing
agent-mode pack (`Stryde Tools and Workflows/agents/`):

**Stage 0 — Donna (inbox orchestration) builds the bundle.** She ingests everything new since the last
run — the subscribed inbox plus any hybrid-fallback scrapes — dedupes across sources, tags every story
against both the current week and month, flags which stories carry real deal mechanics, and logs any
source that failed to parse or went quiet. Her output is the `raw-bundle.json` that Stage 1 reads. See
`agents/donna.md`.

**Lupin and Flo both work across the ENTIRE week's bundle, not one edition.**
The raw bundle normally contains all 5 weekday editions gathered since the
last run (multiple sources per day, once the inbox pivot lands). Lupin
analyzes every deal-relevant story across all of them together — never just
the newest edition — and Flo's throughline has to connect patterns across
the whole week, not spotlight a single day's story.

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
- Where two stories from *anywhere in the week's bundle* are comparable
  structures (e.g. two schools/leagues monetizing media rights differently,
  even if they ran on different days), compare them explicitly — that
  comparison is usually more valuable than either story alone, and it's the
  raw material the throughline in Stage 2 is built from.

Lupin's output is a working note per deal-relevant story: the mechanics, the
basis check, and the open question — not yet newsletter prose.

**Stage 2 — Flo (synthesis mode) writes the article from Lupin's analysis.**
Flo's job is to find the ONE throughline trend connecting stories across the
*whole week's* bundle and lead with that — a short analytical framing of
what's actually changing in how sports/entertainment properties raise and
structure capital, or in governance, or in valuation — using Lupin's numbers
as evidence, not restating headlines. The throughline should draw on at
least two distinct editions/days when the bundle has them; a lead built from
a single day's news, when five days are available, is a bug, not a style
choice. A week with only one deal-relevant story still gets a trend framing —
connect it to the pattern from prior weeks rather than writing a
single-story lead. Every other relevant update from the raw bundle goes below
the lead, grouped by **region**, not by theme (see structure below).

Flo's output at this point is the full weekly digest — the newsletter-length asset. It is not yet cleared
for any channel; that's Stage 3.

**Phase boundary — this is where the build stops today.** The operational target right now (2026-08-12)
is Donna → Lupin → Flo → **post the draft to `#marketing-newsletter-automation` in Slack** for Luca's
review, once the inbox provider is confirmed and the webhook URL is in hand (see the open items in the v2
handoff). Stage 3 below (Loki) is the **Phase 2+** step — it activates once actual external
publishing (chatbot-fed content hub, real newsletter sends, socials) is being built, not before. Don't run
Loki against every weekly cycle yet; run Donna → Lupin → Flo → Slack until Phase 2 starts.

**Stage 3 — Loki (positioning mode) frames it per destination, once Phase 2 starts.** Flo's draft is
written once; Loki does not try to make that single draft serve three audiences. She runs a separate
framing pass for each channel this bundle is actually going to:
- **Newsletter** — closest to Flo's draft as-is; Loki's job here is mainly the guardrail check (no return
  figures, no valuations stated as fact beyond what the original outlet reported, no "you'll get
  allocation" framing) rather than a rewrite.
- **Content hub** — a distinct hook for a site visitor with no prior context, not the subscriber framing
  reused verbatim. Audience-first: what does a cold reader need to believe first?
- **Socials** — the sharpest single claim per post, one position per message, per her own operating
  discipline. Loki produces the angle and the proof points allowed to be used, not the finished post copy
  — writing the actual social post from that brief is still a manual step today.
Every pass runs inside `assets/dfsa-language.md`: signal, never promise. Loki's output for each channel is
**the angle → proof points → explicit "what NOT to say" list**, not a finished send-ready asset.

## Prose rules (apply within each stage's output)

1. **Rewrite, don't copy.** Every headline and body sentence in the raw bundle is
   Daily Playbook's own wording (in turn often sourced from outlets like Front
   Office Sports, Sportico, The Athletic). Write new sentences that convey the
   same facts in Stryde's voice — don't lightly edit their phrasing. Keep each
   item to 2-4 sentences.
2. **Add a Stryde angle — inside the guardrail, every time.** For each story, append one line of
   allocator-relevant context — why it matters to someone investing in sports/entertainment/adjacent
   alternatives (valuation signal, capital flow, governance risk, market-structure comp, etc). This is the
   part that makes it "in-house" rather than a reformatted copy. **Two hard limits, per
   `assets/dfsa-language.md`:** never reference Stryde's own pipeline, deal names, or counterparties (this
   is third-party market commentary, not a description of what Stryde is doing) — and never phrase the
   angle as a return/performance claim ("this signals 3x returns are possible" is a promise; "this signals
   rights valuations are re-rating upward" is a structural observation). If a story is genuinely about a
   Stryde deal or counterparty, it doesn't belong in this pipeline at all — that's a Zee/Hadi-controlled
   announcement, not a Daily-Playbook-style curation item.
3. **Regroup by region, not the source's categories or a theme.** Sections
   are: **MENA**, **Europe**, **Americas**, **Asia & Oceania**, and
   **Global & Cross-Border** (governance bodies like FIFA, leagues or capital
   flows spanning more than one region — don't force these into a single
   region just to avoid a fifth section). Add a **Sub-Saharan Africa** section
   only in the rare week a story actually belongs there — MENA does not cover
   it, and folding an African story into MENA by default would misrepresent
   it. Within each region section, stories are still ordered by allocator
   relevance, and irrelevant stories are still dropped. Empty regions are
   expected some weeks (this source leans heavily US-centric) — log which
   regions came up empty rather than silently omitting the section, so it's
   visible whether that's a real gap in the industry or just this source's
   coverage bias.
4. **Attribute.** Footer credits Daily Playbook as a curation input, and each
   item can carry a discreet "via [outlet]" using the `sourceUrl` domain from
   the raw bundle — don't hotlink Daily Playbook's own article, since this is
   an independent rewrite, not a repost.
5. **Disclosure line, on anything that leaves internal review.** Once a piece is cleared past Luca's
   Slack review (Phase 1) toward an actual public channel (Phase 2+), it carries one of
   `assets/dfsa-language.md`'s standing disclosure lines verbatim — the **Short disclaimer**
   ("DFSA-licensed · Qualified investors only · Capital governed by DIFC regulatory framework") at minimum
   on every asset, the **Full footer** on the long-form newsletter/content-hub version. This is a
   regulatory requirement, not a style choice — don't paraphrase it.
6. **Cadence.** One edition per week, covering the editions gathered since the
   last run (normally the prior 5 weekday editions).
7. **Output is a draft, not a send — and there are two distinct gates, not one.** This pipeline never
   auto-publishes. Two separate approvals, not one vague "human review":
   - **Luca's review** (Phase 1, in Slack) — accuracy, quality, does the throughline hold up. This is the
     gate that exists today.
   - **Zee/Hadi sign-off** (Phase 2+, before anything reaches an actual external channel) — required by
     `assets/dfsa-language.md`'s conduct rule: *"No public statements... about Stryde... without prior
     written sign-off from Zee/Hadi."* This applies to every edition/post, not just ones naming a Stryde
     deal — the pipeline itself is a public statement once it's live on a public channel. Luca approving
     the draft is necessary but not sufficient; it doesn't substitute for this gate. Not yet wired into a
     concrete workflow step — flagged as an open item until Phase 2 design locks this down.

## Optional finishing pass — on hold

Once Flo's draft exists, the **Daisy** mode (`agents/daisy.md`) could take the Markdown/HTML and format it
in Stryde's house look for internal review. **Holding off on wiring this in while the house design
templates are being redone** — no point formatting to a look that's about to change. Revisit once the new
templates land (`assets/house-templates.md` / `assets/brand-lite.md`).

## Running it

**Current (single-source scrape, pre-pivot):**
```
node scraper/scrape.js        # pull new editions since last run
node scraper/consolidate.js   # bundle them into one weekly package
```

**Once the inbox pivot lands:** Donna's ingestion run replaces the two commands above and produces the
same `raw-bundle.json` shape, sourced from `donna@gostryde.com` plus any hybrid-fallback scrapes.

Either way, the Lupin → Flo rewrite is done by a Claude session reading the resulting
`output/week-*--raw-bundle.json` (or the month-tagged equivalent for the monthly rollup) against this
guide — it's judgment-heavy analysis + synthesis, not a deterministic script.
