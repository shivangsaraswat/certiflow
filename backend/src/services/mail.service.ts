import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '../lib/db.js';
import { groupSmtpConfig, groups, mailJobs, mailLogs, certificates } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { decrypt } from './encryption.service.js';

interface SmtpConfig {
    smtpHost: string;
    smtpPort: number;
    smtpEmail: string;
    smtpPassword: string;
    encryptionType: string;
    senderName?: string;
    replyTo?: string;
}

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content?: Buffer;
        path?: string;
    }>;
}

interface MailJobRecipient {
    email: string;
    name: string;
    certificateId?: string;
    certificateUrl?: string;
    data: Record<string, string>;
}

export class MailService {
    private getTransporter(config: SmtpConfig): Transporter {
        const transportConfig: any = {
            host: config.smtpHost,
            port: config.smtpPort,
            auth: {
                user: config.smtpEmail,
                pass: config.smtpPassword,
            },
        };

        if (config.encryptionType === 'SSL') {
            transportConfig.secure = true;
        } else if (config.encryptionType === 'TLS') {
            transportConfig.secure = false;
            transportConfig.requireTLS = true;
        } else {
            transportConfig.secure = false;
        }

        return nodemailer.createTransport(transportConfig);
    }

    async getGroupSmtpConfig(groupId: string): Promise<SmtpConfig | null> {
        const config = await db
            .select()
            .from(groupSmtpConfig)
            .where(eq(groupSmtpConfig.groupId, groupId));

        if (!config[0]) return null;

        return {
            smtpHost: config[0].smtpHost,
            smtpPort: config[0].smtpPort,
            smtpEmail: config[0].smtpEmail,
            smtpPassword: decrypt(config[0].smtpPassword),
            encryptionType: config[0].encryptionType,
            senderName: config[0].senderName || undefined,
            replyTo: config[0].replyTo || undefined,
        };
    }

