
// =============================================================================
// Shared Type Definitions
// =============================================================================

// Template & Attribute Types
export interface Template {
    id: string;
    code: string; // 1-5 char unique template code (e.g., "NAMD25")
    name: string;
    description: string | null;
    filename: string;
    filepath: string;
    pageCount: number;
    width: number;
    height: number;
    format: 'pdf'; // Fixed to PDF for now
    attributes: DynamicAttribute[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DynamicAttribute {
    id: string;
    name: string;
    description?: string;
    placeholder?: string; // e.g., "{studentName}" -> matches CSV header or prompt
    type: 'text' | 'date' | 'signature' | 'image' | 'qrcode';
    required?: boolean;
    defaultValue?: string;

    // Positioning and Style
    page: number; // 1-indexed
    x: number;
    y: number;
    width?: number; // For images/signatures
    height?: number; // For images/signatures

    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string; // 'bold', 'normal'
    color?: string; // Hex code
    align?: 'left' | 'center' | 'right';
    maxWidth?: number; // For text wrapping
}

export interface Certificate {
    id: string;
    certificateCode: string;
    templateId: string;
    groupId?: string | null;
    recipientName: string;
    recipientEmail?: string | null;
    data: any; // JSON payload
    filename: string; // generated filename
    filepath: string; // full path
    fileUrl?: string;
    fileId?: string;
    generationMode: 'single' | 'bulk';
    bulkJobId?: string | null;
    createdAt: Date;
}

export interface BulkError {
    row: number;
    error: string;
    data?: any;
}

export interface BulkJob {
    id: string;
    templateId: string;
    sourceType: 'csv' | 'sheets';
    totalRecords: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    successful: number;
    failed: number;
    zipFilename?: string | null;
    zipFilepath?: string | null;
    zipFileUrl?: string | null;
    zipFileId?: string | null;
    errors?: BulkError[] | null;
    createdAt: Date;
    updatedAt: Date;
}

// Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface GenerationResult {
    certificateId: string;
    filename: string;
    downloadUrl: string;
}

export interface BulkGenerationResult {
    jobId: string;
    message: string;
}

// Storage Types
export type StorageType = 'templates' | 'generated' | 'signatures' | 'bulk-zips';

export interface StorageProvider {
    initialize(): Promise<void>;
    saveFile(file: Express.Multer.File, type: StorageType, filename?: string): Promise<{ id: string, name: string, url: string }>;
    getFile(type: StorageType, filename: string): Promise<Buffer>; // filename or fileId? ImageKit needs ID usually or we search by name
    deleteFile(type: StorageType, filename: string): Promise<boolean>; // filename could be fileId
    listFiles(type: StorageType): Promise<string[]>; // Returns names or objects?
    getPublicUrl(type: StorageType, filename: string): string;
    uploadBuffer(buffer: Buffer, filepath: string): Promise<{ id: string, name: string, url: string }>;
    get(type: StorageType, filename: string): Promise<Buffer>;
}

export interface Signature {
    id: string;
    name: string; // e.g., "Principal Signature"
    filename: string;
    uploadDate: Date;
    filepath: string;
}

// Renderer Types
export interface CertificateData {
    [key: string]: string;
}

export const FONT_MAPPING = {
    'Inter': 'Inter-Regular.ttf',
    'Roboto': 'Roboto-Regular.ttf',
    'Great Vibes': 'GreatVibes-Regular.ttf',
    'Dancing Script': 'DancingScript-Regular.ttf',
    'Playfair Display': 'PlayfairDisplay-Regular.ttf',
    'Montserrat': 'Montserrat-Regular.ttf',
} as const;

export type SupportedFont = keyof typeof FONT_MAPPING;

export function isTextAttribute(attr: DynamicAttribute): boolean {
    return attr.type === 'text' || attr.type === 'date';
}

export function isSignatureAttribute(attr: DynamicAttribute): boolean {
    return attr.type === 'signature' || attr.type === 'image' || attr.type === 'qrcode';
}
