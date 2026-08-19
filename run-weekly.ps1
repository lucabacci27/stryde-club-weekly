# Weekly Stryde Club digest pipeline -- run locally by Windows Task Scheduler.
# Scrapes new Daily Playbook editions, and if there are any, hands them to a
# headless Claude Code session that does the two-stage Lupin -> Flo rewrite
# (see REWRITE_GUIDE.md) and commits/pushes the result. Uses this machine's
# own git credentials, so it needs no cloud environment, no GitHub App, and
# no network-egress allowlist.

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
Set-Location $ProjectDir

function Show-Toast($title, $message) {
    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $textNodes = $template.GetElementsByTagName("text")
        $textNodes.Item(0).AppendChild($template.CreateTextNode($title)) | Out-Null
        $textNodes.Item(1).AppendChild($template.CreateTextNode($message)) | Out-Null
        $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Stryde Club Weekly").Show($toast)
    } catch {
        Write-Host "(toast notification unavailable: $_)"
    }
}

Write-Host "=== Stryde Club Weekly -- $(Get-Date) ==="

npm install --silent 2>&1 | Write-Host

$scrapeLines = node scraper/scrape.js 2>&1
$scrapeLines | ForEach-Object { Write-Host $_ }

if ($scrapeLines -match "No new editions since last run") {
    Write-Host "Nothing new -- stopping without touching git."
    Show-Toast "Stryde Club Weekly" "No new Daily Playbook editions since last run -- nothing to do."
    exit 0
}

node scraper/consolidate.js 2>&1 | Write-Host

$commitBefore = (git rev-parse HEAD).Trim()

$prompt = @"
Read REWRITE_GUIDE.md in this repo -- it's the rulebook for what you're about to do, including the two-stage Lupin (financial analyst mode) -> Flo (synthesis mode) rewrite process using this project's agent-mode pack at 'Stryde Tools and Workflows/agents/'.

The newest raw bundle is already written to output/week-*--raw-bundle.json (just produced by scraper/consolidate.js) and normally contains all editions since last week's run, not just one day. Do this:

1. Read the new raw bundle in full -- every edition in it, not just the most recent one.
2. Lupin pass: across the WHOLE bundle, for every deal-relevant story, rebuild the mechanics, run a basis check, and flag what's missing or unsourced (buyback prices, implied valuations, term lengths, effective cost of capital) -- don't take the source's framing at face value. Explicitly compare stories across different days when they're structurally comparable.
3. Flo pass: write the actual digest from Lupin's analysis. Lead with the ONE throughline trend connecting stories from across the whole week (drawing on at least two different days when the bundle has them -- a single-day lead when five days are available is a bug), using Lupin's numbers as evidence. List the week's other relevant updates below the lead, grouped by REGION: MENA / Europe / Americas / Asia and Oceania / Global and Cross-Border (for FIFA-style governance stories or anything spanning multiple regions) / Sub-Saharan Africa (only if a story actually belongs there). Drop stories with no allocator relevance. Note in your final report which regions came up empty.
4. Produce output/<date>-stryde-weekly.md and output/<date>-stryde-weekly.html, dated with today's Monday. Copy the most recent prior *.html file in output/ as your exact visual template (same CSS, same structure, same theme tokens) -- only replace content and the date line. Keep the 'Internal draft' banner and 'Draft only -- not yet approved' footer line intact, always.
5. Commit and push everything (raw/, output/, state.json) to main with a clear commit message. This machine's git already has push access -- no GitHub App or token needed.

Never publish, email, or send this digest to actual Stryde Club members or any external audience. This only ever produces a draft for Luca to review by hand.
"@

claude -p $prompt --dangerously-skip-permissions
$claudeExit = $LASTEXITCODE

# claude -p exiting 0 only means the process didn't crash -- it does NOT mean the
# digest actually got written, committed, and pushed. Verify the real artifact
# instead of trusting the process exit code alone (this is what silently let the
# 2026-08-17 run report success while producing nothing -- see run-weekly.log).

$commitAfter = (git rev-parse HEAD).Trim()
$committed = $commitAfter -ne $commitBefore

$digestWasChanged = $false
if ($committed) {
    $changedFiles = git diff --name-only $commitBefore $commitAfter
    $digestWasChanged = ($changedFiles -match 'output/.*-stryde-weekly\.md$').Count -gt 0
}

$pushedOk = $false
if ($committed) {
    git fetch origin main --quiet 2>&1 | Write-Host
    $remoteHead = (git rev-parse origin/main).Trim()
    $pushedOk = $remoteHead -eq $commitAfter
}

$success = ($claudeExit -eq 0) -and $committed -and $digestWasChanged -and $pushedOk

if ($success) {
    Write-Host "Verified: new commit $commitAfter includes a digest file and is pushed to origin/main."
    Show-Toast "Stryde Club Weekly" "This week's draft is ready and pushed to the repo for review."
    exit 0
} else {
    $reasons = @()
    if ($claudeExit -ne 0) { $reasons += "claude -p exited $claudeExit" }
    if (-not $committed) { $reasons += "no new commit was created" }
    if ($committed -and -not $digestWasChanged) { $reasons += "the new commit doesn't touch an output/*-stryde-weekly.md file" }
    if ($committed -and -not $pushedOk) { $reasons += "the new commit wasn't pushed to origin/main" }
    $reasonText = $reasons -join "; "
    Write-Host "FAILED: $reasonText"
    Show-Toast "Stryde Club Weekly" "Digest run did not complete: $reasonText -- check run-weekly.log."
    exit 1
}
