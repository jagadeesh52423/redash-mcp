
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'execute-raw-query';
export const describe = 'Execute a raw SQL query and return the results';

export const builder: CommandBuilder = {
  query: { type: 'string', demandOption: true, describe: 'SQL query to execute' },
  dataSourceId: { type: 'number', demandOption: true, describe: 'ID of the data source to execute against' },
  parameters: { type: 'string', describe: 'Query parameters as a JSON string' },
  maxAge: { type: 'number', describe: 'Maximum age of cached results in seconds' },
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
    const result = await getRedashClient().executeQuery(argv.query as string, argv.dataSourceId as number, argv.parameters ? JSON.parse(argv.parameters as string) : undefined, argv.maxAge as number | undefined);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error executing raw query: ${message}`);
  }
};
