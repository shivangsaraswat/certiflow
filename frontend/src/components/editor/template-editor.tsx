'use client';

/**
 * Template Editor
 * Main visual editor component for placing attributes on PDF templates
 * 
 * Supports system attributes:
 * - certificateId: Auto-generated unique ID
 * - recipientName: Name from data
 * - generatedDate: Current date at generation time
 * - qrCode: Dynamic QR code from URL
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, ZoomIn, ZoomOut, Undo, ChevronLeft, ChevronRight, QrCode, Type, Calendar, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EditorCanvas } from './editor-canvas';
import { PropertyPanel } from './property-panel';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { updateTemplateAttributes, getViewUrl } from '@/lib/api';
import type { Template, DynamicAttribute } from '@/types';
import { SYSTEM_ATTRIBUTE_IDS, SYSTEM_ATTRIBUTE_DEFS } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from 'next-auth/react';
import { usePageTitle } from '@/components/providers/page-title-provider';

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

    const { setPageTitle, setActions, setBackButton } = usePageTitle();

    // Track changes
    useEffect(() => {
        const originalJson = JSON.stringify(template.attributes);
        const currentJson = JSON.stringify(attributes);
        setHasChanges(originalJson !== currentJson);
    }, [attributes, template.attributes]);

    // Ref to always get the latest handleSave function
    const handleSaveRef = useRef<() => void>(() => { });

    // Update Global Header
    useEffect(() => {
        setPageTitle(template.name);

        setBackButton(
            <Link href="/templates">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
        );

        setActions(
            <div className="flex items-center gap-2">
                {hasChanges && (
                    <Badge variant="secondary" className="hidden sm:inline-flex bg-amber-50 text-amber-600 border-amber-200">
                        Unsaved changes
                    </Badge>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/templates/${template.id}/preview`)}
                    className="h-9"
                >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                </Button>
                <Button
                    size="sm"
                    onClick={() => handleSaveRef.current()}
                    disabled={isSaving || !hasChanges}
                    className="h-9"
                >
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
        );

        return () => {
            setPageTitle(null);
            setActions(null);
            setBackButton(null);
        };
    }, [template.name, template.id, hasChanges, isSaving, router, setPageTitle, setActions, setBackButton]);

    const handlePdfLoad = useCallback(
        (data: { numPages: number; width: number; height: number }) => {
            setPdfDimensions({ width: data.width, height: data.height });
        },
        []
    );

    // Check which system attributes are already placed
    const hasSystemAttribute = (id: string) => attributes.some(a => a.id === id);

    // Add any system attribute
    const handleAddSystemAttribute = useCallback((systemId: keyof typeof SYSTEM_ATTRIBUTE_DEFS) => {
        if (hasSystemAttribute(systemId)) return; // Prevent duplicates

        const def = SYSTEM_ATTRIBUTE_DEFS[systemId];
        if (!def) return;

        const isQR = def.type === 'qr';

        const systemAttr: DynamicAttribute = {
            id: def.id,
            name: def.name,
            placeholder: `{${def.name.replace(/\s+/g, '')}}`,
            type: def.type,
            required: systemId === 'recipientName',
            page: currentPage,
            x: pdfDimensions.width / 2,
            y: isQR ? pdfDimensions.height - 100 : pdfDimensions.height / 2,
            fontSize: systemId === 'recipientName' ? 24 : 12,
            fontFamily: 'Helvetica',
            fontWeight: systemId === 'recipientName' ? 'bold' : 'normal',
            color: '#000000',
            align: 'center',
            isSystem: true,
            // QR specific
            ...(isQR ? { width: 80, height: 80, qrUrl: '' } : {}),
        };

        setAttributes(prev => [...prev, systemAttr]);
        setSelectedId(def.id);
    }, [currentPage, pdfDimensions, attributes]);

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
            setHasChanges(true);
        },
        [selectedId]
    );

    const handlePositionChange = useCallback((id: string, x: number, y: number) => {
        setAttributes((prev) =>
            prev.map((attr) => (attr.id === id ? { ...attr, x, y } : attr))
        );
        setHasChanges(true);
    }, []);

    const handleResizeChange = useCallback((id: string, width: number, height: number) => {
        setAttributes((prev) =>
            prev.map((attr) => (attr.id === id ? { ...attr, width, height } : attr))
        );
        setHasChanges(true);
    }, []);

    const handleDeleteAttribute = useCallback(() => {
        if (!selectedId) return;

        setAttributes((prev) => prev.filter((a) => a.id !== selectedId));
        setSelectedId(null);
        setHasChanges(true);
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

    // Keep the ref synced with the latest handleSave
    handleSaveRef.current = handleSave;

    const handleZoomIn = () => setScale((s) => Math.min(2, s + 0.1));
    const handleZoomOut = () => setScale((s) => Math.max(0.3, s - 0.1));

    const pdfUrl = getViewUrl('templates', template.filename);

    return (
        <div className="flex h-[calc(100vh-6rem)] flex-col">
            {/* Error Display */}
            {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Main Editor */}
            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* PDF Canvas Area */}
                {/* PDF Canvas Area */}
                <EditorCanvas
                    pdfUrl={pdfUrl}
                    scale={scale}
                    currentPage={currentPage}
                    attributes={attributes}
                    selectedId={selectedId}
                    pdfDimensions={pdfDimensions}
                    onPdfLoad={handlePdfLoad}
                    onSelectAttribute={setSelectedId}
                    onAttributePositionChange={handlePositionChange}
                    onAttributeResizeChange={handleResizeChange}
                    onDeleteAttribute={(id) => {
                        setAttributes((prev) => prev.filter((a) => a.id !== id));
                        if (selectedId === id) setSelectedId(null);
                        setHasChanges(true); // Deleting is a change
                    }}
                />

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
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Custom Attribute Button */}
                    <Button onClick={handleAddAttribute} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Custom
                    </Button>

                    <div className="h-8 w-px bg-border mx-2" />

                    {/* System Attribute Buttons */}
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            System:
                        </span>

                        <Button
                            onClick={() => handleAddSystemAttribute('certificateId')}
                            variant={hasSystemAttribute('certificateId') ? "outline" : "secondary"}
                            size="sm"
                            disabled={hasSystemAttribute('certificateId')}
                            className="h-8 text-xs"
                            title="Auto-generated unique certificate identifier"
                        >
                            <Type className="mr-1 h-3 w-3" />
                            ID
                            {hasSystemAttribute('certificateId') && <span className="ml-1">✓</span>}
                        </Button>

                        <Button
                            onClick={() => handleAddSystemAttribute('recipientName')}
                            variant={hasSystemAttribute('recipientName') ? "outline" : "secondary"}
                            size="sm"
                            disabled={hasSystemAttribute('recipientName')}
                            className="h-8 text-xs"
                            title="Name of the certificate recipient"
                        >
                            <Type className="mr-1 h-3 w-3" />
                            Name
                            {hasSystemAttribute('recipientName') && <span className="ml-1">✓</span>}
                        </Button>

                        <Button
                            onClick={() => handleAddSystemAttribute('generatedDate')}
                            variant={hasSystemAttribute('generatedDate') ? "outline" : "secondary"}
                            size="sm"
                            disabled={hasSystemAttribute('generatedDate')}
                            className="h-8 text-xs"
                            title="Date when the certificate was generated"
                        >
                            <Calendar className="mr-1 h-3 w-3" />
                            Date
                            {hasSystemAttribute('generatedDate') && <span className="ml-1">✓</span>}
                        </Button>

                        <Button
                            onClick={() => handleAddSystemAttribute('qrCode')}
                            variant={hasSystemAttribute('qrCode') ? "outline" : "secondary"}
                            size="sm"
                            disabled={hasSystemAttribute('qrCode')}
                            className="h-8 text-xs"
                            title="Dynamic QR code generated from URL"
                        >
                            <QrCode className="mr-1 h-3 w-3" />
                            QR
                            {hasSystemAttribute('qrCode') && <span className="ml-1">✓</span>}
                        </Button>
                    </div>

                    <div className="h-8 w-px bg-border mx-2" />

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{attributes.length}</span>
                        <span>fields</span>
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
