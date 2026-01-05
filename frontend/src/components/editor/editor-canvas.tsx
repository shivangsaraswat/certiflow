'use client';

/**
 * Editor Canvas
 * Reusable component for displaying the PDF template and attributes.
 * Used by both the main Editor and Preview mode.
 */

import { PDFViewer } from './pdf-viewer';
import { AttributeOverlay } from './attribute-overlay';
import type { DynamicAttribute } from '@/types';

interface EditorCanvasProps {
    pdfUrl: string;
    scale: number;
    currentPage: number;
    attributes: DynamicAttribute[];
    selectedId: string | null;
    pdfDimensions: { width: number; height: number };
    previewValues?: Record<string, string>; // { attributeId: "preview text" }
    onPdfLoad: (data: { numPages: number; width: number; height: number }) => void;
    onSelectAttribute: (id: string) => void;
    onAttributePositionChange: (id: string, x: number, y: number) => void;
    onAttributeResizeChange?: (id: string, width: number, height: number) => void;
    onDeleteAttribute?: (id: string) => void;
    readOnly?: boolean; // If true, attributes strictly for display/preview logic might differ
}

export function EditorCanvas({
    pdfUrl,
    scale,
    currentPage,
    attributes,
    selectedId,
    previewValues = {},
    pdfDimensions,
    onPdfLoad,
    onSelectAttribute,
    onAttributePositionChange,
    onAttributeResizeChange,
    onDeleteAttribute,
}: EditorCanvasProps) {

    // Filter attributes for the current page
    const pageAttributes = attributes.filter((a) => a.page === currentPage);

    return (
        <div className="flex-1 overflow-auto rounded-lg border bg-muted/30 p-4 relative">
            <div className="inline-block min-w-full relative">
                <PDFViewer
                    url={pdfUrl}
                    pageNumber={currentPage}
                    scale={scale}
                    onLoadSuccess={onPdfLoad}
                >
                    {pageAttributes.map((attr) => (
                        <AttributeOverlay
                            key={attr.id}
                            attribute={attr}
                            isSelected={selectedId === attr.id}
                            scale={scale}
                            pdfHeight={pdfDimensions.height}
                            onSelect={() => onSelectAttribute(attr.id)}
                            onPositionChange={(x, y) => onAttributePositionChange(attr.id, x, y)}
                            onResizeChange={onAttributeResizeChange ? (w, h) => onAttributeResizeChange(attr.id, w, h) : undefined}
                            onDelete={() => onDeleteAttribute && onDeleteAttribute(attr.id)}
                            previewValue={previewValues[attr.id]}
                        />
                    ))}
                </PDFViewer>
            </div>
        </div>
    );
}
