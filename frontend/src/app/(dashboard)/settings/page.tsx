'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
    Server,
    Settings,
    Save,
    RefreshCw,
    Plus,
    Trash2,
    Edit,
    Eye,
    EyeOff,
    Check,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GlobalSmtpConfig {
    id: string;
    name: string;
    smtpHost: string;
    smtpPort: number;
    smtpEmail: string;
    smtpPassword?: string;
    encryptionType: string;
    senderName?: string | null;
    replyTo?: string | null;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

type SettingsSection = 'smtp';

export default function SettingsPage() {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [activeSection, setActiveSection] = useState<SettingsSection>('smtp');
    const [loading, setLoading] = useState(true);
    const [configs, setConfigs] = useState<GlobalSmtpConfig[]>([]);

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<GlobalSmtpConfig | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        smtpHost: '',
        smtpPort: '587',
        smtpEmail: '',
        smtpPassword: '',
        encryptionType: 'TLS',
        senderName: '',
        replyTo: '',
        isDefault: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const loadConfigs = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        try {
            const res = await fetch(`${baseUrl}/api/settings/smtp`, {
                headers: { 'x-user-id': userId },
            });
            const data = await res.json();
            if (data.success) {
                setConfigs(data.data);
            }
        } catch (e) {
            console.error('Failed to load SMTP configs:', e);
            toast.error('Failed to load SMTP configurations');
        }
        setLoading(false);
    }, [userId, baseUrl]);

    useEffect(() => {
        loadConfigs();
    }, [loadConfigs]);

    const resetForm = () => {
        setFormData({
            name: '',
            smtpHost: '',
            smtpPort: '587',
            smtpEmail: '',
            smtpPassword: '',
            encryptionType: 'TLS',
            senderName: '',
            replyTo: '',
            isDefault: false,
        });
        setEditingConfig(null);
        setShowPassword(false);
    };

    const openCreateDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditDialog = async (config: GlobalSmtpConfig) => {
        // Fetch with decrypted password
        try {
            const res = await fetch(`${baseUrl}/api/settings/smtp/${config.id}`, {
                headers: { 'x-user-id': userId || '' },
            });
            const data = await res.json();
            if (data.success) {
                const c = data.data;
                setFormData({
                    name: c.name,
                    smtpHost: c.smtpHost,
                    smtpPort: c.smtpPort?.toString() || '587',
                    smtpEmail: c.smtpEmail,
                    smtpPassword: c.smtpPassword || '',
                    encryptionType: c.encryptionType || 'TLS',
                    senderName: c.senderName || '',
                    replyTo: c.replyTo || '',
                    isDefault: c.isDefault || false,
                });
                setEditingConfig(c);
                setIsDialogOpen(true);
            }
        } catch (e) {
            toast.error('Failed to load configuration');
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const res = await fetch(`${baseUrl}/api/settings/smtp/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId || '',
                },
                body: JSON.stringify({
                    smtpHost: formData.smtpHost,
                    smtpPort: parseInt(formData.smtpPort),
                    smtpEmail: formData.smtpEmail,
                    smtpPassword: formData.smtpPassword,
                    encryptionType: formData.encryptionType,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('SMTP connection successful!');
            } else {
                toast.error(data.error || 'SMTP connection failed');
            }
        } catch (e) {
            toast.error('Failed to test SMTP connection');
        }
        setIsTesting(false);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.smtpHost || !formData.smtpEmail) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!editingConfig && !formData.smtpPassword) {
            toast.error('Password is required for new configurations');
            return;
        }

        setIsSaving(true);
        try {
            const url = editingConfig
                ? `${baseUrl}/api/settings/smtp/${editingConfig.id}`
                : `${baseUrl}/api/settings/smtp`;

            const res = await fetch(url, {
                method: editingConfig ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId || '',
                },
                body: JSON.stringify({
                    name: formData.name,
                    smtpHost: formData.smtpHost,
                    smtpPort: parseInt(formData.smtpPort),
                    smtpEmail: formData.smtpEmail,
                    smtpPassword: formData.smtpPassword || undefined,
                    encryptionType: formData.encryptionType,
                    senderName: formData.senderName || null,
                    replyTo: formData.replyTo || null,
                    isDefault: formData.isDefault,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editingConfig ? 'Configuration updated' : 'Configuration created');
                setIsDialogOpen(false);
                resetForm();
                loadConfigs();
            } else {
                toast.error(data.error || 'Failed to save configuration');
            }
        } catch (e) {
            toast.error('Failed to save configuration');
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${baseUrl}/api/settings/smtp/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': userId || '' },
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Configuration deleted');
                loadConfigs();
            } else {
                toast.error(data.error || 'Failed to delete');
            }
        } catch (e) {
            toast.error('Failed to delete configuration');
        }
    };

    const navItems = [
        { id: 'smtp', label: 'SMTP Configuration', icon: Server },
    ];

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.20))] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-theme(spacing.20))] -mx-6 -my-4 bg-background">
            {/* Internal Sidebar */}
            <aside className="w-64 border-r bg-muted/10 p-4">
                <div className="mb-6 px-2">
                    <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
                </div>
                <nav className="space-y-1.5">
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {navItems.find(i => i.id === activeSection)?.label}
                            </h1>
                            <p className="text-muted-foreground">
                                Manage your global SMTP configurations for email delivery.
                            </p>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openCreateDialog}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Configuration
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingConfig ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Configure your email server settings. These can be reused across multiple groups.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Configuration Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="e.g., Primary Gmail"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label>SMTP Host *</Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                                                    onClick={() => setFormData(p => ({
                                                        ...p,
                                                        smtpHost: 'smtp.gmail.com',
                                                        smtpPort: '587',
                                                        encryptionType: 'TLS'
                                                    }))}
                                                >
                                                    Use Gmail Defaults
                                                </Button>
                                            </div>
                                            <Input
                                                value={formData.smtpHost}
                                                onChange={e => setFormData(p => ({ ...p, smtpHost: e.target.value }))}
                                                placeholder="smtp.gmail.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Port *</Label>
                                            <Input
                                                value={formData.smtpPort}
                                                onChange={e => setFormData(p => ({ ...p, smtpPort: e.target.value }))}
                                                placeholder="587"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Email Address *</Label>
                                        <Input
                                            value={formData.smtpEmail}
                                            onChange={e => setFormData(p => ({ ...p, smtpEmail: e.target.value }))}
                                            type="email"
                                            placeholder="sender@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>App Password {editingConfig ? '(leave empty to keep current)' : '*'}</Label>
                                        <div className="relative">
                                            <Input
                                                value={formData.smtpPassword}
                                                onChange={e => setFormData(p => ({ ...p, smtpPassword: e.target.value }))}
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
                                                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Use an App Password if using Gmail/Outlook.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Encryption</Label>
                                        <Select value={formData.encryptionType} onValueChange={v => setFormData(p => ({ ...p, encryptionType: v }))}>
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
                                        <Input
                                            value={formData.senderName}
                                            onChange={e => setFormData(p => ({ ...p, senderName: e.target.value }))}
                                            placeholder="Certificate System"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Reply-To (Optional)</Label>
                                        <Input
                                            value={formData.replyTo}
                                            onChange={e => setFormData(p => ({ ...p, replyTo: e.target.value }))}
                                            placeholder="reply@example.com"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <Button variant="outline" onClick={handleTestConnection} disabled={isTesting || !formData.smtpHost || !formData.smtpEmail || !formData.smtpPassword}>
                                        {isTesting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                        Test Connection
                                    </Button>
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingConfig ? 'Update' : 'Save'} Configuration
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Separator />

                    {/* SMTP Configurations List */}
                    {activeSection === 'smtp' && (
                        <div className="space-y-4">
                            {configs.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Server className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No SMTP Configurations</h3>
                                        <p className="text-muted-foreground text-center mb-4">
                                            Create a global SMTP configuration to reuse across your groups.
                                        </p>
                                        <Button onClick={openCreateDialog}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Configuration
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {configs.map(config => (
                                        <Card key={config.id}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <Server className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                {config.name}
                                                                {config.isDefault && (
                                                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                                                )}
                                                            </CardTitle>
                                                            <CardDescription>{config.smtpEmail}</CardDescription>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(config)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{config.name}"? Groups using this configuration will need to be reconfigured.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(config.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    <span>{config.smtpHost}:{config.smtpPort}</span>
                                                    <span>•</span>
                                                    <span>{config.encryptionType}</span>
                                                    {config.senderName && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Sender: {config.senderName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
