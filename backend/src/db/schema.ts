
import { pgTable, text, timestamp, integer, doublePrecision, jsonb, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccount } from '@auth/core/adapters';

// =============================================================================
// Templates
// =============================================================================
export const templates = pgTable('templates', {
    id: text('id').primaryKey(), // using text for UUIDs provided by app
    code: text('code').notNull().unique(), // 1-5 char unique template code (e.g., "NAMD25")
    name: text('name').notNull(),
    description: text('description'),
    filename: text('filename').notNull(),
    filepath: text('filepath').notNull(),
    fileUrl: text('file_url'),
    fileId: text('file_id'),
    pageCount: integer('page_count').notNull(),
    width: doublePrecision('width').notNull(),
    height: doublePrecision('height').notNull(),
    attributes: jsonb('attributes').notNull(), // DynamicAttribute[]
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    isPublic: boolean('is_public').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const templatesRelations = relations(templates, ({ many }) => ({
    certificates: many(certificates),
    bulkJobs: many(bulkJobs),
    groups: many(groups),
}));

// =============================================================================
// Groups - Container for organizing certificates
// =============================================================================
export const groups = pgTable('groups', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    // Configuration - all nullable for settings-first approach
    templateId: text('template_id').references(() => templates.id, { onDelete: 'set null' }),
    sheetId: text('sheet_id').references(() => spreadsheets.id, { onDelete: 'set null' }),
    selectedSheetTab: text('selected_sheet_tab'), // Which tab in the spreadsheet
    columnMapping: jsonb('column_mapping'), // { attrId: columnName }
    // Email configuration
    emailTemplateHtml: text('email_template_html'),
    emailSubject: text('email_subject'),
    // Global SMTP reference (optional - if set, uses global config instead of group-specific)
    globalSmtpConfigId: text('global_smtp_config_id'),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
    template: one(templates, {
        fields: [groups.templateId],
        references: [templates.id],
    }),
    certificates: many(certificates),
    bulkJobs: many(bulkJobs),
    smtpConfig: one(groupSmtpConfig, {
        fields: [groups.id],
        references: [groupSmtpConfig.groupId],
    }),
    mailJobs: many(mailJobs),
    mailLogs: many(mailLogs),
    shares: many(groupShares),
}));

