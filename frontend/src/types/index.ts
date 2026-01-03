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
    type: 'text' | 'date' | 'signature';
    required: boolean;

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
    templateId: string;
    sheetId?: string | null;
    sheet?: {
        id: string;
        name: string;
    };
    template?: {
        id: string;
        name: string;
        code: string;
    };
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

// Available fonts (must match backend)
export const AVAILABLE_FONTS = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier', label: 'Courier' },
];

export const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

export const ATTRIBUTE_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'date', label: 'Date' },
    { value: 'signature', label: 'Signature' },
];
