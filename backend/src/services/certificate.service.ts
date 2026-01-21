
import { db } from '../lib/db.js';
import { certificates } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { Certificate } from '../types/index.js';

export async function createCertificateRecord(data: Omit<Certificate, 'id' | 'createdAt'>): Promise<Certificate> {
    // Check if a certificate with this code already exists (orphaned or from another context)
    const existing = await db.select({ id: certificates.id })
        .from(certificates)
        .where(eq(certificates.certificateCode, data.certificateCode));

    if (existing[0]) {
        // Delete the old record (this is a regeneration)
        console.log(`[Certificate] Replacing existing certificate with code: ${data.certificateCode}`);
        await db.delete(certificates).where(eq(certificates.id, existing[0].id));
    }

    const id = uuidv4();
    const newCert = {
        id,
        ...data,
        createdAt: new Date(),
    };

    await db.insert(certificates).values(newCert);
    return newCert;
}

export async function getCertificateById(id: string): Promise<Certificate | null> {
    const result = await db.select().from(certificates).where(eq(certificates.id, id));
    return result[0] ? (result[0] as unknown as Certificate) : null;
}

export async function getCertificateByCode(code: string): Promise<Certificate | null> {
    const result = await db.select().from(certificates).where(eq(certificates.certificateCode, code));
    return result[0] ? (result[0] as unknown as Certificate) : null;
}

export async function getAllCertificates(limit = 100, offset = 0): Promise<{ data: Certificate[], total: number }> {
    const data = await db.select().from(certificates)
        .orderBy(desc(certificates.createdAt))
        .limit(limit)
        .offset(offset);

    // Count query is separate in Drizzle usually or use window functions. 
    // Simplified count for now:
    const all = await db.select({ id: certificates.id }).from(certificates);

    return {
        data: data as unknown as Certificate[],
        total: all.length
    };
}
