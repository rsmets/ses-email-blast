import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from "@aws-sdk/client-ses";
import dotenv from "dotenv";
import {readFileSync} from "fs";
import {parse} from "csv-parse/sync";

dotenv.config();

/**
 * Configuration interface for email blast parameters
 */
interface EmailConfig {
  subject: string;
  htmlBody: string;
  textBody?: string; // Optional plain text version
  recipients: string[];
}

/**
 * EmailBlaster class handles sending bulk emails using AWS SES
 */
class EmailBlaster {
  private sesClient: SESClient;
  private senderEmail: string;

  /**
   * Initialize EmailBlaster with AWS configuration
   * @throws Error if required environment variables are missing
   */
  constructor() {
    if (!process.env.AWS_REGION || !process.env.SENDER_EMAIL) {
      throw new Error(
        "Missing required environment variables: AWS_REGION and/or SENDER_EMAIL"
      );
    }

    this.sesClient = new SESClient({
      region: process.env.AWS_REGION,
    });

    this.senderEmail = process.env.SENDER_EMAIL;
  }

  /**
   * Read email addresses from a CSV file
   * @param filePath Path to the CSV file containing email addresses
   * @param emailColumn Name or index of the column containing email addresses
   * @returns Array of email addresses
   */
  private readEmailsFromCsv(
    filePath: string,
    emailColumn: string | number = "email"
  ): string[] {
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records.map((record: any) => {
        const email =
          typeof emailColumn === "number"
            ? Object.values(record)[emailColumn]
            : record[emailColumn];

        if (!email || typeof email !== "string") {
          throw new Error(`Invalid email in CSV: ${JSON.stringify(record)}`);
        }
        return email;
      });
    } catch (error) {
      throw new Error(`Failed to read CSV file: ${error}`);
    }
  }

  /**
   * Read HTML content from a file
   * @param filePath Path to the HTML file
   * @returns HTML content as string
   */
  private readHtmlFile(filePath: string): string {
    try {
      return readFileSync(filePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read HTML file: ${error}`);
    }
  }

  /**
   * Send emails to all recipients
   * @param config Email configuration including subject, body, and recipients
   */
  async sendEmailBlast({
    subject,
    htmlBody,
    textBody,
    recipients,
  }: EmailConfig): Promise<void> {
    console.log(`Starting email blast to ${recipients.length} recipients...`);

    for (const recipient of recipients) {
      try {
        const params: SendEmailCommandInput = {
          Source: this.senderEmail,
          Destination: {
            ToAddresses: [recipient],
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: htmlBody,
                Charset: "UTF-8",
              },
              ...(textBody && {
                Text: {
                  Data: textBody,
                  Charset: "UTF-8",
                },
              }),
            },
          },
        };

        const command = new SendEmailCommand(params);
        await this.sesClient.send(command);
        console.log(`✓ Email sent successfully to ${recipient}`);
      } catch (error) {
        console.error(`✗ Failed to send email to ${recipient}:`, error);
      }
    }
  }

  /**
   * Send email blast using recipients from a CSV file and HTML content from a file
   * @param subject Email subject
   * @param htmlPath Path to HTML file containing email body
   * @param csvPath Path to CSV file containing email addresses
   * @param emailColumn Name or index of the column containing email addresses
   */
  async sendEmailBlastFromHtml(
    subject: string,
    htmlPath: string,
    csvPath: string,
    emailColumn: string | number = "email"
  ): Promise<void> {
    const recipients = this.readEmailsFromCsv(csvPath, emailColumn);
    const htmlBody = this.readHtmlFile(htmlPath);
    await this.sendEmailBlast({subject, htmlBody, recipients});
  }
}

// Example usage
async function main() {
  const emailBlaster = new EmailBlaster();

  try {
    // Example using CSV file and HTML template
    await emailBlaster.sendEmailBlastFromHtml(
      "We are discontinuing Verified Email on December 23, 2024",
      "email.html",
      "emails.csv",
      "email"
    );
    console.log("Email blast completed!");
  } catch (error) {
    console.error("Error during email blast:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
