'use client';

/**
 * Draggable & Resizable Attribute Overlay
 * Clean WYSIWYG approach - text displays exactly as it will appear in final output
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DynamicAttribute } from '@/types';

interface AttributeOverlayProps {
    attribute: DynamicAttribute;
    isSelected: boolean;
    scale: number;
    pdfHeight: number;
    onSelect: () => void;
    onPositionChange: (x: number, y: number) => void;
    onResizeChange?: (width: number, height: number) => void;
    onDelete: () => void;
    previewValue?: string;
}

export function AttributeOverlay({
    attribute,
    isSelected,
    scale,
    pdfHeight,
    onSelect,
    onPositionChange,
    onResizeChange,
    onDelete,
    previewValue,
}: AttributeOverlayProps) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Drag refs
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialPosRef = useRef({ x: 0, y: 0 });
    const currentPosRef = useRef({ x: attribute.x, y: attribute.y });

    // Local position for smooth dragging
    const [localPos, setLocalPos] = useState({ x: attribute.x, y: attribute.y });

    // Sync local state when not dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalPos({ x: attribute.x, y: attribute.y });
            currentPosRef.current = { x: attribute.x, y: attribute.y };
        }
    }, [attribute.x, attribute.y, isDragging]);

    // Calculate screen coordinates
    const screenX = localPos.x * scale;
    const screenWidth = (attribute.width || 80) * scale;
    const screenHeight = (attribute.height || 80) * scale;

    const isQR = attribute.type === 'qr';

    // Convert PDF coordinates (origin bottom-left) to screen coordinates (origin top-left)
    // For QR: PDF y is bottom of image, subtract height to get screen top
    // For Text: PDF y is baseline. CSS positions from top, so subtract ascent (~80% of fontSize) 
    //           to get the element top that places baseline at the correct position
    const fontSize = attribute.fontSize || 12;
    const ascent = fontSize * 0.8; // Approximate ascent for standard fonts

    const screenY = isQR
        ? (pdfHeight - localPos.y - (attribute.height || 80)) * scale
        : (pdfHeight - localPos.y) * scale - (ascent * scale);

    // Get display text
    const displayText = previewValue || attribute.placeholder || `{${attribute.name}}`;

    // DRAGGING LOGIC
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelect();

            setIsDragging(true);
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            initialPosRef.current = { x: localPos.x, y: localPos.y };
            currentPosRef.current = { x: localPos.x, y: localPos.y };
        },
        [onSelect, localPos]
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const startMouse = dragStartRef.current;
            const startPos = initialPosRef.current;

            const dx = e.clientX - startMouse.x;
            const dy = e.clientY - startMouse.y;

            const dPdfX = dx / scale;
            const dPdfY = -dy / scale;

            const newX = Math.max(0, startPos.x + dPdfX);
            const newY = Math.max(0, startPos.y + dPdfY);

            setLocalPos({ x: newX, y: newY });
            currentPosRef.current = { x: newX, y: newY };
        };

        const handleMouseUp = () => {
            onPositionChange(currentPosRef.current.x, currentPosRef.current.y);
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scale, onPositionChange]);

    // QR Resize handlers
    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        if (!onResizeChange) return;
        // Simplified resize - just SE corner for QR
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = attribute.width || 80;
        const startH = attribute.height || 80;

        const onMove = (ev: MouseEvent) => {
            const dx = (ev.clientX - startX) / scale;
            const dy = (ev.clientY - startY) / scale;
            const newSize = Math.max(20, Math.max(startW + dx, startH + dy));
            onResizeChange(newSize, newSize);
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    return (
        <div
            ref={elementRef}
            className={cn(
                'absolute pointer-events-auto touch-none select-none',
                isSelected ? 'z-50' : 'z-10 hover:z-40',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{
                left: screenX,
                top: screenY,
                // Both QR and Text: no translateY - coordinates represent exact position
                // Text: y is baseline, QR: y is bottom-left (adjusted in screenY calculation)
                transform: `translateX(-${attribute.align === 'center' ? 50 : attribute.align === 'right' ? 100 : 0}%)`,
                width: isQR ? screenWidth : 'auto',
                height: isQR ? screenHeight : 'auto',
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Simple Selection Border */}
            <div
                className={cn(
                    "relative",
                    isSelected && "outline outline-2 outline-primary outline-offset-2"
                )}
            >
                {/* Delete button - only when selected */}
                {isSelected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="absolute -top-2 -right-2 z-50 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                        title="Delete"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}

                {/* QR Code Content */}
                {isQR ? (
                    <div className="w-full h-full bg-white relative">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(attribute.qrUrl || 'PREVIEW')}`}
                            alt="QR Code"
                            className="w-full h-full object-contain pointer-events-none"
                            draggable={false}
                        />
                        {/* Resize handle for QR */}
                        {isSelected && (
                            <div
                                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-white shadow"
                                onMouseDown={(e) => handleResizeStart(e, 'se')}
                            />
                        )}
                    </div>
                ) : (
                    /* Text Content - WYSIWYG style */
                    <div
                        className="whitespace-nowrap"
                        style={{
                            fontSize: attribute.fontSize * scale,
                            fontFamily: attribute.fontFamily,
                            fontWeight: attribute.fontWeight,
                            color: attribute.color,
                            lineHeight: 1.2,
                        }}
                    >
                        {displayText}
                    </div>
                )}
            </div>
        </div>
    );
}
