# Donna's Gmail ingestion — one-time setup

This connects Donna's unattended ingestion run to `donna@gostryde.com` via the Gmail API, using an OAuth
refresh token stored locally (same pattern as `run-weekly.ps1`'s local automation — no interactive login
at run time). Read-only scope only (`gmail.readonly`) — Donna never modifies or deletes mail.

## One-time setup (do this once)

1. **Create/select a Google Cloud project.** Go to https://console.cloud.google.com/, create a new
   project (e.g. "stryde-club-weekly") or pick an existing one.
2. **Enable the Gmail API.** In the project, go to "APIs & Services" → "Library" → search "Gmail API" →
   Enable.
3. **Configure the OAuth consent screen.** "APIs & Services" → "OAuth consent screen." If `gostryde.com`
   is a Google Workspace domain, choose **Internal** (simpler, no verification review needed, only usable
   by accounts on the domain). Otherwise choose External and add `donna@gostryde.com` as a test user.
4. **Create OAuth client credentials.** "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth
   client ID" → Application type: **Desktop app**. Download the resulting JSON.
5. **Save the downloaded file as `ingest/.oauth-client.json`** in this repo (already git-ignored — never
   commit it). It should look like `{"installed": {"client_id": "...", "client_secret": "...", ...}}`.
6. **Run the one-time authorization:**
   ```
   cd "Stryde Tools and Workflows/daily-playbook-digest"
   npm install
   node ingest/gmail-auth-setup.js
   ```
   This prints a Google auth URL. Open it **logged in as `donna@gostryde.com`**, approve read-only Gmail
   access, and the script catches the redirect automatically and writes the refresh token to
   `ingest/.gmail-credentials.json` (also git-ignored). You only need to do this once — the refresh token
   doesn't expire from normal use.

## After setup

`ingest/gmail-client.js` exports `getGmailClient()`, which reads both git-ignored files and returns an
authenticated Gmail API client (`googleapis`'s `gmail('v1')`) ready for Donna's actual ingestion logic
(listing/fetching messages since the last run) to build on.

**Not yet built:** the actual message-parsing step (raw email → story-unit schema) — deliberately held off
until real subscriptions exist to test against, per `REWRITE_GUIDE.md`'s "generic vs per-source parsing"
open item. This setup only gets Donna to "can read the inbox," not "can parse Sportico vs. Sportcal vs.
Ecofoot correctly."
