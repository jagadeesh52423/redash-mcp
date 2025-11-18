
import { Arguments, CommandBuilder } from 'yargs';
import { initializeRedashClient, getRedashClient } from '../redashClient.js';

export const command = 'update-widget <widgetId>';
export const describe = 'Update an existing widget in a dashboard';

export const builder: CommandBuilder = {
  widgetId: { type: 'number', demandOption: true, describe: 'ID of the widget to update' },
  text: { type: 'string', describe: 'New text to display in the widget' },
  width: { type: 'number', describe: 'New width of the widget' },
  options: { type: 'string', describe: 'New widget options as a JSON string' },
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
    const updatedWidget = await getRedashClient().updateWidget(argv.widgetId as number, {
        text: argv.text as string | undefined,
        width: argv.width as number | undefined,
        options: argv.options ? JSON.parse(argv.options as string) : undefined,
    });
    console.log(JSON.stringify(updatedWidget, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error updating widget ${argv.widgetId}: ${message}`);
  }
};
