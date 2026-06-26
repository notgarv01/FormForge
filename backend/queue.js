import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAIL_LOG = path.join(__dirname, 'mail.log');

class NotificationQueue {
  constructor() {
    this.jobs = [];
    this.processing = false;
    
    // Configurable SMTP Settings
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    this.fromEmail = process.env.SMTP_FROM || '"FormForge System" <noreply@formforge.com>';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  /**
   * Pushes a new email notification alert job to the async queue.
   */
  async addJob(form, submission) {
    const job = {
      id: 'job_' + Math.random().toString(36).substr(2, 9),
      form,
      submission,
      createdAt: new Date().toISOString()
    };
    
    this.jobs.push(job);
    console.log(`[Queue] Job ${job.id} added. Background email forwarding scheduled.`);
    
    // Asynchronously trigger processing (non-blocking)
    this.processQueue();
  }

  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.jobs.length > 0) {
      const currentJob = this.jobs.shift();
      try {
        await this.executeJob(currentJob);
      } catch (err) {
        console.error(`[Queue] Failed to execute job ${currentJob.id}:`, err);
      }
    }

    this.processing = false;
  }

  async executeJob(job) {
    const { form, submission } = job;
    const recipient = form.notifyEmail || 'developer@example.com';
    const payloadText = Object.entries(submission.payload)
      .map(([key, val]) => `  ${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
      .join('\n');

    const mailOptions = {
      from: this.fromEmail,
      to: recipient,
      subject: `🔥 New Submission Alert on Form: "${form.name}"`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="color: #8b5cf6;">FormForge Endpoint Alert</h2>
          <p>You received a new submission on your form <strong>"${form.name}"</strong> (ID: <code>${form.id}</code>).</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <h3>Submission Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${Object.entries(submission.payload).map(([k, v]) => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">${k}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; background: #fafafa;">${Array.isArray(v) ? v.join(', ') : v}</td>
              </tr>
            `).join('')}
          </table>
          <p style="font-size: 12px; color: #888;">Submission ID: <code>${submission.id}</code> | Time: ${submission.createdAt}</p>
        </div>
      `,
      text: `New submission alert on form: "${form.name}"\n\nPayload:\n${payloadText}\n\nSubmission ID: ${submission.id}`
    };

    // Nodemailer streamTransport outputs raw message data
    const info = await this.transporter.sendMail(mailOptions);
    const messageContent = info.message.toString();

    // 1. Log alert transaction to backend console
    console.log(`[Queue] Alert email processed for form "${form.name}". Dispatch details:`);
    console.log(`  To: ${recipient}`);
    console.log(`  Subject: ${mailOptions.subject}`);
    console.log(`  Submission ID: ${submission.id}`);
    
    // 2. Append email alert directly to mail.log file
    const logEntry = `
=========================================
EMAIL LOG: ${new Date().toISOString()}
JOB ID: ${job.id}
TO: ${recipient}
SUBJECT: ${mailOptions.subject}
-----------------------------------------
${mailOptions.text}
=========================================\n`;
    
    fs.appendFileSync(MAIL_LOG, logEntry, 'utf8');
  }
}

export const queue = new NotificationQueue();
