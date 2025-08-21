import { _log, _error } from './logging.js';
import { sendEmail } from './mailer.js';

import secretsManager from './config_drivers/secrets_manager.js';
import contentManager from './config_drivers/content_manager.js';
import configManager from  './config_drivers/config_manager.js';

export async function sendReport(report) {
  _log("Going to send report: ", report);
  await sendEmail(
                   contentManager.EMAIL_SUBJECT,
                   report,
                   configManager.SMTP_HOST,
                   configManager.SMTP_PORT,
                   configManager.SMTP_USER,
                   secretsManager.SMTP_PASS,
                   configManager.EMAIL_FROM,
                   configManager.EMAIL_TO
                 );
  _log("Report sent successfully");
}
