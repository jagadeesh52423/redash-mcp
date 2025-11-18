
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'update-query <queryId>';
export const describe = 'Update an existing query in Redash';

export const builder: CommandBuilder = {
  queryId: { type: 'number', demandOption: true, describe: 'ID of the query to update' },
  name: { type: 'string', describe: 'New name for the query' },
  data_source_id: { type: 'number', describe: 'New data source ID for the query' },
  query: { type: 'string', describe: 'New SQL query text' },
  description: { type: 'string', describe: 'New description for the query' },
  options: { type: 'string', describe: 'New query options as a JSON string' },
  schedule: { type: 'string', describe: 'New query schedule as a JSON string' },
  tags: { type: 'array', describe: 'New tags for the query' },
  is_archived: { type: 'boolean', describe: 'Archive/unarchive the query' },
  is_draft: { type: 'boolean', describe: 'Mark the query as a draft/published' },
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
    const updatedQuery = await getRedashClient().updateQuery(argv.queryId as number, {
        name: argv.name as string | undefined,
        data_source_id: argv.data_source_id as number | undefined,
        query: argv.query as string | undefined,
        description: argv.description as string | undefined,
        options: argv.options ? JSON.parse(argv.options as string) : undefined,
        schedule: argv.schedule ? JSON.parse(argv.schedule as string) : undefined,
        tags: argv.tags as string[] | undefined,
        is_archived: argv.is_archived as boolean | undefined,
        is_draft: argv.is_draft as boolean | undefined,
    });
    console.log(JSON.stringify(updatedQuery, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error updating query ${argv.queryId}: ${message}`);
  }
};
