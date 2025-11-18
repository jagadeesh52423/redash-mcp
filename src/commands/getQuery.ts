
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'get-query <queryId>';
export const describe = 'Get details of a specific query';

export const builder: CommandBuilder = {
  queryId: {
    type: 'number',
    demandOption: true,
    describe: 'ID of the query to get'
  }
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
    const query = await getRedashClient().getQuery(argv.queryId as number);
    console.log(JSON.stringify(query, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error getting query ${argv.queryId}: ${message}`);
  }
};
