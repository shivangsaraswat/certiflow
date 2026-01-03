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
import { useSession } from 'next-auth/react';

interface TemplateEditorProps {
    template: Template;
    onSave?: () => void;
}

export function TemplateEditor({ template, onSave }: TemplateEditorProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
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

    // Check if certificateId already exists
    const hasCertificateId = attributes.some(a => a.id === 'certificateId');

    // Add Certificate ID attribute (system attribute)
    const handleAddCertificateId = useCallback(() => {
        if (hasCertificateId) return; // Prevent duplicates

        const certificateIdAttr: DynamicAttribute = {
            id: 'certificateId',
            name: 'Certificate ID',
            placeholder: '{CertificateID}',
            type: 'text',
            required: true,
            page: currentPage,
            x: pdfDimensions.width / 2,
            y: 50, // Near bottom of page
            fontSize: 12,
            fontFamily: 'Helvetica',
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
        };
        setAttributes(prev => [...prev, certificateIdAttr]);
        setSelectedId('certificateId');
    }, [hasCertificateId, currentPage, pdfDimensions]);

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
            if (!userId) throw new Error("Unauthorized");
            const res = await updateTemplateAttributes(template.id, attributes, userId);
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
                <div className="shrink-0 h-full border-l bg-background">
                    <PropertyPanel
                        attribute={selectedAttribute}
                        attributes={attributes}
                        pageCount={template.pageCount}
                        pdfDimensions={pdfDimensions}
                        onChange={handleAttributeChange}
                        onDelete={handleDeleteAttribute}
                        onSelect={setSelectedId}
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="mt-4 flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button onClick={handleAddAttribute} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Attribute
                    </Button>
                    <Button
                        onClick={handleAddCertificateId}
                        variant={hasCertificateId ? "outline" : "secondary"}
                        disabled={hasCertificateId}
                        className="shadow-sm"
                        title={hasCertificateId ? "Certificate ID already added" : "Add Certificate ID field"}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Certificate ID
                        {hasCertificateId && <span className="ml-1 text-xs">(Added)</span>}
                    </Button>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{attributes.length}</span>
                        <span>attributes placed</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Page Navigation */}
                    {template.pageCount > 1 && (
                        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="min-w-[4rem] text-center text-sm font-medium">
                                {currentPage} / {template.pageCount}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage((p) => Math.min(template.pageCount, p + 1))}
                                disabled={currentPage >= template.pageCount}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                            <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-12 text-center text-xs font-medium tabular-nums">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                            <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
