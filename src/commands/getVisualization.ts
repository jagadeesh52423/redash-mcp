
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'get-visualization <visualizationId>';
export const describe = 'Get details of a specific visualization';

export const builder: CommandBuilder = {
  visualizationId: { type: 'number', demandOption: true, describe: 'ID of the visualization to get' },
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
    const visualization = await getRedashClient().getVisualization(argv.visualizationId as number);
    console.log(JSON.stringify(visualization, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error getting visualization ${argv.visualizationId}: ${message}`);
  }
};