// =============================================================================
// Group Shares - Collaborative access & invitations
// =============================================================================
export const groupShares = pgTable('group_shares', {
    id: text('id').primaryKey(),
    groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    inviterId: text('inviter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    inviteeId: text('invitee_id').references(() => users.id, { onDelete: 'cascade' }),
    inviteeEmail: text('invitee_email').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'revoked'
    inviteToken: text('invite_token').unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    acceptedAt: timestamp('accepted_at'),
    revokedAt: timestamp('revoked_at'),
});

export const groupSharesRelations = relations(groupShares, ({ one }) => ({
    group: one(groups, {
        fields: [groupShares.groupId],
        references: [groups.id],
    }),
    inviter: one(users, {
        fields: [groupShares.inviterId],
        references: [users.id],
        relationName: 'inviter',
    }),
    invitee: one(users, {
        fields: [groupShares.inviteeId],
        references: [users.id],
        relationName: 'invitee',
    }),
}));

// =============================================================================
// Group SMTP Configuration - Encrypted credentials per group
// =============================================================================
export const groupSmtpConfig = pgTable('group_smtp_config', {
    id: text('id').primaryKey(),
    groupId: text('group_id').notNull().unique().references(() => groups.id, { onDelete: 'cascade' }),
    smtpHost: text('smtp_host').notNull(),
    smtpPort: integer('smtp_port').notNull(),
    smtpEmail: text('smtp_email').notNull(),
    smtpPassword: text('smtp_password').notNull(), // Encrypted
    encryptionType: text('encryption_type').notNull(), // 'tls' | 'ssl' | 'none'
    senderName: text('sender_name'),
    replyTo: text('reply_to'),
    isConfigured: boolean('is_configured').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const groupSmtpConfigRelations = relations(groupSmtpConfig, ({ one }) => ({
    group: one(groups, {
        fields: [groupSmtpConfig.groupId],
        references: [groups.id],
    }),
}));

// =============================================================================
// Global SMTP Configuration - Account-level reusable SMTP configs
// =============================================================================
export const globalSmtpConfig = pgTable('global_smtp_config', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // User-friendly name for the config
    smtpHost: text('smtp_host').notNull(),
    smtpPort: integer('smtp_port').notNull(),
    smtpEmail: text('smtp_email').notNull(),
    smtpPassword: text('smtp_password').notNull(), // Encrypted
    encryptionType: text('encryption_type').notNull(), // 'tls' | 'ssl' | 'none'
    senderName: text('sender_name'),
    replyTo: text('reply_to'),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const globalSmtpConfigRelations = relations(globalSmtpConfig, ({ one }) => ({
    user: one(users, {
        fields: [globalSmtpConfig.userId],
        references: [users.id],
    }),
}));

// =============================================================================
// Mail Jobs - Async mail sending tracking
// =============================================================================
export const mailJobs = pgTable('mail_jobs', {
    id: text('id').primaryKey(),
    groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    totalRecipients: integer('total_recipients').notNull(),
    sentCount: integer('sent_count').default(0).notNull(),
    failedCount: integer('failed_count').default(0).notNull(),
    pendingCount: integer('pending_count').notNull(),
    status: text('status').default('pending').notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
    recipientData: jsonb('recipient_data'), // Array of recipient details
    errors: jsonb('errors'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mailJobsRelations = relations(mailJobs, ({ one, many }) => ({
    group: one(groups, {
        fields: [mailJobs.groupId],
        references: [groups.id],
    }),
    logs: many(mailLogs),
}));

// =============================================================================
// Mail Logs - Permanent record of all emails sent
// =============================================================================
export const mailLogs = pgTable('mail_logs', {
    id: text('id').primaryKey(),
    groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    mailJobId: text('mail_job_id').references(() => mailJobs.id, { onDelete: 'set null' }),
    recipientEmail: text('recipient_email').notNull(),
    recipientName: text('recipient_name'),
    subject: text('subject').notNull(),
    status: text('status').notNull(), // 'sent' | 'failed'
    errorMessage: text('error_message'),
    sentAt: timestamp('sent_at').defaultNow().notNull(),
});

export const mailLogsRelations = relations(mailLogs, ({ one }) => ({
    group: one(groups, {
        fields: [mailLogs.groupId],
        references: [groups.id],
    }),
    mailJob: one(mailJobs, {
        fields: [mailLogs.mailJobId],
        references: [mailJobs.id],
    }),
}));


// =============================================================================
// Certificates
// =============================================================================
export const certificates = pgTable('certificates', {
    id: text('id').primaryKey(),
    certificateCode: text('certificate_code').notNull().unique(),
    templateId: text('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
    groupId: text('group_id').references(() => groups.id, { onDelete: 'set null' }),
    recipientName: text('recipient_name').notNull(),
    recipientEmail: text('recipient_email'), // Used for certificate ID generation
    data: jsonb('data').notNull(),
    filename: text('filename').notNull(),
    filepath: text('filepath').notNull(),
    fileUrl: text('file_url'),
    fileId: text('file_id'),
    generationMode: text('generation_mode').notNull(), // 'single' | 'bulk'
    bulkJobId: text('bulk_job_id').references(() => bulkJobs.id, { onDelete: 'set null' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const certificatesRelations = relations(certificates, ({ one }) => ({
    template: one(templates, {
        fields: [certificates.templateId],
        references: [templates.id],
    }),
    group: one(groups, {
        fields: [certificates.groupId],
        references: [groups.id],
    }),
    bulkJob: one(bulkJobs, {
        fields: [certificates.bulkJobId],
        references: [bulkJobs.id],
    }),
}));

// =============================================================================
// Bulk Jobs
// =============================================================================
export const bulkJobs = pgTable('bulk_jobs', {
    id: text('id').primaryKey(),
    templateId: text('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
    groupId: text('group_id').references(() => groups.id, { onDelete: 'set null' }),
    sourceType: text('source_type').notNull(), // 'csv' | 'sheets'
    totalRecords: integer('total_records').notNull(),
    successful: integer('successful').default(0).notNull(),
    failed: integer('failed').default(0).notNull(),
    status: text('status').default('pending').notNull(),
    zipFilename: text('zip_filename'),
    zipFilepath: text('zip_filepath'),
    zipFileUrl: text('zip_file_url'),
    zipFileId: text('zip_file_id'),
    errors: jsonb('errors'),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bulkJobsRelations = relations(bulkJobs, ({ one, many }) => ({
    template: one(templates, {
        fields: [bulkJobs.templateId],
        references: [templates.id],
    }),
    group: one(groups, {
        fields: [bulkJobs.groupId],
        references: [groups.id],
    }),
    certificates: many(certificates),
}));

// =============================================================================
// Spreadsheets (Data Vault)
// =============================================================================
export const spreadsheets = pgTable('spreadsheets', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const spreadsheetData = pgTable('spreadsheet_data', {
    id: text('id').primaryKey(),
    spreadsheetId: text('spreadsheet_id').notNull().references(() => spreadsheets.id, { onDelete: 'cascade' }),
    content: jsonb('content').notNull(), // FortuneSheet data
});

export const spreadsheetsRelations = relations(spreadsheets, ({ one }) => ({
    data: one(spreadsheetData, {
        fields: [spreadsheets.id],
        references: [spreadsheetData.spreadsheetId],
    }),
}));

export const spreadsheetDataRelations = relations(spreadsheetData, ({ one }) => ({
    spreadsheet: one(spreadsheets, {
        fields: [spreadsheetData.spreadsheetId],
        references: [spreadsheets.id],
    }),
}));

// =============================================================================
// Auth & System
// =============================================================================

export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: text("role").$type<"admin" | "user">().default("user"),
    isAllowed: boolean("is_allowed").default(false), // Admin must approve
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccount["type"]>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
);

export const systemSettings = pgTable("system_settings", {
    id: text("id").primaryKey().$defaultFn(() => "global"),
    allowSignups: boolean("allow_signups").default(false).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =============================================================================
// Signatures
// =============================================================================
export const signatures = pgTable('signatures', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    filename: text('filename').notNull(),
    fileUrl: text('file_url').notNull(),
    fileId: text('file_id'), // ImageKit ID
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
