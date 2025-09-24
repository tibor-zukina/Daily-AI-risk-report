import { readFromFile } from  '../io.js';

const configuration = JSON.parse(
  await readFromFile('./config/configuration.json')
);

const SMTP_HOST = configuration.email?.smtp_host;
const SMTP_PORT = configuration.email?.smtp_port;
const SMTP_USER = configuration.email?.smtp_user;
const EMAIL_FROM = configuration.email?.email_from;
const EMAIL_TO = configuration.email?.email_to;

const OPENAI_API_FILE_PROCESSING_TIMEOUT = configuration.openai_api?.file_processing_timeout;
const OPENAI_API_DOMAINS_PROCESSED_PER_CALL = configuration.openai_api?.domains_processed_per_call;

const GOOGLE_NEWS_QUERY_URL = configuration.google_news?.query_url;
const GOOGLE_NEWS_MAX_QUERY_LENGTH = configuration.google_news?.max_query_length;
const GOOGLE_NEWS_MIN_QUERY_DELAY =  configuration.google_news?.min_query_delay;
const GOOGLE_NEWS_MAX_QUERY_DELAY =  configuration.google_news?.max_query_delay;
const GOOGLE_NEWS_MAX_RESULTS_PER_QUERY = configuration.google_news?.max_results_per_query;

const STANDARD_DELAY_TIME = configuration.execution?.standard_delay_time;
const BETWEEN_RETRIES_DELAY_TIME = configuration.execution?.between_retries_delay_time;
const QUERY_PLAN_GENERATION_STAGE = configuration.execution?.stages?.query_plan_generation;
const RISK_ANALYSIS_STAGE = configuration.execution?.stages?.risk_analysis;

const RISKS_DATA_TYPE = configuration.data?.data_types?.risks;
const QUERIES_DATA_TYPE = configuration.data?.data_types?.queries;
const NEWS_DATA_TYPE = configuration.data?.data_types?.news;
const REPORT_DATA_TYPE = configuration.data?.data_types?.report;

const TEXT_FILE_TYPE =  configuration.data?.file_types?.text;
const JSON_FILE_TYPE =  configuration.data?.file_types?.json;

const MIN_REPORT_LENGTH = configuration.execution?.min_report_length;
const MAX_RETRIES = configuration.execution?.max_retries;

export default {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  EMAIL_FROM,
  EMAIL_TO,
  OPENAI_API_FILE_PROCESSING_TIMEOUT,
  GOOGLE_NEWS_QUERY_URL,
  GOOGLE_NEWS_MAX_QUERY_LENGTH,
  GOOGLE_NEWS_MIN_QUERY_DELAY,
  GOOGLE_NEWS_MAX_QUERY_DELAY,
  GOOGLE_NEWS_MAX_RESULTS_PER_QUERY,
  STANDARD_DELAY_TIME,
  BETWEEN_RETRIES_DELAY_TIME,
  QUERY_PLAN_GENERATION_STAGE,
  RISK_ANALYSIS_STAGE,
  RISKS_DATA_TYPE,
  QUERIES_DATA_TYPE,
  NEWS_DATA_TYPE,
  REPORT_DATA_TYPE,
  TEXT_FILE_TYPE,
  JSON_FILE_TYPE,
  MIN_REPORT_LENGTH,
  MAX_RETRIES
};
