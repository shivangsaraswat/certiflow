'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EditorCanvas } from '@/components/editor/editor-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { getTemplate, updateTemplateAttributes, getViewUrl } from '@/lib/api';
import type { Template, DynamicAttribute } from '@/types';
import { useSession } from 'next-auth/react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PreviewPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession();
    const templateId = params?.id as string;

    const [template, setTemplate] = useState<Template | null>(null);
    const [attributes, setAttributes] = useState<DynamicAttribute[]>([]);
    const [previewValues, setPreviewValues] = useState<Record<string, string>>({});

    // Canvas state
    const [scale, setScale] = useState(0.8);
    const [pdfDimensions, setPdfDimensions] = useState({ width: 842, height: 595 });
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Initial Load
    useEffect(() => {
        if (!templateId) return;

        const loadTemplate = async () => {
            try {
                const fetched = await getTemplate(templateId, session?.user?.id);
                if (fetched.success && fetched.data) {
                    const tpl = fetched.data;
                    setTemplate(tpl);
                    setAttributes(tpl.attributes);
                    setPdfDimensions({ width: tpl.width, height: tpl.height });

                    // Pre-fill preview values with placeholders or names for clarity
                    const initialPreviews: Record<string, string> = {};
                    tpl.attributes.forEach(attr => {
                        if (attr.type !== 'qr') {
                            // Use explicit placeholder or default derived from name
                            initialPreviews[attr.id] = attr.placeholder.replace(/^\{|\}$/g, '') || attr.name;

                            // For system attributes, provide specific example data
                            if (attr.id === 'recipientName') initialPreviews[attr.id] = 'John Doe';
                            if (attr.id === 'generatedDate') initialPreviews[attr.id] = new Date().toLocaleDateString();
                            if (attr.id === 'certificateId') initialPreviews[attr.id] = 'CERT-2024-001';
                        }
                    });
                    setPreviewValues(initialPreviews);
                }
            } catch (error) {
                console.error("Failed to load template", error);
                toast.error("Failed to load template");
            } finally {
                setIsLoading(false);
            }
        };

        loadTemplate();
    }, [templateId]);

    // Handle Layout Changes (Move/Resize) - Reusing logic from Editor
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

    // Handle Preview Input Change
    const handlePreviewChange = (id: string, value: string) => {
        setPreviewValues(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSaveLayout = async () => {
        if (!template || !session?.user?.id) return;

        setIsSaving(true);
        try {
            // Only save layout attributes, ignore preview values
            const res = await updateTemplateAttributes(template.id, attributes, session.user.id);
            if (res.success) {
                toast.success("Layout updated successfully");
                setHasChanges(false);
                // Redirect back to main editor
                router.push(`/templates/${template.id}`);
            } else {
                toast.error(res.error?.message || "Failed to update layout");
            }
        } catch (error) {
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!template) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Template not found</p>
                <Button onClick={() => router.push('/templates')}>Go Back</Button>
            </div>
        );
    }

    const pdfUrl = getViewUrl('templates', template.filename);

    return (
        <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/templates/${template.id}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            Preview: {template.name}
                            <Badge variant="outline" className="text-xs font-normal">Live Data Mode</Badge>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && <Badge variant="secondary">Unsaved Layout Changes</Badge>}
                    <Button onClick={handleSaveLayout} disabled={!hasChanges || isSaving}>
                        {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Layout & Return
                    </Button>
                </div>
            </div>

            {/* Main Content - Split View */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left: Canvas */}
                <div className="flex-[2] flex flex-col min-w-0 rounded-lg border bg-muted/30">
                    <EditorCanvas
                        pdfUrl={pdfUrl}
                        scale={scale}
                        currentPage={1} // Preview simplified to Page 1 for now
                        attributes={attributes}
                        selectedId={selectedId}
                        pdfDimensions={pdfDimensions}
                        previewValues={previewValues}
                        onPdfLoad={(d) => setPdfDimensions({ width: d.width, height: d.height })}
                        onSelectAttribute={setSelectedId}
                        onAttributePositionChange={handlePositionChange}
                        onAttributeResizeChange={handleResizeChange}
                    // Deletion disabled in preview mode to prevent accidental data loss
                    // onDeleteAttribute={undefined} 
                    />

                    <div className="p-2 border-t bg-background flex justify-center text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            You can move and resize elements here to fix alignment issues. Changes will be saved.
                        </span>
                    </div>
                </div>

                {/* Right: Dynamic Form */}
                <div className="flex-1 max-w-sm flex flex-col rounded-lg border bg-card">
                    <div className="p-4 border-b bg-muted/10">
                        <h2 className="font-semibold mb-1">Test Data</h2>
                        <p className="text-xs text-muted-foreground">
                            Enter values to see how they fit on the certificate.
                        </p>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {attributes
                                .filter(attr => attr.type !== 'qr') // Skip QR codes in form
                                .sort((a, b) => (a.y - b.y)) // Sort visually top-to-bottom
                                .map((attr) => (
                                    <div key={attr.id} className="space-y-1.5Context">
                                        <Label htmlFor={`input-${attr.id}`} className="text-xs font-medium flex items-center justify-between">
                                            {attr.name}
                                            {attr.id === selectedId && <Badge variant="outline" className="h-4 px-1 text-[10px]">Selected</Badge>}
                                        </Label>
                                        <Input
                                            id={`input-${attr.id}`}
                                            value={previewValues[attr.id] || ''}
                                            onChange={(e) => handlePreviewChange(attr.id, e.target.value)}
                                            onFocus={() => setSelectedId(attr.id)}
                                            className="h-8 text-sm"
                                            placeholder={`Value for ${attr.name}`}
                                        />
                                    </div>
                                ))}

                            {attributes.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No editable text fields found. Add fields in the editor.
                                </p>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t bg-muted/10">
                        <Button
                            variant="secondary"
                            className="w-full text-xs"
                            onClick={() => {
                                // Reset to defaults
                                const defaults: Record<string, string> = {};
                                attributes.forEach(attr => {
                                    if (attr.type !== 'qr') defaults[attr.id] = attr.placeholder.replace(/^\{|\}$/g, '') || attr.name;
                                });
                                setPreviewValues(defaults);
                            }}
                        >
                            <RotateCcw className="mr-2 h-3 w-3" />
                            Reset Values
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
