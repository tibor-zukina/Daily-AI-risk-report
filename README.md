# Daily-AI-risk-report

This repository contains the code for the automated Daily AI risk reporting process which runs once a day, queries Google News based on the risk configuration, and sends the report to the user email.

## Table of Contents
- [Instructions](#instructions)
  - [External services](#external-services)
  - [Project setup](#project-setup)
  - [Testing and periodic scheduling](#testing-and-periodic-scheduling)

## Instructions

### External services
- Create the Open AI API key
- Create the free email sending account with the provider such as Brevo and set up your SMTP API key for transactional emails.
- Request an API key from Google news with your email.

### Project setup
- Clone this repository to a preferred location on your server (e.g. `/var/logs/scheduled_ai_report`):

```bash
git clone https://github.com/tibor-zukina/Daily-AI-risk-report.git
```

- Copy `example.configuration.json` to `configuration.json` and specify SMTP user, SMTP sender (email from), and the receiving email (email to).
- Copy `example.secrets.json` to `secrets.json` and specify your OpenAI key, Open AI assistant ID, Google News API key, and the SMTP password.
- Copy `example.risks.json` to `risks.json` and specify the risk domains you want to track in the same format.
- Install the local dependencies (requires NodeJS):

```bash
npm install
```

### Testing and periodic scheduling
- Test your script execution by running the following command after replacing the specified paths with your values (source directory - `/var/openai/scheduled_ai_report/src`, risk configuration path - `../data/risks.json`, and log directory - `/var/logs/scheduled_ai_report`):

```bash
mkdir -p /var/logs/scheduled_ai_report && \
cd /var/openai/scheduled_ai_report/src && \
(/usr/bin/node index.js ../data/risks.json >> /var/logs/scheduled_ai_report/log_$(date +%Y_%m_%d).txt 2>> /var/logs/scheduled_ai_report/error_$(date +%Y_%m_%d).txt)
```

- Edit your cronjob to periodically schedule the risk analysis by pasting the contents of `example.crontab.txt` to your crontab using `crontab -e` (you can update the execution time, currently set to midnight UTC every day, and paths).