

export interface DynamicAttribute {
    id: string; // Unique ID for the attribute
    name: string; // Display name (e.g., "Student Name")
    key: string; // unique key for data mapping (e.g., "recipient_name")
    type: 'text' | 'image' | 'qrcode' | 'date' | 'qr';
    defaultValue?: string;
    description?: string;

    // System attribute flag - cannot be renamed or deleted
    isSystem?: boolean;

    // For QR code type - URL template with optional placeholders
    // e.g., "https://verify.example.com/{certificateId}"
    qrUrl?: string;

    // Positioning and Style
    x: number; // Percentage (0-100)
    y: number; // Percentage (0-100)
    width?: number; // For images/QR codes
    height?: number; // For images/QR codes

    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    opacity?: number;

    // Renderer properties
    align?: 'left' | 'center' | 'right';
    page?: number;
    maxWidth?: number;
    required?: boolean;
    placeholder?: string;
}

export interface Template {
    id: string;
    code: string; // Unique code
    name: string;
    description?: string;

    // File Info
    filename: string;
    filepath: string; // Path in storage
    fileUrl?: string; // Public/Private URL
    fileId?: string; // ImageKit/Cloud File ID

    // Dimensions
    pageCount: number;
    width: number;
    height: number;
    format: 'pdf' | 'png' | 'jpg';

    // Dynamic Content
    attributes: DynamicAttribute[];

    // Multi-tenancy
    userId?: string | null;
    isPublic?: boolean;
    category?: string | null;
    style?: string | null;
    color?: string | null;

    createdAt: Date;
    updatedAt: Date;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export type StorageType = 'templates' | 'generated' | 'signatures' | 'bulk-zips' | 'assets';

export interface Signature {
    id: string;
    name: string;
    filename: string;
    filepath: string; // URL
    fileId?: string;
    createdAt: Date;
    userId?: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    // Configuration - all optional for settings-first approach
    templateId?: string | null;
    sheetId?: string | null;
    selectedSheetTab?: string | null;
    columnMapping?: Record<string, string> | null; // { attrId: columnName }
    // Email configuration
    emailTemplateHtml?: string | null;
    emailSubject?: string | null;
    // Metadata
    certificateCount?: number;
    userId?: string;
    createdAt: Date;
    updatedAt: Date;
    // Relations (populated by API)
    template?: {
        id: string;
        name: string;
        code: string;
    } | null;
    sheet?: {
        id: string;
        name: string;
    } | null;
    smtpConfig?: GroupSmtpConfig | null;
}

export interface GroupSmtpConfig {
    id: string;
    groupId: string;
    smtpHost: string;
    smtpPort: number;
    smtpEmail: string;
    smtpPassword?: string; // Only exposed for creation, masked otherwise
    encryptionType: 'tls' | 'ssl' | 'none';
    senderName?: string | null;
    replyTo?: string | null;
    isConfigured: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MailJob {
    id: string;
    groupId: string;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    pendingCount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    recipientData?: Array<{
        email: string;
        name?: string;
        data?: Record<string, string>;
    }>;
    errors?: Array<{ email: string; message: string }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface MailLog {
    id: string;
    groupId: string;
    mailJobId?: string | null;
    recipientEmail: string;
    recipientName?: string | null;
    subject: string;
    status: 'sent' | 'failed';
    errorMessage?: string | null;
    sentAt: Date;
}


export interface Certificate {
    id: string;
    certificateCode: string;
    templateId: string;
    groupId?: string | null;
    recipientName: string;
    recipientEmail?: string | null;
    data: Record<string, string>;
    filename: string;
    filepath: string;
    fileUrl?: string;
    fileId?: string;
    generationMode: 'single' | 'bulk';
    bulkJobId?: string | null;
    userId?: string | null;
    createdAt: Date;
}

export interface BulkJob {
    id: string;
    templateId: string;
    groupId?: string | null;
    sourceType: 'csv' | 'sheets';
    totalRecords: number;
    successful: number;
    failed: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    zipFilename?: string | null;
    zipFilepath?: string | null;
    zipFileUrl?: string | null;
    zipFileId?: string | null;
    errors?: any;
    userId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CertificateData extends Record<string, string> { }

export interface GenerationResult {
    certificateId: string;
    filename: string;
    downloadUrl: string;
    fileUrl?: string;
}

export interface BulkGenerationResult {
    jobId: string;
    message?: string;
    totalRequested?: number;
    successful?: number;
    failed?: number;
    status?: string;
    errors?: Array<{ row: number; message: string }>;
    zipUrl?: string;
}

export interface StorageProvider {
    saveFile(file: any, type: StorageType, filename?: string): Promise<{ id: string, name: string, url: string }>;
    uploadBuffer(buffer: Buffer, filepath: string): Promise<{ id: string, name: string, url: string }>;
    deleteFile(type: StorageType, filename: string): Promise<boolean>;
    getFile(type: StorageType, filename: string): Promise<Buffer>;
    listFiles(type: StorageType): Promise<string[]>;
    getPublicUrl(type: StorageType, filename: string): string;
}

// Font mapping - expanded list matching frontend AVAILABLE_FONTS
// Maps user-friendly font names to categories for PDF rendering
export const FONT_MAPPING = {
    // Sans-serif fonts
    'Helvetica': 'Helvetica',
    'Inter': 'Helvetica',
    'Roboto': 'Helvetica',
    'Montserrat': 'Helvetica',
    'Open Sans': 'Helvetica',
    'Lato': 'Helvetica',
    // Serif fonts
    'Times New Roman': 'TimesRoman',
    'Playfair Display': 'TimesRoman',
    'DM Serif Display': 'TimesRoman',
    // Monospace
    'Courier': 'Courier',
    // Decorative / Script fonts (italic fallback)
    'Great Vibes': 'TimesRomanItalic',
    'Dancing Script': 'TimesRomanItalic',
} as const;

export type SupportedFont = keyof typeof FONT_MAPPING;
export type PDFFontType = 'Helvetica' | 'HelveticaBold' | 'TimesRoman' | 'TimesRomanBold' | 'TimesRomanItalic' | 'Courier' | 'CourierBold';

// Get PDF font type from user font selection
export function getPDFFontType(fontFamily: string, fontWeight?: string): PDFFontType {
    const mapping = FONT_MAPPING[fontFamily as SupportedFont];
    const baseFont = mapping || 'Helvetica';

    // Apply bold variant if available
    if (fontWeight === 'bold') {
        if (baseFont === 'Helvetica') return 'HelveticaBold';
        if (baseFont === 'TimesRoman') return 'TimesRomanBold';
        if (baseFont === 'Courier') return 'CourierBold';
    }

    return baseFont as PDFFontType;
}

export function isTextAttribute(attr: DynamicAttribute): boolean {
    return attr.type === 'text' || attr.type === 'date';
}

export function isSignatureAttribute(attr: DynamicAttribute): boolean {
    return attr.type === 'image';
}

export function isQRCodeAttribute(attr: DynamicAttribute): boolean {
    return attr.type === 'qr' || attr.type === 'qrcode';
}
