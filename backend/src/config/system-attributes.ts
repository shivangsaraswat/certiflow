/**
 * System Attributes Registry
 * 
 * These are predefined, backend-controlled attributes that cannot be
 * recreated, renamed, or overridden by users. They behave exactly like
 * user-created attributes at render time.
 */

import type { DynamicAttribute } from '../types/index.js';

export interface SystemAttributeDefinition {
    id: string;
    name: string;
    type: 'text' | 'date' | 'qr';
    locked: true;
    description: string;
    defaultStyle: Partial<DynamicAttribute>;
}

/**
 * System Attributes Registry - Single Source of Truth
 * 
 * These IDs are reserved and cannot be used by user-defined attributes.
 */
export const SYSTEM_ATTRIBUTES: Record<string, SystemAttributeDefinition> = {
    certificateId: {
        id: 'certificateId',
        name: 'Certificate ID',
        type: 'text',
        locked: true,
        description: 'Auto-generated unique certificate identifier',
        defaultStyle: {
            fontSize: 12,
            fontFamily: 'Helvetica',
            fontWeight: 'normal',
            color: '#000000',
            align: 'left',
        },
    },
    recipientName: {
        id: 'recipientName',
        name: 'Recipient Name',
        type: 'text',
        locked: true,
        description: 'Name of the certificate recipient',
        defaultStyle: {
            fontSize: 24,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            color: '#000000',
            align: 'center',
        },
    },
    generatedDate: {
        id: 'generatedDate',
        name: 'Generated Date',
        type: 'date',
        locked: true,
        description: 'Date when the certificate was generated',
        defaultStyle: {
            fontSize: 12,
            fontFamily: 'Helvetica',
            fontWeight: 'normal',
            color: '#000000',
            align: 'left',
        },
    },
    qrCode: {
        id: 'qrCode',
        name: 'QR Code',
        type: 'qr',
        locked: true,
        description: 'Dynamic QR code generated from URL template',
        defaultStyle: {
            width: 80,
            height: 80,
        },
    },
};

/**
 * List of reserved attribute IDs that users cannot create
 */
export const SYSTEM_ATTRIBUTE_IDS = Object.keys(SYSTEM_ATTRIBUTES);

/**
 * Check if an attribute ID is a system attribute
 */
export function isSystemAttribute(id: string): boolean {
    return SYSTEM_ATTRIBUTE_IDS.includes(id);
}

/**
 * Get a system attribute definition by ID
 */
export function getSystemAttribute(id: string): SystemAttributeDefinition | undefined {
    return SYSTEM_ATTRIBUTES[id];
}

/**
 * Create a DynamicAttribute from a system attribute definition
 * Used when adding system attributes to a template
 */
export function createSystemAttribute(
    id: string,
    position: { x: number; y: number; page: number }
): DynamicAttribute | null {
    const def = SYSTEM_ATTRIBUTES[id];
    if (!def) return null;

    return {
        id: def.id,
        name: def.name,
        key: def.id,
        type: def.type as any,
        x: position.x,
        y: position.y,
        page: position.page,
        required: id === 'recipientName', // Only recipientName is required
        placeholder: `{${def.name.replace(/\s+/g, '')}}`,
        isSystem: true,
        ...def.defaultStyle,
    };
}
