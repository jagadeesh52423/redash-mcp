
import { Arguments, CommandBuilder } from 'yargs';

export const command = 'doctor';
export const describe = 'Check configuration and environment';

export const builder: CommandBuilder = {};

export const handler = (argv: Arguments) => {
  const redashUrl = argv['redash-url'] || process.env.REDASH_URL;
  const redashApiKey = argv['redash-api-key'] || process.env.REDASH_API_KEY;

  if (redashUrl && redashApiKey) {
    console.log('✅  Redash configuration is valid.');
  } else {
    console.error('❌  Missing required Redash configuration.');
    if (!redashUrl) {
      console.error('   - REDASH_URL is not set.');
    }
    if (!redashApiKey) {
      console.error('   - REDASH_API_KEY is not set.');
    }
    console.log('\nRun with --help for configuration instructions.');
  }
};
