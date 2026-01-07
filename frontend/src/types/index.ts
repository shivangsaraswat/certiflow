/**
 * TypeScript type definitions for the Certificate Generation Frontend
 * Updated for dynamic, user-defined attributes per template
 */

// =============================================================================
// Template Types
// =============================================================================

export interface Template {
    id: string;
    code: string;                      // 1-5 char unique template code (e.g., "NAMD25")
    name: string;
    description?: string;
    filename: string;
    filepath: string;
    format: 'pdf';
    pageCount: number;
    width: number;                    // Page width in points
    height: number;                   // Page height in points
    attributes: DynamicAttribute[];   // Custom attributes defined by user
    isPublic: boolean;
    category?: string | null;
    style?: string | null;
    color?: string | null;
    fileUrl?: string | null;
    fileId?: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Dynamic Attribute - User-defined placeholder on the template
 */
export interface DynamicAttribute {
    id: string;
    name: string;                     // Display name (e.g., "Recipient Name")
    placeholder: string;              // Placeholder shown in editor (e.g., "{Name}")
    type: 'text' | 'date' | 'signature' | 'qr' | 'image' | 'shape';
    required: boolean;
    defaultValue?: string;

    // Position in PDF coordinates
    page: number;
    x: number;
    y: number;

    // Text styling
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    color: string;
    align: 'left' | 'center' | 'right';
    maxWidth?: number;

    // For signature type
    width?: number;
    height?: number;

    // Layer properties
    locked?: boolean;
    hidden?: boolean;

    // System attribute flag - cannot be renamed or deleted
    isSystem?: boolean;

    // For QR code type - URL template with optional placeholders
    qrUrl?: string;
}

// =============================================================================
// Certificate Data Types
// =============================================================================

export interface CertificateData {
    [attributeId: string]: string | undefined;
}

export interface GenerateSingleRequest {
    templateId: string;
    data: CertificateData;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string>;
}

export interface GenerationResult {
    certificateId: string;
    filename: string;
    downloadUrl: string;
}

export interface BulkGenerationResult {
    jobId: string;
    status: 'processing' | 'completed' | 'failed';
    totalRequested: number;
    successful: number;
    failed: number;
    zipUrl: string;
    errors?: BulkError[];
}

export interface BulkError {
    row: number;
    message: string;
}

// =============================================================================
// Group Types
// =============================================================================

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
    // Relations
    sheet?: {
        id: string;
        name: string;
    } | null;
    template?: {
        id: string;
        name: string;
        code: string;
    } | null;
    smtpConfig?: GroupSmtpConfig | null;
    certificateCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface GroupCertificate {
    id: string;
    certificateCode: string;
    recipientName: string;
    recipientEmail?: string;
    filename: string;
    fileUrl?: string;
    generationMode: 'single' | 'bulk';
    createdAt: string;
}

// =============================================================================
// Mail System Types
// =============================================================================

export interface GroupSmtpConfig {
    id: string;
    groupId: string;
    smtpHost: string;
    smtpPort: number;
    smtpEmail: string;
    smtpPassword?: string; // Only for creation, masked otherwise
    encryptionType: 'tls' | 'ssl' | 'none';
    senderName?: string | null;
    replyTo?: string | null;
    isConfigured: boolean;
    createdAt: string;
    updatedAt: string;
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
    createdAt: string;
    updatedAt: string;
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
    sentAt: string;
}

// =============================================================================
// Signature Types
// =============================================================================

export interface Signature {
    id: string;
    name: string;
    filename: string;
    filepath: string;
    previewUrl: string;
    createdAt: string;
}

// =============================================================================
// Editor Types
// =============================================================================

export interface EditorState {
    selectedAttributeId: string | null;
    zoom: number;
    isDragging: boolean;
}

// Available fonts - expanded list matching backend FONT_MAPPING
// Standard PDF fonts and their web equivalents
export const AVAILABLE_FONTS = [
    // Sans-serif fonts
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    // Serif fonts
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'DM Serif Display', label: 'DM Serif Display' },
    // Monospace
    { value: 'Courier', label: 'Courier' },
    // Decorative / Script fonts
    { value: 'Great Vibes', label: 'Great Vibes' },
    { value: 'Dancing Script', label: 'Dancing Script' },
];

export const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

export const ATTRIBUTE_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'date', label: 'Date' },
    { value: 'signature', label: 'Signature' },
    { value: 'qr', label: 'QR Code' },
];

// System attribute IDs - these are auto-injected and non-deletable
export const SYSTEM_ATTRIBUTE_IDS = ['certificateId', 'recipientName', 'generatedDate', 'qrCode'];

// System attribute definitions for the editor
export const SYSTEM_ATTRIBUTE_DEFS = {
    certificateId: {
        id: 'certificateId',
        name: 'Certificate ID',
        type: 'text' as const,
        description: 'Auto-generated unique certificate identifier',
    },
    recipientName: {
        id: 'recipientName',
        name: 'Recipient Name',
        type: 'text' as const,
        description: 'Name of the certificate recipient',
    },
    generatedDate: {
        id: 'generatedDate',
        name: 'Generated Date',
        type: 'date' as const,
        description: 'Date when the certificate was generated',
    },
    qrCode: {
        id: 'qrCode',
        name: 'QR Code',
        type: 'qr' as const,
        description: 'Dynamic QR code generated from URL',
    },
};


// =============================================================================
// Dashboard Stats
// =============================================================================

export interface DashboardStats {
    certificates: number;
    templates: number;
    groups: number;
    signatures: number;
    recentActivity?: {
        id: string;
        recipientName: string;
        createdAt: string;
        generationMode: 'single' | 'bulk';
    }[];
}

// =============================================================================
// Asset Types
// =============================================================================

export interface UserAsset {
    id: string;
    filename: string;
    fileUrl: string;
    fileId?: string;
    width: number;
    height: number;
    createdAt: string;
    userId: string;
}
