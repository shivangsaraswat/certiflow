'use client';

/**
 * Bulk Upload Form
 * CSV upload or Data Vault selection with dynamic column mapping
 */

import { useState, useEffect, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, Database, Check } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { toast } from 'sonner';

interface Spreadsheet {
    id: string;
    name: string;
    updatedAt: string;
}

export function BulkUploadForm() {
    // Data state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [sourceType, setSourceType] = useState<'csv' | 'vault'>('csv');

    // CSV State
    const [csvFile, setCsvFile] = useState<File | null>(null);

    // Vault State
    const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
    const [selectedSheetId, setSelectedSheetId] = useState<string>('');

    // Shared State
    const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingSource, setIsProcessingSource] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BulkGenerationResult | null>(null);

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    // Load templates & spreadsheets
    useEffect(() => {
        async function loadData() {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const [tplRes, sheetRes] = await Promise.all([
                    getTemplates(),
                    fetch(`${baseUrl}/api/spreadsheets`).then(r => r.json())
                ]);

                if (tplRes.success && tplRes.data) {
                    setTemplates(tplRes.data);
                }
                if (sheetRes.success && sheetRes.data) {
                    setSpreadsheets(sheetRes.data);
                }
            } catch {
                setError('Failed to load initial data');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Reset mapping when template changes
    useEffect(() => {
        if (selectedTemplate) {
            const initialMapping: Record<string, string> = {};
            selectedTemplate.attributes.forEach((attr) => {
                // Try to auto-map based on similar names
                const matchingHeader = sourceHeaders.find(
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
    }, [selectedTemplateId, selectedTemplate, sourceHeaders]);

    const handleCSVChange = useCallback(async (file: File | null) => {
        setCsvFile(file);
        setSourceHeaders([]);
        setColumnMapping({});
        setResult(null);

        if (!file) return;

        setIsProcessingSource(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('csv', file);

            const res = await previewCSVHeaders(formData);
            if (res.success && res.data) {
                setSourceHeaders(res.data.headers);
            } else {
                setError(res.error?.message || 'Failed to read CSV headers');
            }
        } catch {
            setError('Failed to read CSV file');
        } finally {
            setIsProcessingSource(false);
        }
    }, []);

    const handleSheetSelect = useCallback(async (sheetId: string) => {
        setSelectedSheetId(sheetId);
        setSourceHeaders([]);
        setColumnMapping({});
        setResult(null);

        if (!sheetId) return;

        setIsProcessingSource(true);
        setError(null);

        try {
            // Fetch sheet content to extract headers (row 0)
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/spreadsheets/${sheetId}`);
            const data = await res.json();

            if (data.success && data.data.content) {
                const sheet = data.data.content[0]; // First sheet
                const headers: string[] = [];

                if (sheet) {
                    // Handle celldata format (sparse array with {r, c, v} objects)
                    if (sheet.celldata && Array.isArray(sheet.celldata) && sheet.celldata.length > 0) {
                        sheet.celldata.forEach((cell: any) => {
                            if (cell.r === 0) {
                                const val = cell.v?.m || cell.v?.v || (typeof cell.v === 'string' ? cell.v : '');
                                if (val) headers[cell.c] = String(val);
                            }
                        });
                    }
                    // Handle data format (2D array)
                    else if (sheet.data && Array.isArray(sheet.data) && sheet.data.length > 0) {
                        const firstRow = sheet.data[0];
                        if (Array.isArray(firstRow)) {
                            firstRow.forEach((cell: any, colIndex: number) => {
                                if (cell !== null && cell !== undefined) {
                                    const val = cell?.m || cell?.v || (typeof cell === 'string' ? cell : '');
                                    if (val) headers[colIndex] = String(val);
                                }
                            });
                        }
                    }
                }

                const filteredHeaders = headers.filter(Boolean);
                if (filteredHeaders.length > 0) {
                    setSourceHeaders(filteredHeaders);
                } else {
                    setError('No headers found in row 1. Make sure your spreadsheet has column headers.');
                }
            } else {
                setError('Failed to load spreadsheet data');
            }
        } catch {
            setError('Failed to process spreadsheet');
        } finally {
            setIsProcessingSource(false);
        }
    }, []);

    const handleMappingChange = useCallback((attrId: string, colName: string) => {
        setColumnMapping((prev) => {
            // Handle skip selection - remove the mapping
            if (colName === '__skip__') {
                const { [attrId]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [attrId]: colName,
            };
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTemplate) return;
        if (sourceType === 'csv' && !csvFile) return;
        if (sourceType === 'vault' && !selectedSheetId) return;

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
            // Invert mapping: backend expects sourceColumn -> attributeId
            const backendMapping: Record<string, string> = {};
            Object.entries(columnMapping).forEach(([attrId, sourceCol]) => {
                if (sourceCol) {
                    backendMapping[sourceCol] = attrId;
                }
            });

            const formData = new FormData();
            formData.append('templateId', selectedTemplateId);
            formData.append('columnMapping', JSON.stringify(backendMapping));

            if (sourceType === 'csv' && csvFile) {
                formData.append('csv', csvFile);
            } else if (sourceType === 'vault' && selectedSheetId) {
                formData.append('sheetId', selectedSheetId); // Backend must handle this
            }

            const res = await generateBulkCertificates(formData);
            if (res.success && res.data) {
                setResult(res.data);
                toast.success('Generation started successfully');
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
                {/* Configuration */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Source Configuration</CardTitle>
                            <CardDescription>Select data source and template</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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

                            <Tabs
                                defaultValue="csv"
                                value={sourceType}
                                onValueChange={(v) => setSourceType(v as 'csv' | 'vault')}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                                    <TabsTrigger value="vault">Data Vault</TabsTrigger>
                                </TabsList>

                                <TabsContent value="csv" className="space-y-4">
                                    <div className="rounded-lg border border-dashed p-4">
                                        <Label className="mb-2 block">Upload CSV File</Label>
                                        <FileUpload
                                            accept=".csv"
                                            onFileSelect={handleCSVChange}
                                            value={csvFile}
                                            maxSize={10 * 1024 * 1024}
                                            disabled={!selectedTemplateId}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="vault" className="space-y-4">
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <Label className="mb-2 block">Select Spreadsheet</Label>
                                        {spreadsheets.length === 0 ? (
                                            <div className="text-sm text-muted-foreground py-2">
                                                No spreadsheets found. Go to Data Vault to create one.
                                            </div>
                                        ) : (
                                            <Select
                                                value={selectedSheetId}
                                                onValueChange={handleSheetSelect}
                                                disabled={!selectedTemplateId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a spreadsheet" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {spreadsheets.map(sheet => (
                                                        <SelectItem key={sheet.id} value={sheet.id}>
                                                            <div className="flex items-center gap-2">
                                                                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                                                                {sheet.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {isProcessingSource && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <LoadingSpinner size="sm" />
                                    Processing data headers...
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mapping (Only show if source is selected) */}
                    {selectedTemplateId && sourceHeaders.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Field Mapping</CardTitle>
                                <CardDescription>Map template fields to data columns</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form id="bulk-form" onSubmit={handleSubmit} className="space-y-4">
                                    {selectedTemplate?.attributes.map((attr) => (
                                        <div key={attr.id} className="flex items-center gap-3">
                                            <div className="w-1/3">
                                                <span className="text-sm font-medium block truncate" title={attr.name}>
                                                    {attr.name}
                                                </span>
                                                {attr.required && (
                                                    <span className="text-[10px] text-destructive uppercase font-bold tracking-wider">Required</span>
                                                )}
                                            </div>
                                            <div className="w-2/3">
                                                <Select
                                                    value={columnMapping[attr.id] || '__skip__'}
                                                    onValueChange={(v) => handleMappingChange(attr.id, v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__skip__">-- Skip --</SelectItem>
                                                        {sourceHeaders.map((header) => (
                                                            <SelectItem key={header} value={header}>
                                                                {header}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}

                                    {error && (
                                        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive mt-4">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full mt-4"
                                        disabled={isGenerating || (sourceType === 'csv' ? !csvFile : !selectedSheetId)}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <LoadingSpinner size="sm" className="mr-2" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Start Generation
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Results Preview (Right Column) */}
                <div className="space-y-6">
                    <Card className="h-full border-dashed bg-muted/10">
                        <CardHeader>
                            <CardTitle>Generation Status</CardTitle>
                            <CardDescription>
                                Track progress and download results
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!result && !isGenerating && (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <div className="rounded-full bg-muted p-4 mb-4">
                                        <Database className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h4 className="font-medium mb-1">Ready to Generate</h4>
                                    <p className="text-sm max-w-[200px]">
                                        Configure your source and mapping to begin the bulk generation process.
                                    </p>
                                </div>
                            )}

                            {/* Active Generation State */}
                            {isGenerating && !result && (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <LoadingSpinner size="lg" className="mb-4" />
                                    <h4 className="font-medium">Generating Certificates...</h4>
                                    <p className="text-sm text-muted-foreground mt-1">This might take a while depending on the batch size.</p>
                                </div>
                            )}

                            {result && (
                                <div className="space-y-6">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="rounded-lg bg-background border p-3">
                                            <p className="text-2xl font-bold">{result.totalRequested}</p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                                        </div>
                                        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {result.successful}
                                            </p>
                                            <p className="text-xs text-green-600/80 dark:text-green-400/80 uppercase tracking-wide">Success</p>
                                        </div>
                                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                {result.failed}
                                            </p>
                                            <p className="text-xs text-red-600/80 dark:text-red-400/80 uppercase tracking-wide">Failed</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>Completion</span>
                                            <span>
                                                {result.totalRequested > 0
                                                    ? Math.round((result.successful / result.totalRequested) * 100)
                                                    : 0}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={result.totalRequested > 0
                                                ? (result.successful / result.totalRequested) * 100
                                                : 0}
                                            className="h-2"
                                        />
                                    </div>

                                    {/* Error List */}
                                    {result.errors && result.errors.length > 0 && (
                                        <div className="max-h-48 overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                                            <p className="mb-2 font-medium text-destructive flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                Error Log
                                            </p>
                                            <div className="space-y-1">
                                                {result.errors.slice(0, 10).map((err, i) => (
                                                    <div key={i} className="text-xs text-destructive/90 font-mono bg-destructive/5 p-1 rounded">
                                                        Row {err.row}: {err.message}
                                                    </div>
                                                ))}
                                                {result.errors.length > 10 && (
                                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                                        ...and {result.errors.length - 10} more errors
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Download Action */}
                                    {result.successful > 0 && (
                                        <div className="pt-4 border-t">
                                            <Button asChild className="w-full shadow-lg animate-in fade-in zoom-in duration-300">
                                                <a
                                                    href={getDownloadUrl('bulk-zips', result.zipUrl.split('/').pop() || '')}
                                                    download
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download ZIP Bundle
                                                </a>
                                            </Button>
                                            <p className="text-center text-xs text-muted-foreground mt-2">
                                                Contains {result.successful} generated PDF files
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
