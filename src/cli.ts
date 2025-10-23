#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Check if .env file exists in current directory and load it
const envPath = path.join(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('redash-url', {
    alias: 'u',
    type: 'string',
    description: 'Redash instance URL'
  })
  .option('redash-api-key', {
    alias: 'k',
    type: 'string',
    description: 'Redash API key'
  })
  .option('redash-timeout', {
    alias: 't',
    type: 'number',
    description: 'Request timeout in milliseconds',
    default: 30000
  })
  .option('ignore-ssl-errors', {
    alias: 's',
    type: 'boolean',
    description: 'Ignore SSL certificate errors (useful for self-signed certificates)',
    default: false
  })
  .help()
  .parseSync();

// Get configuration from CLI args or environment variables
const redashUrl = argv['redash-url'] || process.env.REDASH_URL;
const redashApiKey = argv['redash-api-key'] || process.env.REDASH_API_KEY;
const redashTimeout = argv['redash-timeout'] || parseInt(process.env.REDASH_TIMEOUT || '30000');
const ignoreSslErrors = argv['ignore-ssl-errors'] || process.env.REDASH_IGNORE_SSL_ERRORS === 'true';

// Check if we have the required configuration
if (!redashUrl || !redashApiKey) {
  console.error('Error: Missing required Redash configuration');
  console.error('');
  console.error('You can provide configuration in one of these ways:');
  console.error('');
  console.error('1. Command line arguments:');
  console.error('   --redash-url https://your-redash-instance.com --redash-api-key your_api_key');
  console.error('');
  console.error('2. Environment variables in .env file:');
  console.error('   REDASH_URL=https://your-redash-instance.com');
  console.error('   REDASH_API_KEY=your_api_key');
  console.error('');
  console.error('3. Environment variables when running:');
  console.error('   REDASH_URL=https://your-redash-instance.com REDASH_API_KEY=your_key npx @suthio/redash-mcp');
  process.exit(1);
}

// Set global configuration for the MCP server
global.redashConfig = {
  url: redashUrl,
  apiKey: redashApiKey,
  timeout: redashTimeout,
  rejectUnauthorized: !ignoreSslErrors
};

// Run the MCP server
import('./index.js');
