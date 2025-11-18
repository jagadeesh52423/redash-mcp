
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'create-query';
export const describe = 'Create a new query in Redash';

export const builder: CommandBuilder = {
  name: { type: 'string', demandOption: true, describe: 'Name of the query' },
  data_source_id: { type: 'number', demandOption: true, describe: 'ID of the data source to use' },
  query: { type: 'string', demandOption: true, describe: 'SQL query text' },
  description: { type: 'string', describe: 'Description of the query' },
  options: { type: 'string', describe: 'Query options as a JSON string' },
  schedule: { type: 'string', describe: 'Query schedule as a JSON string' },
  tags: { type: 'array', describe: 'Tags for the query' },
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
    const newQuery = await getRedashClient().createQuery({
        name: argv.name as string,
        data_source_id: argv.data_source_id as number,
        query: argv.query as string,
        description: argv.description as string | undefined,
        options: argv.options ? JSON.parse(argv.options as string) : undefined,
        schedule: argv.schedule ? JSON.parse(argv.schedule as string) : undefined,
        tags: argv.tags as string[] | undefined,
    });
    console.log(JSON.stringify(newQuery, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error creating query: ${message}`);
  }
};
