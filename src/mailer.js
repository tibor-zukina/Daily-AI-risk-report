import nodemailer from 'nodemailer';
import { _log, _error } from './logging.js';

export async function sendEmail(subject, text, smtpHost, smtpPort, smtpUser, smtpPass, emailFrom, emailTo) {

  _log("Going to send email: ", subject, text);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  await transporter.sendMail({
    from: emailFrom,
    to: emailTo,
    subject,
    text
  });

}
