import fs from 'fs';
import path from 'path';
import { _log, _error } from './logging.js';
import configManager from  './config_drivers/config_manager.js';

export function format(text, formats, values) {
  for (let i = 0, len = Math.min(formats.length, values.length); i < len; i++) {
    if (text.indexOf("{{") > -1) {
      if (formats[i].startsWith("(") && formats[i].endsWith(")")) {
        formats[i] = `{{${(formats[i].slice(1, -1))}}}`;
      }
    }
    text = text?.replace(formats[i], (values[i] !== null) ? values[i] : '');
  }
  return text;
}

export function shortenQuery(query, maxLength) {
  const parts = query.split(/\s+OR\s+/);
  const shortened = [];

  for (const part of parts) {
    shortened.push(part);
    const testQuery = shortened.join(' OR ');
    if (testQuery.length > maxLength) {
      shortened.pop();
      break;
    }
  }

  return shortened.join(' OR ');
}


export function extractJsonFromMarkdown(markdownText) {
  return markdownText
    .replace(/^```json\s*/i, '')  // remove ```json at the start
    .replace(/^```\s*$/i, '')     // remove standalone ```
    .replace(/```$/i, '')         // optional final backtick cleanup
    .trim();
}

export function currentDate(delimiter = '-') {

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const currentDate = `${yyyy}${delimiter}${mm}${delimiter}${dd}`;
  return currentDate;
}

export function standardDelay(input) {
  const delaySec = configManager.STANDARD_DELAY_TIME;
  _log(`Adding delay of ${delaySec} seconds between steps`);
  return new Promise(resolve => {
    setTimeout(() => resolve(input), delaySec * 1000);
  });
}

export function betweenRetriesDelay(input) {
  const delaySec = configManager.BETWEEN_RETRIES_DELAY_TIME;
  _log(`Adding delay of ${delaySec} seconds between retries`);
  return new Promise(resolve => {
    setTimeout(() => resolve(input), delaySec * 1000);
  });
}

export function randomDelay(minDelay = configManager.GOOGLE_NEWS_MIN_QUERY_DELAY, maxDelay = configManager.GOOGLE_NEWS_MAX_QUERY_DELAY) {
  const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000;
  _log(`Adding random delay of ${delay / 1000} seconds`);
  return new Promise(resolve => {
    setTimeout(() => resolve(), delay);
  });
}
