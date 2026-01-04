'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, FileText, Database, Mail, ChevronRight, AlertCircle, Server, Columns, Eye, Code, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getGroup, getTemplates, updateGroupTemplate, updateGroupDataConfig, updateGroupEmailTemplate } from '@/lib/api';
import type { Group, Template, DynamicAttribute } from '@/types';
import { toast } from 'sonner';

interface Spreadsheet {
    id: string;
    name: string;
    updatedAt: string;
}

export default function GroupSettingsPage() {
    const params = useParams();
    const groupId = params.id as string;
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [group, setGroup] = useState<Group | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
    const [loading, setLoading] = useState(true);

    // Selected template for column mapping
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    // Template selection dialog
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    // Data vault selection dialog
    const [isDataDialogOpen, setIsDataDialogOpen] = useState(false);
    const [selectedSheetId, setSelectedSheetId] = useState<string>('');
    const [isSavingData, setIsSavingData] = useState(false);

    // Column mapping
    const [isColumnMappingOpen, setIsColumnMappingOpen] = useState(false);
    const [sheetColumns, setSheetColumns] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [loadingColumns, setLoadingColumns] = useState(false);
    const [isSavingMapping, setIsSavingMapping] = useState(false);

    // SMTP Configuration dialog
    const [isSmtpDialogOpen, setIsSmtpDialogOpen] = useState(false);
    const [smtpConfig, setSmtpConfig] = useState({
        smtpHost: '',
        smtpPort: '587',
        smtpEmail: '',
        smtpPassword: '',
        encryptionType: 'TLS',
        senderName: '',
        replyTo: '',
    });
    const [isSavingSmtp, setIsSavingSmtp] = useState(false);
    const [isTestingSmtp, setIsTestingSmtp] = useState(false);

    // Email Template dialog
    const [isEmailTemplateOpen, setIsEmailTemplateOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailTemplateHtml, setEmailTemplateHtml] = useState('');
    const [emailPreviewMode, setEmailPreviewMode] = useState<'edit' | 'preview'>('edit');
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const loadData = useCallback(async () => {
        if (!userId || !groupId) return;
        setLoading(true);

        const [groupRes, templatesRes, sheetsRes] = await Promise.all([
            getGroup(groupId, userId),
            getTemplates(userId),
            fetch(`${baseUrl}/api/spreadsheets`, {
                headers: { 'x-user-id': userId }
            }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ]);

        if (groupRes.success && groupRes.data) {
            setGroup(groupRes.data);
            setSelectedTemplateId(groupRes.data.templateId || '');
            setSelectedSheetId(groupRes.data.sheetId || '');
            setColumnMapping(groupRes.data.columnMapping || {});
            setEmailSubject(groupRes.data.emailSubject || '');
            setEmailTemplateHtml(groupRes.data.emailTemplateHtml || getDefaultEmailTemplate());

            // Load SMTP config if exists
            if (groupRes.data.smtpConfig) {
                setSmtpConfig({
                    smtpHost: groupRes.data.smtpConfig.smtpHost || '',
                    smtpPort: groupRes.data.smtpConfig.smtpPort?.toString() || '587',
                    smtpEmail: groupRes.data.smtpConfig.smtpEmail || '',
                    smtpPassword: '', // Never show password
                    encryptionType: groupRes.data.smtpConfig.encryptionType || 'TLS',
                    senderName: groupRes.data.smtpConfig.senderName || '',
                    replyTo: groupRes.data.smtpConfig.replyTo || '',
                });
            }
        }
        if (templatesRes.success && templatesRes.data) {
            setTemplates(templatesRes.data);
            // Find selected template for column mapping
            if (groupRes.data?.templateId) {
                const groupData = groupRes.data;
                const tpl = templatesRes.data.find((t: Template) => t.id === groupData.templateId);
                setSelectedTemplate(tpl || null);
            }
        }
        if (sheetsRes.success && sheetsRes.data) {
            setSpreadsheets(sheetsRes.data);
        }

        setLoading(false);
    }, [userId, groupId, baseUrl]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Load spreadsheet columns when opening column mapping
    const loadSpreadsheetColumns = useCallback(async () => {
        if (!group?.sheetId || !userId) return;
        setLoadingColumns(true);
        try {
            const res = await fetch(`${baseUrl}/api/spreadsheets/${group.sheetId}`, {
                headers: { 'x-user-id': userId }
            });
            const data = await res.json();

            if (data.success && data.data?.content) {
                const sheet = data.data.content[0]; // Get first sheet
                const headers: string[] = [];

                if (sheet) {
                    // Extract headers logic - same as bulk generation
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
                setSheetColumns(cleanHeaders);

                // Auto-map existing column mapping if the group has one
                if (group.columnMapping) {
                    setColumnMapping(group.columnMapping as Record<string, string>);
                } else if (selectedTemplate && cleanHeaders.length > 0) {
                    // Auto-mapping logic
                    const initialMapping: Record<string, string> = {};
                    selectedTemplate.attributes.forEach(attr => {
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
                    setColumnMapping(initialMapping);
                }
            }
        } catch (error) {
            console.error('Failed to load spreadsheet columns:', error);
            toast.error('Failed to load spreadsheet columns');
        }
        setLoadingColumns(false);
    }, [group?.sheetId, group?.columnMapping, userId, baseUrl, selectedTemplate]);

    const handleSaveTemplate = async () => {
        if (!selectedTemplateId) return;
        setIsSavingTemplate(true);
        const result = await updateGroupTemplate(groupId, selectedTemplateId, userId);
        if (result.success) {
            toast.success('Template updated');
            await loadData();
            setIsTemplateDialogOpen(false);
        } else {
            toast.error('Failed to update template');
        }
        setIsSavingTemplate(false);
    };

    const handleSaveDataConfig = async () => {
        if (!selectedSheetId) return;
        setIsSavingData(true);
        const result = await updateGroupDataConfig(groupId, {
            sheetId: selectedSheetId,
            selectedSheetTab: null,
            columnMapping: null,
        }, userId);
        if (result.success) {
            toast.success('Data vault connected');
            await loadData();
            setIsDataDialogOpen(false);
        } else {
            toast.error('Failed to connect data vault');
        }
        setIsSavingData(false);
    };

    const handleSaveColumnMapping = async () => {
        if (!group?.sheetId) return;
        setIsSavingMapping(true);
        const result = await updateGroupDataConfig(groupId, {
            sheetId: group.sheetId,
            selectedSheetTab: null,
            columnMapping: columnMapping,
        }, userId);
        if (result.success) {
            toast.success('Column mapping saved');
            await loadData();
            setIsColumnMappingOpen(false);
        } else {
            toast.error('Failed to save column mapping');
        }
        setIsSavingMapping(false);
    };

    const handleSaveSmtpConfig = async () => {
        setIsSavingSmtp(true);
        try {
            const res = await fetch(`${baseUrl}/api/groups/${groupId}/settings/smtp`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId || '',
                },
                body: JSON.stringify({
                    smtpHost: smtpConfig.smtpHost,
                    smtpPort: parseInt(smtpConfig.smtpPort),
                    smtpEmail: smtpConfig.smtpEmail,
                    smtpPassword: smtpConfig.smtpPassword,
                    encryptionType: smtpConfig.encryptionType,
                    senderName: smtpConfig.senderName,
                    replyTo: smtpConfig.replyTo,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('SMTP configuration saved');
                await loadData();
                setIsSmtpDialogOpen(false);
            } else {
                toast.error(data.error || 'Failed to save SMTP configuration');
            }
        } catch (error) {
            toast.error('Failed to save SMTP configuration');
        }
        setIsSavingSmtp(false);
    };

    const handleTestSmtp = async () => {
        setIsTestingSmtp(true);
        try {
            const res = await fetch(`${baseUrl}/api/groups/${groupId}/settings/smtp/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId || '',
                },
                body: JSON.stringify({
                    smtpHost: smtpConfig.smtpHost,
                    smtpPort: parseInt(smtpConfig.smtpPort),
                    smtpEmail: smtpConfig.smtpEmail,
                    smtpPassword: smtpConfig.smtpPassword,
                    encryptionType: smtpConfig.encryptionType,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('SMTP connection successful!');
            } else {
                toast.error(data.error || 'SMTP connection failed');
            }
        } catch (error) {
            toast.error('Failed to test SMTP connection');
        }
        setIsTestingSmtp(false);
    };

    const handleSaveEmailTemplate = async () => {
        setIsSavingEmail(true);
        const result = await updateGroupEmailTemplate(groupId, {
            emailSubject,
            emailTemplateHtml,
        }, userId);
        if (result.success) {
            toast.success('Email template saved');
            await loadData();
            setIsEmailTemplateOpen(false);
        } else {
            toast.error('Failed to save email template');
        }
        setIsSavingEmail(false);
    };

    const getDefaultEmailTemplate = () => `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .content { padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Certificate</h1>
        </div>
        <div class="content">
            <p>Dear {Name},</p>
            <p>Please find attached your certificate.</p>
            <p>Certificate ID: {CertificateID}</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply.</p>
        </div>
    </div>
</body>
</html>`;

    const insertVariable = (variable: string) => {
        setEmailTemplateHtml(prev => prev + `{${variable}}`);
    };

    const isConfigured = group?.templateId && group?.sheetId;
    const hasSmtpConfig = group?.smtpConfig?.isConfigured;
    const hasEmailTemplate = !!group?.emailTemplateHtml;
    const hasColumnMapping = group?.columnMapping && Object.keys(group.columnMapping).length > 0;

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
                    <a href="/groups">Back to Groups</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Group Settings</h2>
                <p className="text-muted-foreground">
                    Configure your certificate template, data source, and email settings.
                </p>
            </div>

            {!isConfigured && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Complete the configuration below to start generating certificates.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4">
                {/* Template Configuration */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${group.templateId ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                    {group.templateId ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                                <div>
                                    <CardTitle className="text-base">Certificate Template</CardTitle>
                                    <CardDescription>
                                        {group.template
                                            ? `Using: ${group.template.name} (${group.template.code})`
                                            : 'Select a template for your certificates'
                                        }
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                variant={group.templateId ? "outline" : "default"}
                                size="sm"
                                onClick={() => setIsTemplateDialogOpen(true)}
                            >
                                {group.templateId ? 'Change' : 'Configure'}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Data Vault Configuration */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${group.sheetId ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                    {group.sheetId ? <Check className="h-5 w-5" /> : <Database className="h-5 w-5" />}
                                </div>
                                <div>
                                    <CardTitle className="text-base">Data Vault</CardTitle>
                                    <CardDescription>
                                        {group.sheet
                                            ? `Connected: ${group.sheet.name}`
                                            : 'Connect a spreadsheet for bulk generation'
                                        }
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {group.sheetId && selectedTemplate && (
                                    <Button
                                        variant={hasColumnMapping ? "outline" : "secondary"}
                                        size="sm"
                                        onClick={() => {
                                            loadSpreadsheetColumns();
                                            setIsColumnMappingOpen(true);
                                        }}
                                    >
                                        <Columns className="mr-1 h-4 w-4" />
                                        {hasColumnMapping ? 'Edit Mapping' : 'Map Columns'}
                                    </Button>
                                )}
                                <Button
                                    variant={group.sheetId ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => setIsDataDialogOpen(true)}
                                >
                                    {group.sheetId ? 'Change' : 'Configure'}
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* SMTP Configuration */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${hasSmtpConfig ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                    {hasSmtpConfig ? <Check className="h-5 w-5" /> : <Server className="h-5 w-5" />}
                                </div>
                                <div>
                                    <CardTitle className="text-base">SMTP Configuration</CardTitle>
                                    <CardDescription>
                                        {hasSmtpConfig
                                            ? `Connected: ${group.smtpConfig?.smtpEmail}`
                                            : 'Configure email server for sending certificates'
                                        }
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                variant={hasSmtpConfig ? "outline" : "default"}
                                size="sm"
                                onClick={() => setIsSmtpDialogOpen(true)}
                            >
                                {hasSmtpConfig ? 'Edit' : 'Configure'}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Email Template */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${hasEmailTemplate ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                    {hasEmailTemplate ? <Check className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                                </div>
                                <div>
                                    <CardTitle className="text-base">Email Template</CardTitle>
                                    <CardDescription>
                                        {hasEmailTemplate
                                            ? `Subject: ${group.emailSubject || 'Your Certificate'}`
                                            : 'Create the email template for certificate delivery'
                                        }
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                variant={hasEmailTemplate ? "outline" : "default"}
                                size="sm"
                                onClick={() => setIsEmailTemplateOpen(true)}
                            >
                                {hasEmailTemplate ? 'Edit' : 'Configure'}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Template Selection Dialog */}
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Select Template</DialogTitle>
                        <DialogDescription>
                            Choose a certificate template for this group.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 max-h-[400px] overflow-y-auto">
                        {templates.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-4">No templates available</p>
                                <Button asChild>
                                    <a href="/templates/new">Create Template</a>
                                </Button>
                            </div>
                        ) : (
                            <RadioGroup value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                <div className="space-y-2">
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplateId === template.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                            onClick={() => setSelectedTemplateId(template.id)}
                                        >
                                            <RadioGroupItem value={template.id} id={template.id} />
                                            <Label htmlFor={template.id} className="flex-1 cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{template.name}</span>
                                                    <Badge variant="secondary" className="text-xs">{template.code}</Badge>
                                                </div>
                                                {template.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                                                )}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveTemplate}
                            disabled={!selectedTemplateId || isSavingTemplate}
                        >
                            {isSavingTemplate ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Data Vault Selection Dialog */}
            <Dialog open={isDataDialogOpen} onOpenChange={setIsDataDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Select Data Vault</DialogTitle>
                        <DialogDescription>
                            Choose a spreadsheet to use as the data source for bulk generation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 max-h-[400px] overflow-y-auto">
                        {spreadsheets.length === 0 ? (
                            <div className="text-center py-8">
                                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-4">No spreadsheets available</p>
                                <Button asChild>
                                    <a href="/data-vault">Create Spreadsheet</a>
                                </Button>
                            </div>
                        ) : (
                            <RadioGroup value={selectedSheetId} onValueChange={setSelectedSheetId}>
                                <div className="space-y-2">
                                    {spreadsheets.map((sheet) => (
                                        <div
                                            key={sheet.id}
                                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedSheetId === sheet.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                            onClick={() => setSelectedSheetId(sheet.id)}
                                        >
                                            <RadioGroupItem value={sheet.id} id={sheet.id} />
                                            <Label htmlFor={sheet.id} className="flex-1 cursor-pointer">
                                                <span className="font-medium">{sheet.name}</span>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Last updated: {new Date(sheet.updatedAt).toLocaleDateString()}
                                                </p>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDataDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveDataConfig}
                            disabled={!selectedSheetId || isSavingData}
                        >
                            {isSavingData ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Column Mapping Dialog */}
            <Dialog open={isColumnMappingOpen} onOpenChange={setIsColumnMappingOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Column Mapping</DialogTitle>
                        <DialogDescription>
                            Map your spreadsheet columns to certificate template fields.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {loadingColumns ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                        ) : sheetColumns.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No columns found in spreadsheet. Make sure the first row contains headers.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    For each template field, select the corresponding spreadsheet column.
                                </p>
                                <div className="grid gap-3">
                                    {selectedTemplate?.attributes.filter(attr => attr.id !== 'certificateId').map((attr) => (
                                        <div key={attr.id} className="flex items-center gap-4">
                                            <div className="w-1/3">
                                                <Label className="font-medium">
                                                    {attr.name}
                                                    {attr.required && <span className="text-destructive ml-1">*</span>}
                                                </Label>
                                            </div>
                                            <div className="w-2/3">
                                                <Select
                                                    value={columnMapping[attr.id] || '__skip__'}
                                                    onValueChange={(value) => {
                                                        setColumnMapping(prev => {
                                                            const newMapping = { ...prev };
                                                            if (value === '__skip__') {
                                                                delete newMapping[attr.id];
                                                            } else {
                                                                newMapping[attr.id] = value;
                                                            }
                                                            return newMapping;
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select column..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__skip__">-- Not Mapped --</SelectItem>
                                                        {sheetColumns.map((col) => (
                                                            <SelectItem key={col} value={col}>
                                                                {col}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Email column mapping */}
                                    <div className="flex items-center gap-4 pt-2 border-t">
                                        <div className="w-1/3">
                                            <Label className="font-medium">
                                                Email Address
                                                <span className="text-muted-foreground text-xs ml-1">(for sending)</span>
                                            </Label>
                                        </div>
                                        <div className="w-2/3">
                                            <Select
                                                value={columnMapping['email'] || '__skip__'}
                                                onValueChange={(value) => {
                                                    setColumnMapping(prev => {
                                                        const newMapping = { ...prev };
                                                        if (value === '__skip__') {
                                                            delete newMapping['email'];
                                                        } else {
                                                            newMapping['email'] = value;
                                                        }
                                                        return newMapping;
                                                    });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select column..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__skip__">-- Not Mapped --</SelectItem>
                                                    {sheetColumns.map((col) => (
                                                        <SelectItem key={col} value={col}>
                                                            {col}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsColumnMappingOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveColumnMapping}
                            disabled={isSavingMapping}
                        >
                            {isSavingMapping ? 'Saving...' : 'Save Mapping'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SMTP Configuration Dialog */}
            <Dialog open={isSmtpDialogOpen} onOpenChange={setIsSmtpDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>SMTP Configuration</DialogTitle>
                        <DialogDescription>
                            Configure your email server settings for sending certificates.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtpHost">SMTP Host *</Label>
                                <Input
                                    id="smtpHost"
                                    placeholder="smtp.gmail.com"
                                    value={smtpConfig.smtpHost}
                                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtpPort">Port *</Label>
                                <Input
                                    id="smtpPort"
                                    placeholder="587"
                                    value={smtpConfig.smtpPort}
                                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="smtpEmail">Email Address *</Label>
                            <Input
                                id="smtpEmail"
                                type="email"
                                placeholder="sender@example.com"
                                value={smtpConfig.smtpEmail}
                                onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpEmail: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="smtpPassword">App Password *</Label>
                            <Input
                                id="smtpPassword"
                                type="password"
                                placeholder="••••••••••••••••"
                                value={smtpConfig.smtpPassword}
                                onChange={(e) => setSmtpConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                For Gmail, use an App Password instead of your account password.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Encryption</Label>
                            <Select
                                value={smtpConfig.encryptionType}
                                onValueChange={(value) => setSmtpConfig(prev => ({ ...prev, encryptionType: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select encryption..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TLS">TLS (Recommended)</SelectItem>
                                    <SelectItem value="SSL">SSL</SelectItem>
                                    <SelectItem value="NONE">None</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="senderName">Sender Display Name</Label>
                            <Input
                                id="senderName"
                                placeholder="Certificate System"
                                value={smtpConfig.senderName}
                                onChange={(e) => setSmtpConfig(prev => ({ ...prev, senderName: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="replyTo">Reply-To Email (optional)</Label>
                            <Input
                                id="replyTo"
                                type="email"
                                placeholder="reply@example.com"
                                value={smtpConfig.replyTo}
                                onChange={(e) => setSmtpConfig(prev => ({ ...prev, replyTo: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={handleTestSmtp}
                            disabled={isTestingSmtp || !smtpConfig.smtpHost || !smtpConfig.smtpEmail || !smtpConfig.smtpPassword}
                        >
                            {isTestingSmtp ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                'Test Connection'
                            )}
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsSmtpDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveSmtpConfig}
                                disabled={isSavingSmtp || !smtpConfig.smtpHost || !smtpConfig.smtpEmail}
                            >
                                {isSavingSmtp ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Template Dialog */}
            <Dialog open={isEmailTemplateOpen} onOpenChange={setIsEmailTemplateOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Email Template</DialogTitle>
                        <DialogDescription>
                            Create the email that will be sent with the certificate attachment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="emailSubject">Subject Line</Label>
                            <Input
                                id="emailSubject"
                                placeholder="Your Certificate - {Name}"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">Insert variable:</span>
                            <Button variant="outline" size="sm" onClick={() => insertVariable('Name')}>
                                {'{Name}'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => insertVariable('Email')}>
                                {'{Email}'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => insertVariable('CertificateID')}>
                                {'{CertificateID}'}
                            </Button>
                            {selectedTemplate?.attributes.filter(a => a.id !== 'certificateId').map(attr => (
                                <Button key={attr.id} variant="outline" size="sm" onClick={() => insertVariable(attr.name)}>
                                    {`{${attr.name}}`}
                                </Button>
                            ))}
                        </div>

                        <Tabs value={emailPreviewMode} onValueChange={(v) => setEmailPreviewMode(v as 'edit' | 'preview')}>
                            <TabsList>
                                <TabsTrigger value="edit">
                                    <Code className="mr-2 h-4 w-4" />
                                    Edit HTML
                                </TabsTrigger>
                                <TabsTrigger value="preview">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="edit" className="mt-4">
                                <Textarea
                                    className="font-mono text-sm min-h-[300px]"
                                    value={emailTemplateHtml}
                                    onChange={(e) => setEmailTemplateHtml(e.target.value)}
                                    placeholder="Enter your HTML email template..."
                                />
                            </TabsContent>
                            <TabsContent value="preview" className="mt-4">
                                <div className="border rounded-lg p-4 min-h-[300px] bg-white">
                                    <iframe
                                        srcDoc={emailTemplateHtml}
                                        className="w-full min-h-[280px] border-0"
                                        title="Email Preview"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailTemplateOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEmailTemplate}
                            disabled={isSavingEmail}
                        >
                            {isSavingEmail ? 'Saving...' : 'Save Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
