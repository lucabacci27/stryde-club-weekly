// One-time OAuth setup for Donna's Gmail ingestion. Run manually: `node ingest/gmail-auth-setup.js`.
// See ingest/README.md for the full setup sequence (Cloud project, OAuth client, etc).
const fs = require('fs');
const path = require('path');
const http = require('http');
const { google } = require('googleapis');

const OAUTH_CLIENT_PATH = path.join(__dirname, '.oauth-client.json');
const CREDENTIALS_PATH = path.join(__dirname, '.gmail-credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const REDIRECT_PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/oauth2callback`;

async function main() {
  if (!fs.existsSync(OAUTH_CLIENT_PATH)) {
    console.error(
      `Missing ${OAUTH_CLIENT_PATH}.\n` +
      'Download the OAuth client JSON from Google Cloud Console (Desktop app type) and save it there. ' +
      'See ingest/README.md steps 1-5.'
    );
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(OAUTH_CLIENT_PATH, 'utf8'));
  const clientConfig = raw.installed || raw.web;
  if (!clientConfig) {
    console.error('Unrecognized OAuth client JSON shape — expected an "installed" or "web" key.');
    process.exit(1);
  }

  const oAuth2Client = new google.auth.OAuth2(
    clientConfig.client_id,
    clientConfig.client_secret,
    REDIRECT_URI
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // forces a refresh_token even on repeat runs
    scope: SCOPES,
  });

  console.log('\nOpen this URL, log in as donna@gostryde.com, and approve access:\n');
  console.log(authUrl);
  console.log('\nWaiting for the redirect back to this machine...\n');

  const code = await waitForAuthCode();

  const { tokens } = await oAuth2Client.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      'No refresh_token came back. This usually means consent was already granted previously without ' +
      '"prompt: consent" forcing a fresh one — revoke access at https://myaccount.google.com/permissions ' +
      '(as donna@gostryde.com) and re-run this script.'
    );
    process.exit(1);
  }

  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(tokens, null, 2));
  console.log(`Saved refresh token to ${CREDENTIALS_PATH}. Setup complete — this only needs to run once.`);
}

function waitForAuthCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== '/oauth2callback') {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(error
        ? `<h1>Authorization failed: ${error}</h1><p>You can close this tab.</p>`
        : '<h1>Authorized.</h1><p>You can close this tab and return to the terminal.</p>');
      server.close();
      if (error) reject(new Error(error));
      else resolve(code);
    });
    server.listen(REDIRECT_PORT);
  });
}

main().catch((err) => {
  console.error('Auth setup failed:', err.message);
  process.exit(1);
});
