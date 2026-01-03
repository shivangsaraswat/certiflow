'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FolderKanban, FileText, Award, Trash2, ChevronRight, ChevronLeft, FileImage, Database, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getGroups, getTemplates, createGroup, deleteGroup } from '@/lib/api';
import type { Group, Template } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Spreadsheet {
    id: string;
    name: string;
    updatedAt: string;
}

export default function GroupsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [groups, setGroups] = useState<Group[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
    const [loading, setLoading] = useState(true);

    // Wizard state
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);

    // Form data
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [selectedSheetId, setSelectedSheetId] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        if (!userId) return;

        const [groupsRes, templatesRes, sheetsRes] = await Promise.all([
            getGroups(userId),
            getTemplates(userId),
            fetch(`${baseUrl}/api/spreadsheets`, {
                headers: { 'x-user-id': userId }
            }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ]);

        if (groupsRes.success && groupsRes.data) setGroups(groupsRes.data);
        if (templatesRes.success && templatesRes.data) setTemplates(templatesRes.data);
        if (sheetsRes.success && sheetsRes.data) setSpreadsheets(sheetsRes.data);

        setLoading(false);
    }, []);

    useEffect(() => {
        if (userId) loadData();
    }, [loadData, userId]);

    // Check for return from template/sheet creation
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const returnStep = params.get('wizardStep');
        const savedData = sessionStorage.getItem('groupWizardData');

        if (returnStep && savedData) {
            const data = JSON.parse(savedData);
            setGroupName(data.name || '');
            setGroupDescription(data.description || '');
            setSelectedTemplateId(data.templateId || '');
            setSelectedSheetId(data.sheetId || '');
            setWizardStep(parseInt(returnStep));
            setIsWizardOpen(true);

            // Clean up
            sessionStorage.removeItem('groupWizardData');
            window.history.replaceState({}, '', '/groups');

            // Reload data to get newly created template/sheet
            loadData();
        }
    }, [loadData]);

    const openWizard = () => {
        setWizardStep(1);
        setGroupName('');
        setGroupDescription('');
        setSelectedTemplateId('');
        setSelectedSheetId('');
        setIsWizardOpen(true);
    };

    const closeWizard = () => {
        setIsWizardOpen(false);
        sessionStorage.removeItem('groupWizardData');
    };

    const saveWizardState = () => {
        sessionStorage.setItem('groupWizardData', JSON.stringify({
            name: groupName,
            description: groupDescription,
            templateId: selectedTemplateId,
            sheetId: selectedSheetId,
        }));
    };

    const goToCreateTemplate = () => {
        saveWizardState();
        router.push('/templates/new?returnTo=/groups&wizardStep=2');
    };

    const goToCreateSheet = async () => {
        saveWizardState();
        // Create new sheet and redirect
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${baseUrl}/api/spreadsheets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId || ''
            },
            body: JSON.stringify({ name: 'Untitled Spreadsheet' }),
        });
        const data = await res.json();
        if (data.success && data.data?.id) {
            router.push(`/data-vault/${data.data.id}?returnTo=/groups&wizardStep=3`);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || !selectedTemplateId || !selectedSheetId) return;

        setIsCreating(true);
        const result = await createGroup({
            name: groupName,
            description: groupDescription || undefined,
            templateId: selectedTemplateId,
            sheetId: selectedSheetId,
        }, userId);

        if (result.success && result.data) {
            setGroups((prev) => [result.data!, ...prev]);
            closeWizard();
        }
        setIsCreating(false);
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm('Are you sure you want to delete this group?')) return;
        const result = await deleteGroup(id, userId);
        if (result.success) {
            setGroups((prev) => prev.filter((g) => g.id !== id));
        }
    };

    const canProceed = () => {
        switch (wizardStep) {
            case 1: return groupName.trim().length > 0;
            case 2: return selectedTemplateId.length > 0;
            case 3: return selectedSheetId.length > 0;
            default: return false;
        }
    };

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const selectedSheet = spreadsheets.find(s => s.id === selectedSheetId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
                    <p className="text-muted-foreground">Organize certificates by campaign or event</p>
                </div>
                <Button onClick={openWizard}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Group
                </Button>
            </div>

            {/* Groups Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : groups.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No groups yet</h3>
                        <p className="text-muted-foreground mt-1 mb-4">Create your first group to start generating certificates.</p>
                        <Button onClick={openWizard}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Group
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Link key={group.id} href={`/groups/${group.id}`}>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow group relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{group.name}</CardTitle>
                                            {group.description && (
                                                <CardDescription className="mt-1 line-clamp-2">{group.description}</CardDescription>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteGroup(group.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <FileText className="h-4 w-4" />
                                            <span>{group.template?.name || 'Unknown'}</span>
                                        </div>
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Award className="h-3 w-3" />
                                            {group.certificateCount || 0}
                                        </Badge>
                                    </div>
                                    {group.template?.code && (
                                        <Badge variant="outline" className="mt-2 font-mono text-xs">{group.template.code}</Badge>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Multi-Step Wizard Dialog */}
            <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                        <DialogDescription>
                            Step {wizardStep} of 3: {wizardStep === 1 ? 'Basic Information' : wizardStep === 2 ? 'Select Template' : 'Select Data Vault'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 py-4">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${step < wizardStep ? 'bg-primary text-primary-foreground' :
                                    step === wizardStep ? 'bg-primary text-primary-foreground' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                    {step < wizardStep ? <Check className="h-4 w-4" /> : step}
                                </div>
                                {step < 3 && (
                                    <div className={`flex-1 h-1 mx-2 ${step < wizardStep ? 'bg-primary' : 'bg-muted'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Basic Info */}
                    {wizardStep === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Group Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Workshop 2026"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Optional description..."
                                    value={groupDescription}
                                    onChange={(e) => setGroupDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Template Selection */}
                    {wizardStep === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Select a template for your certificates</p>
                                <Button variant="outline" size="sm" onClick={goToCreateTemplate}>
                                    <Plus className="mr-2 h-3 w-3" />
                                    Create Template
                                </Button>
                            </div>

                            {templates.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <FileImage className="h-10 w-10 text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground mb-3">No templates yet</p>
                                        <Button onClick={goToCreateTemplate}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Your First Template
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                                    {templates.map((template) => (
                                        <Card
                                            key={template.id}
                                            className={`cursor-pointer transition-all ${selectedTemplateId === template.id
                                                ? 'ring-2 ring-primary bg-primary/5'
                                                : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => setSelectedTemplateId(template.id)}
                                        >
                                            <CardContent className="flex items-center gap-4 p-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                                    <FileImage className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{template.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Code: <span className="font-mono">{template.code}</span>
                                                    </p>
                                                </div>
                                                {selectedTemplateId === template.id && (
                                                    <Check className="h-5 w-5 text-primary" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Data Vault Selection */}
                    {wizardStep === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Select a Data Vault spreadsheet for bulk generation</p>
                                <Button variant="outline" size="sm" onClick={goToCreateSheet}>
                                    <Plus className="mr-2 h-3 w-3" />
                                    Create Spreadsheet
                                </Button>
                            </div>

                            {spreadsheets.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <Database className="h-10 w-10 text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground mb-3">No spreadsheets yet</p>
                                        <Button onClick={goToCreateSheet}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Your First Spreadsheet
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                                    {spreadsheets.map((sheet) => (
                                        <Card
                                            key={sheet.id}
                                            className={`cursor-pointer transition-all ${selectedSheetId === sheet.id
                                                ? 'ring-2 ring-primary bg-primary/5'
                                                : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => setSelectedSheetId(sheet.id)}
                                        >
                                            <CardContent className="flex items-center gap-4 p-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                                    <Database className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{sheet.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Updated: {new Date(sheet.updatedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {selectedSheetId === sheet.id && (
                                                    <Check className="h-5 w-5 text-primary" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Summary before creation */}
                    {wizardStep === 3 && canProceed() && (
                        <div className="mt-4 p-4 rounded-lg bg-muted/50">
                            <p className="text-sm font-medium mb-2">Summary</p>
                            <div className="grid gap-1 text-sm">
                                <p><span className="text-muted-foreground">Name:</span> {groupName}</p>
                                <p><span className="text-muted-foreground">Template:</span> {selectedTemplate?.name} ({selectedTemplate?.code})</p>
                                <p><span className="text-muted-foreground">Data Vault:</span> {selectedSheet?.name}</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-between gap-2 pt-4">
                        <div>
                            {wizardStep > 1 && (
                                <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={closeWizard}>Cancel</Button>
                            {wizardStep < 3 ? (
                                <Button onClick={() => setWizardStep(wizardStep + 1)} disabled={!canProceed()}>
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleCreateGroup} disabled={!canProceed() || isCreating}>
                                    {isCreating ? 'Creating...' : 'Create Group'}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
