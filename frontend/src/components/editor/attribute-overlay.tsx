'use client';

/**
 * Draggable & Resizable Attribute Overlay
 * Represents a text or QR code placeholder on the PDF
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, X, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DynamicAttribute } from '@/types';
import { SYSTEM_ATTRIBUTE_IDS } from '@/types';

interface AttributeOverlayProps {
    attribute: DynamicAttribute;
    isSelected: boolean;
    scale: number;
    pdfHeight: number;
    onSelect: () => void;
    onPositionChange: (x: number, y: number) => void;
    onResizeChange?: (width: number, height: number) => void;
    onDelete: () => void;
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
}: AttributeOverlayProps) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [interactionState, setInteractionState] = useState<'idle' | 'dragging' | 'resizing'>('idle');

    // Drag refs
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialPosRef = useRef({ x: 0, y: 0 });
    const currentPosRef = useRef({ x: attribute.x, y: attribute.y });

    // Resize refs
    const resizeStartRef = useRef({ x: 0, y: 0 });
    const initialSizeRef = useRef({ w: 0, h: 0 });
    const activeHandleRef = useRef<string | null>(null);

    // Local state for smooth UI updates
    const [localState, setLocalState] = useState({
        x: attribute.x,
        y: attribute.y,
        width: attribute.width,
        height: attribute.height
    });

    // Sync local state when not interacting
    useEffect(() => {
        if (interactionState === 'idle') {
            setLocalState({
                x: attribute.x,
                y: attribute.y,
                width: attribute.width,
                height: attribute.height
            });
            currentPosRef.current = { x: attribute.x, y: attribute.y };
        }
    }, [attribute.x, attribute.y, attribute.width, attribute.height, interactionState]);

    // Calculate screen coordinates
    const screenX = localState.x * scale;
    const screenY = (pdfHeight - localState.y) * scale;
    // For QR/Images, width/height are used. For text, it's auto/min-content but we might add text resizing later.
    const screenWidth = (localState.width || 80) * scale;
    const screenHeight = (localState.height || 80) * scale;

    const isQR = attribute.type === 'qr';

    // DRAGGING LOGIC
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (interactionState === 'resizing') return; // Don't drag if resizing
            e.stopPropagation();
            onSelect();

            setInteractionState('dragging');
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            initialPosRef.current = { x: localState.x, y: localState.y };
            currentPosRef.current = { x: localState.x, y: localState.y };
        },
        [onSelect, localState, interactionState]
    );

    // RESIZING LOGIC
    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect(); // Ensure selected when resizing starts

        if (!onResizeChange) return;

        setInteractionState('resizing');
        activeHandleRef.current = handle;
        resizeStartRef.current = { x: e.clientX, y: e.clientY };
        initialSizeRef.current = {
            w: attribute.width || 80,
            h: attribute.height || 80
        };
    };

    useEffect(() => {
        if (interactionState === 'idle') return;

        const handleMouseMove = (e: MouseEvent) => {
            if (interactionState === 'dragging') {
                const startMouse = dragStartRef.current;
                const startPos = initialPosRef.current;

                const dx = e.clientX - startMouse.x;
                const dy = e.clientY - startMouse.y;

                // PDF Y grows UP currently? NO, wait.
                // Renderer uses: y = attr.y - ...
                // If PDF origin is Bottom-Left:
                // Drag Up (dy < 0) -> Y should INCREASE.
                // Drag Down (dy > 0) -> Y should DECREASE.
                //
                // Wait, in previous step `screenY = (pdfHeight - localPos.y) * scale`.
                // So if localPos.y increases (upwards in PDF coords), screenY decreases (upwards on screen).
                // dPdfY should be: -dy / scale.

                const dPdfX = dx / scale;
                const dPdfY = -dy / scale;

                const newX = Math.max(0, startPos.x + dPdfX);
                const newY = Math.max(0, startPos.y + dPdfY);

                setLocalState(prev => ({ ...prev, x: newX, y: newY }));
                currentPosRef.current = { x: newX, y: newY };
            }
            else if (interactionState === 'resizing' && onResizeChange) {
                const startMouse = resizeStartRef.current;
                const startSize = initialSizeRef.current;
                const handle = activeHandleRef.current;

                const dx = (e.clientX - startMouse.x) / scale;
                const dy = (e.clientY - startMouse.y) / scale; // Screen dy (positive is down)

                // Current implementation only supports unified aspect ratio for QR
                // Simple implementation: drag any handle changes size based on largest delta
                // Or standard logic:
                // SE: +w, +h
                // SW: -w, +h (requires pos change too)
                // NE: +w, -h (requires pos change too)
                // NW: -w, -h (requires pos change too)

                // For simplicity first iteration: enable SE (Bottom-Right) resizing only or uniform resizing
                // User asked for "brag functionality" - likely corner dragging.

                // Let's implement SE handle logic first properly.
                // SE handle: moving mouse right (+dx) increases width. moving down (+dy) increases screen height.
                // Wait, screen height increased means PDF element gets taller.

                let newW = startSize.w;
                let newH = startSize.h;

                if (!handle) return;

                if (handle.includes('e')) newW = startSize.w + dx;
                if (handle.includes('w')) newW = startSize.w - dx;
                if (handle.includes('s')) newH = startSize.h + dy;
                if (handle.includes('n')) newH = startSize.h - dy;

                // Enforce Aspect Ratio for QR
                if (isQR) {
                    const maxDim = Math.max(Math.abs(newW), Math.abs(newH));
                    newW = maxDim;
                    newH = maxDim;
                }

                // Min size
                newW = Math.max(20, newW);
                newH = Math.max(20, newH);

                setLocalState(prev => ({ ...prev, width: newW, height: newH }));
            }
        };

        const handleMouseUp = () => {
            if (interactionState === 'dragging') {
                onPositionChange(currentPosRef.current.x, currentPosRef.current.y);
            } else if (interactionState === 'resizing' && onResizeChange) {
                // For now, we only update size, not position during resize (offset logic ignored for MVP simplicity unless needed)
                // NOTE: If we support NW/SW/NE resizing that moves origin, we need to update X/Y too.
                // Current logic only updates W/H (so acts like SE resize relative to TL).
                // Given the complexity of coordinate systems, let's stick to SE resize for MVP or center-based.
                // Actually, let's just commit the W/H.
                onResizeChange(localState.width || 80, localState.height || 80);
            }
            setInteractionState('idle');
            activeHandleRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interactionState, scale, onPositionChange, onResizeChange, localState.width, localState.height, isQR]);

    return (
        <div
            ref={elementRef}
            className={cn(
                'absolute group flex flex-col pointer-events-auto',
                'touch-none select-none transition-shadow',
                isSelected ? 'z-50' : 'z-10 hover:z-40',
                interactionState === 'dragging' ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{
                left: screenX,
                top: screenY,
                // Transform logic: 'translateY(-100%)' puts the element ABOVE the point (x,y).
                // Renderer usually draws image from (x, y) upwards?
                // Wait. PDF coordinates: (x,y) is bottom-left.
                // Renderer drawImage: x, y is bottom-left of image.
                // So on screen (top-left origin), the "bottom-left" of the PDF element is at screenY.
                // So the element should extend UPWARDS from screenY.
                // This means 'top: screenY' and 'transform: translateY(-100%)' is CORRECT.
                // The element grows upwards from the anchor point.
                transform: `translateX(-${attribute.align === 'center' ? 50 : attribute.align === 'right' ? 100 : 0}%) translateY(-${isQR ? 100 : 100}%)`,
                minWidth: isQR ? undefined : 'min-content',
                width: isQR ? screenWidth : undefined,
                height: isQR ? screenHeight : undefined,
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Main Content */}
            <div className={cn(
                "relative flex flex-col w-full h-full",
                isSelected
                    ? isQR ? "ring-2 ring-primary" : "ring-1 ring-primary shadow-lg bg-background/95 rounded-md"
                    : isQR ? "ring-1 ring-primary/30 hover:ring-primary/60" : "ring-1 ring-transparent hover:ring-border hover:bg-background/80 hover:shadow-sm rounded-sm"
            )}>

                {/* Delete Button - Corner Badge style for QR, Header style for Text */}
                {isSelected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className={cn(
                            "absolute z-50 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:scale-110 transition-all",
                            isQR ? "-top-2.5 -right-2.5 w-5 h-5" : "top-0.5 right-0.5 w-4 h-4 opacity-50 hover:opacity-100"
                        )}
                        title="Remove"
                    >
                        <X className={cn("w-3 h-3", isQR ? "w-3 h-3" : "w-3 h-3")} />
                    </button>
                )}

                {/* Text Header - Only for Text attributes */}
                {!isQR && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium tracking-wide transition-opacity",
                        isSelected ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-muted-foreground",
                    )}>
                        <GripVertical className="h-3 w-3 shrink-0 opacity-50" />
                        <span className="truncate max-w-[80px]">{attribute.name}</span>
                    </div>
                )}


                {/* CONTENT */}
                {isQR ? (
                    // Realistic QR Preview
                    <div className="w-full h-full bg-white relative overflow-hidden">
                        {/* 4 Corner Resize Handles - Only visible when selected */}
                        {isSelected && (
                            <>
                                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-nw-resize z-50" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-ne-resize z-50" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-sw-resize z-50" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-se-resize z-50" onMouseDown={(e) => handleResizeStart(e, 'se')} />
                            </>
                        )}

                        {/* Realistic Mock QR Image */}
                        {/* Using a verified clean QR placeholder image from a standard API or base64 if possible. For now specific QR image URL */}
                        {/* Interactive "Use" visual */}
                        <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PREVIEW"
                            alt="QR Preview"
                            className="w-full h-full object-contain pointer-events-none opacity-90"
                        />

                        {/* Overlay info to identify it */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/80 px-1 py-0.5 text-[8px] font-mono border rounded shadow-sm">
                                {localState.width?.toFixed(0)}x{localState.height?.toFixed(0)}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Text Content
                    <div
                        className={cn(
                            "px-2 pb-1 text-sm font-medium text-foreground whitespace-nowrap",
                            !isSelected && interactionState === 'idle' && "bg-black/5 rounded-sm"
                        )}
                        style={{
                            fontSize: Math.max(10, attribute.fontSize * scale),
                            color: attribute.color,
                            fontFamily: attribute.fontFamily,
                            fontWeight: attribute.fontWeight,
                        }}
                    >
                        {attribute.placeholder}
                    </div>
                )}
            </div>

            {/* Helper Lines (visual sugar) */}
            {isSelected && (
                <>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full h-2 w-px bg-primary/50" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full h-2 w-px bg-primary/50" />
                </>
            )}
        </div>
    );
}
