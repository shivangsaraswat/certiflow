'use client';

/**
 * Draggable & Resizable Attribute Overlay
 * Represents a text or QR code placeholder on the PDF
 * Uses react-moveable for professional handles and controls
 */

import { useRef, useState, useEffect } from 'react';
import Moveable from 'react-moveable';
import { Copy, Lock, Unlock, ArrowUp, ArrowDown, Trash, GripVertical } from 'lucide-react';
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
    onDuplicate?: () => void;
    onLock?: () => void;
    onLayerUp?: () => void;
    onLayerDown?: () => void;
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
    onDuplicate,
    onLock,
    onLayerUp,
    onLayerDown,
    previewValue,
}: AttributeOverlayProps) {
    const targetRef = useRef<HTMLDivElement>(null);

    // Calculate screen coordinates
    const screenX = attribute.x * scale;
    const screenY = (pdfHeight - attribute.y) * scale;
    const screenWidth = (attribute.width || 80) * scale;
    const screenHeight = (attribute.height || 80) * scale;

    const isVisual = ['qr', 'image', 'signature', 'shape'].includes(attribute.type);
    const isQR = attribute.type === 'qr';
    const isShape = attribute.type === 'shape';
    const isLocked = attribute.locked;

    // For Shapes, we render SVGs
    const renderShape = () => {
        const type = attribute.defaultValue || 'rect';
        const fill = attribute.color || '#000000';

        switch (type) {
            case 'circle':
                return (
                    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ display: 'block' }}>
                        <circle cx="50" cy="50" r="50" fill={fill} />
                    </svg>
                );
            case 'triangle':
                return (
                    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ display: 'block' }}>
                        <polygon points="50,0 100,100 0,100" fill={fill} />
                    </svg>
                );
            case 'star':
                return (
                    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ display: 'block' }}>
                        <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill={fill} />
                    </svg>
                );
            case 'line':
                return (
                    <div style={{ width: '100%', height: '2px', backgroundColor: fill, marginTop: '50%' }} />
                );
            case 'rect':
            default:
                return <div style={{ width: '100%', height: '100%', backgroundColor: fill }} />;
        }
    };

    // Handle Drag
    const onDrag = (e: any) => {
        const { beforeDelta } = e;
        const [dx, dy] = beforeDelta;

        // Convert screen delta to PDF delta
        // PDF X = +dx / scale
        // PDF Y: Screen Y is (H-y)*s. 
        // If ScreenY increases (down), (H-y) must increase? No.
        // ScreenY = Hs - ys. 
        // dScreenY = -s * dy.
        // dy_pdf = - dScreenY / s
        // So if I drag DOWN (+dy screen), PDF y should decrease.

        const dPdfX = dx / scale;
        const dPdfY = -dy / scale;

        onPositionChange(attribute.x + dPdfX, attribute.y + dPdfY);
    };

    // Handle Resize
    const onResize = (e: any) => {
        const { delta, drag } = e;
        const [dw, dh] = delta;
        const { beforeDelta } = drag; // Drag position delta if resized from left/top/etc

        if (!onResizeChange) return;

        // Update Width/Height
        const currentWidth = attribute.width || 80;
        const currentHeight = attribute.height || 80;
        const newWidth = Math.max(20, currentWidth + (dw / scale));
        const newHeight = Math.max(20, currentHeight + (dh / scale));

        onResizeChange(newWidth, newHeight);

        // Update Position if needed (e.g. resizing from Top-Left moves the origin)
        if (beforeDelta[0] !== 0 || beforeDelta[1] !== 0) {
            const dPdfX = beforeDelta[0] / scale;
            const dPdfY = -beforeDelta[1] / scale;
            onPositionChange(attribute.x + dPdfX, attribute.y + dPdfY);
        }
    };

    // Prevent deselection when clicking inside
    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
    };

    return (
        <>
            {/* The Target Element */}
            <div
                ref={targetRef}
                className={cn(
                    'absolute group flex flex-col',
                    'touch-none select-none',
                    isSelected ? 'z-50' : 'z-10 hover:z-40',
                )}
                style={{
                    left: screenX,
                    top: screenY,
                    // Note: In our coordinate system, the anchor (x,y) is the BOTTOM-LEFT of the element
                    // But DOM 'top' grows downwards. 
                    // So we position 'top' at screenY (which is the screen-y of the anchor)
                    // and translate Y -100% to make the element go UP from that anchor.
                    transform: `translateX(-${attribute.align === 'center' ? 50 : attribute.align === 'right' ? 100 : 0}%) translateY(-${isVisual ? 100 : 100}%)`,
                    minWidth: isVisual ? undefined : 'min-content',
                    width: isVisual ? screenWidth : undefined,
                    height: isVisual ? screenHeight : undefined,
                    cursor: isLocked ? 'not-allowed' : 'grab'
                }}
                onMouseDown={handleMouseDown}
            >
                {/* Floating Action Bar - Only visible when selected */}
                {isSelected && !isLocked && (
                    <div
                        className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border shadow-lg rounded-lg p-1 z-[60] pointer-events-auto"
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <ActionButton icon={Copy} onClick={onDuplicate} tooltip="Duplicate" />
                        <div className="w-px h-4 bg-border mx-1" />
                        <ActionButton icon={ArrowUp} onClick={onLayerUp} tooltip="Bring Forward" />
                        <ActionButton icon={ArrowDown} onClick={onLayerDown} tooltip="Send Backward" />
                        <div className="w-px h-4 bg-border mx-1" />
                        <ActionButton icon={Lock} onClick={onLock} tooltip="Lock" />
                        <div className="w-px h-4 bg-border mx-1" />
                        <ActionButton icon={Trash} onClick={onDelete} tooltip="Delete" variant="destructive" />
                    </div>
                )}
                {isSelected && isLocked && (
                    <div
                        className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border shadow-lg rounded-lg p-1 z-[60] pointer-events-auto"
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <ActionButton icon={Unlock} onClick={onLock} tooltip="Unlock" />
                    </div>
                )}


                {/* Content Box */}
                <div className={cn(
                    "relative flex flex-col w-full h-full transition-all",
                    isSelected
                        ? isVisual ? "ring-2 ring-primary" : "ring-1 ring-primary shadow-lg bg-background/95 rounded-md"
                        : isVisual ? "ring-1 ring-primary/30 hover:ring-primary/60" : "ring-1 ring-transparent hover:ring-border hover:bg-background/80 hover:shadow-sm rounded-sm"
                )}>

                    {/* Header Label (Text Mode) */}
                    {!isVisual && (
                        <div className={cn(
                            "flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium tracking-wide transition-opacity",
                            isSelected ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-muted-foreground",
                        )}>
                            <GripVertical className="h-3 w-3 shrink-0 opacity-50" />
                            <span className="truncate max-w-[80px]">{attribute.name}</span>
                        </div>
                    )}

                    {/* Visual Content (Image, QR, Shape) */}
                    {isVisual ? (
                        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                            {isShape ? (
                                renderShape()
                            ) : (
                                <img
                                    src={attribute.defaultValue || attribute.qrUrl || "https://placehold.co/150x150?text=Preview"}
                                    alt={attribute.name}
                                    className="w-full h-full object-contain pointer-events-none"
                                />
                            )}

                            {/* Size overlay on selection */}
                            {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                                    <div className="bg-white/80 px-1 py-0.5 text-[8px] font-mono border rounded shadow-sm">
                                        {(attribute.width || 80).toFixed(0)}x{(attribute.height || 80).toFixed(0)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "px-2 pb-1 text-sm font-medium text-foreground whitespace-nowrap",
                                !isSelected && "bg-black/5 rounded-sm"
                            )}
                            style={{
                                fontSize: Math.max(10, attribute.fontSize * scale),
                                fontFamily: attribute.fontFamily,
                                fontWeight: attribute.fontWeight,
                                color: attribute.color,
                            }}
                        >
                            {previewValue || attribute.placeholder || `{${attribute.name}}`}
                        </div>
                    )}
                </div>
            </div>

            {/* Moveable Control */}
            {isSelected && !isLocked && (
                <Moveable
                    target={targetRef}
                    draggable={true}
                    resizable={true}
                    rotatable={false} // Rotation needs more backend support, disable for now
                    keepRatio={isQR || attribute.type === 'image' || attribute.type === 'signature'}
                    throttleDrag={0}
                    throttleResize={0}
                    renderDirections={isVisual ? ["nw", "ne", "se", "sw"] : ["e", "w"]} // Text usually mainly resizes width? Or N/S/E/W?
                    // Actually for text, we might only want to move it unless we implement text-wrapping.
                    // Attributes are single-line usually. 
                    // Let's enable all directions for resizing just in case.

                    onDrag={onDrag}
                    onResize={onResize}

                    // Styles for handles
                    className="z-50"
                />
            )}
        </>
    );
}

function ActionButton({ icon: Icon, onClick, tooltip, variant = 'default' }: { icon: any, onClick?: () => void, tooltip: string, variant?: 'default' | 'destructive' }) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick?.();
            }}
            className={cn(
                "p-1.5 rounded-md transition-colors",
                variant === 'destructive'
                    ? "hover:bg-red-50 text-red-500 hover:text-red-700"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            title={tooltip}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}


