/**
 * TypeScript type definitions for the Certificate Generation Application
 * Updated for dynamic, user-defined attributes per template
 */

// =============================================================================
// Template Types
// =============================================================================

export interface Template {
    id: string;
    name: string;
    description?: string;
    filename: string;
    filepath: string;
    format: 'pdf';
    pageCount: number;
    width: number;                    // Page width in points (72 points = 1 inch)
    height: number;                   // Page height in points
    attributes: DynamicAttribute[];   // Custom attributes defined by user
    createdAt: string;
    updatedAt: string;
}

/**
 * Dynamic Attribute - User-defined placeholder on the template
 * Each template can have different attributes based on user configuration
 */
export interface DynamicAttribute {
    id: string;                       // Unique ID (e.g., "attr_1", "attr_2")
    name: string;                     // Display name (e.g., "Recipient Name")
    placeholder: string;              // Placeholder shown in editor (e.g., "{Name}")
    type: 'text' | 'date' | 'signature';
    required: boolean;

    // Position in PDF coordinates (origin at bottom-left)
    page: number;                     // 1-indexed page number
    x: number;                        // X position in points
    y: number;                        // Y position in points (from bottom)

    // Text styling (for text and date types)
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    color: string;                    // Hex color (e.g., "#1F2A44")
    align: 'left' | 'center' | 'right';
    maxWidth?: number;                // For text wrapping

    // Image dimensions (for signature type)
    width?: number;
    height?: number;
}

// Type guards
export function isTextAttribute(attr: DynamicAttribute): boolean {
    return attr.type === 'text' || attr.type === 'date';
}

export function isSignatureAttribute(attr: DynamicAttribute): boolean {
    return attr.type === 'signature';
}

// =============================================================================
// Certificate Data Types
// =============================================================================

/**
 * Certificate data - dynamic key-value pairs matching template attributes
 */
export interface CertificateData {
    [attributeId: string]: string | undefined;
}

export interface GenerateSingleRequest {
    templateId: string;
    data: CertificateData;
}

export interface GenerateBulkRequest {
    templateId: string;
    columnMapping: Record<string, string>; // CSV column -> attribute ID
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
// Storage Types
// =============================================================================

export type StorageType = 'templates' | 'signatures' | 'generated' | 'bulk-zips';

export interface StorageProvider {
    save(file: Buffer, type: StorageType, filename: string): Promise<string>;
    get(type: StorageType, filename: string): Promise<Buffer>;
    delete(type: StorageType, filename: string): Promise<void>;
    list(type: StorageType): Promise<string[]>;
    getUrl(type: StorageType, filename: string): string;
    getPath(type: StorageType, filename: string): string;
}

// =============================================================================
// Signature Types
// =============================================================================

export interface Signature {
    id: string;
    name: string;
    filename: string;
    filepath: string;
    createdAt: string;
}

// =============================================================================
// CSV Types
// =============================================================================

export interface CSVRecord {
    [key: string]: string;
}

export interface ColumnMapping {
    [csvColumn: string]: string; // maps to attribute ID
}

// =============================================================================
// Font Types
// =============================================================================

export type SupportedFont =
    | 'Helvetica'
    | 'Helvetica-Bold'
    | 'Times-Roman'
    | 'Times-Bold'
    | 'Courier'
    | 'Courier-Bold';

// Map user-friendly names to pdf-lib standard fonts
export const FONT_MAPPING: Record<string, SupportedFont> = {
    'Helvetica': 'Helvetica',
    'Arial': 'Helvetica',
    'Sans-Serif': 'Helvetica',
    'Times New Roman': 'Times-Roman',
    'Times': 'Times-Roman',
    'Serif': 'Times-Roman',
    'Courier': 'Courier',
    'Courier New': 'Courier',
    'Monospace': 'Courier',
};

// Available fonts for the editor
export const AVAILABLE_FONTS = [
    { value: 'Helvetica', label: 'Helvetica (Sans-Serif)' },
    { value: 'Times New Roman', label: 'Times New Roman (Serif)' },
    { value: 'Courier', label: 'Courier (Monospace)' },
];
