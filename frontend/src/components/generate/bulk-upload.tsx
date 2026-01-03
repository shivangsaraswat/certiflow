'use client';

/**
 * Bulk Upload Form
 * CSV upload with dynamic column mapping based on template attributes
 */

import { useState, useEffect, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { FileUpload } from '@/components/shared/file-upload';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
    getTemplates,
    previewCSVHeaders,
    generateBulkCertificates,
    getDownloadUrl,
} from '@/lib/api';
import type { Template, BulkGenerationResult } from '@/types';

export function BulkUploadForm() {
    // Data state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isPreviewingCSV, setIsPreviewingCSV] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BulkGenerationResult | null>(null);

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    // Load templates
    useEffect(() => {
        async function loadTemplates() {
            try {
                const res = await getTemplates();
                if (res.success && res.data) {
                    setTemplates(res.data);
                }
            } catch {
                setError('Failed to load templates');
            } finally {
                setIsLoading(false);
            }
        }
        loadTemplates();
    }, []);

    // Reset mapping when template changes
    useEffect(() => {
        if (selectedTemplate) {
            const initialMapping: Record<string, string> = {};
            selectedTemplate.attributes.forEach((attr) => {
                // Try to auto-map based on similar names
                const matchingHeader = csvHeaders.find(
                    (h) =>
                        h.toLowerCase() === attr.name.toLowerCase() ||
                        h.toLowerCase() === attr.placeholder.replace(/[{}]/g, '').toLowerCase()
                );
                if (matchingHeader) {
                    initialMapping[attr.id] = matchingHeader;
                }
            });
            setColumnMapping(initialMapping);
        }
    }, [selectedTemplateId, selectedTemplate, csvHeaders]);

    const handleCSVChange = useCallback(async (file: File | null) => {
        setCsvFile(file);
        setCsvHeaders([]);
        setColumnMapping({});
        setResult(null);

        if (!file) return;

        setIsPreviewingCSV(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('csv', file);

            const res = await previewCSVHeaders(formData);
            if (res.success && res.data) {
                setCsvHeaders(res.data.headers);
            } else {
                setError(res.error?.message || 'Failed to read CSV headers');
            }
        } catch {
            setError('Failed to read CSV file');
        } finally {
            setIsPreviewingCSV(false);
        }
    }, []);

    const handleMappingChange = useCallback((attrId: string, csvColumn: string) => {
        setColumnMapping((prev) => ({
            ...prev,
            [attrId]: csvColumn,
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTemplate || !csvFile) return;

        // Validate required mappings
        const missingRequired = selectedTemplate.attributes
            .filter((attr) => attr.required && !columnMapping[attr.id])
            .map((attr) => attr.name);

        if (missingRequired.length > 0) {
            setError(`Please map these required fields: ${missingRequired.join(', ')}`);
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult(null);

        try {
            // Invert mapping: backend expects csvColumn -> attributeId
            const backendMapping: Record<string, string> = {};
            Object.entries(columnMapping).forEach(([attrId, csvColumn]) => {
                if (csvColumn) {
                    backendMapping[csvColumn] = attrId;
                }
            });

            const formData = new FormData();
            formData.append('templateId', selectedTemplateId);
            formData.append('csv', csvFile);
            formData.append('columnMapping', JSON.stringify(backendMapping));

            const res = await generateBulkCertificates(formData);
            if (res.success && res.data) {
                setResult(res.data);
            } else {
                setError(res.error?.message || 'Failed to generate certificates');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upload & Mapping */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            CSV Upload
                        </CardTitle>
                        <CardDescription>
                            Upload a CSV file and map columns to template attributes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                                <span className="ml-2 text-muted-foreground">
                                                    ({template.attributes.length} fields)
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* CSV Upload */}
                            <div className="space-y-2">
                                <Label>CSV File</Label>
                                <FileUpload
                                    accept=".csv"
                                    onFileSelect={handleCSVChange}
                                    value={csvFile}
                                    maxSize={10 * 1024 * 1024}
                                    disabled={!selectedTemplateId}
                                />
                                {isPreviewingCSV && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <LoadingSpinner size="sm" />
                                        Reading CSV headers...
                                    </div>
                                )}
                            </div>

                            {/* Column Mapping */}
                            {selectedTemplate && csvHeaders.length > 0 && (
                                <div className="space-y-4">
                                    <Label>Column Mapping</Label>
                                    <div className="space-y-3">
                                        {selectedTemplate.attributes.map((attr) => (
                                            <div key={attr.id} className="flex items-center gap-3">
                                                <div className="w-1/2">
                                                    <span className="text-sm font-medium">
                                                        {attr.name}
                                                        {attr.required && (
                                                            <span className="ml-1 text-destructive">*</span>
                                                        )}
                                                    </span>
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        {attr.placeholder}
                                                    </span>
                                                </div>
                                                <div className="w-1/2">
                                                    <Select
                                                        value={columnMapping[attr.id] || ''}
                                                        onValueChange={(v) => handleMappingChange(attr.id, v)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select column" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="">-- Skip --</SelectItem>
                                                            {csvHeaders.map((header) => (
                                                                <SelectItem key={header} value={header}>
                                                                    {header}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={
                                    !selectedTemplate ||
                                    !csvFile ||
                                    csvHeaders.length === 0 ||
                                    isGenerating
                                }
                            >
                                {isGenerating ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Generating Certificates...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Generate Bulk Certificates
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>
                            Generation progress and download
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!result && (
                            <div className="flex h-64 items-center justify-center text-muted-foreground">
                                Upload a CSV and configure mapping to generate
                            </div>
                        )}

                        {result && (
                            <div className="space-y-6">
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-2xl font-bold">{result.totalRequested}</p>
                                        <p className="text-sm text-muted-foreground">Total</p>
                                    </div>
                                    <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                                        <p className="text-2xl font-bold text-green-600">
                                            {result.successful}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Successful</p>
                                    </div>
                                    <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                                        <p className="text-2xl font-bold text-red-600">
                                            {result.failed}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Failed</p>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>
                                            {Math.round((result.successful / result.totalRequested) * 100)}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={(result.successful / result.totalRequested) * 100}
                                    />
                                </div>

                                {/* Errors */}
                                {result.errors && result.errors.length > 0 && (
                                    <div className="max-h-32 overflow-auto rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
                                        <p className="mb-2 font-medium text-red-600">Errors:</p>
                                        {result.errors.slice(0, 5).map((err, i) => (
                                            <p key={i} className="text-red-600">
                                                Row {err.row}: {err.message}
                                            </p>
                                        ))}
                                        {result.errors.length > 5 && (
                                            <p className="text-muted-foreground">
                                                ...and {result.errors.length - 5} more
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Download */}
                                {result.successful > 0 && (
                                    <Button asChild className="w-full">
                                        <a
                                            href={getDownloadUrl('bulk-zips', result.zipUrl.split('/').pop() || '')}
                                            download
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download ZIP ({result.successful} certificates)
                                        </a>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
