'use client';

/**
 * PDF Viewer Component
 * Renders a PDF template using react-pdf
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string;
    pageNumber?: number;
    scale?: number;
    onLoadSuccess?: (data: { numPages: number; width: number; height: number }) => void;
    onPageClick?: (x: number, y: number) => void;
    children?: React.ReactNode;
}

export function PDFViewer({
    url,
    pageNumber = 1,
    scale = 1,
    onLoadSuccess,
    onPageClick,
    children,
}: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDocumentLoadSuccess = useCallback(
        ({ numPages }: { numPages: number }) => {
            setNumPages(numPages);
        },
        []
    );

    const handlePageLoadSuccess = useCallback(
        (page: { width: number; height: number; originalWidth: number; originalHeight: number }) => {
            setDimensions({ width: page.originalWidth, height: page.originalHeight });
            if (onLoadSuccess && numPages > 0) {
                onLoadSuccess({
                    numPages,
                    width: page.originalWidth,
                    height: page.originalHeight,
                });
            }
        },
        [numPages, onLoadSuccess]
    );

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!onPageClick || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / scale;
            const y = (e.clientY - rect.top) / scale;

            // Convert to PDF coordinates (flip Y)
            const pdfX = x;
            const pdfY = dimensions.height - y;

            onPageClick(pdfX, pdfY);
        },
        [onPageClick, scale, dimensions.height]
    );

    return (
        <div
            ref={containerRef}
            className="relative inline-block"
            onClick={handleClick}
            style={{ cursor: onPageClick ? 'crosshair' : 'default' }}
        >
            <Document
                file={url}
                onLoadSuccess={handleDocumentLoadSuccess}
                loading={
                    <div className="flex h-96 w-full items-center justify-center bg-muted">
                        <span className="text-muted-foreground">Loading PDF...</span>
                    </div>
                }
                error={
                    <div className="flex h-96 w-full items-center justify-center bg-destructive/10">
                        <span className="text-destructive">Failed to load PDF</span>
                    </div>
                }
            >
                <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    onLoadSuccess={handlePageLoadSuccess}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                />
            </Document>
            {/* Overlay for attributes */}
            <div
                className="pointer-events-none absolute left-0 top-0"
                style={{
                    width: dimensions.width * scale,
                    height: dimensions.height * scale,
                }}
            >
                {children}
            </div>
        </div>
    );
}
