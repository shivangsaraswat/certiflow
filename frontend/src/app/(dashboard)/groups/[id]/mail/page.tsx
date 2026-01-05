'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Mail, Send, CheckCircle2, XCircle, Clock, Users, AlertCircle,
    RefreshCw, ChevronDown, ChevronUp, Settings, History, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getGroup } from '@/lib/api';
import type { Group } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface Participant {
    id: number;
    email: string;
    name: string;
    data: Record<string, string>;
    certificateId: string;
}

interface MailJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    progress: number;
}

interface MailLogEntry {
    id: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    status: 'sent' | 'failed';
    errorMessage?: string;
    sentAt?: string;
    createdAt: string;
}

export default function GroupMailPage() {
    const params = useParams();
    const groupId = params.id as string;
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('send');

    // Participant state
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Sending state
    const [isSending, setIsSending] = useState(false);
    const [activeJob, setActiveJob] = useState<MailJob | null>(null);
    const [isTrackerOpen, setIsTrackerOpen] = useState(false);

    // History state
    const [mailHistory, setMailHistory] = useState<MailLogEntry[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [logToDelete, setLogToDelete] = useState<string | null>(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const loadGroup = useCallback(async () => {
        if (!userId || !groupId) return;
        setLoading(true);
        const result = await getGroup(groupId, userId);
        if (result.success && result.data) {
            setGroup(result.data);
        }
        setLoading(false);
    }, [userId, groupId]);

    const loadParticipants = useCallback(async () => {
        if (!userId || !groupId) return;
        setLoadingParticipants(true);
        try {
            const res = await fetch(`${baseUrl}/api/groups/${groupId}/mail/participants`, {
                headers: { 'x-user-id': userId }
            });
            const data = await res.json();
            if (data.success) {
                setParticipants(data.data);
            }
        } catch (error) {
            console.error('Failed to load participants:', error);
        }
        setLoadingParticipants(false);
    }, [userId, groupId, baseUrl]);

    const loadHistory = useCallback(async () => {
        if (!userId || !groupId) return;
        setLoadingHistory(true);
        try {
            const res = await fetch(`${baseUrl}/api/groups/${groupId}/mail/history?limit=100`, {
                headers: { 'x-user-id': userId }
            });
            const data = await res.json();
            if (data.success) {
                setMailHistory(data.data);
                setHistoryTotal(data.pagination?.total || 0);
            }
        } catch (error) {
            console.error('Failed to load mail history:', error);
        }
        setLoadingHistory(false);
    }, [userId, groupId, baseUrl]);

    const handleDeleteLog = async () => {
        if (!logToDelete || !userId || !groupId) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`${baseUrl}/api/groups/${groupId}/mail/history/${logToDelete}`, {
                method: 'DELETE',
                headers: { 'x-user-id': userId }
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Log entry deleted');
                setMailHistory(prev => prev.filter(log => log.id !== logToDelete));
                setHistoryTotal(prev => prev - 1);
            } else {
                toast.error(data.error || 'Failed to delete log entry');
            }
        } catch (error) {
            toast.error('Failed to delete log entry');
        } finally {
            setIsDeleting(false);
            setLogToDelete(null);
        }
    };

    useEffect(() => {
        loadGroup();
    }, [loadGroup]);

    useEffect(() => {
        if (group) {
            loadParticipants();
            loadHistory();
        }
    }, [group, loadParticipants, loadHistory]);

    // Poll for active job status
    useEffect(() => {
        if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') {
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`${baseUrl}/api/groups/${groupId}/mail/jobs/${activeJob.id}`, {
                    headers: { 'x-user-id': userId || '' }
                });
                const data = await res.json();
                if (data.success) {
                    setActiveJob(data.data);
                    if (data.data.status === 'completed') {
                        toast.success(`Mail job completed: ${data.data.sentCount} sent, ${data.data.failedCount} failed`);
                        loadHistory();
                    } else if (data.data.status === 'failed') {
                        toast.error('Mail job failed');
                    }
                }
            } catch (error) {
                console.error('Failed to poll job status:', error);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [activeJob, groupId, userId, baseUrl, loadHistory]);

    const handleSelectAll = () => {
        if (selectedIds.size === participants.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(participants.map(p => p.id)));
        }
    };

    const handleToggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSendMails = async () => {
        if (selectedIds.size === 0) {
            toast.error('Please select at least one recipient');
            return;
        }

        setIsSending(true);
        try {
            const selectedParticipants = participants.filter(p => selectedIds.has(p.id));
            const recipients = selectedParticipants.map(p => ({
                email: p.email,
                name: p.name,
                data: p.data,
                certificateId: p.certificateId, // Pass this to backend for attachments
            }));

            const res = await fetch(`${baseUrl}/api/groups/${groupId}/mail/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId || '',
                },
                body: JSON.stringify({ recipients }),
            });

            const data = await res.json();
            if (data.success) {
                setActiveJob({
                    id: data.data.jobId,
                    status: 'processing',
                    totalRecipients: data.data.totalRecipients,
                    sentCount: 0,
                    failedCount: 0,
                    progress: 0,
                });
                setIsTrackerOpen(true);
                toast.success('Mail job started');
            } else {
                toast.error(data.error || 'Failed to start mail job');
            }
        } catch (error) {
            toast.error('Failed to start mail job');
        }
        setIsSending(false);
    };

    // Configuration checks
    const hasSmtpConfig = group?.smtpConfig?.isConfigured;
    const hasEmailTemplate = !!group?.emailTemplateHtml;
    const hasDataVault = !!group?.sheetId;
    const hasColumnMapping = group?.columnMapping && Object.keys(group.columnMapping).length > 0 && group.columnMapping['email'];
    const isFullyConfigured = hasSmtpConfig && hasEmailTemplate && hasDataVault && hasColumnMapping;

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
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Mail Center</h2>
                <p className="text-muted-foreground">
                    Send emails to participants with their certificates.
                </p>
            </div>

            {/* Configuration Status */}
            {!isFullyConfigured && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Configuration Required</AlertTitle>
                    <AlertDescription className="mt-2">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                {hasSmtpConfig ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓ SMTP</Badge>
                                ) : (
                                    <Badge variant="outline">✗ SMTP not configured</Badge>
                                )}
                                {hasEmailTemplate ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Email Template</Badge>
                                ) : (
                                    <Badge variant="outline">✗ Email template missing</Badge>
                                )}
                                {hasDataVault ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Dataset</Badge>
                                ) : (
                                    <Badge variant="outline">✗ Dataset not connected</Badge>
                                )}
                                {hasColumnMapping ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Email Column</Badge>
                                ) : (
                                    <Badge variant="outline">✗ Email column not mapped</Badge>
                                )}
                            </div>
                            <Button variant="outline" size="sm" asChild className="w-fit">
                                <Link href={`/groups/${groupId}/settings`}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configure Settings
                                </Link>
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {isFullyConfigured && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="send">
                            <Send className="mr-2 h-4 w-4" />
                            Send Emails
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <History className="mr-2 h-4 w-4" />
                            History ({historyTotal})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="send" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Select Recipients</CardTitle>
                                        <CardDescription>
                                            Choose participants to send emails to
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={loadParticipants}
                                            disabled={loadingParticipants}
                                        >
                                            <RefreshCw className={`mr-2 h-4 w-4 ${loadingParticipants ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                        <Button
                                            onClick={handleSendMails}
                                            disabled={selectedIds.size === 0 || isSending}
                                        >
                                            {isSending ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Starting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Send ({selectedIds.size})
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingParticipants ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                ) : participants.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No participants found with email addresses</p>
                                        <p className="text-sm mt-2">Make sure your spreadsheet has data and the email column is mapped</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">
                                                        <Checkbox
                                                            checked={selectedIds.size === participants.length}
                                                            onCheckedChange={handleSelectAll}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {participants.map((participant) => (
                                                    <TableRow key={participant.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedIds.has(participant.id)}
                                                                onCheckedChange={() => handleToggleSelect(participant.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{participant.name || '-'}</TableCell>
                                                        <TableCell>{participant.email}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Email History</CardTitle>
                                        <CardDescription>
                                            All emails sent from this group
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadHistory}
                                        disabled={loadingHistory}
                                    >
                                        <RefreshCw className={`mr-2 h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                ) : mailHistory.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No emails sent yet</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Recipient</TableHead>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead>Sent At</TableHead>
                                                    <TableHead className="w-12 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {mailHistory.map((log) => (
                                                    <TableRow key={log.id}>
                                                        <TableCell>
                                                            {log.status === 'sent' ? (
                                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                    Sent
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="destructive">
                                                                    <XCircle className="mr-1 h-3 w-3" />
                                                                    Failed
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{log.recipientName || '-'}</div>
                                                                <div className="text-sm text-muted-foreground">{log.recipientEmail}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                                                        <TableCell>
                                                            {log.sentAt
                                                                ? new Date(log.sentAt).toLocaleString()
                                                                : '-'
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() => setLogToDelete(log.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Job Tracker Dialog */}
            <Dialog open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mail Job Progress</DialogTitle>
                        <DialogDescription>
                            Tracking email sending progress
                        </DialogDescription>
                    </DialogHeader>

                    {activeJob && (
                        <div className="py-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <Badge variant={
                                    activeJob.status === 'completed' ? 'secondary' :
                                        activeJob.status === 'failed' ? 'destructive' :
                                            'default'
                                }>
                                    {activeJob.status === 'processing' ? (
                                        <>
                                            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                                            Processing
                                        </>
                                    ) : activeJob.status === 'completed' ? (
                                        <>
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Completed
                                        </>
                                    ) : activeJob.status === 'failed' ? (
                                        <>
                                            <XCircle className="mr-1 h-3 w-3" />
                                            Failed
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="mr-1 h-3 w-3" />
                                            Pending
                                        </>
                                    )}
                                </Badge>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Progress</span>
                                    <span className="text-sm font-medium">{activeJob.progress}%</span>
                                </div>
                                <Progress value={activeJob.progress} />
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-2">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{activeJob.totalRecipients}</div>
                                    <div className="text-xs text-muted-foreground">Total</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{activeJob.sentCount}</div>
                                    <div className="text-xs text-muted-foreground">Sent</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">{activeJob.failedCount}</div>
                                    <div className="text-xs text-muted-foreground">Failed</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setIsTrackerOpen(false)}>
                            {activeJob?.status === 'processing' ? 'Run in Background' : 'Close'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this email log entry from the history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteLog();
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
