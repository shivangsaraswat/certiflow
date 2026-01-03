'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { ArrowLeft, Award, Download, ExternalLink, RefreshCw, Plus, ChevronDown, User, Users, Trash2, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { getGroup, getGroupCertificates, getDownloadUrl, getTemplate, generateSingleInGroup, deleteCertificate, getBulkJobStatus } from '@/lib/api';
import type { Group, GroupCertificate, Template, DynamicAttribute } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePageTitle } from '@/components/providers/page-title-provider';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [group, setGroup] = useState<Group | null>(null);
    const [template, setTemplate] = useState<Template | null>(null);
    const [certificates, setCertificates] = useState<GroupCertificate[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingCerts, setLoadingCerts] = useState(false);

    // Generation dialogs
    const [isSingleDialogOpen, setIsSingleDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Bulk generation state
    const [bulkStep, setBulkStep] = useState<1 | 2 | 3>(1); // 1: Source, 2: Mapping, 3: Processing/Results
    const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [bulkJobId, setBulkJobId] = useState<string | null>(null);
    const [bulkStatus, setBulkStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
    const [bulkResult, setBulkResult] = useState<any>(null);
    const [loadingHeaders, setLoadingHeaders] = useState(false);

    // Delete Confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Page Title Context
    const { setPageTitle } = usePageTitle();

    // Set page title when group is loaded
    useEffect(() => {
        if (group) {
            setPageTitle(group.name);
        }
        return () => setPageTitle(null);
    }, [group, setPageTitle]);

    const loadGroup = useCallback(async () => {
        setLoading(true);
        const result = await getGroup(id);
        if (result.success && result.data) {
            setGroup(result.data);
            // Load template details
            const tplRes = await getTemplate(result.data.templateId);
            if (tplRes.success && tplRes.data) {
                setTemplate(tplRes.data);
                // Initialize form data
                const initial: Record<string, string> = {};
                tplRes.data.attributes.forEach((attr: DynamicAttribute) => {
                    initial[attr.id] = '';
                });
                setFormData(initial);
            }
        }
        setLoading(false);
    }, [id]);

    const loadCertificates = useCallback(async () => {
        setLoadingCerts(true);
        const result = await getGroupCertificates(id);
        if (result.success && result.data) {
            setCertificates(result.data.certificates);
            setTotal(result.data.total);
        }
        setLoadingCerts(false);
    }, [id]);

    useEffect(() => {
        loadGroup();
        loadCertificates();
    }, [loadGroup, loadCertificates]);

    const handleRefresh = () => {
        loadGroup();
        loadCertificates();
    };

    const handleSingleGenerate = async () => {
        if (!template || !group) return;

        setIsGenerating(true);
        const res = await generateSingleInGroup(group.id, {
            data: formData,
            recipientName: formData[template.attributes[0]?.id] || 'Unknown',
            recipientEmail: recipientEmail || undefined,
        });

        if (res.success && res.data) {
            toast.success(`Certificate ${res.data.certificateId} generated!`);
            // Reset form
            const initial: Record<string, string> = {};
            template.attributes.forEach((attr: DynamicAttribute) => {
                initial[attr.id] = '';
            });
            setFormData(initial);
            setRecipientEmail('');
            setIsSingleDialogOpen(false);
            handleRefresh();
        } else {
            toast.error(res.error?.message || 'Failed to generate certificate');
        }
    };

    const handleDeleteCertificate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this certificate? This cannot be undone.')) return;

        const res = await deleteCertificate(id);
        if (res.success) {
            toast.success('Certificate deleted successfully');
            loadCertificates(); // Refresh list
        } else {
            toast.error(res.error?.message || 'Failed to delete certificate');
        }
    };

    // Bulk Generation Logic
    const loadSheetHeaders = async () => {
        if (!group?.sheetId) return;

        setLoadingHeaders(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const sheetRes = await fetch(`${baseUrl}/api/spreadsheets/${group.sheetId}`);
            const sheetData = await sheetRes.json();

            if (sheetData.success && sheetData.data?.content) {
                const sheet = sheetData.data.content[0]; // Get first sheet
                const headers: string[] = [];

                if (sheet) {
                    // Extract headers logic
                    if (sheet.celldata && Array.isArray(sheet.celldata)) {
                        const row0Cells = sheet.celldata.filter((c: any) => c.r === 0);
                        row0Cells.forEach((cell: any) => {
                            if (cell.v?.v || cell.v?.m) {
                                headers[cell.c] = String(cell.v?.m || cell.v?.v);
                            }
                        });
                    } else if (sheet.data && Array.isArray(sheet.data)) {
                        if (sheet.data[0] && Array.isArray(sheet.data[0])) {
                            sheet.data[0].forEach((cell: any, idx: number) => {
                                if (cell?.v !== undefined || typeof cell === 'string') {
                                    headers[idx] = cell?.v !== undefined ? String(cell.v) : (typeof cell === 'string' ? cell : '');
                                }
                            });
                        }
                    }
                }

                const cleanHeaders = headers.filter(h => h);
                setSheetHeaders(cleanHeaders);

                // Auto-mapping
                const initialMapping: Record<string, string> = {};
                if (template) {
                    template.attributes.forEach(attr => {
                        // Specific check for email
                        if (attr.name.toLowerCase().includes('email')) {
                            const emailHeader = cleanHeaders.find(h =>
                                h.toLowerCase() === 'email' ||
                                h.toLowerCase() === 'e-mail' ||
                                h.toLowerCase() === 'mail' ||
                                h.toLowerCase().includes('email')
                            );
                            if (emailHeader) initialMapping[attr.id] = emailHeader;
                        } else {
                            const matchingHeader = cleanHeaders.find(h =>
                                h.toLowerCase() === attr.name.toLowerCase() ||
                                h.toLowerCase().includes(attr.name.toLowerCase())
                            );
                            if (matchingHeader) initialMapping[attr.id] = matchingHeader;
                        }
                    });
                }
                setColumnMapping(initialMapping);
            }
        } catch (err) {
            toast.error('Failed to load spreadsheet headers');
        } finally {
            setLoadingHeaders(false);
        }
    };

    useEffect(() => {
        if (isBulkDialogOpen && bulkStep === 1) {
            // Reset state when opening
            setBulkStatus('idle');
            setBulkJobId(null);
            setBulkResult(null);
        }
    }, [isBulkDialogOpen, bulkStep]);

    const handleBulkStart = async () => {
        if (!group?.sheetId) return;

        // Validate required fields
        const missing = template?.attributes
            .filter(a => a.required && !columnMapping[a.id])
            .map(a => a.name);

        if (missing && missing.length > 0) {
            toast.error(`Missing required mappings: ${missing.join(', ')}`);
            return;
        }

        setBulkStep(3);
        setBulkStatus('processing');

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const formData = new FormData();
            formData.append('templateId', group.templateId);
            // Invert mapping for backend: sourceColumn -> attrId (logic in backend may vary, checking logic...)
            // Actually backend expects: columnMapping object/json
            // Code review of existing bulk upload: backend expects JSON string where keys are Source Columns and Values are Attr IDs? 
            // WAIT, looking at existing backend logic: 
            // `for (const [sourceColumn, attrId] of Object.entries(columnMapping))`
            // So we need { "Source Col": "Attr ID" }

            const backendMapping: Record<string, string> = {};
            // Flip our frontend mapping: { attrId: sourceCol } -> { sourceCol: attrId }
            Object.entries(columnMapping).forEach(([attrId, sourceCol]) => {
                if (sourceCol && sourceCol !== '__skip__') {
                    backendMapping[sourceCol] = attrId;
                }
            });

            formData.append('columnMapping', JSON.stringify(backendMapping));
            formData.append('sheetId', group.sheetId);
            formData.append('groupId', group.id);

            const result = await fetch(`${baseUrl}/api/generate/bulk`, {
                method: 'POST',
                body: formData,
            });

            const data = await result.json();

            if (data.success && data.data.jobId) {
                setBulkJobId(data.data.jobId);
                // Start polling
            } else {
                toast.error(data.error || 'Failed to start bulk generation');
                setBulkStatus('failed');
            }
        } catch (err) {
            toast.error('Failed to start bulk generation');
            setBulkStatus('failed');
        }
    };

    // Polling Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (bulkStatus === 'processing' && bulkJobId) {
            interval = setInterval(async () => {
                const res = await getBulkJobStatus(bulkJobId);
                if (res.success && res.data) {
                    setBulkResult(res.data);

                    if (res.data.status === 'completed') {
                        setBulkStatus('completed');
                        clearInterval(interval);
                        toast.success('Bulk generation completed!');
                        handleRefresh();
                    } else if (res.data.status === 'failed') {
                        setBulkStatus('failed');
                        clearInterval(interval);
                        toast.error('Bulk generation failed');
                    }
                }
            }, 2000); // 2 second poll
        }

        return () => clearInterval(interval);
    }, [bulkStatus, bulkJobId]);



    const resetBulkDialog = () => {
        setBulkStatus('idle');
        setBulkStep(1);
        setBulkJobId(null);
        setBulkResult(null);
        setIsBulkDialogOpen(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Group not found</p>
                <Button asChild className="mt-4">
                    <Link href="/groups">Back to Groups</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/groups">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleRefresh}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Generate
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsSingleDialogOpen(true)}>
                                <User className="mr-2 h-4 w-4" />
                                Single Certificate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsBulkDialogOpen(true)}>
                                <Users className="mr-2 h-4 w-4" />
                                Bulk from Data Vault
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>



            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Certificates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{total}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Template Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-bold font-mono">{group.template?.code || '-'}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-lg font-medium truncate block" title={group.template?.name}>{group.template?.name || '-'}</span>
                    </CardContent>
                </Card>
            </div>

            {/* Certificates Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Generated Certificates</CardTitle>
                            <CardDescription>All certificates generated in this group</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingCerts ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Award className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">No certificates yet. Start by generating one!</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Generate Certificate
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setIsSingleDialogOpen(true)}>
                                        <User className="mr-2 h-4 w-4" />
                                        Single Certificate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsBulkDialogOpen(true)}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Bulk from Data Vault
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Certificate ID</TableHead>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {certificates.map((cert) => (
                                    <TableRow key={cert.id}>
                                        <TableCell className="font-mono text-sm">{cert.certificateCode}</TableCell>
                                        <TableCell>{cert.recipientName}</TableCell>
                                        <TableCell className="text-muted-foreground">{cert.recipientEmail || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={cert.generationMode === 'bulk' ? 'secondary' : 'default'}>
                                                {cert.generationMode}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(cert.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {cert.fileUrl && (
                                                        <DropdownMenuItem asChild>
                                                            <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer flex items-center">
                                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                                View
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem asChild>
                                                        <a href={getDownloadUrl('generated', cert.filename)} download className="cursor-pointer flex items-center">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteId(cert.id);
                                                        }}
                                                        className="text-destructive focus:text-destructive cursor-pointer flex items-center"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Single Generation Dialog */}
            <Dialog open={isSingleDialogOpen} onOpenChange={setIsSingleDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Generate Single Certificate</DialogTitle>
                        <DialogDescription>Fill in the details to generate a certificate</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {template?.attributes.map((attr) => (
                            <div key={attr.id} className="space-y-2">
                                <Label htmlFor={attr.id}>
                                    {attr.name}
                                    {attr.required && <span className="text-destructive ml-1">*</span>}
                                </Label>
                                <Input
                                    id={attr.id}
                                    value={formData[attr.id] || ''}
                                    onChange={(e) => setFormData({ ...formData, [attr.id]: e.target.value })}
                                    placeholder={attr.placeholder || `Enter ${attr.name}`}
                                    required={attr.required}
                                />
                            </div>
                        ))}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Recipient Email
                                <span className="text-muted-foreground ml-1 text-xs">(for Certificate ID)</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="e.g., 24f3001856@ds.study.iitm.ac.in"
                            />
                            <p className="text-xs text-muted-foreground">
                                Last 4 digits before @ will be used in Certificate ID
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSingleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSingleGenerate} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Generate Certificate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Generation Dialog */}
            <Dialog open={isBulkDialogOpen} onOpenChange={(open) => !open && resetBulkDialog()}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Bulk Generate from Data Vault</DialogTitle>
                        <DialogDescription>
                            Generate certificates for records in the linked spreadsheet
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {/* Steps Indicator */}
                        <div className="flex items-center justify-center mb-8">
                            <div className={`flex items-center gap-2 ${bulkStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${bulkStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>1</div>
                                <span className="font-medium text-sm">Source</span>
                            </div>
                            <div className={`w-12 h-0.5 mx-2 ${bulkStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                            <div className={`flex items-center gap-2 ${bulkStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${bulkStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>2</div>
                                <span className="font-medium text-sm">Mapping</span>
                            </div>
                            <div className={`w-12 h-0.5 mx-2 ${bulkStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                            <div className={`flex items-center gap-2 ${bulkStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${bulkStep >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>3</div>
                                <span className="font-medium text-sm">Processing</span>
                            </div>
                        </div>

                        {/* Step 1: Source */}
                        {bulkStep === 1 && (
                            <div className="space-y-4">
                                <div className="border rounded-lg p-4 bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <FileSpreadsheet className="h-6 w-6 text-green-700" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">{group.sheet?.name || 'Linked Spreadsheet'}</h4>
                                            {group?.sheetId ? (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Ready for generation
                                                </p>
                                            ) : (
                                                <p className="text-sm text-destructive flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> No spreadsheet linked
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Note</AlertTitle>
                                    <AlertDescription>
                                        Make sure your spreadsheet has headers in the first row. We'll use these headers to map data to your template placeholders.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {/* Step 2: Mapping */}
                        {bulkStep === 2 && (
                            <div className="space-y-4">
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {template?.attributes.map((attr) => (
                                        <div key={attr.id} className="grid grid-cols-2 gap-4 items-center p-3 border rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium">{attr.name}</p>
                                                <p className="text-xs text-muted-foreground">{attr.placeholder}</p>
                                                {attr.required && (
                                                    <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded mt-1 inline-block">REQUIRED</span>
                                                )}
                                            </div>
                                            {sheetHeaders.length > 0 ? (
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={columnMapping[attr.id] || '__skip__'}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setColumnMapping(prev => {
                                                            if (val === '__skip__') {
                                                                const { [attr.id]: _, ...rest } = prev;
                                                                return rest;
                                                            }
                                                            return { ...prev, [attr.id]: val };
                                                        });
                                                    }}
                                                >
                                                    <option value="__skip__">-- Skip --</option>
                                                    {sheetHeaders.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="text-sm text-destructive flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> No columns found
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Processing */}
                        {bulkStep === 3 && (
                            <div className="space-y-6 text-center">
                                {bulkStatus === 'processing' && (
                                    <div className="py-8">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                                        <h3 className="text-lg font-medium">Generating Certificates...</h3>
                                        <p className="text-muted-foreground text-sm mt-2">
                                            Processed {bulkResult?.successful + bulkResult?.failed || 0} / {bulkResult?.totalRequested || '...'} records
                                        </p>
                                        <Progress
                                            value={bulkResult?.totalRequested ? ((bulkResult.successful + bulkResult.failed) / bulkResult.totalRequested) * 100 : 0}
                                            className="h-2 w-64 mx-auto mt-4"
                                        />
                                    </div>
                                )}

                                {bulkStatus === 'completed' && (
                                    <div className="py-8">
                                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                            <Award className="h-6 w-6 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-medium">Generation Complete!</h3>
                                        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mt-6">
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                                <p className="text-2xl font-bold text-green-600">{bulkResult?.successful || 0}</p>
                                                <p className="text-xs text-green-600 font-medium uppercase">Successful</p>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                                <p className="text-2xl font-bold text-red-600">{bulkResult?.failed || 0}</p>
                                                <p className="text-xs text-red-600 font-medium uppercase">Failed</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {bulkStatus === 'failed' && (
                                    <div className="py-8 text-destructive">
                                        <AlertCircle className="h-10 w-10 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium">Generation Failed</h3>
                                        <p className="text-sm mt-2">Something went wrong during the process.</p>
                                    </div>
                                )}

                                {bulkResult?.errors && bulkResult.errors.length > 0 && (
                                    <div className="mt-6 text-left border rounded-lg overflow-hidden">
                                        <div className="bg-muted px-4 py-2 border-b text-sm font-medium">Error Log</div>
                                        <ScrollArea className="h-32 p-2">
                                            {bulkResult.errors.map((err: any, idx: number) => (
                                                <div key={idx} className="text-xs text-destructive mb-1 font-mono">
                                                    Row {err.row}: {err.message}
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        {bulkStep === 1 && (
                            <>
                                <Button variant="outline" onClick={resetBulkDialog}>Cancel</Button>
                                <Button
                                    onClick={async () => {
                                        await loadSheetHeaders();
                                        setBulkStep(2);
                                    }}
                                    disabled={!group?.sheetId || loadingHeaders}
                                >
                                    {loadingHeaders ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Next: Map Columns
                                </Button>
                            </>
                        )}

                        {bulkStep === 2 && (
                            <>
                                <Button variant="outline" onClick={() => setBulkStep(1)}>Back</Button>
                                <Button onClick={handleBulkStart}>Start Generating</Button>
                            </>
                        )}

                        {bulkStep === 3 && bulkStatus !== 'processing' && (
                            <Button onClick={resetBulkDialog}>Close</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the certificate and remove the associated file from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                                if (deleteId) {
                                    handleDeleteCertificate(deleteId, e as any);
                                    setDeleteId(null);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

