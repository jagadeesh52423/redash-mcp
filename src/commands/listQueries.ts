
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'list-queries';
export const describe = 'List all available queries in Redash';

export const builder: CommandBuilder = {
    page: { type: 'number', default: 1, describe: 'Page number to fetch' },
    pageSize: { type: 'number', default: 25, describe: 'Number of queries per page' },
    q: { type: 'string', describe: 'Search query' },
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
    const queries = await getRedashClient().getQueries(argv.page as number, argv.pageSize as number, argv.q as string | undefined);
    console.log(JSON.stringify(queries, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error listing queries: ${message}`);
  }
};
