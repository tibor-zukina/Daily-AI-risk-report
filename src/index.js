import { _log, _error } from './logging.js';
import { fetchNews } from './news_fetcher.js';
import { sendReport } from './report_sender.js';
import { generateQueryPlan, analyzeNewsData } from './openai_caller.js';
import { standardDelay } from './utils.js';
import { readFromFile, createDataDirectories } from './io.js';

(async () => {
  try {
    const configPath = process.argv[2];

    if (!configPath) {
      _error("Error: Please provide a path to the risk configuration file as an argument.");
      process.exit(1);
    }

    createDataDirectories();

    await readFromFile(configPath)
    .then(generateQueryPlan)
    .then(fetchNews)
    .then(standardDelay)
    .then(analyzeNewsData)
    .then(sendReport);

    process.exit(0);

  } catch (err) {
    _error("Error:", err.response?.data || (err.message + err.stack));
    process.exit(1);
  }
})();
