import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { _log, _error } from './logging.js';
import { format, currentDate, extractJsonFromMarkdown } from './utils.js';
import secretsManager from './config_drivers/secrets_manager.js';
import configManager from './config_drivers/config_manager.js';
import contentManager from './config_drivers/content_manager.js';
import { standardDelay } from './utils.js';
import { readFromFile, getDataFilename, saveData } from './io.js';

const openai = new OpenAI({ apiKey: secretsManager.OPENAI_API_KEY });

let threadID;
let riskFilePath;

// Helper: Polls a run until completion or failure

const pollRunUntilComplete = async (runId, threadId, stage) => {
    let runStatus = "queued";
    while (runStatus !== "completed") {
      const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
      runStatus = run.status;

      if (runStatus === "failed") {
      	 const errorDetails = run.last_error
        ? `${run.last_error.code}: ${run.last_error.message}`
        : "Unknown error";
      	throw new Error(`Failed while doing ${stage} — ${errorDetails}`);
      }

      _log(`Agent executing operation ${stage}, run status: ${runStatus}`);
      if (runStatus !== "completed") {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
}

async function waitForFileProcessing(fileId) {

  const timeoutMs = configManager.OPENAI_API_FILE_PROCESSING_TIMEOUT;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs * 1000) {
    const fileInfo = await openai.files.retrieve(fileId);

    if (fileInfo.status === "processed") {
      _log(`File ${fileId} processed successfully.`);
      return;
    }
    if (fileInfo.status === "error") {
      throw new Error(`File ${fileId} failed to process: ${fileInfo.error?.message || "Unknown error"}`);
    }

    _log(`File ${fileId} still processing...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error(`Timeout: File ${fileId} not processed within ${timeoutMs / 1000} seconds`);
}

async function uploadFileAndWait(filePath) {

   // Upload the file to OpenAI
   const uploadedFile = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants"
   });

   const fileId = uploadedFile.id;

   _log(`Uploaded file ID: ${fileId}`);

   await waitForFileProcessing(fileId);
   await standardDelay(); // to avoid exceeding the token cap per minute

   return fileId;
}

async function sendMessageWithAttachments(threadID, messageContent, fileIds) {

 _log(`Sending message on thread ID ${threadID} with attachments file IDs ${fileIds.concat(',')}: ${messageContent}`);

  let messageObject =  {
      role: "user",
      content: [
        {
          type: "text",
          text: messageContent
        }
      ],
      attachments: fileIds.map(fileId => ({
         file_id: fileId,
         tools: [{ type: "file_search" }]
     }))
    };

 await openai.beta.threads.messages.create(threadID, messageObject);

}

export async function generateQueryPlan(riskConfig) {

    _log("Generating query plan");

    const filePath = saveData(riskConfig, configManager.RISKS_DATA_TYPE, configManager.JSON_FILE_TYPE);

    _log(`Risks data saved to ${filePath} (${Buffer.byteLength(riskConfig)} bytes)`);

    riskFilePath = filePath;

    const fileId = await uploadFileAndWait(filePath);

    _log('Creating a thread');
    const thread = await openai.beta.threads.create();
    threadID = thread.id.toString();
    _log('Thread ID: ', threadID);

    // Ask assistant what data to collect
    let messageContent = format(contentManager.QUERY_GENERATION_PROMPT, ["((currentDate))"], [currentDate(), riskConfig]);

    _log('Sending risk configuration for query planning');

    await sendMessageWithAttachments(threadID, messageContent, [fileId]);

    // Run assistant to generate query plan
    const queryPlanRun = await openai.beta.threads.runs.create(threadID, {
      assistant_id: secretsManager.OPENAI_ASSISTANT_ID
    });

    await pollRunUntilComplete(queryPlanRun.id, threadID, configManager.QUERY_PLAN_GENERATION_STAGE);

    const planMessages = await openai.beta.threads.messages.list(threadID);
    const queryPlanJson = extractJsonFromMarkdown(planMessages.data[0].content[0].text.value);

   _log(`Query plan received (${Buffer.byteLength(queryPlanJson)} bytes)`);

    saveData(queryPlanJson, configManager.QUERIES_DATA_TYPE, configManager.JSON_FILE_TYPE);

    return queryPlanJson;
  }

export async function analyzeNewsData(newsData) {

  _log("Starting news analysis");

  // Save newsData to a local temporary file
  const filePath = getDataFilename(configManager.NEWS_DATA_TYPE, configManager.JSON_FILE_TYPE);

  _log(`News data saved to ${filePath} (${Buffer.byteLength(newsData)} bytes)`);

  _log('Processing news > Uploading risk file as an attachment');
  const riskFileId = await uploadFileAndWait(riskFilePath);

  _log('Processing news > Uploading news file as an attachment');
  const newsFileId = await uploadFileAndWait(filePath);

  const messageContent = format(contentManager.DATA_ANALYSIS_PROMPT, [], []);

  await sendMessageWithAttachments(threadID, messageContent, [riskFileId, newsFileId]);

  // Run the assistant to conduct a news analysis

  const analysisRun = await openai.beta.threads.runs.create(threadID, {
    assistant_id: secretsManager.OPENAI_ASSISTANT_ID
  });

  // poll until completion
  await pollRunUntilComplete(analysisRun.id, threadID, configManager.RISK_ANALYSIS_STAGE);

  // retrieve analysis
  const analysisMessages = await openai.beta.threads.messages.list(threadID);

  const reportText = analysisMessages.data[0].content[0].text.value;

  saveData(reportText, configManager.REPORT_DATA_TYPE, configManager.TEXT_FILE_TYPE);

  return reportText;
}
