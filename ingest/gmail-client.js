// Authenticated Gmail API client for Donna's ingestion, built from the one-time setup in
// gmail-auth-setup.js. See ingest/README.md.
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const OAUTH_CLIENT_PATH = path.join(__dirname, '.oauth-client.json');
const CREDENTIALS_PATH = path.join(__dirname, '.gmail-credentials.json');

function getGmailClient() {
  if (!fs.existsSync(OAUTH_CLIENT_PATH) || !fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      'Gmail not authorized yet — run `node ingest/gmail-auth-setup.js` first (see ingest/README.md).'
    );
  }

  const { installed, web } = JSON.parse(fs.readFileSync(OAUTH_CLIENT_PATH, 'utf8'));
  const clientConfig = installed || web;
  const tokens = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

  const oAuth2Client = new google.auth.OAuth2(clientConfig.client_id, clientConfig.client_secret);
  oAuth2Client.setCredentials(tokens);

  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

module.exports = { getGmailClient };
