import configManager from './config_drivers/config_manager.js';
import { _log, _error } from './logging.js';
import { generateQueryPlan, analyzeNewsData } from './openai_caller.js';
import { standardDelay, betweenRetriesDelay } from './utils.js';
import { fetchNews } from './news_fetcher.js';
import { readFromFile} from './io.js';


export async function runAnalysisWithRetry(configPath, attempt = 1) {
  try {
    _log(`Starting analysis attempt ${attempt}/${configManager.MAX_RETRIES}`);

    const report = await readFromFile(configPath)
      .then(generateQueryPlan)
      .then(fetchNews)
      .then(standardDelay)
      .then(analyzeNewsData);

    if (!report || report.length < configManager.MIN_REPORT_LENGTH) {
      _log(`Report too short (${report?.length || 0} characters). Required: ${configManager.MIN_REPORT_LENGTH}`);

      if (attempt < configManager.MAX_RETRIES) {
        _log(`Retrying analysis (attempt ${attempt + 1}/${configManager.MAX_RETRIES})`);
        await betweenRetriesDelay();
        return runAnalysisWithRetry(configPath, attempt + 1);
      } else {
        throw new Error("No adequate report could be produced after a maximum number of retries.");
      }
    }

    _log(`Analysis successful. Report length: ${report.length} characters`);
    return report;
  } catch (error) {
    _error(`Analysis attempt ${attempt} failed:`, error.message);
    throw error;
  }
}