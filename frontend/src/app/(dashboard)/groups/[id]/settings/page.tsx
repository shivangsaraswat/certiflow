'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Check,
    FileText,
    Database,
    Mail,
    Server,
    Settings,
    Save,
    RefreshCw,
    Columns,
    Eye,
    EyeOff,
    Code,
    LayoutTemplate
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Separator } from '@/components/ui/separator';
import { getGroup, getTemplates, updateGroupTemplate, updateGroupDataConfig, updateGroupEmailTemplate, updateGroup } from '@/lib/api';
import type { Group, Template, DynamicAttribute } from '@/types';
import { toast } from 'sonner';
import { useSidebar } from '@/components/providers/sidebar-provider';
import { cn } from '@/lib/utils';

interface Spreadsheet {
    id: string;
    name: string;
    updatedAt: string;
}

type SettingsSection = 'general' | 'template' | 'datavault' | 'smtp' | 'email';

export default function GroupSettingsPage() {
    const params = useParams();
    const groupId = params.id as string;
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { collapseSidebar } = useSidebar();

    // Auto-collapse sidebar on mount
    useEffect(() => {
        collapseSidebar();
    }, [collapseSidebar]);

    const [activeSection, setActiveSection] = useState<SettingsSection>('general');
    const [group, setGroup] = useState<Group | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
    const [loading, setLoading] = useState(true);

    // General state
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [isSavingGeneral, setIsSavingGeneral] = useState(false);

    // Selected template state
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    // Dataset state
    const [selectedSheetId, setSelectedSheetId] = useState<string>('');
    const [isSavingData, setIsSavingData] = useState(false);
    const [sheetColumns, setSheetColumns] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [loadingColumns, setLoadingColumns] = useState(false);
    const [isSavingMapping, setIsSavingMapping] = useState(false);

    // SMTP state
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
    const [showPassword, setShowPassword] = useState(false);

    // Email Template state
    const [emailSubject, setEmailSubject] = useState('');
    const [emailTemplateHtml, setEmailTemplateHtml] = useState('');
    const [emailPreviewMode, setEmailPreviewMode] = useState<'edit' | 'preview'>('edit');
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

    const loadData = useCallback(async () => {
        if (!userId || !groupId) return;
        setLoading(true);

        try {
            const [groupRes, templatesRes, sheetsRes] = await Promise.all([
                getGroup(groupId, userId),
                getTemplates(userId),
                fetch(`${baseUrl}/api/spreadsheets`, {
                    headers: { 'x-user-id': userId }
                }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
            ]);

            if (groupRes.success && groupRes.data) {
                const gData = groupRes.data;
                setGroup(gData);
                setGroupName(gData.name || '');
                setGroupDescription(gData.description || '');
                setSelectedTemplateId(gData.templateId || '');
                setSelectedSheetId(gData.sheetId || '');
                setColumnMapping(gData.columnMapping || {});
                setEmailSubject(gData.emailSubject || '');
                setEmailTemplateHtml(gData.emailTemplateHtml || getDefaultEmailTemplate());

                if (gData.smtpConfig) {
                    setSmtpConfig({
                        smtpHost: gData.smtpConfig.smtpHost || '',
                        smtpPort: gData.smtpConfig.smtpPort?.toString() || '587',
                        smtpEmail: gData.smtpConfig.smtpEmail || '',
                        smtpPassword: gData.smtpConfig.smtpPassword || '',
                        encryptionType: gData.smtpConfig.encryptionType || 'TLS',
                        senderName: gData.smtpConfig.senderName || '',
                        replyTo: gData.smtpConfig.replyTo || '',
                    });
                }
            }

            if (templatesRes.success && templatesRes.data) {
                setTemplates(templatesRes.data);
                if (groupRes.success && groupRes.data?.templateId) {
                    const tData = groupRes.data;
                    const tpl = templatesRes.data.find((t: Template) => t.id === tData.templateId);
                    setSelectedTemplate(tpl || null);
                }
            }

            if (sheetsRes.success && sheetsRes.data) {
                setSpreadsheets(sheetsRes.data);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load settings");
        }
        setLoading(false);
    }, [userId, groupId, baseUrl]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadSpreadsheetColumns = useCallback(async () => {
        if (!selectedSheetId || !userId) return;
        setLoadingColumns(true);
        try {
            const res = await fetch(`${baseUrl}/api/spreadsheets/${selectedSheetId}`, { // Use selectedSheetId
                headers: { 'x-user-id': userId }
            });
            const data = await res.json();

            if (data.success && data.data?.content) {
                const sheet = data.data.content[0];
                const headers: string[] = [];

                if (sheet) {
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

                // Auto-map if columnMapping is empty or we just switched sheets (might want to reset mapping if switching sheets? keeping existing logic for now)
                if (group?.sheetId === selectedSheetId && group.columnMapping) {
                    // Using stored mapping
                    // setColumnMapping(group.columnMapping as Record<string, string>); // Already set in loadData
                } else if (selectedTemplate && cleanHeaders.length > 0 && Object.keys(columnMapping).length === 0) {
                    // Auto mapping
                    const initialMapping: Record<string, string> = {};
                    selectedTemplate.attributes.forEach(attr => {
                        if (attr.name.toLowerCase().includes('email')) {
                            const emailHeader = cleanHeaders.find(h => h.toLowerCase().includes('email') || h.toLowerCase() === 'mail');
                            if (emailHeader) initialMapping[attr.id] = emailHeader;
                        } else {
                            const matchingHeader = cleanHeaders.find(h => h.toLowerCase().includes(attr.name.toLowerCase()));
                            if (matchingHeader) initialMapping[attr.id] = matchingHeader;
                        }
                    });
                    // Email for sending
                    const emailHeader = cleanHeaders.find(h => h.toLowerCase().includes('email') || h.toLowerCase() === 'mail');
                    if (emailHeader) initialMapping['email'] = emailHeader;

                    setColumnMapping(initialMapping);
                }
            }
        } catch (error) {
            console.error('Failed to load columns:', error);
            // toast.error('Failed to load columns');
        }
        setLoadingColumns(false);
    }, [selectedSheetId, userId, baseUrl, selectedTemplate, group, columnMapping]);

    // Triggers column load when DataVault section is active and we have a selected sheet
    useEffect(() => {
        if (activeSection === 'datavault' && selectedSheetId) {
            loadSpreadsheetColumns();
        }
    }, [activeSection, selectedSheetId, loadSpreadsheetColumns]);

    // Also update selected template object when ID changes
    useEffect(() => {
        const tpl = templates.find(t => t.id === selectedTemplateId);
        setSelectedTemplate(tpl || null);
    }, [selectedTemplateId, templates]);

    const handleSaveGeneral = async () => {
        if (!groupName) return;
        setIsSavingGeneral(true);
        const result = await updateGroup(groupId, {
            name: groupName,
            description: groupDescription
        }, userId);
        if (result.success) {
            toast.success('General settings updated');
            await loadData();
        } else {
            toast.error('Failed to update general settings');
        }
        setIsSavingGeneral(false);
    };

    const handleSaveTemplate = async () => {
        if (!selectedTemplateId) return;
        setIsSavingTemplate(true);
        const result = await updateGroupTemplate(groupId, selectedTemplateId, userId);
        if (result.success) {
            toast.success('Template updated');
            await loadData();
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
            columnMapping: columnMapping,
        }, userId);
        if (result.success) {
            toast.success('Dataset configuration saved');
            await loadData();
        } else {
            toast.error('Failed to save data configuration');
        }
        setIsSavingData(false);
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
        } else {
            toast.error('Failed to save email template');
        }
        setIsSavingEmail(false);
    };

    const copyVariable = (variable: string) => {
        const text = `{${variable}}`;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${text} to clipboard`);
    };

    const navItems = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'template', label: 'Certificate Template', icon: FileText },
        { id: 'datavault', label: 'Dataset', icon: Database },
        { id: 'smtp', label: 'SMTP Configuration', icon: Server },
        { id: 'email', label: 'Email Template', icon: Mail },
    ];

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.20))] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!group) return <div>Group not found</div>;

    return (
        <div className="flex h-[calc(100vh-theme(spacing.20))] -mx-6 -my-4 bg-background">
            {/* Internal Sidebar */}
            <aside className="w-64 border-r bg-muted/10 p-4">
                <div className="mb-6 px-2">
                    <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
                </div>
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as SettingsSection)}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                activeSection === item.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="mx-auto max-w-4xl space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {navItems.find(i => i.id === activeSection)?.label}
                        </h1>
                        <p className="text-muted-foreground">
                            {activeSection === 'general' && "Manage general group settings."}
                            {activeSection === 'template' && "Select the certificate design for this group."}
                            {activeSection === 'datavault' && "Connect data source and map columns."}
                            {activeSection === 'smtp' && "Configure outgoing email server."}
                            {activeSection === 'email' && "Design the email body sent to recipients."}
                        </p>
                    </div>
                    <Separator />

                    {/* GENERAL SECTION */}
                    {activeSection === 'general' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Group Details</CardTitle>
                                    <CardDescription>Update your group's name and description.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="groupName">Group Name</Label>
                                        <Input
                                            id="groupName"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            placeholder="Enter group name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="groupDescription">Description</Label>
                                        <Textarea
                                            id="groupDescription"
                                            value={groupDescription}
                                            onChange={(e) => setGroupDescription(e.target.value)}
                                            placeholder="Enter group description"
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Created At</Label>
                                        <Input
                                            value={group.createdAt ? new Date(group.createdAt).toLocaleDateString() : ''}
                                            disabled
                                            className="bg-muted text-muted-foreground"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveGeneral} disabled={!groupName || isSavingGeneral}>
                                    {isSavingGeneral && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* TEMPLATE SECTION */}
                    {activeSection === 'template' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Select Template</CardTitle>
                                    <CardDescription>Choose from your available certificate templates.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {templates.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">No templates available. Create one first.</p>
                                        </div>
                                    ) : (
                                        <RadioGroup value={selectedTemplateId} onValueChange={setSelectedTemplateId} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {templates.map((tpl) => (
                                                <div key={tpl.id} className={cn(
                                                    "flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-all hover:border-primary/50",
                                                    selectedTemplateId === tpl.id ? "border-primary bg-primary/5 shadow-sm" : ""
                                                )}
                                                    onClick={() => setSelectedTemplateId(tpl.id)}
                                                >
                                                    <RadioGroupItem value={tpl.id} id={tpl.id} className="mt-1" />
                                                    <div className="space-y-1">
                                                        <Label htmlFor={tpl.id} className="font-medium cursor-pointer">{tpl.name}</Label>
                                                        <p className="text-xs text-muted-foreground">{tpl.code}</p>
                                                        {tpl.description && <p className="text-xs text-muted-foreground pt-1">{tpl.description}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}
                                </CardContent>
                            </Card>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveTemplate} disabled={!selectedTemplateId || isSavingTemplate}>
                                    {isSavingTemplate && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* DATA VAULT SECTION */}
                    {activeSection === 'datavault' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Data Source</CardTitle>
                                    <CardDescription>Select the spreadsheet containing your recipient data.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {spreadsheets.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">No spreadsheets found.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Label>Select Spreadsheet</Label>
                                            <Select value={selectedSheetId} onValueChange={setSelectedSheetId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a spreadsheet" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {spreadsheets.map(sheet => (
                                                        <SelectItem key={sheet.id} value={sheet.id}>{sheet.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedSheetId && (
                                                <p className="text-sm text-muted-foreground">
                                                    Selected: {spreadsheets.find(s => s.id === selectedSheetId)?.name}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {selectedSheetId && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Column Mapping</CardTitle>
                                        <CardDescription>Map spreadsheet columns to template placeholders.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingColumns ? (
                                            <div className="flex justify-center py-4"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                        ) : sheetColumns.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No columns detected. Ensure the first row has headers.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {!selectedTemplate ? (
                                                    <Alert>
                                                        <AlertDescription>Please select a template in the Template tab first.</AlertDescription>
                                                    </Alert>
                                                ) : (
                                                    <div className="grid gap-4">
                                                        {selectedTemplate.attributes.filter(attr => attr.id !== 'certificateId').map((attr) => (
                                                            <div key={attr.id} className="grid grid-cols-3 items-center gap-4">
                                                                <Label className="col-span-1">
                                                                    {attr.name} {attr.required && <span className="text-destructive">*</span>}
                                                                </Label>
                                                                <div className="col-span-2">
                                                                    <Select value={columnMapping[attr.id] || '__skip__'}
                                                                        onValueChange={(val) => setColumnMapping(prev => {
                                                                            const n = { ...prev };
                                                                            if (val === '__skip__') delete n[attr.id]; else n[attr.id] = val;
                                                                            return n;
                                                                        })}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select column" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="__skip__">-- Not Mapped --</SelectItem>
                                                                            {sheetColumns.map(col => <SelectItem key={col} value={col}>{col}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Separator className="my-2" />
                                                        <div className="grid grid-cols-3 items-center gap-4">
                                                            <Label className="col-span-1">Email Address <span className="text-xs text-muted-foreground">(for sending)</span></Label>
                                                            <div className="col-span-2">
                                                                <Select value={columnMapping['email'] || '__skip__'}
                                                                    onValueChange={(val) => setColumnMapping(prev => {
                                                                        const n = { ...prev };
                                                                        if (val === '__skip__') delete n['email']; else n['email'] = val;
                                                                        return n;
                                                                    })}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select column" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="__skip__">-- Not Mapped --</SelectItem>
                                                                        {sheetColumns.map(col => <SelectItem key={col} value={col}>{col}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex justify-end">
                                <Button onClick={handleSaveDataConfig} disabled={!selectedSheetId || isSavingData}>
                                    {isSavingData && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Configuration
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SMTP SECTION */}
                    {activeSection === 'smtp' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>SMTP Settings</CardTitle>
                                    <CardDescription>Configure your custom email sending server.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label>SMTP Host</Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                                                    onClick={() => setSmtpConfig(p => ({
                                                        ...p,
                                                        smtpHost: 'smtp.gmail.com',
                                                        smtpPort: '587',
                                                        encryptionType: 'TLS'
                                                    }))}
                                                >
                                                    Use Gmail Defaults
                                                </Button>
                                            </div>
                                            <Input value={smtpConfig.smtpHost} onChange={e => setSmtpConfig(p => ({ ...p, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Port</Label>
                                            <Input value={smtpConfig.smtpPort} onChange={e => setSmtpConfig(p => ({ ...p, smtpPort: e.target.value }))} placeholder="587" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input value={smtpConfig.smtpEmail} onChange={e => setSmtpConfig(p => ({ ...p, smtpEmail: e.target.value }))} type="email" placeholder="sender@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>App Password</Label>
                                        <div className="relative">
                                            <Input
                                                value={smtpConfig.smtpPassword}
                                                onChange={e => setSmtpConfig(p => ({ ...p, smtpPassword: e.target.value }))}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="sr-only">
                                                    {showPassword ? "Hide password" : "Show password"}
                                                </span>
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Use an App Password if using Gmail/Outlook.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Encryption</Label>
                                        <Select value={smtpConfig.encryptionType} onValueChange={v => setSmtpConfig(p => ({ ...p, encryptionType: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TLS">TLS</SelectItem>
                                                <SelectItem value="SSL">SSL</SelectItem>
                                                <SelectItem value="NONE">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sender Name (Optional)</Label>
                                        <Input value={smtpConfig.senderName} onChange={e => setSmtpConfig(p => ({ ...p, senderName: e.target.value }))} placeholder="Certificate System" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reply-To (Optional)</Label>
                                        <Input value={smtpConfig.replyTo} onChange={e => setSmtpConfig(p => ({ ...p, replyTo: e.target.value }))} placeholder="reply@example.com" />
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-between items-center">
                                <Button variant="outline" onClick={handleTestSmtp} disabled={isTestingSmtp || !smtpConfig.smtpHost}>
                                    {isTestingSmtp ? "Testing..." : "Test Connection"}
                                </Button>
                                <Button onClick={handleSaveSmtpConfig} disabled={isSavingSmtp}>
                                    {isSavingSmtp && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Save SMTP Settings
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* EMAIL TEMPLATE SECTION */}
                    {activeSection === 'email' && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Email Content</CardTitle>
                                    <CardDescription>Compose the email sent with the certificate.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Subject Line</Label>
                                        <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Your Certificate" />
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm text-muted-foreground mr-2">Available Variables:</span>

                                        {/* Certificate ID is always available */}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-6 text-xs px-2 font-mono text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                                            onClick={() => copyVariable('CertificateID')}
                                        >
                                            {`{CertificateID}`}
                                        </Button>

                                        {/* Dynamically show mapped columns from spreadsheet */}
                                        {Object.entries(columnMapping).map(([key, mappedCol]) => {
                                            // Find the attribute name if it's mapped to a template field
                                            let varName = mappedCol; // Default to column name

                                            // If mapped to 'email', use 'Email'
                                            if (key === 'email') varName = 'Email';
                                            else {
                                                const attr = selectedTemplate?.attributes.find(a => a.id === key);
                                                if (attr) varName = attr.name;
                                            }

                                            return (
                                                <Button
                                                    key={key}
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-6 text-xs px-2 font-mono"
                                                    onClick={() => copyVariable(varName)}
                                                >
                                                    {`{${varName}}`}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Tabs value={emailPreviewMode} onValueChange={(v) => setEmailPreviewMode(v as 'edit' | 'preview')}>
                                        <TabsList className="w-full justify-start">
                                            <TabsTrigger value="edit">Edit HTML</TabsTrigger>
                                            <TabsTrigger value="preview">Preview</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="edit">
                                            <Textarea
                                                className="min-h-[300px] font-mono text-sm"
                                                value={emailTemplateHtml}
                                                onChange={e => setEmailTemplateHtml(e.target.value)}
                                            />
                                        </TabsContent>
                                        <TabsContent value="preview">
                                            <div className="border rounded-md p-4 bg-white min-h-[300px]">
                                                <iframe srcDoc={emailTemplateHtml} className="w-full h-full border-0 min-h-[280px]" title="Preview" />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveEmailTemplate} disabled={isSavingEmail}>
                                    {isSavingEmail && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Email Template
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
