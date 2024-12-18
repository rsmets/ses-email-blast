# AWS SES Email Blast Script

This TypeScript script allows you to send email blasts using AWS Simple Email Service (SES).

## Prerequisites

1. Node.js and npm installed
2. AWS account with SES access
3. Verified email address in SES (for sending emails)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file and fill in your details:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your AWS credentials and verified sender email.

4. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Usage

1. Edit the `src/index.ts` file to modify the email content and recipient list.

2. Run the script:
   ```bash
   npm start
   ```

## Important Notes

- Make sure your AWS credentials have the necessary permissions to send emails via SES
- If you're in the SES sandbox environment, you can only send to verified email addresses
- Be mindful of your SES sending limits and quotas