    async sendEmail(config: SmtpConfig, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const transporter = this.getTransporter(config);

            const from = config.senderName
                ? `"${config.senderName}" <${config.smtpEmail}>`
                : config.smtpEmail;

            const info = await transporter.sendMail({
                from,
                to: options.to,
                replyTo: config.replyTo || config.smtpEmail,
                subject: options.subject,
                html: options.html,
                attachments: options.attachments,
            });

            return { success: true, messageId: info.messageId };
        } catch (error: any) {
            console.error('Email send failed:', error);
            return { success: false, error: error.message };
        }
    }

    replacePlaceholders(template: string, data: Record<string, string | undefined>): string {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            if (value === undefined) continue;
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }

    async createMailJob(groupId: string, recipients: MailJobRecipient[]): Promise<{ success: boolean; jobId?: string; error?: string }> {
        try {
            const jobId = crypto.randomUUID();

            await db.insert(mailJobs).values({
                id: jobId,
                groupId,
                status: 'pending',
                totalRecipients: recipients.length,
                pendingCount: recipients.length,
                sentCount: 0,
                failedCount: 0,
                recipientData: recipients,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return { success: true, jobId };
        } catch (error: any) {
            console.error('Create mail job failed:', error);
            return { success: false, error: error.message };
        }
    }

    async processMailJob(jobId: string): Promise<void> {
        // Get the job
        const jobs = await db.select().from(mailJobs).where(eq(mailJobs.id, jobId));
        const job = jobs[0];

        if (!job) {
            console.error('Mail job not found:', jobId);
            return;
        }

        // Update job status to processing
        await db.update(mailJobs)
            .set({ status: 'processing', updatedAt: new Date() })
            .where(eq(mailJobs.id, jobId));

        // Get group email template
        const groupData = await db.select().from(groups).where(eq(groups.id, job.groupId));
        const group = groupData[0];

        if (!group || !group.emailSubject || !group.emailTemplateHtml) {
            await db.update(mailJobs)
                .set({ status: 'failed', updatedAt: new Date() })
                .where(eq(mailJobs.id, jobId));
            return;
        }

        // Get SMTP config
        const smtpConfig = await this.getGroupSmtpConfig(job.groupId);
        if (!smtpConfig) {
            await db.update(mailJobs)
                .set({ status: 'failed', updatedAt: new Date() })
                .where(eq(mailJobs.id, jobId));
            return;
        }

        const recipients = job.recipientData as MailJobRecipient[];
        let sentCount = 0;
        let failedCount = 0;

        // Process each recipient with rate limiting
        for (const recipient of recipients) {
            try {
                // Prepare attachments and fetch certificate code
                const attachments = [];
                let certificateCode = '';

                if (recipient.certificateId) {
                    // Fetch certificate details
                    const certParams = await db
                        .select({
                            code: certificates.certificateCode,
                            filename: certificates.filename,
                            fileUrl: certificates.fileUrl,
                            filepath: certificates.filepath
                        })
                        .from(certificates)
                        .where(eq(certificates.id, recipient.certificateId));

                    if (certParams[0]) {
                        const cert = certParams[0];
                        certificateCode = cert.code;

                        // Prioritize fileUrl (Cloud), fallback to filepath (Local)
                        const path = cert.fileUrl || cert.filepath;
                        if (path) {
                            attachments.push({
                                filename: cert.filename || 'certificate.pdf',
                                path: path
                            });
                        }
                    }
                }

                const variables = {
                    ...recipient.data,
                    Name: recipient.name,
                    name: recipient.name, // Support lowercase
                    Email: recipient.email,
                    email: recipient.email, // Support lowercase
                    CertificateID: certificateCode || recipient.certificateId || '', // Prefer code
                    certificateId: certificateCode || recipient.certificateId || '' // Support camelCase
                };

                const subject = this.replacePlaceholders(group.emailSubject, variables);
                const html = this.replacePlaceholders(group.emailTemplateHtml, variables);



                const result = await this.sendEmail(smtpConfig, {
                    to: recipient.email,
                    subject,
                    html,
                    attachments
                });

                // Log the email
                await db.insert(mailLogs).values({
                    id: crypto.randomUUID(),
                    groupId: job.groupId,
                    mailJobId: jobId,
                    recipientEmail: recipient.email,
                    recipientName: recipient.name,
                    subject,
                    status: result.success ? 'sent' : 'failed',
                    errorMessage: result.error || null,
                    sentAt: result.success ? new Date() : undefined,
                });

                if (result.success) {
                    sentCount++;
                } else {
                    failedCount++;
                }

                // Update job progress
                const pendingCount = recipients.length - sentCount - failedCount;
                await db.update(mailJobs)
                    .set({ sentCount, failedCount, pendingCount, updatedAt: new Date() })
                    .where(eq(mailJobs.id, jobId));

                // Rate limiting: 1 email per second
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error: any) {
                failedCount++;
                await db.insert(mailLogs).values({
                    id: crypto.randomUUID(),
                    groupId: job.groupId,
                    mailJobId: jobId,
                    recipientEmail: recipient.email,
                    recipientName: recipient.name,
                    subject: group.emailSubject,
                    status: 'failed',
                    errorMessage: error.message,
                });
            }
        }

        // Update job status to completed
        await db.update(mailJobs)
            .set({
                status: failedCount === recipients.length ? 'failed' : 'completed',
                sentCount,
                failedCount,
                pendingCount: 0,
                updatedAt: new Date(),
            })
            .where(eq(mailJobs.id, jobId));
    }

    async getMailJobStatus(jobId: string): Promise<any> {
        const jobs = await db.select().from(mailJobs).where(eq(mailJobs.id, jobId));
        return jobs[0] || null;
    }

    async getMailHistory(groupId: string, limit = 100, offset = 0): Promise<any[]> {
        const logs = await db
            .select()
            .from(mailLogs)
            .where(eq(mailLogs.groupId, groupId))
            .orderBy(desc(mailLogs.sentAt))
            .limit(limit)
            .offset(offset);

        return logs;
    }
}

export const mailService = new MailService();
