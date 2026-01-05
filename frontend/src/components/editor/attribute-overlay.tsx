'use client';

/**
 * Draggable Attribute Overlay
 * Represents a text placeholder that can be dragged on the PDF
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, X, QrCode, Lock } from 'lucide-react';
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
    onDelete: () => void;
}

export function AttributeOverlay({
    attribute,
    isSelected,
    scale,
    pdfHeight,
    onSelect,
    onPositionChange,
    onDelete,
}: AttributeOverlayProps) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Use Refs for drag state to avoid re-render loops and stale closures in event listeners
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialPosRef = useRef({ x: 0, y: 0 });
    const currentPosRef = useRef({ x: attribute.x, y: attribute.y });

    // Local position state for UI updates
    const [localPos, setLocalPos] = useState({ x: attribute.x, y: attribute.y });

    // Sync local state with props when NOT dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalPos({ x: attribute.x, y: attribute.y });
            currentPosRef.current = { x: attribute.x, y: attribute.y };
        }
    }, [attribute.x, attribute.y, isDragging]);

    // Calculate screen coordinates
    const screenX = localPos.x * scale;
    const screenY = (pdfHeight - localPos.y) * scale;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelect();

            // Initialize drag state in Refs
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

            // Calculate delta
            const dx = e.clientX - startMouse.x;
            const dy = e.clientY - startMouse.y;

            // Convert to PDF units
            const dPdfX = dx / scale;
            const dPdfY = -dy / scale;

            const newX = Math.max(0, startPos.x + dPdfX);
            const newY = Math.max(0, startPos.y + dPdfY);

            // Update local state (triggers re-render)
            setLocalPos({ x: newX, y: newY });

            // Update ref (for mouseUp to read)
            currentPosRef.current = { x: newX, y: newY };
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            // Commit final position from Ref
            onPositionChange(currentPosRef.current.x, currentPosRef.current.y);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scale, onPositionChange]); // Dependencies are now stable

    return (
        <div
            ref={elementRef}
            className={cn(
                'absolute group flex flex-col pointer-events-auto',
                'touch-none select-none transition-shadow',
                isSelected ? 'z-50' : 'z-10 hover:z-40',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{
                left: screenX,
                top: screenY,
                transform: `translateX(-${attribute.align === 'center' ? 50 : attribute.align === 'right' ? 100 : 0}%) translateY(-100%)`,
                minWidth: 'min-content',
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Content Container */}
            <div className={cn(
                "relative flex flex-col min-w-[100px]",
                "transition-all duration-200",
                isSelected
                    ? "ring-1 ring-primary shadow-lg bg-background/95 rounded-md"
                    : "ring-1 ring-transparent hover:ring-border hover:bg-background/80 hover:shadow-sm rounded-sm"
            )}>

                {/* Header - Only visible when selected or hovering */}
                <div className={cn(
                    "flex items-center justify-between px-2 py-1 text-[10px] font-medium tracking-wide border-b transition-opacity",
                    isSelected ? "opacity-100 border-primary/20 bg-primary/5 text-primary" : "opacity-0 group-hover:opacity-100 border-border bg-muted/50 text-muted-foreground",
                    isDragging && "opacity-100" // Keep visible dragging
                )}>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <GripVertical className="h-3 w-3 shrink-0 opacity-50" />
                        <span className="truncate max-w-[80px]">{attribute.name}</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="ml-1 rounded-sm p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>

                {/* Main Value Preview - Different for QR vs Text */}
                {attribute.type === 'qr' ? (
                    // QR Code Skeleton Placeholder
                    <div
                        className={cn(
                            "flex items-center justify-center border-2 border-dashed border-muted-foreground/40 bg-muted/20 rounded",
                            isSelected && "border-primary/60"
                        )}
                        style={{
                            width: (attribute.width || 80) * scale,
                            height: (attribute.height || 80) * scale,
                        }}
                    >
                        <QrCode
                            className="text-muted-foreground/50"
                            style={{
                                width: Math.min(40, (attribute.width || 80) * scale * 0.5),
                                height: Math.min(40, (attribute.height || 80) * scale * 0.5),
                            }}
                        />
                    </div>
                ) : (
                    // Text Placeholder
                    <div
                        className={cn(
                            "px-3 py-1.5 whitespace-nowrap text-center font-mono text-sm",
                            !isSelected && !isDragging && "bg-black/5 rounded-sm"
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
