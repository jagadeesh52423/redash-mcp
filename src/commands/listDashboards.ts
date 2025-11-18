
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'list-dashboards';
export const describe = 'List all available dashboards in Redash';

export const builder: CommandBuilder = {
    page: { type: 'number', default: 1, describe: 'Page number to fetch' },
    pageSize: { type: 'number', default: 25, describe: 'Number of dashboards per page' },
};

export const handler = async (argv: Arguments) => {
  const redashUrl = argv['redash-url'] as string || process.env.REDASH_URL;
  const redashApiKey = argv['redash-api-key'] as string || process.env.REDASH_API_KEY;

  if (!redashUrl || !redashApiKey) {
    console.error('Error: Missing required Redash configuration. Please provide --redash-url and --redash-api-key.');
    return;
  }

  initializeRedashClient(redashUrl, redashApiKey, argv['redash-timeout'] as number, !(argv['ignore-ssl-errors'] as boolean));

  try {
    const dashboards = await getRedashClient().getDashboards(argv.page as number, argv.pageSize as number);
    console.log(JSON.stringify(dashboards, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error listing dashboards: ${message}`);
  }
};
