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
    DashboardStats,
    UserAsset,
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
                ...(options?.headers as Record<string, string>),
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

export interface GetTemplatesParams {
    category?: string;
    style?: string;
    color?: string;
    search?: string;
    public?: boolean;
}

export async function getTemplates(userId?: string, params?: GetTemplatesParams): Promise<ApiResponse<Template[]>> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.style) query.append('style', params.style);
    if (params?.color) query.append('color', params.color);
    if (params?.search) query.append('search', params.search);
    if (params?.public) query.append('public', 'true');

    const queryString = query.toString();
    const endpoint = `/templates${queryString ? `?${queryString}` : ''}`;

    return fetchApi<Template[]>(endpoint, {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

export async function getTemplate(id: string, userId?: string): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}`, {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

export async function createTemplate(formData: FormData, userId?: string): Promise<ApiResponse<Template>> {
    return fetchApi<Template>('/templates', {
        method: 'POST',
        headers: userId ? { 'x-user-id': userId } : undefined,
        body: formData,
    });
}

export async function updateTemplate(
    id: string,
    data: { name?: string; description?: string; sourceTemplateId?: string },
    userId?: string
): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(data),
    });
}

/**
 * Update all attributes for a template (from visual editor)
 */
export async function updateTemplateAttributes(
    id: string,
    attributes: DynamicAttribute[],
    userId?: string
): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}/attributes`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({ attributes }),
    });
}

/**
 * Add a single attribute to a template
 */
export async function addTemplateAttribute(
    id: string,
    attribute: Omit<DynamicAttribute, 'id'>,
    userId?: string
): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}/attributes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(attribute),
    });
}

/**
 * Remove an attribute from a template
 */
export async function removeTemplateAttribute(
    id: string,
    attributeId: string,
    userId?: string
): Promise<ApiResponse<Template>> {
    return fetchApi<Template>(`/templates/${id}/attributes/${attributeId}`, {
        method: 'DELETE',
        headers: userId ? { 'x-user-id': userId } : undefined,
    });
}

export async function deleteTemplate(id: string, userId?: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return fetchApi<{ deleted: boolean }>(`/templates/${id}`, {
        method: 'DELETE',
        headers: userId ? { 'x-user-id': userId } : undefined,
    });
}

// =============================================================================
// Certificate Generation API
// =============================================================================

export async function generateSingleCertificate(
    templateId: string,
    data: CertificateData,
    userId?: string
): Promise<ApiResponse<GenerationResult>> {
    return fetchApi<GenerationResult>('/generate/single', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({ templateId, data }),
    });
}

export async function generateBulkCertificates(
    formData: FormData,
    userId?: string
): Promise<ApiResponse<BulkGenerationResult>> {
    return fetchApi<BulkGenerationResult>('/generate/bulk', {
        method: 'POST',
        headers: userId ? { 'x-user-id': userId } : undefined,
        body: formData,
    });
}

export async function previewCSVHeaders(
    formData: FormData,
    userId?: string
): Promise<ApiResponse<{ headers: string[] }>> {
    return fetchApi<{ headers: string[] }>('/generate/bulk/preview', {
        method: 'POST',
        headers: userId ? { 'x-user-id': userId } : undefined,
        body: formData,
    });
}

// =============================================================================
// Signature API
// =============================================================================

