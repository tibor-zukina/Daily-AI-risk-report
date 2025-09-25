import { readFromFile } from  '../io.js';

const secrets = JSON.parse(
  await readFromFile('./config/secrets.json')
);

const OPENAI_API_KEY = secrets.openai_api_key;
const OPENAI_ASSISTANT_ID = secrets.openai_assistant_id;
const NEWSAPI_KEY = secrets.newsapi_key;
const SMTP_PASS = secrets.smtp_pass;

export default {
  OPENAI_API_KEY,
  OPENAI_ASSISTANT_ID,
  NEWSAPI_KEY,
  SMTP_PASS
};