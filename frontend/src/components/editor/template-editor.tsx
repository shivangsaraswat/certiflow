'use client';

/**
 * Template Editor
 * Main visual editor component for placing attributes on PDF templates
 * Redesigned to match Certifier.io UI
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Download, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { updateTemplateAttributes, updateTemplate, getViewUrl } from '@/lib/api';
import type { Template, DynamicAttribute } from '@/types';
import { SYSTEM_ATTRIBUTE_DEFS } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from 'next-auth/react';
import { usePageTitle } from '@/components/providers/page-title-provider'; // Import page title hook
import { LoadingSpinner } from '@/components/shared/loading-spinner';

// Editor Components
import { EditorSidebar, EditorTab } from './editor-sidebar';
// import { EditorHeader } from './editor-header'; // Removed in favor of global header
import { EditorToolbar } from './editor-toolbar';
import { EditorCanvas } from './editor-canvas';
import { FormattingToolbar } from './formatting-toolbar';
import { TemplatesPanel } from './panels/templates-panel';
import { AttributesPanel } from './panels/attributes-panel';
import { ImagesPanel } from './panels/images-panel';
import { TextPanel } from './panels/text-panel';
import { ElementsPanel } from './panels/elements-panel';
import { QRCodePanel } from './panels/qr-code-panel';
import { LayersPanel } from './panels/layers-panel';
import { cn } from '@/lib/utils';

interface TemplateEditorProps {
    template: Template;
    onSave?: () => void;
}

export function TemplateEditor({ template, onSave }: TemplateEditorProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { setPageTitle, setActions, setBackButton } = usePageTitle(); // Use global header context

    // State
    const [currentTemplate, setCurrentTemplate] = useState<Template>(template);
    const [activeTab, setActiveTab] = useState<EditorTab>('attributes');
    const [attributes, setAttributes] = useState<DynamicAttribute[]>(currentTemplate.attributes);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [scale, setScale] = useState(0.8);
    const [currentPage, setCurrentPage] = useState(1);
    const [pdfDimensions, setPdfDimensions] = useState({ width: currentTemplate.width, height: currentTemplate.height });
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [templateName, setTemplateName] = useState(currentTemplate.name);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [error, setError] = useState<string | null>(null);

    const selectedAttribute = attributes.find((a) => a.id === selectedId) || null;

    // Track changes
    useEffect(() => {
        const originalJson = JSON.stringify(currentTemplate.attributes);
        const currentJson = JSON.stringify(attributes);
        setHasChanges(originalJson !== currentJson || templateName !== currentTemplate.name);
    }, [attributes, currentTemplate.attributes, templateName, currentTemplate.name]);

    const handlePdfLoad = useCallback(
        (data: { numPages: number; width: number; height: number }) => {
            setPdfDimensions({ width: data.width, height: data.height });
        },
        []
    );

    // Attribute Management
    const hasSystemAttribute = (id: string) => {
        // Check by name as ID might differ for system attributes
        const def = SYSTEM_ATTRIBUTE_DEFS[id as keyof typeof SYSTEM_ATTRIBUTE_DEFS];
        return attributes.some(a => a.name === def?.name);
    };

    const handleAddSystemAttribute = useCallback((systemId: keyof typeof SYSTEM_ATTRIBUTE_DEFS) => {
        if (hasSystemAttribute(systemId)) return;

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

    // Add Image Attribute (from Drag & Drop)
    const handleAddImageAttribute = useCallback((url: string, clientX: number, clientY: number) => {
        // Calculate position relative to canvas
        // This is tricky because clientX/Y are screen coords.
        // We'll put it in center for now, or improve coord mapping later.

        const newAttribute: DynamicAttribute = {
            id: `img_${uuidv4().substring(0, 8)}`,
            name: 'Image',
            placeholder: 'Image',
            type: 'image',
            required: false,
            page: currentPage,
            x: pdfDimensions.width / 2, // Centered
            y: pdfDimensions.height / 2,
            width: 150,
            height: 150,
            fontSize: 0,
            fontFamily: '',
            fontWeight: 'normal',
            color: '',
            align: 'center',
            qrUrl: url, // Using qrUrl field to store Image URL for now? Or need fileUrl?
            // DynamicAttribute doesn't have fileUrl? 
            // Wait, DynamicAttribute signature type uses what?
            // Let's check type definition. It has specific fields.
            // Actually 'signature' usually means user signs it.
            // For static images, we might need a new 'image' type or modify DynamicAttribute.
            // The type definition has 'type: text | date | signature | qr'.
            // I should add 'image' type to DynamicAttribute in types.
        };
        // Reuse qrUrl for image URL or add a new field 'imageUrl'? 
        // For now I'll use qrUrl as a hack or add a field 'defaultValue' which exists.
        newAttribute.defaultValue = url;

        setAttributes((prev) => [...prev, newAttribute]);
        setSelectedId(newAttribute.id);
    }, [currentPage, pdfDimensions]);



    // Generic update handler
    const handleUpdateAttribute = useCallback((id: string, updates: Partial<DynamicAttribute>) => {
        setAttributes((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
        );
        setHasChanges(true);
    }, []);

    const handleAttributeChange = useCallback(
        (updates: Partial<DynamicAttribute>) => {
            if (!selectedId) return;
            handleUpdateAttribute(selectedId, updates);
        },
        [selectedId, handleUpdateAttribute]
    );

    // Add Text (Heading, Subheading, Body)
    const handleAddText = useCallback((type: 'heading' | 'subheading' | 'body') => {
        const style = {
            heading: { fontSize: 32, fontWeight: 'bold' as const, name: 'Heading' },
            subheading: { fontSize: 24, fontWeight: 'bold' as const, name: 'Subheading' },
            body: { fontSize: 14, fontWeight: 'normal' as const, name: 'Body Text' },
        }[type];

        const newAttribute: DynamicAttribute = {
            id: `text_${uuidv4().substring(0, 8)}`,
            name: style.name,
            placeholder: style.name,
            type: 'text',
            required: true,
            page: currentPage,
            x: pdfDimensions.width / 2,
            y: pdfDimensions.height / 2,
            fontSize: style.fontSize,
            fontFamily: 'Helvetica',
            fontWeight: style.fontWeight,
            color: '#000000',
            align: 'center',
            defaultValue: style.name
        };

        setAttributes((prev) => [...prev, newAttribute]);
        setSelectedId(newAttribute.id);
    }, [currentPage, pdfDimensions]);

    // Add Element (Shape)
    const handleAddElement = useCallback((type: 'rect' | 'circle' | 'line' | 'star' | 'triangle') => {
        const newAttribute: DynamicAttribute = {
            id: `el_${uuidv4().substring(0, 8)}`,
            name: type.charAt(0).toUpperCase() + type.slice(1),
            placeholder: type,
            type: 'shape',
            required: false,
            page: currentPage,
            x: pdfDimensions.width / 2,
            y: pdfDimensions.height / 2,
            width: 100,
            height: 100,
            fontSize: 0,
            fontFamily: '',
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
            defaultValue: type,
        };
        setAttributes((prev) => [...prev, newAttribute]);
        setSelectedId(newAttribute.id);
    }, [currentPage, pdfDimensions]);

    // Add QR Code
    const handleAddQRCode = useCallback((url: string) => {
        const newAttribute: DynamicAttribute = {
            id: `qr_${uuidv4().substring(0, 8)}`,
            name: 'QR Code',
            placeholder: 'QR Code',
            type: 'qr',
            required: false,
            page: currentPage,
            x: pdfDimensions.width / 2,
            y: pdfDimensions.height / 2,
            width: 100,
            height: 100,
            fontSize: 0,
            fontFamily: '',
            fontWeight: 'normal',
            color: '#000000',
            align: 'center',
            qrUrl: url,
            defaultValue: url
        };
        setAttributes((prev) => [...prev, newAttribute]);
        setSelectedId(newAttribute.id);
    }, [currentPage, pdfDimensions]);

    // Reorder Layers
    const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
        setAttributes(prev => {
            const newAttributes = [...prev];
            const [moved] = newAttributes.splice(fromIndex, 1);
            newAttributes.splice(toIndex, 0, moved);
            return newAttributes;
        });
        setHasChanges(true);
    }, []);

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

    const handleDuplicateAttribute = useCallback((id: string) => {
        const attribute = attributes.find(a => a.id === id);
        if (!attribute) return;

        const newAttribute: DynamicAttribute = {
            ...attribute,
            id: `copy_${uuidv4().substring(0, 8)}`,
            name: `${attribute.name} (Copy)`,
            x: attribute.x + 20,
            y: attribute.y + 20, // Move slightly down-right
        };

        setAttributes(prev => [...prev, newAttribute]);
        setSelectedId(newAttribute.id);
        setHasChanges(true);
    }, [attributes]);

    const handleLockAttribute = useCallback((id: string) => {
        setAttributes(prev => prev.map(a => a.id === id ? { ...a, locked: !a.locked } : a));
        setHasChanges(true);
    }, []);

    const handleLayerMove = useCallback((id: string, direction: 'up' | 'down') => {
        setAttributes(prev => {
            const index = prev.findIndex(a => a.id === id);
            if (index === -1) return prev;

            const newAttributes = [...prev];
            if (direction === 'up' && index < newAttributes.length - 1) {
                // Move UP means move towards END of array (higher z-index)
                const temp = newAttributes[index];
                newAttributes[index] = newAttributes[index + 1];
                newAttributes[index + 1] = temp;
            } else if (direction === 'down' && index > 0) {
                // Move DOWN means move towards START of array (lower z-index)
                const temp = newAttributes[index];
                newAttributes[index] = newAttributes[index - 1];
                newAttributes[index - 1] = temp;
            } else {
                return prev; // No change
            }
            return newAttributes;
        });
        setHasChanges(true);
    }, []);

    const handleApplyTemplate = async (sourceTemplateId: string) => {
        if (!userId) return;
        if (!window.confirm("This will replace your current design. Continue?")) return;

        setIsSaving(true);
        try {
            // "Applying" a template means we update the CURRENT template to match the source (file + attrs)
            const res = await updateTemplate(currentTemplate.id, { sourceTemplateId }, userId);

            if (res.success && res.data) {
                const updated = res.data;
                setCurrentTemplate(updated);
                setAttributes(updated.attributes);
                setPdfDimensions({ width: updated.width, height: updated.height });
                // We don't necessarily update name unless we want to
                setHasChanges(false);
                setError(null);
            } else {
                setError('Failed to apply template');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to apply template');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            if (!userId) throw new Error("Unauthorized");

            // Save attributes
            const res = await updateTemplateAttributes(currentTemplate.id, attributes, userId);

            // Note: Saving name is not implemented in API yet, would go here

            if (res.success) {
                setHasChanges(false);
                if (onSave) {
                    onSave();
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

    // Update Global Header
    useEffect(() => {
        // 1. Back Button
        setBackButton(
            <Link href="/templates">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
        );

        // 2. Title (Name Input + Status)
        setPageTitle(
            <div className="flex items-center gap-3">
                <Input
                    key="editor-name-input"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="h-9 w-[280px] border border-transparent bg-transparent px-2 text-base font-semibold hover:border-border hover:bg-muted/50 focus:border-primary focus:bg-background transition-all"
                    placeholder="Untitled Design"
                />
                <div className="flex items-center">
                    {hasChanges ? (
                        <Badge variant="secondary" className="h-6 px-2 text-xs font-normal text-muted-foreground border-transparent bg-muted/50">
                            Unsaved changes
                        </Badge>
                    ) : (
                        <span className="flex items-center text-xs text-muted-foreground px-2 h-6">
                            <Cloud className="mr-1.5 h-3.5 w-3.5" />
                            Saved
                        </span>
                    )}
                </div>
            </div>
        );

        // 3. Actions (Download + Save)
        setActions(
            <div className="flex items-center gap-3 pr-2">
                <Button variant="ghost" size="sm" onClick={() => console.log('Download')} className="text-muted-foreground hover:text-foreground">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>

                <Button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className="min-w-[110px] shadow-sm active:scale-95 transition-all"
                    size="sm"
                >
                    {isSaving ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Saving
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Design
                        </>
                    )}
                </Button>
            </div>
        );

        // Cleanup
        return () => {
            setPageTitle(null);
            setActions(null);
            setBackButton(null);
        };
    }, [templateName, hasChanges, isSaving, setPageTitle, setActions, setBackButton]); // handleSave excluded as it's stable-ish but safer to omit or memoize if needed

    const handleZoomIn = () => setScale((s) => Math.min(2, s + 0.1));
    const handleZoomOut = () => setScale((s) => Math.max(0.3, s - 0.1));
    const handleFitToScreen = () => setScale(0.8); // Simple reset for now

    const pdfUrl = getViewUrl('templates', currentTemplate.filename);

    // Render active panel content
    const renderPanelContent = () => {
        switch (activeTab) {
            case 'templates':
                return (
                    <TemplatesPanel
                        onSelectTemplate={handleApplyTemplate}
                    />
                );
            case 'attributes':
                return (
                    <AttributesPanel
                        attributes={attributes}
                        onAddKeyAttribute={(key) => handleAddSystemAttribute(key)}
                        onAddCustomAttribute={handleAddAttribute}
                        onSelectAttribute={setSelectedId}
                    />
                );
            case 'images':
                return <ImagesPanel />;
            case 'text':
                return <TextPanel onAddText={handleAddText} />;
            case 'elements':
                return <ElementsPanel onAddElement={handleAddElement} />;
            case 'qr':
                return <QRCodePanel onAddQRCode={handleAddQRCode} />;
            case 'layers':
                return (
                    <LayersPanel
                        attributes={attributes}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onUpdate={handleUpdateAttribute}
                        onReorder={handleReorder}
                        onDelete={(id) => {
                            setAttributes((prev) => prev.filter((a) => a.id !== id));
                            if (selectedId === id) setSelectedId(null);
                            setHasChanges(true);
                        }}
                    />
                );

            default:
                return (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground bg-background">
                        <p>Panel for {activeTab} coming soon in Phase 2</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-full flex-col bg-background overflow-hidden">
            {/* EditorHeader REMOVED - Controls hoisted to Global Header */}

            {/* 2. Main Workspace (Toolbar + Body) */}
            <div className="flex flex-1 overflow-hidden">
                {/* 3. Left Sidebar */}
                <EditorSidebar
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        // If clicking active tab, toggle panel visibility (not implemented yet, just keep active)
                        setActiveTab(tab);
                    }}
                />

                {/* 4. Left Panel (Contextual) */}
                <div
                    className={cn(
                        "w-[320px] flex-shrink-0 border-r bg-background transition-all duration-300 ease-in-out",
                        activeTab ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 w-0 border-none overflow-hidden"
                    )}
                >
                    {renderPanelContent()}
                </div>

                {/* 5. Canvas Area */}
                <div className="flex flex-1 flex-col bg-zinc-100/80 relative">
                    {/* Secondary Toolbar - Now the top bar in the editor itself */}
                    <EditorToolbar
                        scale={scale}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onFitToScreen={handleFitToScreen}
                        onAddBackground={() => console.log('Add background placeholder')}
                        onPreview={() => router.push(`/templates/${currentTemplate.id}/preview`)}
                    />

                    {/* Centered Formatting Toolbar (Absolute) */}
                    {selectedId && (
                        <FormattingToolbar
                            attribute={selectedAttribute}
                            onChange={handleAttributeChange}
                            onDelete={handleDeleteAttribute}
                        />
                    )}

                    {/* Canvas Container */}
                    <div
                        className="flex-1 overflow-auto flex items-center justify-center p-8"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            const type = e.dataTransfer.getData('type');
                            if (type === 'image') {
                                const src = e.dataTransfer.getData('src');
                                handleAddImageAttribute(src, e.clientX, e.clientY);
                            }
                        }}
                    >
                        <div className="shadow-xl">
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
                                    setHasChanges(true);
                                }}
                                onDuplicateAttribute={handleDuplicateAttribute}
                                onLockAttribute={handleLockAttribute}
                                onLayerMove={handleLayerMove}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
