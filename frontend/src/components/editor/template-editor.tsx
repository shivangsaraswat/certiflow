'use client';

/**
 * Template Editor
 * Main visual editor component for placing attributes on PDF templates
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, ZoomIn, ZoomOut, Undo, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PDFViewer } from './pdf-viewer';
import { AttributeOverlay } from './attribute-overlay';
import { PropertyPanel } from './property-panel';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { updateTemplateAttributes, getViewUrl } from '@/lib/api';
import type { Template, DynamicAttribute } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface TemplateEditorProps {
    template: Template;
    onSave?: () => void;
}

export function TemplateEditor({ template, onSave }: TemplateEditorProps) {
    const router = useRouter();
    const [attributes, setAttributes] = useState<DynamicAttribute[]>(template.attributes);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [scale, setScale] = useState(0.8);
    const [currentPage, setCurrentPage] = useState(1);
    const [pdfDimensions, setPdfDimensions] = useState({ width: template.width, height: template.height });
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedAttribute = attributes.find((a) => a.id === selectedId) || null;
    const pageAttributes = attributes.filter((a) => a.page === currentPage);

    // Track changes
    useEffect(() => {
        const originalJson = JSON.stringify(template.attributes);
        const currentJson = JSON.stringify(attributes);
        setHasChanges(originalJson !== currentJson);
    }, [attributes, template.attributes]);

    const handlePdfLoad = useCallback(
        (data: { numPages: number; width: number; height: number }) => {
            setPdfDimensions({ width: data.width, height: data.height });
        },
        []
    );

    const handleAddAttribute = useCallback(() => {
        const newAttribute: DynamicAttribute = {
            id: `attr_${uuidv4().substring(0, 8)}`,
            name: `Field ${attributes.length + 1}`,
            placeholder: `{Field${attributes.length + 1}}`,
            type: 'text',
            required: true,
            page: currentPage,
            x: pdfDimensions.width / 2,
            y: pdfDimensions.height / 2,
            fontSize: 24,
            fontFamily: 'Helvetica',
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
        };

        setAttributes((prev) => [...prev, newAttribute]);
        setSelectedId(newAttribute.id);
    }, [attributes.length, currentPage, pdfDimensions]);

    const handleAttributeChange = useCallback(
        (updates: Partial<DynamicAttribute>) => {
            if (!selectedId) return;

            setAttributes((prev) =>
                prev.map((a) => (a.id === selectedId ? { ...a, ...updates } : a))
            );
        },
        [selectedId]
    );

    const handlePositionChange = useCallback(
        (id: string, x: number, y: number) => {
            setAttributes((prev) =>
                prev.map((a) => (a.id === id ? { ...a, x, y } : a))
            );
        },
        []
    );

    const handleDeleteAttribute = useCallback(() => {
        if (!selectedId) return;

        setAttributes((prev) => prev.filter((a) => a.id !== selectedId));
        setSelectedId(null);
    }, [selectedId]);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const res = await updateTemplateAttributes(template.id, attributes);
            if (res.success) {
                setHasChanges(false);
                if (onSave) {
                    onSave();
                } else {
                    router.push('/templates');
                }
            } else {
                setError(res.error?.message || 'Failed to save template');
            }
        } catch {
            setError('Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleZoomIn = () => setScale((s) => Math.min(2, s + 0.1));
    const handleZoomOut = () => setScale((s) => Math.max(0.3, s - 0.1));

    const pdfUrl = getViewUrl('templates', template.filename);

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/templates">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{template.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {Math.round(pdfDimensions.width)} × {Math.round(pdfDimensions.height)} pt • {template.pageCount} page(s)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <Badge variant="secondary">Unsaved changes</Badge>
                    )}
                    <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                        {isSaving ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Template
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Main Editor */}
            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* PDF Canvas Area */}
                <div className="flex-1 overflow-auto rounded-lg border bg-muted/30 p-4">
                    <div className="inline-block min-w-full">
                        <PDFViewer
                            url={pdfUrl}
                            pageNumber={currentPage}
                            scale={scale}
                            onLoadSuccess={handlePdfLoad}
                        >
                            {pageAttributes.map((attr) => (
                                <AttributeOverlay
                                    key={attr.id}
                                    attribute={attr}
                                    isSelected={selectedId === attr.id}
                                    scale={scale}
                                    pdfHeight={pdfDimensions.height}
                                    onSelect={() => setSelectedId(attr.id)}
                                    onPositionChange={(x, y) => handlePositionChange(attr.id, x, y)}
                                    onDelete={() => {
                                        setAttributes((prev) => prev.filter((a) => a.id !== attr.id));
                                        if (selectedId === attr.id) setSelectedId(null);
                                    }}
                                />
                            ))}
                        </PDFViewer>
                    </div>
                </div>

                {/* Property Panel */}
                <div className="shrink-0">
                    <PropertyPanel
                        attribute={selectedAttribute}
                        pageCount={template.pageCount}
                        onChange={handleAttributeChange}
                        onDelete={handleDeleteAttribute}
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="mt-4 flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2">
                    <Button onClick={handleAddAttribute} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Attribute
                    </Button>
                    <div className="mx-2 h-6 w-px bg-border" />
                    <span className="text-sm text-muted-foreground">
                        {attributes.length} attribute{attributes.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Page Navigation */}
                    {template.pageCount > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                                Page {currentPage} of {template.pageCount}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage((p) => Math.min(template.pageCount, p + 1))}
                                disabled={currentPage >= template.pageCount}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <div className="h-6 w-px bg-border" />

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handleZoomOut}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="w-16 text-center text-sm">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button variant="outline" size="icon" onClick={handleZoomIn}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
