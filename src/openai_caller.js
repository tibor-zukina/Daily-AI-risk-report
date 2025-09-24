import fs from 'fs';
import OpenAI from 'openai';
import { _log, _error } from './logging.js';
import { format, currentDate, extractJsonFromMarkdown } from './utils.js';
import secretsManager from './config_drivers/secrets_manager.js';
import configManager from './config_drivers/config_manager.js';
import contentManager from './config_drivers/content_manager.js';
import { standardDelay } from './utils.js';
import { saveData } from './io.js';

const openai = new OpenAI({ apiKey: secretsManager.OPENAI_API_KEY });

let savedRiskFilePath;

// Helper function to upload file and wait for processing
async function uploadFileForChat(filePath, purpose = "assistants") {
    const uploadedFile = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: purpose
    });

    const fileId = uploadedFile.id;
    _log(`Uploaded file ID: ${fileId}`);

    // Wait for file processing
    const timeoutMs = configManager.OPENAI_API_FILE_PROCESSING_TIMEOUT * 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const fileInfo = await openai.files.retrieve(fileId);

        if (fileInfo.status === "processed") {
            _log(`File ${fileId} processed successfully.`);
            return fileId;
        }
        if (fileInfo.status === "error") {
            throw new Error(`File ${fileId} failed to process: ${fileInfo.error?.message || "Unknown error"}`);
        }

        _log(`File ${fileId} still processing...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error(`Timeout: File ${fileId} not processed within ${timeoutMs / 1000} seconds`);
}

export async function generateQueryPlan(riskConfig) {
    _log("Generating query plan");

    const filePath = saveData(riskConfig, configManager.RISKS_DATA_TYPE, configManager.JSON_FILE_TYPE);
    _log(`Risks data saved to ${filePath} (${Buffer.byteLength(riskConfig)} bytes)`);
    
    savedRiskFilePath = filePath;

    try {
        // Upload the risk config file
        const fileId = await uploadFileForChat(filePath);
        await standardDelay();

        const messageContent = format(contentManager.QUERY_GENERATION_PROMPT, ["((currentDate))"], [currentDate()]);

        const completion = await openai.chat.completions.create({
            model: configManager.OPENAI_API_MODEL,
            messages: [
                {
                    role: "system",
                    content: contentManager.ASSISTANT_ROLE_PROMPT
                },
                {
                    role: "user",
                    content: `${messageContent}\n\nPlease analyze the uploaded risk configuration file (ID: ${fileId}) and generate appropriate queries.`
                }
            ],
            temperature: configManager.OPENAI_API_TEMPERATURE,
            max_tokens: configManager.OPENAI_API_MAX_TOKENS_QUERY_PLAN
        });

        const queryPlanJson = extractJsonFromMarkdown(completion.choices[0].message.content);
        _log(`Query plan received (${Buffer.byteLength(queryPlanJson)} bytes)`);

        saveData(queryPlanJson, configManager.QUERIES_DATA_TYPE, configManager.JSON_FILE_TYPE);
        return queryPlanJson;

    } catch (error) {
        _error("Error generating query plan:", error);
        throw new Error(`Failed during ${configManager.QUERY_PLAN_GENERATION_STAGE}: ${error.message}`);
    }
}

export async function analyzeNewsData(newsFilePath) {
    _log("Starting news analysis");

    try {
        // Upload both files
        const riskFileId = await uploadFileForChat(savedRiskFilePath);
        await standardDelay();
        
        const newsFileId = await uploadFileForChat(newsFilePath);
        await standardDelay();

        const messageContent = format(contentManager.DATA_ANALYSIS_PROMPT, [], []);

        const completion = await openai.chat.completions.create({
            model: configManager.OPENAI_API_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are a risk analysis assistant. Analyze news data against risk configurations and provide comprehensive risk assessment reports. Write detailed, professional reports that thoroughly address all risk factors."
                },
                {
                    role: "user",
                    content: `${messageContent}\n\nPlease analyze the uploaded files:\n- Risk Configuration (ID: ${riskFileId})\n- News Data (ID: ${newsFileId})\n\nProvide a comprehensive risk analysis report.`
                }
            ],
            temperature: configManager.OPENAI_API_TEMPERATURE,
            max_tokens: configManager.OPENAI_API_MAX_TOKENS_ANALYSIS
        });

        const reportText = completion.choices[0].message.content;
        _log(`Analysis completed (${Buffer.byteLength(reportText)} bytes)`);

        saveData(reportText, configManager.REPORT_DATA_TYPE, configManager.TEXT_FILE_TYPE);
        return reportText;

    } catch (error) {
        _error("Error analyzing news data:", error);
        throw new Error(`Failed during ${configManager.RISK_ANALYSIS_STAGE}: ${error.message}`);
    }
}
