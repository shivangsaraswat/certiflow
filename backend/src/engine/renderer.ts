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
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

/**
 * Embed standard fonts into the PDF document
 */
async function embedFonts(pdfDoc: PDFDocument): Promise<Record<SupportedFont, PDFFont>> {
    const fonts: Record<SupportedFont, PDFFont> = {
        'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'Helvetica-Bold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        'Times-Roman': await pdfDoc.embedFont(StandardFonts.TimesRoman),
        'Times-Bold': await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        'Courier': await pdfDoc.embedFont(StandardFonts.Courier),
        'Courier-Bold': await pdfDoc.embedFont(StandardFonts.CourierBold),
    };
    return fonts;
}

/**
 * Get the appropriate font based on attribute settings
 */
function getFont(
    fonts: Record<SupportedFont, PDFFont>,
    fontFamily: string,
    fontWeight?: 'normal' | 'bold'
): PDFFont {
    // Map user font to standard font
    const baseFont = FONT_MAPPING[fontFamily] || 'Helvetica';

    // Get bold variant if needed
    if (fontWeight === 'bold') {
        const boldFont = `${baseFont.replace('-Roman', '')}-Bold` as SupportedFont;
        if (fonts[boldFont]) {
            return fonts[boldFont];
        }
    }

    return fonts[baseFont] || fonts['Helvetica'];
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
 * Generate a unique certificate ID
 */
export function generateCertificateId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CERT-${timestamp}-${random}`;
}

/**
 * Get PDF metadata (dimensions, page count)
 */
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

    // Get first page dimensions (in points)
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    return {
        pageCount: pages.length,
        width,
        height,
    };
}
