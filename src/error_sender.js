
import { sendEmail } from './mailer.js';
import { _log, _error } from './logging.js';
import configManager from './config_drivers/config_manager.js';
import secretsManager from './config_drivers/secrets_manager.js';

export async function sendErrorNotification(error, context) {
  try {
    const subject = `Daily Risk Analysis Error - ${new Date().toISOString().split('T')[0]}`;
    const errorMessage = `
  Error in Daily Risk Analysis

  Timestamp: ${new Date().toISOString()}
  Context: ${context}

  Error Type: ${error.constructor.name}
  Message: ${error.message}

  Stack Trace:
  ${error.stack}

  ${error.response?.data ? `API Response Data:\n${JSON.stringify(error.response.data, null, 2)}` : ''}
    `;

    await sendEmail(
      subject,
      errorMessage,
      configManager.SMTP_HOST,
      configManager.SMTP_PORT,
      configManager.SMTP_USER,
      secretsManager.SMTP_PASS,
      configManager.EMAIL_FROM,
      configManager.EMAIL_TO
    );

    _log("Error notification email sent successfully");
  } catch (emailError) {
    _error("Failed to send error notification email:", emailError);
  }
}