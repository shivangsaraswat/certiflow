'use client';

/**
 * Draggable Attribute Overlay
 * Represents a text placeholder that can be dragged on the PDF
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DynamicAttribute } from '@/types';

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
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Convert PDF coordinates to screen coordinates
    // PDF: origin at bottom-left, Y increases upward
    // Screen: origin at top-left, Y increases downward
    const screenX = attribute.x * scale;
    const screenY = (pdfHeight - attribute.y) * scale;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelect();

            if (!elementRef.current) return;

            const rect = elementRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
            setIsDragging(true);
        },
        [onSelect]
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!elementRef.current?.parentElement) return;

            const parentRect = elementRef.current.parentElement.getBoundingClientRect();
            const newScreenX = e.clientX - parentRect.left - dragOffset.x;
            const newScreenY = e.clientY - parentRect.top - dragOffset.y;

            // Convert screen coordinates to PDF coordinates
            const pdfX = newScreenX / scale;
            const pdfY = pdfHeight - newScreenY / scale;

            onPositionChange(Math.max(0, pdfX), Math.max(0, pdfY));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, scale, pdfHeight, onPositionChange]);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    // Calculate text alignment offset for display
    let alignOffset = 0;
    if (attribute.align === 'center') {
        alignOffset = 50; // Move left by 50% of width
    } else if (attribute.align === 'right') {
        alignOffset = 100; // Move left by 100% of width
    }

    return (
        <div
            ref={elementRef}
            className={cn(
                'pointer-events-auto absolute flex cursor-move items-center gap-1 rounded border-2 px-2 py-1 transition-colors',
                isSelected
                    ? 'border-primary bg-primary/20 shadow-lg'
                    : 'border-dashed border-blue-500 bg-blue-500/10 hover:bg-blue-500/20',
                isDragging && 'opacity-80'
            )}
            style={{
                left: screenX,
                top: screenY,
                transform: `translateX(-${alignOffset}%) translateY(-100%)`,
                fontSize: Math.max(10, attribute.fontSize * scale * 0.5),
                color: attribute.color,
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            <span className="select-none whitespace-nowrap font-medium">
                {attribute.placeholder}
            </span>
            {isSelected && (
                <button
                    onClick={handleDeleteClick}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
