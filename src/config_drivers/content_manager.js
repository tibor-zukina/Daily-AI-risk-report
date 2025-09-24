import { readFromFile } from  '../io.js';

const content = JSON.parse(
  await readFromFile('./config/content.json')
);

const EMAIL_SUBJECT = content.email?.email_subject;

const ASSISTANT_ROLE_PROMPT = content.prompts?.assistant_role_prompt;
const QUERY_GENERATION_PROMPT = content.prompts?.query_generation_prompt;
const DATA_ANALYSIS_PROMPT = content.prompts?.data_analysis_prompt;

export default {
  EMAIL_SUBJECT,
  ASSISTANT_ROLE_PROMPT,
  QUERY_GENERATION_PROMPT,
  DATA_ANALYSIS_PROMPT
};
