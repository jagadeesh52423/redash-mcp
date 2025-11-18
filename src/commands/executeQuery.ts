
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'execute-query <queryId>';
export const describe = 'Execute a Redash query and return the results';

export const builder: CommandBuilder = {
  queryId: { type: 'number', demandOption: true, describe: 'ID of the query to execute' },
  parameters: { type: 'string', describe: 'Query parameters as a JSON string' },
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
    const result = await getRedashClient().executeQueryById(argv.queryId as number, argv.parameters ? JSON.parse(argv.parameters as string) : undefined);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error executing query ${argv.queryId}: ${message}`);
  }
};
