import { _log, _error } from './logging.js';
import { sendReport } from './report_sender.js';
import { createDataDirectories } from './io.js';
import { runAnalysisWithRetry } from './risk_analyzer_with_retry.js';
import { sendErrorNotification } from './error_sender.js';

(async () => {
  try {
    const configPath = process.argv[2];

    if (!configPath) {
      _error("Error: Please provide a path to the risk configuration file as an argument.");
      process.exit(1);
    }

    createDataDirectories();

    const report = await runAnalysisWithRetry(configPath);
    await sendReport(report);

    process.exit(0);

  } catch (err) {
    const errorMessage = err.response?.data || (err.message + err.stack);
    _error("Error:", errorMessage);
    
    await sendErrorNotification(err, "Daily Risk Analysis Process");
    
    process.exit(1);
  }
})();
