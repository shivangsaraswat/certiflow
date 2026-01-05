/**
 * PDF-Native Certificate Rendering Engine
 * 
 * Updated for dynamic, user-defined attributes.
 * Iterates over the template's attribute array and overlays each one.
 * 
 * Supports system attributes:
 * - certificateId: Auto-generated unique ID
 * - recipientName: Name from data
 * - generatedDate: Current date at generation time
 * - qrCode: Dynamic QR code from URL template
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import {
    Template,
    CertificateData,
    DynamicAttribute,
    isTextAttribute,
    isSignatureAttribute,
    isQRCodeAttribute,
    FONT_MAPPING,
    SupportedFont
} from '../types/index.js';
import { storage } from '../services/storage.service.js';

/**
 * Render a single certificate by overlaying data on a PDF template
 * @param template - The certificate template
 * @param data - Key-value pairs of attribute values
 * @param recipientEmail - Optional email for certificate ID generation
 */
export async function renderCertificate(
    template: Template,
    data: CertificateData,
    recipientEmail?: string
): Promise<Buffer> {
    // 1. Load the PDF template
    const templateBuffer = await storage.get('templates', template.filename);
    const pdfDoc = await PDFDocument.load(templateBuffer);

    // 2. Embed fonts we'll need
    const fonts = await embedFonts(pdfDoc);

    // 3. Get pages
    const pages = pdfDoc.getPages();

    // 4. Auto-inject system attribute values
    console.log('[Renderer] Template attributes:', template.attributes.map(a => ({ id: a.id, type: a.type })));

    // Certificate ID - auto-generate if not provided
    const hasCertIdAttr = template.attributes.some(a => a.id === 'certificateId');
    console.log(`[Renderer] hasCertIdAttr: ${hasCertIdAttr}`);
    if (hasCertIdAttr && !data['certificateId']) {
        data['certificateId'] = generateCertificateCode(template.code, recipientEmail);
        console.log(`[Renderer] Auto-generated certificateId: ${data['certificateId']}`);
    }

    // Generated Date - always use current date/time
    const hasGenDateAttr = template.attributes.some(a => a.id === 'generatedDate');
    console.log(`[Renderer] hasGenDateAttr: ${hasGenDateAttr}`);
    if (hasGenDateAttr && !data['generatedDate']) {
        data['generatedDate'] = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        console.log(`[Renderer] Auto-generated generatedDate: ${data['generatedDate']}`);
    }

    // 5. Process each attribute from the template
    console.log('[Renderer] Processing', template.attributes.length, 'attributes');
    console.log('[Renderer] Data keys:', Object.keys(data));

    for (const attr of template.attributes) {
        console.log(`[Renderer] Processing attr: ${attr.id} (type: ${attr.type})`);

        // Handle QR Code separately
        if (isQRCodeAttribute(attr)) {
            console.log(`[Renderer] Drawing QR code for ${attr.id}, qrUrl: ${attr.qrUrl}`);
            await drawQRCode(pdfDoc, pages, attr, data);
            continue;
        }

        const value = data[attr.id];

        if (!value && attr.required) {
            console.warn(`[Renderer] Missing required value for attribute: ${attr.name} (id: ${attr.id})`);
            continue;
        }

        if (!value) {
            console.log(`[Renderer] Skipping ${attr.id} - no value found`);
            continue;
        }

        console.log(`[Renderer] Drawing ${attr.id} with value: ${value.substring(0, 50)}...`);

        if (isTextAttribute(attr)) {
            await drawText(pages, attr, value, fonts);
        } else if (isSignatureAttribute(attr)) {
            // For signatures, the value is the signature filename
            await drawSignature(pdfDoc, pages, attr, value);
        }
    }

    // 6. Save and return the modified PDF
    const pdfBytes = await pdfDoc.save();

    // Side-effect removed: Caller is responsible for saving/uploading.

    return Buffer.from(pdfBytes);
}

/**
 * Embed standard fonts into the PDF document
 * Creates a map of all possible PDF fonts for lookup
 */
async function embedFonts(pdfDoc: PDFDocument): Promise<Record<string, PDFFont>> {
    const fonts: Record<string, PDFFont> = {
        // Sans-serif
        'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'HelveticaBold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        // Serif
        'TimesRoman': await pdfDoc.embedFont(StandardFonts.TimesRoman),
        'TimesRomanBold': await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        'TimesRomanItalic': await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
        // Monospace
        'Courier': await pdfDoc.embedFont(StandardFonts.Courier),
        'CourierBold': await pdfDoc.embedFont(StandardFonts.CourierBold),
    };
    return fonts;
}

/**
 * Get the appropriate PDF font based on attribute settings
 * Uses the font family from template configuration and applies weight
 */
function getFont(
    fonts: Record<string, PDFFont>,
    fontFamily: string | undefined,
    fontWeight?: string
): PDFFont {
    // Map user font to PDF standard font using FONT_MAPPING
    const userFont = fontFamily || 'Helvetica';
    const mapping = FONT_MAPPING[userFont as keyof typeof FONT_MAPPING];
    const baseFont = mapping || 'Helvetica';

    // Apply bold variant if weight is bold
    let fontKey: string = baseFont;
    if (fontWeight === 'bold') {
        if (baseFont === 'Helvetica') fontKey = 'HelveticaBold';
        else if (baseFont === 'TimesRoman') fontKey = 'TimesRomanBold';
        else if (baseFont === 'Courier') fontKey = 'CourierBold';
    }

    // Return the matched font or fallback
    return fonts[fontKey] || fonts['Helvetica'];
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

    // Log the page size and first position
    const pageHeight = page.getHeight();
    const pageWidth = page.getWidth();
    console.log(`[Renderer] Text '${text.substring(0, 20)}...' position: x=${attr.x}, y=${attr.y}, page: ${pageWidth}x${pageHeight}`);

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
 * Draw a QR code on a PDF page
 * Generates QR from URL template, replacing placeholders with actual data
 */
async function drawQRCode(
    pdfDoc: PDFDocument,
    pages: PDFPage[],
    attr: DynamicAttribute,
    data: CertificateData
): Promise<void> {
    try {
        // Get the correct page
        const pageIndex = (attr.page || 1) - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) {
            console.warn(`Page ${attr.page} does not exist in template`);
            return;
        }

        const page = pages[pageIndex];

        // Get QR URL from attribute and resolve placeholders
        let qrUrl = attr.qrUrl || '';

        if (!qrUrl) {
            console.warn('QR Code attribute has no URL configured');
            return;
        }

        // Replace placeholders like {certificateId} with actual values
        for (const [key, value] of Object.entries(data)) {
            if (value) {
                qrUrl = qrUrl.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            }
        }

        // Generate QR code as PNG buffer
        const qrBuffer = await QRCode.toBuffer(qrUrl, {
            type: 'png',
            width: attr.width || 80,
            margin: 1,
            errorCorrectionLevel: 'M',
        });

        // Embed and draw QR image
        const qrImage = await pdfDoc.embedPng(qrBuffer);

        const pageHeight = page.getHeight();
        const pageWidth = page.getWidth();

        console.log(`[Renderer] QR position: x=${attr.x}, y=${attr.y}, page size: ${pageWidth}x${pageHeight}`);
        console.log(`[Renderer] QR dimensions: ${attr.width || 80}x${attr.height || 80}`);

        page.drawImage(qrImage, {
            x: attr.x,
            y: attr.y,
            width: attr.width || 80,
            height: attr.height || 80,
        });

        console.log('[Renderer] QR code drawn successfully');
    } catch (error) {
        console.error('[Renderer] Could not generate QR code:', error);
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
