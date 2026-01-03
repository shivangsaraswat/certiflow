'use client';

/**
 * Single Certificate Form
 * Dynamic form that adapts based on the selected template's attributes
 */

import { useState, useEffect, useCallback } from 'react';
import { Download, FileOutput } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { getTemplates, getSignatures, generateSingleCertificate, getDownloadUrl } from '@/lib/api';
import { useSession } from 'next-auth/react';
import type { Template, Signature, CertificateData, DynamicAttribute, GenerationResult } from '@/types';

export function SingleCertificateForm() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    // Data state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [formData, setFormData] = useState<CertificateData>({});

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GenerationResult | null>(null);

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    // Load templates and signatures
    useEffect(() => {
        async function loadData() {
            if (!userId) return;
            try {
                const [templatesRes, signaturesRes] = await Promise.all([
                    getTemplates(userId),
                    getSignatures(userId),
                ]);

                if (templatesRes.success && templatesRes.data) {
                    setTemplates(templatesRes.data);
                }
                if (signaturesRes.success && signaturesRes.data) {
                    setSignatures(signaturesRes.data);
                }
            } catch {
                setError('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        }

        if (userId) {
            loadData();
        }
    }, [userId]);

    // Reset form when template changes
    useEffect(() => {
        if (selectedTemplate) {
            const initialData: CertificateData = {};
            selectedTemplate.attributes.forEach((attr) => {
                if (attr.type === 'date') {
                    initialData[attr.id] = new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                } else {
                    initialData[attr.id] = '';
                }
            });
            setFormData(initialData);
            setResult(null);
        }
    }, [selectedTemplateId, selectedTemplate]);

    const handleFieldChange = useCallback((attrId: string, value: string) => {
        setFormData((prev) => ({ ...prev, [attrId]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        // Validate required fields
        const missingRequired = selectedTemplate.attributes
            .filter((attr) => attr.required && !formData[attr.id])
            .map((attr) => attr.name);

        if (missingRequired.length > 0) {
            setError(`Missing required fields: ${missingRequired.join(', ')}`);
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult(null);

        try {
            const res = await generateSingleCertificate(selectedTemplateId, formData, userId);
            if (res.success && res.data) {
                setResult(res.data);
            } else {
                setError(res.error?.message || 'Failed to generate certificate');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const renderField = (attr: DynamicAttribute) => {
        const value = formData[attr.id] || '';

        if (attr.type === 'signature') {
            return (
                <Select
                    value={value}
                    onValueChange={(v) => handleFieldChange(attr.id, v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a signature" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">No signature</SelectItem>
                        {signatures.map((sig) => (
                            <SelectItem key={sig.id} value={sig.filename}>
                                {sig.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        if (attr.type === 'date') {
            return (
                <Input
                    type="date"
                    value={value}
                    onChange={(e) => handleFieldChange(attr.id, e.target.value)}
                />
            );
        }

        // Text field - use textarea if maxWidth suggests long text
        if (attr.maxWidth && attr.maxWidth > 300) {
            return (
                <Textarea
                    value={value}
                    onChange={(e) => handleFieldChange(attr.id, e.target.value)}
                    placeholder={`Enter ${attr.name.toLowerCase()}`}
                    rows={3}
                />
            );
        }

        return (
            <Input
                value={value}
                onChange={(e) => handleFieldChange(attr.id, e.target.value)}
                placeholder={`Enter ${attr.name.toLowerCase()}`}
            />
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Certificate Details</CardTitle>
                    <CardDescription>
                        Fill in the details for the certificate
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Template Selection */}
                        <div className="space-y-2">
                            <Label>Template</Label>
                            <Select
                                value={selectedTemplateId}
                                onValueChange={setSelectedTemplateId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                            {template.attributes.length === 0 && (
                                                <span className="ml-2 text-muted-foreground">(no attributes)</span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dynamic Fields based on Template */}
                        {selectedTemplate && selectedTemplate.attributes.length === 0 && (
                            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                This template has no attributes configured. Please edit the template to add fields.
                            </div>
                        )}

                        {selectedTemplate && selectedTemplate.attributes.map((attr) => (
                            <div key={attr.id} className="space-y-2">
                                <Label htmlFor={attr.id}>
                                    {attr.name}
                                    {attr.required && <span className="ml-1 text-destructive">*</span>}
                                </Label>
                                {renderField(attr)}
                            </div>
                        ))}

                        {/* Error Display */}
                        {error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!selectedTemplate || isGenerating || selectedTemplate.attributes.length === 0}
                        >
                            {isGenerating ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileOutput className="mr-2 h-4 w-4" />
                                    Generate Certificate
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Result / Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Result</CardTitle>
                    <CardDescription>
                        Your generated certificate will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!result && !selectedTemplate && (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            Select a template to get started
                        </div>
                    )}

                    {!result && selectedTemplate && (
                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                            Fill in the fields and click Generate
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                <p className="font-medium">Certificate Generated Successfully!</p>
                                <p className="text-sm">ID: {result.certificateId}</p>
                            </div>

                            <Button asChild className="w-full">
                                <a href={getDownloadUrl('generated', result.filename)} download>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Certificate
                                </a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
