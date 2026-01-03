/**
 * PDF-Native Certificate Rendering Engine
 * 
 * Updated for dynamic, user-defined attributes.
 * Iterates over the template's attribute array and overlays each one.
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import {
    Template,
    CertificateData,
    DynamicAttribute,
    isTextAttribute,
    isSignatureAttribute,
    FONT_MAPPING,
    SupportedFont
} from '../types/index.js';
import { storage } from '../services/storage.service.js';

/**
 * Render a single certificate by overlaying data on a PDF template
 */
export async function renderCertificate(
    template: Template,
    data: CertificateData
): Promise<Buffer> {
    // 1. Load the PDF template
    const templateBuffer = await storage.get('templates', template.filename);
    const pdfDoc = await PDFDocument.load(templateBuffer);

    // 2. Embed fonts we'll need
    const fonts = await embedFonts(pdfDoc);

    // 3. Get pages
    const pages = pdfDoc.getPages();

    // 4. Process each attribute from the template
    for (const attr of template.attributes) {
        const value = data[attr.id];

        if (!value && attr.required) {
            console.warn(`Missing required value for attribute: ${attr.name}`);
            continue;
        }

        if (!value) continue;

        if (isTextAttribute(attr)) {
            await drawText(pages, attr, value, fonts);
        } else if (isSignatureAttribute(attr)) {
            // For signatures, the value is the signature filename
            await drawSignature(pdfDoc, pages, attr, value);
        }
    }

    // 5. Save and return the modified PDF
    // 5. Save and return the modified PDF
    const pdfBytes = await pdfDoc.save();

    // Side-effect removed: Caller is responsible for saving/uploading.

    return Buffer.from(pdfBytes);
}

/**
 * Embed standard fonts into the PDF document
 */
async function embedFonts(pdfDoc: PDFDocument): Promise<Record<SupportedFont, PDFFont>> {
    const fonts: Record<SupportedFont, PDFFont> = {
        'Inter': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'Roboto': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'Great Vibes': await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
        'Dancing Script': await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
        'Playfair Display': await pdfDoc.embedFont(StandardFonts.TimesRoman),
        'Montserrat': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        // Fallbacks standard fonts if needed, but the type expects keys from FONT_MAPPING
    };
    return fonts;
}

/**
 * Get the appropriate font based on attribute settings
 */
function getFont(
    fonts: Record<SupportedFont, PDFFont>,
    fontFamily: string | undefined, // Allow undefined
    fontWeight?: string
): PDFFont {
    // Map user font to standard font
    // @ts-ignore
    const baseFontKey = (fontFamily && FONT_MAPPING[fontFamily]) ? fontFamily : 'Inter';
    const baseFont = fonts[baseFontKey as SupportedFont];

    return baseFont || fonts['Inter'];
}


/**
 * Parse hex color to RGB values (0-1 range)
 */
function parseColor(hexColor?: string): { r: number; g: number; b: number } {
    const hex = (hexColor || '#000000').replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return { r, g, b };
}

/**
 * Draw text on a PDF page
 */
async function drawText(
    pages: PDFPage[],
    attr: DynamicAttribute,
    text: string,
    fonts: Record<SupportedFont, PDFFont>
): Promise<void> {
    // Get the correct page (1-indexed to 0-indexed)
    const pageIndex = (attr.page || 1) - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) {
        console.warn(`Page ${attr.page} does not exist in template`);
        return;
    }

    const page = pages[pageIndex];
    const font = getFont(fonts, attr.fontFamily, attr.fontWeight);
    const fontSize = attr.fontSize || 12;
    const color = parseColor(attr.color);

    // Handle text wrapping if maxWidth is specified
    const lines = attr.maxWidth
        ? wrapText(text, font, fontSize, attr.maxWidth)
        : [text];

    const lineHeight = fontSize * 1.2;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let x = attr.x;

        // Handle text alignment
        if (attr.align === 'center' || attr.align === 'right') {
            const textWidth = font.widthOfTextAtSize(line, fontSize);
            if (attr.align === 'center') {
                x = attr.x - textWidth / 2;
            } else {
                x = attr.x - textWidth;
            }
        }

        // Y position decreases for each line (PDF coordinate system)
        const y = attr.y - (i * lineHeight);

        page.drawText(line, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
        });
    }
}

/**
 * Wrap text to fit within maxWidth
 */
function wrapText(
    text: string,
    font: PDFFont,
    fontSize: number,
    maxWidth: number
): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

/**
 * Draw a signature image on a PDF page
 */
async function drawSignature(
    pdfDoc: PDFDocument,
    pages: PDFPage[],
    attr: DynamicAttribute,
    signatureFilename: string
): Promise<void> {
    try {
        // Get the correct page
        const pageIndex = (attr.page || 1) - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) {
            console.warn(`Page ${attr.page} does not exist in template`);
            return;
        }

        const page = pages[pageIndex];

        // Load the signature image
        const signatureBuffer = await storage.get('signatures', signatureFilename);

        // Determine image type and embed
        let image;
        if (signatureFilename.toLowerCase().endsWith('.png')) {
            image = await pdfDoc.embedPng(signatureBuffer);
        } else {
            image = await pdfDoc.embedJpg(signatureBuffer);
        }

        // Draw the image at the specified position and size
        page.drawImage(image, {
            x: attr.x,
            y: attr.y,
            width: attr.width || 120,
            height: attr.height || 60,
        });
    } catch (error) {
        console.warn(`Could not load signature: ${signatureFilename}`, error);
    }
}

/**
 * Generate a unique certificate ID using template code and email
 * Format: {TemplateCode}{Last4CharsBeforeEmail@}
 * 
 * Example:
 * - Email: 24f3001856@ds.study.iitm.ac.in
 * - Template Code: NAMD25
 * - Result: NAMD251856
 * 
 * If email is not provided or invalid, uses random 4 characters as fallback
 */
export function generateCertificateCode(templateCode: string, email?: string): string {
    // Ensure template code is uppercase
    const code = (templateCode || 'CERT').toUpperCase();

    if (email) {
        const atIndex = email.indexOf('@');
        if (atIndex >= 4) {
            // Get last 4 characters before @
            const last4 = email.substring(atIndex - 4, atIndex);
            return `${code}${last4.toUpperCase()}`;
        } else if (atIndex > 0) {
            // Email local part is less than 4 chars, use what we have
            const localPart = email.substring(0, atIndex);
            return `${code}${localPart.toUpperCase()}`;
        }
    }

    // Fallback: use random 4 alphanumeric characters
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${code}${random}`;
}

/**
 * Legacy function - deprecated, use generateCertificateCode instead
 * Kept for backward compatibility
 */
export function generateCertificateId(templateId?: string, index?: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const suffix = index !== undefined ? `-${index}` : '';
    return `CERT-${timestamp}-${random}${suffix}`;
}

/**
 * Extract PDF metadata (dimensions, page count)
 */
export async function extractMetadata(filepath: string): Promise<{
    pageCount: number;
    width: number;
    height: number;
}> {
    const buffer = await storage.get('templates', filepath.split('/').pop() || filepath);
    return getPDFMetadata(buffer);
}

export async function getPDFMetadata(pdfBuffer: Buffer): Promise<{
    pageCount: number;
    width: number;
    height: number;
}> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
        throw new Error('PDF has no pages');
    }

    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    return {
        pageCount: pages.length,
        width,
        height,
    };
}
