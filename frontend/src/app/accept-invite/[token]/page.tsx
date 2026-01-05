'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface InvitationInfo {
    groupName: string;
    inviterName: string;
    inviteeEmail: string;
    status: 'pending' | 'accepted' | 'revoked';
}

export default function AcceptInvitePage() {
    const params = useParams();
    const router = useRouter();
    const token = params?.token as string;
    const { data: session, status: sessionStatus } = useSession();

    const [inviteInfo, setInviteInfo] = useState<InvitationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const fetchInviteInfo = async () => {
            try {
                const res = await fetch(`${baseUrl}/api/shares/info/${token}`);
                const data = await res.json();

                if (data.success) {
                    setInviteInfo(data.data);
                } else {
                    setError(data.error || 'Invalid invitation');
                }
            } catch (err) {
                setError('Failed to load invitation details');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchInviteInfo();
        }
    }, [token, baseUrl]);

    const handleAccept = async () => {
        if (!session?.user?.id) {
            toast.error('Please sign in to accept this invitation');
            return;
        }

        setAccepting(true);

        try {
            const res = await fetch(`${baseUrl}/api/shares/accept/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': session.user.id,
                },
            });

            const data = await res.json();

            if (data.success) {
                toast.success(`You now have access to "${data.data.groupName}"`);
                router.push('/groups');
            } else {
                toast.error(data.error || 'Failed to accept invitation');
            }
        } catch (err) {
            toast.error('Failed to accept invitation');
        } finally {
            setAccepting(false);
        }
    };

    if (loading || sessionStatus === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                                <XCircle className="h-8 w-8 text-destructive" />
                            </div>
                        </div>
                        <CardTitle>Invalid Invitation</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button onClick={() => router.push('/groups')}>
                            Go to Groups
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!inviteInfo) {
        return null;
    }

    // Already accepted or revoked
    if (inviteInfo.status !== 'pending') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </div>
                        <CardTitle>
                            {inviteInfo.status === 'accepted' ? 'Already Accepted' : 'Invitation Revoked'}
                        </CardTitle>
                        <CardDescription>
                            {inviteInfo.status === 'accepted'
                                ? 'This invitation has already been accepted.'
                                : 'This invitation is no longer valid.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button onClick={() => router.push('/groups')}>
                            Go to Groups
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Check if user is logged in with the correct email
    const emailMismatch = session?.user?.email && session.user.email !== inviteInfo.inviteeEmail;

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle>Group Invitation</CardTitle>
                    <CardDescription>
                        You have been invited to collaborate on a group
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Group</span>
                            <span className="font-medium">{inviteInfo.groupName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Invited by</span>
                            <span className="font-medium">{inviteInfo.inviterName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Invitation for</span>
                            <span className="font-medium text-sm">{inviteInfo.inviteeEmail}</span>
                        </div>
                    </div>

                    {emailMismatch ? (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <p className="text-sm text-destructive">
                                This invitation was sent to <strong>{inviteInfo.inviteeEmail}</strong>, but you are signed in as <strong>{session?.user?.email}</strong>.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Please sign in with the correct account to accept this invitation.
                            </p>
                        </div>
                    ) : !session ? (
                        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                            <p className="text-sm">
                                Please sign in to accept this invitation.
                            </p>
                        </div>
                    ) : null}

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.push('/groups')}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleAccept}
                            disabled={accepting || !session || !!emailMismatch}
                        >
                            {accepting ? (
                                <>
                                    <LoadingSpinner className="h-4 w-4 mr-2" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Accept Invitation
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
