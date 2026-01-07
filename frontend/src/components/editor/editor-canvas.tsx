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
    onDuplicateAttribute?: (id: string) => void;
    onLockAttribute?: (id: string) => void;
    onLayerMove?: (id: string, direction: 'up' | 'down') => void;
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
    onDuplicateAttribute,
    onLockAttribute,
    onLayerMove,
}: EditorCanvasProps) {

    // Filter attributes for the current page
    const pageAttributes = attributes.filter((a) => a.page === currentPage);

    return (
        <div className="relative isolate">
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
                        onDuplicate={() => onDuplicateAttribute?.(attr.id)}
                        onLock={() => onLockAttribute?.(attr.id)}
                        onLayerUp={() => onLayerMove?.(attr.id, 'up')}
                        onLayerDown={() => onLayerMove?.(attr.id, 'down')}
                        previewValue={previewValues[attr.id]}
                    />
                ))}
            </PDFViewer>
        </div>
    );
}
