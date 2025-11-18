#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as archiveQuery from './commands/archiveQuery.js';
import * as createDashboard from './commands/createDashboard.js';
import * as createQuery from './commands/createQuery.js';
import * as createWidget from './commands/createWidget.js';
import * as doctor from './commands/doctor.js';
import * as executeQuery from './commands/executeQuery.js';
import * as executeRawQuery from './commands/executeRawQuery.js';
import * as getDashboard from './commands/getDashboard.js';
import * as getQuery from './commands/getQuery.js';
import * as getVisualization from './commands/getVisualization.js';
import * as listDashboards from './commands/listDashboards.js';
import * as listDataSources from './commands/listDataSources.js';
import * as listQueries from './commands/listQueries.js';
import * as updateQuery from './commands/updateQuery.js';
import * as updateWidget from './commands/updateWidget.js';

// Check if .env file exists in current directory and load it
const envPath = path.join(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const version = '0.0.2';

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .command(archiveQuery)
  .command(createDashboard)
  .command(createQuery)
  .command(createWidget)
  .command(doctor)
  .command(executeQuery)
  .command(executeRawQuery)
  .command(getDashboard)
  .command(getQuery)
  .command(getVisualization)
  .command(listDashboards)
  .command(listDataSources)
  .command(listQueries)
  .command(updateQuery)
  .command(updateWidget)
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
  .version(version)
  .alias('v', 'version')
  .help()
  .recommendCommands()
  .strict()
  .parseSync();

// Get configuration from CLI args or environment variables
const redashUrl = argv['redash-url'] || process.env.REDASH_URL;
const redashApiKey = argv['redash-api-key'] || process.env.REDASH_API_KEY;

// If no command is given, start the server
if (argv._.length === 0) {
    // Check if we have the required configuration
    if (!redashUrl || !redashApiKey) {
        console.error('Error: Missing required Redash configuration to start the server.');
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

    const redashTimeout = argv['redash-timeout'] || parseInt(process.env.REDASH_TIMEOUT || '30000');
    const ignoreSslErrors = argv['ignore-ssl-errors'] || process.env.REDASH_IGNORE_SSL_ERRORS === 'true';

    // Set global configuration for the MCP server
    global.redashConfig = {
      url: redashUrl,
      apiKey: redashApiKey,
      timeout: redashTimeout,
      rejectUnauthorized: !ignoreSslErrors
    };

    try {
        import('./index.js');
    } catch (error) {
        console.error('Failed to start the MCP server:', error);
        process.exit(1);
    }
}
