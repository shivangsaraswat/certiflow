
import { pgTable, text, timestamp, integer, doublePrecision, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// Templates
// =============================================================================
export const templates = pgTable('templates', {
    id: text('id').primaryKey(), // using text for UUIDs provided by app
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const templatesRelations = relations(templates, ({ many }) => ({
    certificates: many(certificates),
    bulkJobs: many(bulkJobs),
}));

// =============================================================================
// Certificates
// =============================================================================
export const certificates = pgTable('certificates', {
    id: text('id').primaryKey(),
    certificateCode: text('certificate_code').notNull().unique(),
    templateId: text('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
    recipientName: text('recipient_name').notNull(),
    data: jsonb('data').notNull(),
    filename: text('filename').notNull(),
    filepath: text('filepath').notNull(),
    fileUrl: text('file_url'),
    fileId: text('file_id'),
    generationMode: text('generation_mode').notNull(), // 'single' | 'bulk'
    bulkJobId: text('bulk_job_id').references(() => bulkJobs.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const certificatesRelations = relations(certificates, ({ one }) => ({
    template: one(templates, {
        fields: [certificates.templateId],
        references: [templates.id],
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bulkJobsRelations = relations(bulkJobs, ({ one, many }) => ({
    template: one(templates, {
        fields: [bulkJobs.templateId],
        references: [templates.id],
    }),
    certificates: many(certificates),
}));
