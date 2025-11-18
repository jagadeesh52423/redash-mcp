
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'create-dashboard';
export const describe = 'Create a new dashboard in Redash';

export const builder: CommandBuilder = {
  name: { type: 'string', demandOption: true, describe: 'Name of the dashboard' },
  tags: { type: 'array', describe: 'Tags for the dashboard' },
  is_draft: { type: 'boolean', describe: 'Whether the dashboard is a draft' },
  dashboard_filters_enabled: { type: 'boolean', describe: 'Whether dashboard filters are enabled' },
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
    const newDashboard = await getRedashClient().createDashboard({
        name: argv.name as string,
        tags: argv.tags as string[] | undefined,
        is_draft: argv.is_draft as boolean | undefined,
        dashboard_filters_enabled: argv.dashboard_filters_enabled as boolean | undefined,
    });
    console.log(JSON.stringify(newDashboard, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error creating dashboard: ${message}`);
  }
};
