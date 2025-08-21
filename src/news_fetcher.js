import {_log, _error} from './logging.js';
import { shortenQuery, format, randomDelay } from './utils.js';
import { saveData } from './io.js';
import configManager from './config_drivers/config_manager.js';
import Parser from 'rss-parser';


const parser = new Parser();

export async function fetchNews(queryPlanJson) {

  let queries;
  try {
    queries = JSON.parse(queryPlanJson);

    _log(`Sending ${queries.length} queries to Google News`);
    if (!Array.isArray(queries)) throw new Error("Expected a JSON array.");
  } catch (err) {
    throw new Error("Invalid query plan format ÔÇö must be a JSON array of query objects.");
  }

  const allResults = [];
  let totalNews = 0;
  const queryURLTemplate = configManager.GOOGLE_NEWS_QUERY_URL;

  for (const { query, domain } of queries) {
    let querySent = query;

    // Optional: enforce max length for Google News query
    if (querySent.length >= configManager.GOOGLE_NEWS_MAX_QUERY_LENGTH) {
      _log(`The maximum query length is ${configManager.GOOGLE_NEWS_MAX_QUERY_LENGTH}, shortening query ${querySent}`);
      querySent = shortenQuery(querySent, configManager.GOOGLE_NEWS_MAX_QUERY_LENGTH);
      _log(`Query shortened to ${querySent}`);
    }

    _log(`Sending query "${querySent}" for domain "${domain}"`);

    try {
      const encodedQuery = encodeURIComponent(querySent);
      const url = format(queryURLTemplate, [ '((encodedQuery))' ], [ encodedQuery ]);

      _log(`Query URL is ${url}`);

      const feed = await parser.parseURL(url);

      if (feed.items && feed.items.length > 0) {

        const limitedArticles = feed.items
                                .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
                                .slice(0, configManager.GOOGLE_NEWS_MAX_RESULTS_PER_QUERY);

        totalNews += limitedArticles.length;

        allResults.push({
          querySent,
          domain,
          articles: limitedArticles.map(item => ({
            title: item.title,
            description: item.contentSnippet || '',
            url: item.link,
            publishedAt: item.pubDate,
            source: item.source?.title || 'Unknown'
          }))
        });
      } else {
        _log(`No articles found for "${querySent}"`);
      }
    } catch (error) {
      _error(`Error fetching news for "${querySent}": ${error}`);
    }

    // Add random delay (1–5 seconds) between requests
    await randomDelay(configManager.GOOGLE_NEWS_MIN_QUERY_DELAY, configManager.GOOGLE_NEWS_MAX_QUERY_DELAY);
  }

  const newsData = JSON.stringify({ news: allResults }, null, 2);
  _log(`Successfully fetched ${totalNews} news`);
  saveData(newsData, configManager.NEWS_DATA_TYPE, configManager.JSON_FILE_TYPE);

  return newsData;
}
