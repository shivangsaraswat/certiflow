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
import { useSession } from 'next-auth/react';
import { useGroupContext } from './layout';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [group, setGroup] = useState<Group | null>(null);
    const [template, setTemplate] = useState<Template | null>(null);
    const [certificates, setCertificates] = useState<GroupCertificate[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingCerts, setLoadingCerts] = useState(false);

    // Generation dialogs - controlled by layout context
    const { isSingleDialogOpen, setIsSingleDialogOpen, isBulkDialogOpen, setIsBulkDialogOpen, refreshGroup } = useGroupContext();
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Bulk generation state
    const [bulkJobId, setBulkJobId] = useState<string | null>(null);
    const [bulkStatus, setBulkStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
    const [bulkResult, setBulkResult] = useState<any>(null);

    // Delete Confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const loadGroup = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const result = await getGroup(id, userId);
        if (result.success && result.data) {
            setGroup(result.data);
            // Load template details only if template is configured
            if (result.data.templateId) {
                const tplRes = await getTemplate(result.data.templateId, userId);
                if (tplRes.success && tplRes.data) {
                    setTemplate(tplRes.data);
                    // Initialize form data
                    const initial: Record<string, string> = {};
                    tplRes.data.attributes.forEach((attr: DynamicAttribute) => {
                        initial[attr.id] = '';
                    });
                    setFormData(initial);
                }
            } else {
                setTemplate(null);
            }
        }
        setLoading(false);
    }, [id, userId]);

    const loadCertificates = useCallback(async () => {
        if (!userId) return;
        setLoadingCerts(true);
        const result = await getGroupCertificates(id, userId);
        if (result.success && result.data) {
            setCertificates(result.data.certificates);
            setTotal(result.data.total);
        }
        setLoadingCerts(false);
    }, [id, userId]);

    useEffect(() => {
        if (userId) {
            loadGroup();
            loadCertificates();
        }
    }, [loadGroup, loadCertificates, userId]);

    const handleRefresh = useCallback(() => {
        loadGroup();
        loadCertificates();
    }, [loadGroup, loadCertificates]);

    const handleSingleGenerate = async () => {
        if (!template || !group) return;

        setIsGenerating(true);
        const res = await generateSingleInGroup(group.id, {
            data: formData,
            recipientName: formData[template.attributes[0]?.id] || 'Unknown',
            recipientEmail: recipientEmail || undefined,
        }, userId);

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

    const handleDeleteCertificate = async (id: string) => {
        const res = await deleteCertificate(id, userId);
        if (res.success) {
            toast.success('Certificate deleted successfully');
            loadCertificates(); // Refresh list
        } else {
            toast.error(res.error?.message || 'Failed to delete certificate');
        }
    };

    // Bulk Generation Logic

    useEffect(() => {
        if (isBulkDialogOpen) {
            // Reset state when opening
            setBulkStatus('idle');
            setBulkJobId(null);
            setBulkResult(null);
        }
    }, [isBulkDialogOpen]);

    const handleBulkStart = async () => {
        if (!group?.sheetId) return;

        // Use stored column mapping
        const storedMapping = group.columnMapping as Record<string, string>;

        if (!storedMapping || Object.keys(storedMapping).length === 0) {
            toast.error('Please configure Data Vault settings first');
            return;
        }

        // Validate required fields (exclude system attributes like certificateId)
        const missing = template?.attributes
            .filter(a => a.id !== 'certificateId' && a.required && !storedMapping[a.id])
            .map(a => a.name);

        if (missing && missing.length > 0) {
            toast.error(`Missing required mappings: ${missing.join(', ')}`);
            return;
        }

        setBulkStatus('processing');

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const formData = new FormData();
            formData.append('templateId', group.templateId || '');

            // Invert mapping for backend: { sourceCol: attrId }
            // Stored mapping is { attrId: sourceCol }
            const backendMapping: Record<string, string> = {};
            Object.entries(storedMapping).forEach(([attrId, sourceCol]) => {
                if (sourceCol && sourceCol !== '__skip__') {
                    backendMapping[sourceCol] = attrId;
                }
            });

            formData.append('columnMapping', JSON.stringify(backendMapping));
            formData.append('sheetId', group.sheetId);
            formData.append('groupId', group.id);

            const result = await fetch(`${baseUrl}/api/generate/bulk`, {
                method: 'POST',
                headers: { 'x-user-id': userId || '' },
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
                const res = await getBulkJobStatus(bulkJobId, userId);
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

    // If template is not configured, prompt to configure settings
    if (!group.templateId) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Configuration Required</h3>
                        <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                            Before you can generate certificates, you need to configure a template and data source for this group.
                        </p>
                        <Button asChild>
                            <Link href={`/groups/${id}/settings`}>
                                Configure Group
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                        {template?.attributes.filter(attr => attr.id !== 'certificateId').map((attr) => (
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
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="e.g., 24f3001856@ds.study.iitm.ac.in"
                            />
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
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Bulk Generate Certificates</DialogTitle>
                        <DialogDescription>
                            Generate certificates using the connected Data Vault
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {/* Configuration Check */}
                        {bulkStatus === 'idle' && (
                            <div className="space-y-6">
                                {group?.sheetId && group?.columnMapping && Object.keys(group.columnMapping).length > 0 ? (
                                    <>
                                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-green-900">Ready to Generate</h4>
                                                    <p className="text-sm text-green-700">
                                                        Connected to <strong>{group.sheet?.name || 'Spreadsheet'}</strong>
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-green-800 pl-[52px]">
                                                {Object.keys(group.columnMapping).length} columns mapped.
                                                Click start to process all records.
                                            </p>
                                        </div>

                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Note</AlertTitle>
                                            <AlertDescription>
                                                This will generate certificates for all valid rows in the spreadsheet.
                                                Existing certificates for the same recipients may be updated or skipped based on settings.
                                            </AlertDescription>
                                        </Alert>
                                    </>
                                ) : (
                                    <div className="text-center py-6 space-y-4">
                                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-6 max-w-sm mx-auto">
                                            <AlertCircle className="h-10 w-10 text-orange-500 mx-auto mb-3" />
                                            <h4 className="font-medium text-orange-900">Configuration Required</h4>
                                            <p className="text-sm text-orange-700 mt-1">
                                                Please configure the Data Vault and map columns in the Settings tab before running bulk generation.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Processing Status */}
                        {bulkStatus === 'processing' && (
                            <div className="space-y-6 text-center py-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                <div>
                                    <h3 className="text-lg font-medium">Generating Certificates...</h3>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Please wait while we process your request.
                                    </p>
                                </div>
                                <div className="max-w-xs mx-auto space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{bulkResult?.totalRequested ? Math.round(((bulkResult.successful + bulkResult.failed) / bulkResult.totalRequested) * 100) : 0}%</span>
                                    </div>
                                    <Progress
                                        value={bulkResult?.totalRequested ? ((bulkResult.successful + bulkResult.failed) / bulkResult.totalRequested) * 100 : 0}
                                        className="h-2"
                                    />
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Processed {bulkResult?.successful + bulkResult?.failed || 0} / {bulkResult?.totalRequested || '...'} records
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {bulkStatus === 'completed' && (
                            <div className="py-4">
                                <div className="text-center mb-6">
                                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                        <Award className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-medium">Generation Complete!</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                                        <p className="text-3xl font-bold text-green-600 mb-1">{bulkResult?.successful || 0}</p>
                                        <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">Successful</p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                                        <p className="text-3xl font-bold text-red-600 mb-1">{bulkResult?.failed || 0}</p>
                                        <p className="text-xs text-red-700 font-semibold uppercase tracking-wider">Failed</p>
                                    </div>
                                </div>

                                {bulkResult?.errors && bulkResult.errors.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden mt-4">
                                        <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold uppercase text-muted-foreground">
                                            Error Log
                                        </div>
                                        <ScrollArea className="h-32 p-0">
                                            <div className="p-2 space-y-1">
                                                {bulkResult.errors.map((err: any, idx: number) => (
                                                    <div key={idx} className="text-xs text-destructive flex gap-2 font-mono bg-destructive/5 p-1.5 rounded">
                                                        <span className="font-semibold shrink-0">Row {err.row}:</span>
                                                        <span>{err.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        )}

                        {bulkStatus === 'failed' && (
                            <div className="py-6 text-center text-destructive">
                                <div className="bg-red-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground">Generation Failed</h3>
                                <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                                    {bulkResult?.error || 'Something went wrong while starting the process. Please try again.'}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="sm:justify-between">
                        {bulkStatus === 'idle' ? (
                            <>
                                <Button variant="ghost" onClick={resetBulkDialog}>Cancel</Button>
                                {group?.sheetId && group?.columnMapping && Object.keys(group.columnMapping).length > 0 ? (
                                    <Button onClick={handleBulkStart} className="min-w-[140px]">
                                        Start Generating
                                    </Button>
                                ) : (
                                    <Button asChild>
                                        <a href={`/groups/${group?.id}/settings`}>Go to Settings</a>
                                    </Button>
                                )}
                            </>
                        ) : bulkStatus === 'completed' || bulkStatus === 'failed' ? (
                            <Button onClick={resetBulkDialog} className="w-full sm:w-auto sm:ml-auto">
                                Close
                            </Button>
                        ) : (
                            // Processing state - no buttons or disabled cancel?
                            <div />
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
                            onClick={() => {
                                if (deleteId) {
                                    handleDeleteCertificate(deleteId);
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

