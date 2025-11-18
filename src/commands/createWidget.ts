
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'create-widget';
export const describe = 'Create a new widget in a dashboard';

export const builder: CommandBuilder = {
  dashboard_id: { type: 'number', demandOption: true, describe: 'ID of the dashboard to add the widget to' },
  visualization_id: { type: 'number', describe: 'ID of the visualization to use for the widget' },
  text: { type: 'string', describe: 'Text to display in the widget' },
  width: { type: 'number', describe: 'Width of the widget' },
  options: { type: 'string', describe: 'Widget options as a JSON string' },
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
    const newWidget = await getRedashClient().createWidget({
        dashboard_id: argv.dashboard_id as number,
        visualization_id: argv.visualization_id as number | undefined,
        text: argv.text as string | undefined,
        width: argv.width as number | undefined,
        options: argv.options ? JSON.parse(argv.options as string) : undefined,
    });
    console.log(JSON.stringify(newWidget, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error creating widget: ${message}`);
  }
};
