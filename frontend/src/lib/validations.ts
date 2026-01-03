/**
 * Zod validation schemas for form data
 * Updated for PDF-based templates
 */

import { z } from 'zod';

export const templateUploadSchema = z.object({
    name: z.string().min(1, 'Template name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    template: z.instanceof(File, { message: 'Template file is required' })
        .refine(
            (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
            'Only PDF files are supported'
        )
        .refine(
            (file) => file.size <= 50 * 1024 * 1024,
            'File must be less than 50MB'
        ),
});

export const singleCertificateSchema = z.object({
    templateId: z.string().min(1, 'Please select a template'),
    name: z.string().min(1, 'Recipient name is required').max(200, 'Name must be less than 200 characters'),
    certificateId: z.string().optional(),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    date: z.string().optional(),
    signatureId: z.string().optional(),
});

export const bulkUploadSchema = z.object({
    templateId: z.string().min(1, 'Please select a template'),
    csv: z.instanceof(File, { message: 'CSV file is required' })
        .refine(
            (file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
            'File must be a CSV'
        )
        .refine(
            (file) => file.size <= 10 * 1024 * 1024,
            'File must be less than 10MB'
        ),
    columnMapping: z.record(z.string(), z.string()),
});

export const signatureUploadSchema = z.object({
    name: z.string().min(1, 'Signature name is required').max(100, 'Name must be less than 100 characters'),
    signature: z.instanceof(File, { message: 'Signature file is required' })
        .refine(
            (file) => ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type),
            'File must be PNG or JPG'
        )
        .refine(
            (file) => file.size <= 5 * 1024 * 1024,
            'File must be less than 5MB'
        ),
});

export type TemplateUploadData = z.infer<typeof templateUploadSchema>;
export type SingleCertificateData = z.infer<typeof singleCertificateSchema>;
export type BulkUploadData = z.infer<typeof bulkUploadSchema>;
export type SignatureUploadData = z.infer<typeof signatureUploadSchema>;
