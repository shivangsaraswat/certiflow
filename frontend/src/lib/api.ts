/**
 * API Client for Certificate Generation Backend
 * Updated for dynamic attributes
 */

import type {
    Template,
    ApiResponse,
    GenerationResult,
    BulkGenerationResult,
    Signature,
    CertificateData,
    DynamicAttribute,
} from '@/types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options?.headers,
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: error instanceof Error ? error.message : 'Network request failed',
            },
        };
    }
}

// =============================================================================
// Template API
// =============================================================================

export async function getTemplates(): Promise<ApiResponse<Template[]>> {
    return fetchApi<Template[]>('/templates');
}

export async function getTemplate(id: string): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}`);
}

export async function createTemplate(formData: FormData): Promise<ApiResponse<Template>> {
    return fetchApi<Template>('/templates', {
        method: 'POST',
        body: formData,
    });
}

export async function updateTemplate(
    id: string,
    data: { name?: string; description?: string }
): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

/**
 * Update all attributes for a template (from visual editor)
 */
export async function updateTemplateAttributes(
    id: string,
    attributes: DynamicAttribute[]
): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}/attributes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes }),
    });
}

/**
 * Add a single attribute to a template
 */
export async function addTemplateAttribute(
    id: string,
    attribute: Omit<DynamicAttribute, 'id'>
): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attribute),
    });
}

/**
 * Remove an attribute from a template
 */
export async function removeTemplateAttribute(
    id: string,
    attributeId: string
): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}/attributes/${attributeId}`, {
        method: 'DELETE',
    });
}

export async function deleteTemplate(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return fetchApi<{ deleted: boolean }>(`/templates/${id}`, {
        method: 'DELETE',
    });
}

// =============================================================================
// Certificate Generation API
// =============================================================================

export async function generateSingleCertificate(
    templateId: string,
    data: CertificateData
): Promise<ApiResponse<GenerationResult>> {
    return fetchApi<GenerationResult>('/generate/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, data }),
    });
}

export async function generateBulkCertificates(
    formData: FormData
): Promise<ApiResponse<BulkGenerationResult>> {
    return fetchApi<BulkGenerationResult>('/generate/bulk', {
        method: 'POST',
        body: formData,
    });
}

export async function previewCSVHeaders(
    formData: FormData
): Promise<ApiResponse<{ headers: string[] }>> {
    return fetchApi<{ headers: string[] }>('/generate/bulk/preview', {
        method: 'POST',
        body: formData,
    });
}

// =============================================================================
// Signature API
// =============================================================================

export async function getSignatures(): Promise<ApiResponse<Signature[]>> {
    return fetchApi<Signature[]>('/files/signatures');
}

export async function uploadSignature(formData: FormData): Promise<ApiResponse<Signature>> {
    return fetchApi<Signature>('/files/signature', {
        method: 'POST',
        body: formData,
    });
}

export async function deleteSignature(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return fetchApi<{ deleted: boolean }>(`/files/signature/${id}`, {
        method: 'DELETE',
    });
}

// =============================================================================
// File URLs
// =============================================================================

export function getDownloadUrl(type: string, filename: string): string {
    return `${API_BASE_URL}/files/download/${type}/${filename}`;
}

export function getViewUrl(type: string, filename: string, thumbnail?: boolean): string {
    const url = `${API_BASE_URL}/files/view/${type}/${filename}`;
    return thumbnail ? `${url}?thumbnail=true` : url;
}

// =============================================================================
// Groups API
// =============================================================================

import type { Group, GroupCertificate } from '@/types';

export async function getGroups(): Promise<ApiResponse<Group[]>> {
    return fetchApi<Group[]>('/groups');
}

export async function getGroup(id: string): Promise<ApiResponse<Group>> {
    return fetchApi<Group>(`/groups/${id}`);
}

export async function createGroup(data: { name: string; description?: string; templateId: string; sheetId?: string }): Promise<ApiResponse<Group>> {
    return fetchApi<Group>('/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function updateGroup(id: string, data: { name?: string; description?: string }): Promise<ApiResponse<{ id: string; updated: boolean }>> {
    return fetchApi<{ id: string; updated: boolean }>(`/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteGroup(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return fetchApi<{ deleted: boolean }>(`/groups/${id}`, {
        method: 'DELETE',
    });
}

export async function getGroupCertificates(groupId: string, limit = 50, offset = 0): Promise<ApiResponse<{ certificates: GroupCertificate[]; total: number }>> {
    return fetchApi<{ certificates: GroupCertificate[]; total: number }>(`/groups/${groupId}/certificates?limit=${limit}&offset=${offset}`);
}

export async function generateSingleInGroup(groupId: string, data: { data: Record<string, string>; recipientName?: string; recipientEmail?: string }): Promise<ApiResponse<GenerationResult>> {
    return fetchApi<GenerationResult>(`/groups/${groupId}/generate/single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function generateBulkInGroup(groupId: string, formData: FormData): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return fetchApi<{ jobId: string; message: string }>(`/groups/${groupId}/generate/bulk`, {
        method: 'POST',
        body: formData,
    });
}

export async function deleteCertificate(id: string): Promise<ApiResponse<{ message: string }>> {
    return fetchApi<{ message: string }>(`/certificates/${id}`, {
        method: 'DELETE',
    });
}

export async function getBulkJobStatus(jobId: string): Promise<ApiResponse<BulkGenerationResult>> {
    return fetchApi<BulkGenerationResult>(`/generate/bulk/status/${jobId}`);
}
