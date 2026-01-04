import React, { useState } from 'react';

interface CustomTooltipProps {
    children: React.ReactNode;
    content: string;
    side?: 'right' | 'top' | 'bottom' | 'left';
    className?: string;
}

export function CustomTooltip({ children, content, side = 'right', className }: CustomTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Position styles based on side
    const positionStyles = {
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2"
    };

    const arrowStyles = {
        right: "left-0 top-1/2 -translate-x-[40%] -translate-y-1/2 border-r-foreground/90 border-t-transparent border-b-transparent border-l-transparent",
        left: "right-0 top-1/2 translate-x-[40%] -translate-y-1/2 border-l-foreground/90 border-t-transparent border-b-transparent border-r-transparent",
        top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-[40%] border-t-foreground/90 border-l-transparent border-r-transparent border-b-transparent",
        bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-[40%] border-b-foreground/90 border-l-transparent border-r-transparent border-t-transparent"
    };

    return (
        <div
            className={`relative flex items-center ${className || ''}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute z-50 px-2 py-1 text-xs font-medium text-primary-foreground bg-primary/90 rounded shadow-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 ${positionStyles[side]}`}
                    role="tooltip"
                >
                    {content}
                    {/* Tiny arrow */}
                    {/* <div className={`absolute w-0 h-0 border-[4px] ${arrowStyles[side]}`}></div> */}
                </div>
            )}
        </div>
    );
}