export async function getSignatures(userId?: string): Promise<ApiResponse<Signature[]>> {
    return fetchApi<Signature[]>('/files/signatures', {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

export async function uploadSignature(formData: FormData, userId?: string): Promise<ApiResponse<Signature>> {
    return fetchApi<Signature>('/files/signatures', {
        method: 'POST',
        headers: userId ? { 'x-user-id': userId } : undefined,
        body: formData,
    });
}

export async function deleteSignature(id: string, userId?: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return fetchApi<{ deleted: boolean }>(`/files/signatures/${id}`, {
        method: 'DELETE',
        headers: userId ? { 'x-user-id': userId } : undefined,
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

export async function getGroups(userId?: string): Promise<ApiResponse<Group[]>> {
    return fetchApi<Group[]>('/groups', {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

export async function getGroup(id: string, userId?: string): Promise<ApiResponse<Group>> {
    return fetchApi<Group>(`/groups/${id}`, {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

// Simplified: Only name and description required
export async function createGroup(data: { name: string; description?: string }, userId?: string): Promise<ApiResponse<Group>> {
    return fetchApi<Group>('/groups', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(data),
    });
}

export async function updateGroup(id: string, data: { name?: string; description?: string }, userId?: string): Promise<ApiResponse<{ id: string; updated: boolean }>> {
    return fetchApi<{ id: string; updated: boolean }>(`/groups/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(data),
    });
}

export async function deleteGroup(id: string, userId?: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return fetchApi<{ deleted: boolean }>(`/groups/${id}`, {
        method: 'DELETE',
        headers: userId ? { 'x-user-id': userId } : undefined,
    });
}

// =============================================================================
// Group Settings APIs
// =============================================================================

export async function updateGroupTemplate(groupId: string, templateId: string | null, userId?: string): Promise<ApiResponse<{ id: string; templateId: string; updated: boolean }>> {
    return fetchApi<{ id: string; templateId: string; updated: boolean }>(`/groups/${groupId}/settings/template`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({ templateId }),
    });
}

export async function updateGroupDataConfig(
    groupId: string,
    config: { sheetId?: string | null; selectedSheetTab?: string | null; columnMapping?: Record<string, string> | null },
    userId?: string
): Promise<ApiResponse<{ id: string; updated: boolean }>> {
    return fetchApi<{ id: string; updated: boolean }>(`/groups/${groupId}/settings/data`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(config),
    });
}

export async function updateGroupEmailTemplate(
    groupId: string,
    config: { emailSubject?: string; emailTemplateHtml?: string },
    userId?: string
): Promise<ApiResponse<{ id: string; updated: boolean }>> {
    return fetchApi<{ id: string; updated: boolean }>(`/groups/${groupId}/settings/email-template`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(config),
    });
}


export async function getGroupCertificates(groupId: string, userId?: string, limit = 50, offset = 0): Promise<ApiResponse<{ certificates: GroupCertificate[]; total: number }>> {
    return fetchApi<{ certificates: GroupCertificate[]; total: number }>(`/groups/${groupId}/certificates?limit=${limit}&offset=${offset}`, {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

export async function generateSingleInGroup(groupId: string, data: { data: Record<string, string>; recipientName?: string; recipientEmail?: string }, userId?: string): Promise<ApiResponse<GenerationResult>> {
    return fetchApi<GenerationResult>(`/groups/${groupId}/generate/single`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(data),
    });
}

export async function generateBulkInGroup(groupId: string, formData: FormData, userId?: string): Promise<ApiResponse<{ jobId: string; message: string }>> {
    return fetchApi<{ jobId: string; message: string }>(`/groups/${groupId}/generate/bulk`, {
        method: 'POST',
        headers: userId ? { 'x-user-id': userId } : undefined,
        body: formData,
    });
}

export async function deleteCertificate(id: string, userId?: string): Promise<ApiResponse<{ message: string }>> {
    return fetchApi<{ message: string }>(`/certificates/${id}`, {
        method: 'DELETE',
        headers: userId ? { 'x-user-id': userId } : undefined,
    });
}

export async function getBulkJobStatus(jobId: string, userId?: string): Promise<ApiResponse<BulkGenerationResult>> {
    return fetchApi<BulkGenerationResult>(`/generate/bulk/status/${jobId}`, {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

// =============================================================================
// Dashboard API
// =============================================================================

export async function getDashboardStats(userId?: string): Promise<ApiResponse<DashboardStats>> {
    return fetchApi<DashboardStats>('/dashboard/stats', {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

// =============================================================================
// Assets API
// =============================================================================

export async function getUserAssets(userId?: string): Promise<ApiResponse<UserAsset[]>> {
    return fetchApi<UserAsset[]>('/assets', {
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}

export async function uploadAsset(formData: FormData, userId?: string): Promise<ApiResponse<UserAsset>> {
    return fetchApi<UserAsset>('/assets', {
        method: 'POST',
        headers: userId ? { 'x-user-id': userId } : undefined,
        body: formData,
    });
}

export async function deleteAsset(id: string, userId?: string): Promise<ApiResponse<{ message: string }>> {
    return fetchApi<{ message: string }>(`/assets/${id}`, {
        method: 'DELETE',
        headers: userId ? { 'x-user-id': userId } : undefined
    });
}
